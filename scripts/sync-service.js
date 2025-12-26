
/**
 * scripts/sync-service.js
 * Service Background untuk Sinkronisasi Otomatis
 * 
 * Update: Fix Path .env (Mundur satu folder ke root)
 */

const path = require('path');
// Karena file ini ada di folder /scripts, kita harus mundur satu level (../) untuk mencari .env di root
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const ZKLib = require('node-zklib');
const { createClient } = require('@supabase/supabase-js');
const net = require('net');

// Cek Environment
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("FATAL ERROR: SUPABASE_URL atau SUPABASE_KEY tidak terbaca.");
    console.error("Mencoba membaca .env dari: " + path.resolve(__dirname, '../.env'));
    process.exit(1);
}

// --- KONFIGURASI ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Fungsi Helper: Cek apakah IP & Port bisa dijangkau (Ping TCP)
function checkConnection(host, port, timeout = 2000) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        let status = null;

        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
            status = 'open';
            socket.destroy();
        });

        socket.on('timeout', () => {
            status = 'closed';
            socket.destroy();
        });

        socket.on('error', () => {
            status = 'closed';
        });

        socket.on('close', () => {
            resolve(status === 'open');
        });

        socket.connect(port, host);
    });
}

// Fungsi Mengambil Konfigurasi dari Supabase
async function getMachineConfig() {
    try {
        const { data, error } = await supabase
            .from('system_config')
            .select('*')
            .eq('id', 'machine_conf')
            .single();

        if (error || !data) {
            console.log("   ⚠️ Config tidak ditemukan di Database. Menggunakan default lokal.");
            return {
                ips: ['192.168.1.201'],
                port: 4370
            };
        }

        const ips = data.ip_addresses.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
        
        return {
            ips: ips,
            port: parseInt(data.port) || 4370
        };

    } catch (e) {
        console.error("   ❌ Gagal fetch config:", e.message);
        return { ips: [], port: 4370 };
    }
}

async function syncData() {
    console.log(`\n[${new Date().toLocaleString()}] === MULAI SINKRONISASI ===`);
    
    // 1. Ambil Config Terbaru dari Cloud
    console.log(`   🔄 Mengambil konfigurasi IP terbaru...`);
    const config = await getMachineConfig();
    
    if (config.ips.length === 0) {
        console.log("   ❌ Tidak ada IP Mesin yang dikonfigurasi.");
        return;
    }

    console.log(`   🎯 Target: ${config.ips.length} Mesin (Port: ${config.port})`);

    // Loop setiap mesin
    for (const ip of config.ips) {
        console.log(`\n   📡 Menghubungkan ke: ${ip}`);

        const isReachable = await checkConnection(ip, config.port);
        if (!isReachable) {
            console.log(`      ❌ SKIP: Mesin tidak dapat dijangkau (Ping failed).`);
            continue; 
        }

        const zk = new ZKLib(ip, config.port, 5000, 4000); 
        
        try {
            await zk.createSocket();
            console.log(`      ✅ Terhubung Protocol ZK. Mengambil data...`);
            
            const logs = await zk.getAttendances();
            console.log(`      📄 Ditemukan ${logs.length} data log.`);

            if (logs.length === 0) {
                await zk.disconnect();
                continue;
            }

            let successCount = 0;

            for (const log of logs) {
                const machineUserId = String(log.deviceUserId);
                const logTime = new Date(log.recordTime);
                
                const dateStr = logTime.toISOString().split('T')[0]; 
                const timeStr = logTime.toTimeString().split(' ')[0]; 
                
                const isMorning = logTime.getHours() < 12;

                const payload = {
                    fingerprint_id: machineUserId,
                    date: dateStr,
                    ...(isMorning ? { check_in: timeStr } : { check_out: timeStr })
                };

                const { error } = await supabase
                    .from('attendance_logs')
                    .upsert(payload, { onConflict: 'fingerprint_id, date' });

                if (!error) successCount++;
            }
            
            console.log(`      💾 Berhasil simpan ${successCount} data ke Cloud.`);

        } catch (e) {
            console.error(`      ❌ Error ZKLib:`, e.message);
        } finally {
            try { await zk.disconnect(); } catch (e) {}
        }
    }

    console.log(`\n[${new Date().toLocaleString()}] === SELESAI ===`);
}

// Jalankan fungsi
syncData();

// Set interval otomatis (misal tiap 5 menit)
setInterval(syncData, 5 * 60 * 1000);
