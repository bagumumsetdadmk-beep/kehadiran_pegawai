
/**
 * PENTING: Script ini dijalankan di Komputer Server Kantor (Infinix), BUKAN di Vercel.
 * 
 * Cara Install:
 * 1. Pastikan Node.js terinstall di komputer Infinix.
 * 2. Buat folder baru, copy file ini kesana.
 * 3. Buka terminal di folder tersebut, jalankan:
 *    npm install node-zklib @supabase/supabase-js dotenv
 * 4. Buat file .env berisi:
 *    SUPABASE_URL=https://...
 *    SUPABASE_KEY=eyJ...
 * 5. Jalankan script: node sync-service.js
 */

require('dotenv').config();
const ZKLib = require('node-zklib');
const { createClient } = require('@supabase/supabase-js');
const net = require('net');

// --- KONFIGURASI ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// DAFTAR IP MESIN FINGERPRINT
// Catatan Jaringan:
// 1. Jika mesin satu jaringan lokal (LAN) dengan komputer ini, gunakan IP 192.168.x.x
// 2. Jika mesin beda lokasi (via Internet), Anda WAJIB setting Port Forwarding di router lokasi mesin,
//    lalu masukkan IP PUBLIC di sini (bukan 192.168...), atau gunakan VPN.
const MACHINE_IPS = ['192.168.1.201', '192.168.1.202', '192.168.1.203', '192.168.1.204', '192.168.1.205']; 
const MACHINE_PORT = 4370;

// Fungsi Helper: Cek apakah IP & Port bisa dijangkau (Ping TCP)
// Ini penting agar script tidak macet menunggu mesin yang beda jaringan/offline
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

async function syncData() {
    console.log(`\n[${new Date().toLocaleString()}] === MULAI SINKRONISASI ===`);
    
    // Loop setiap mesin
    for (const ip of MACHINE_IPS) {
        console.log(`\n📡 Target: ${ip}`);

        // 1. Cek Koneksi Jaringan Dulu (Pre-flight check)
        const isReachable = await checkConnection(ip, MACHINE_PORT);
        if (!isReachable) {
            console.log(`   ❌ SKIP: Mesin tidak dapat dijangkau. Cek kabel LAN atau setting Gateway/VPN.`);
            continue; // Lanjut ke IP berikutnya
        }

        // 2. Jika lolos cek jaringan, baru inisialisasi Library Fingerprint
        const zk = new ZKLib(ip, MACHINE_PORT, 5000, 4000); 
        
        try {
            await zk.createSocket();
            console.log(`   ✅ Terhubung ke Protokol Fingerprint. Mengambil data...`);
            
            const logs = await zk.getAttendances();
            console.log(`   📄 Ditemukan ${logs.length} data log.`);

            if (logs.length === 0) {
                await zk.disconnect();
                continue;
            }

            let successCount = 0;

            // Proses setiap log
            for (const log of logs) {
                const machineUserId = String(log.deviceUserId);
                const logTime = new Date(log.recordTime);
                
                const dateStr = logTime.toISOString().split('T')[0]; // YYYY-MM-DD
                const timeStr = logTime.toTimeString().split(' ')[0]; // HH:MM:SS
                
                // Logika Sederhana Shift (Bisa disesuaikan)
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
            
            console.log(`   💾 Berhasil simpan ${successCount} data ke Cloud.`);

        } catch (e) {
            console.error(`   ❌ Error Protokol ZKLib di ${ip}:`, e.message);
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
