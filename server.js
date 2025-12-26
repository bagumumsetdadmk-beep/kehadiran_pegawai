
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

// --- JEMBATAN KOMPATIBILITAS (ESM ke CommonJS) ---
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -------------------------------------------------

/**
 * server.js
 * Middleware API untuk AbsensiPintar
 */

// Memaksa dotenv membaca file .env di folder yang sama dengan server.js
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const ZKLib = require('node-zklib');
const { createClient } = require('@supabase/supabase-js');
const net = require('net');

const app = express();
const PORT = 3001;

// Cek apakah Env terbaca
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("FATAL ERROR: SUPABASE_URL atau SUPABASE_KEY tidak terbaca dari .env");
    console.error("Pastikan file .env ada di folder: " + path.resolve(__dirname, '.env'));
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Konfigurasi Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Helper: Cek Koneksi TCP (Ping)
function checkNetworkConnection(host, port, timeout = 2000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { resolve(false); });
        socket.connect(port, host);
    });
}

/**
 * Endpoint: /api/test-connection
 */
app.post('/api/test-connection', async (req, res) => {
    const { ips, port, commKey } = req.body;
    
    console.log(`[TEST] Menerima request tes koneksi ke: ${ips.join(', ')}`);

    let successCount = 0;

    for (const ip of ips) {
        // 1. Cek Jaringan
        const isReachable = await checkNetworkConnection(ip, port);
        if (!isReachable) continue;

        // 2. Cek Protokol ZK
        const zk = new ZKLib(ip, port, 5000, 4000);
        try {
            await zk.createSocket();
            await zk.disconnect();
            successCount++;
        } catch (e) {
            console.error(`[TEST] Gagal konek ke ${ip}:`, e.message);
        }
    }

    if (successCount > 0) {
        res.status(200).json({ message: "Connected", detail: `${successCount} mesin terhubung.` });
    } else {
        res.status(500).json({ message: "Failed", detail: "Tidak ada mesin yang dapat dijangkau." });
    }
});

/**
 * Endpoint: /api/sync-logs
 */
app.post('/api/sync-logs', async (req, res) => {
    const { ips, port, commKey } = req.body;
    console.log(`[SYNC] Memulai sinkronisasi manual...`);

    let totalLogs = [];

    for (const ip of ips) {
        if (!await checkNetworkConnection(ip, port)) {
            console.log(`[SYNC] Skip ${ip} (Unreachable)`);
            continue;
        }

        const zk = new ZKLib(ip, port, 10000, 4000);
        try {
            await zk.createSocket();
            const logs = await zk.getAttendances();
            
            const formattedLogs = logs.map(log => {
                const logTime = new Date(log.recordTime);
                const dateStr = logTime.toISOString().split('T')[0];
                const timeStr = logTime.toTimeString().split(' ')[0].substring(0, 5); 
                const isMorning = logTime.getHours() < 12;

                return {
                    fingerprint_id: String(log.deviceUserId),
                    date: dateStr,
                    check_in: isMorning ? timeStr : null,
                    check_out: !isMorning ? timeStr : null
                };
            });

            for (const log of formattedLogs) {
                const { error } = await supabase
                    .from('attendance_logs')
                    .upsert({
                        fingerprint_id: log.fingerprint_id,
                        date: log.date,
                        ...(log.check_in ? { check_in: log.check_in } : {}),
                        ...(log.check_out ? { check_out: log.check_out } : {})
                    }, { onConflict: 'fingerprint_id, date' });
            }

            totalLogs = [...totalLogs, ...formattedLogs];
            await zk.disconnect();
            console.log(`[SYNC] ${ip}: ${logs.length} data ditarik.`);

        } catch (e) {
            console.error(`[SYNC] Error pada ${ip}:`, e.message);
        }
    }

    const responseData = totalLogs.map((log, idx) => ({
        id: `sync-${Date.now()}-${idx}`,
        employeeId: 'unknown',
        date: log.date,
        day: new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long' }),
        shiftIn: '08:00',
        fingerprintIn: log.check_in || null,
        shiftOut: '17:00',
        fingerprintOut: log.check_out || null,
        remarks: 'Baru Disinkronisasi',
        isLate: false
    }));

    res.status(200).json(responseData);
});

app.listen(PORT, () => {
    console.log(`
    🚀 Server Middleware Berjalan di http://localhost:${PORT}
    -----------------------------------------------------
    Status ENV: OK (URL Supabase Terbaca)
    `);
});
