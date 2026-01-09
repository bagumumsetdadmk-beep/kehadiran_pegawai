
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import net from 'net';
import dotenv from 'dotenv';

// --- KONFIGURASI PATH & ENV ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

console.log(`[INIT] Memeriksa file .env di: ${envPath}`);

if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error(`[INIT] Error parsing .env file:`, result.error);
    } else {
        console.log(`[INIT] Berhasil memuat .env. Variabel yang ditemukan:`, Object.keys(result.parsed || {}));
    }
} else {
    console.error(`[INIT] FATAL: File .env TIDAK DITEMUKAN di ${envPath}`);
}

// Validasi Env
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("[FATAL] SUPABASE_URL atau SUPABASE_KEY kosong. Cek isi file .env Anda.");
    console.error("Isi process.env saat ini (sebagian):", {
        NODE_ENV: process.env.NODE_ENV,
        PWD: process.env.PWD
    });
    process.exit(1);
}

// --- SETUP DEPENDENCIES ---
const require = createRequire(import.meta.url);
let ZKLib;
let isZKLibAvailable = true;
try {
    ZKLib = require('node-zklib');
    console.log("[INIT] node-zklib berhasil dimuat.");
} catch (e) {
    isZKLibAvailable = false;
    console.warn(`[INIT] PERINGATAN: Gagal load node-zklib. Mode simulasi akan diaktifkan.`);
    console.warn(`[INIT] Untuk fungsionalitas penuh, pastikan Anda telah menjalankan 'npm install node-zklib' di folder ini.`);
}

const app = express();
const PORT = 3006;

// Allow All CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// Global Error Handlers (Prevent Crash)
process.on('uncaughtException', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`
        [FATAL ERROR] Port ${PORT} sedang digunakan oleh aplikasi lain!
        -------------------------------------------------------------
        Mungkin 'Laravel Herd', 'Valet', atau server Node.js lain sedang berjalan.
        
        SOLUSI:
        1. Matikan aplikasi lain yang menggunakan port ${PORT}.
        2. Atau ganti 'const PORT = ${PORT}' di file ini ke angka lain (misal 3007).
        `);
        process.exit(1);
    } else {
        console.error('[FATAL] Uncaught Exception:', err);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection:', reason);
});

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
 * Root Route: Visual Check if server is running
 */
app.get('/', (req, res) => {
    res.send(`
        <h1>AbsensiPintar Middleware Running</h1>
        <p>Server status: <strong>ONLINE</strong></p>
        <p>Port: ${PORT}</p>
        <p>Time: ${new Date().toLocaleString()}</p>
        <p>ZKLib Status: <strong>${isZKLibAvailable ? 'Loaded' : 'Simulasi (node-zklib tidak ditemukan)'}</strong></p>
    `);
});

/**
 * Endpoint: /api/test-connection
 */
app.post('/api/test-connection', async (req, res) => {
    const { ips, port, commKey } = req.body;
    const logs = [];
    let overallSuccess = false;

    if (!ips || !Array.isArray(ips) || ips.length === 0) {
        return res.status(400).json({ success: false, message: "IP Address tidak valid atau kosong.", logs: [] });
    }

    console.log(`[TEST] Menerima request tes koneksi ke: ${ips.join(', ')} (Port: ${port})`);

    // Handle simulation mode if ZKLib is not available
    if (!isZKLibAvailable) {
        console.log(`[TEST] ZKLib tidak tersedia, menjalankan simulasi koneksi.`);
        ips.forEach(ip => {
            logs.push({ ip, status: 'Simulasi' });
        });
        return res.status(200).json({ success: true, status: 'success_simulation', message: "Middleware berjalan dalam mode simulasi. ZKLib tidak ditemukan.", logs });
    }

    for (const ip of ips) {
        try {
            // 1. Cek Jaringan (TCP Ping)
            const isReachable = await checkNetworkConnection(ip, port);
            if (!isReachable) {
                logs.push({ ip, status: 'Gagal (Jaringan)' });
                continue;
            }

            // 2. Cek Protokol ZK
            const zk = new ZKLib(ip, port, 5000, 4000); // Increased timeout for connection
            try {
                await zk.createSocket();
                await zk.disconnect(); // Disconnect immediately after successful connection
                logs.push({ ip, status: 'OK' });
                overallSuccess = true;
            } catch (e) {
                console.error(`[TEST] Gagal konek ke ZKTeco ${ip}:`, e.message);
                logs.push({ ip, status: `Gagal (ZKLib: ${e.message.substring(0, 50)}...)` });
            } finally {
                try { await zk.disconnect(); } catch (e) {} // Ensure disconnect even if ZKLib fails
            }
        } catch (err) {
            console.error(`[TEST] Error saat memproses IP ${ip}:`, err.message);
            logs.push({ ip, status: `Error (Internal: ${err.message.substring(0, 50)}...)` });
        }
    }

    if (overallSuccess) {
        res.status(200).json({ success: true, status: 'success', message: `${logs.filter(l => l.status === 'OK').length} mesin terhubung.`, logs });
    } else {
        res.status(500).json({ success: false, status: 'failed', message: "Tidak ada mesin yang dapat dijangkau.", logs });
    }
});

/**
 * Endpoint: /api/sync-logs
 */
app.post('/api/sync-logs', async (req, res) => {
    const { ips, port, commKey } = req.body; // commKey is not used by node-zklib for basic connection
    let totalLogs = [];

    if (!ips || !Array.isArray(ips)) {
         return res.status(400).json({ message: "IP Address tidak valid.", logs: [] });
    }

    console.log(`[SYNC] Memulai sinkronisasi manual untuk: ${ips.join(', ')}`);

    // Handle simulation mode for sync
    if (!isZKLibAvailable) {
        console.warn(`[SYNC] ZKLib tidak tersedia, tidak dapat menarik data dari mesin. Mengembalikan data kosong.`);
        return res.status(200).json([]); // Return empty array in simulation mode
    }

    for (const ip of ips) {
        if (!await checkNetworkConnection(ip, port)) {
            console.log(`[SYNC] Skip ${ip} (Mesin tidak dapat dijangkau di jaringan)`);
            continue;
        }

        const zk = new ZKLib(ip, port, 10000, 4000); // Extended timeouts for sync
        try {
            await zk.createSocket();
            let logsFromMachine = await zk.getAttendances();
            
            // --- FIX START ---
            // Memastikan logsFromMachine adalah array sebelum diproses
            if (!Array.isArray(logsFromMachine)) {
                console.warn(`[SYNC] ${ip}: zk.getAttendances() mengembalikan data non-array. Menggunakan array kosong.`);
                logsFromMachine = [];
            }
            // --- FIX END ---
            
            console.log(`[SYNC] ${ip}: Ditemukan ${logsFromMachine.length} log kehadiran.`);

            const formattedLogs = logsFromMachine.map(log => {
                const logTime = new Date(log.recordTime);
                const dateStr = logTime.toISOString().split('T')[0];
                const timeStr = logTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
                const isMorning = logTime.getHours() < 12; // Simple heuristic for check-in/check-out

                return {
                    fingerprint_id: String(log.deviceUserId),
                    date: dateStr,
                    check_in: isMorning ? timeStr : null,
                    check_out: !isMorning ? timeStr : null
                };
            });

            let upsertedCount = 0;
            for (const log of formattedLogs) {
                const { error } = await supabase
                    .from('attendance_logs')
                    .upsert({
                        fingerprint_id: log.fingerprint_id,
                        date: log.date,
                        ...(log.check_in ? { check_in: log.check_in } : {}),
                        ...(log.check_out ? { check_out: log.check_out } : {})
                    }, { onConflict: 'fingerprint_id, date' }); // Upsert by fingerprint_id and date
                
                if (!error) {
                  upsertedCount++;
                  // Tambahkan ke totalLogs untuk dikirim ke frontend
                  totalLogs.push({
                      id: `sync-${log.fingerprint_id}-${log.date}-${log.check_in || log.check_out}`, // unique id for frontend
                      employeeId: 'unknown', // Akan di-resolve di frontend
                      date: log.date,
                      day: new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long' }),
                      shiftIn: '08:00', // Default, bisa di-override frontend
                      fingerprintIn: log.check_in || null,
                      shiftOut: '17:00', // Default, bisa di-override frontend
                      fingerprintOut: log.check_out || null,
                      remarks: 'Data Mesin',
                      isLate: false // Default, bisa di-override frontend
                  });
                } else {
                    console.error(`[SYNC] Error upsert log ${log.fingerprint_id} - ${log.date}:`, error.message);
                }
            }
            console.log(`[SYNC] ${ip}: ${upsertedCount} data baru/diperbarui ke Cloud.`);

        } catch (e) {
            console.error(`[SYNC] Error pada mesin ${ip}:`, e.message);
        } finally {
            try { await zk.disconnect(); } catch (e) {}
        }
    }

    res.status(200).json(totalLogs); // Kirim semua log yang berhasil di-upsert dan diformat
});

// Bind to 0.0.0.0 to accept connections from other devices/IPs
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 Server Middleware Berjalan di http://localhost:${PORT}
    🚀 Bisa diakses via IP LAN (Misal: http://192.168.1.x:${PORT})
    -----------------------------------------------------
    Env Check: OK
    ZKLib Status: ${isZKLibAvailable ? 'Loaded' : 'Simulasi (node-zklib tidak ditemukan)'}
    `);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`
        [FATAL ERROR] Port ${PORT} sedang digunakan!
        Matikan aplikasi lain atau ganti PORT di server.js
        `);
        process.exit(1);
    }
});