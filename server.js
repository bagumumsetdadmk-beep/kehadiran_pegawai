
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import net from 'net';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("[FATAL] SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di .env.");
    process.exit(1);
}

const require = createRequire(import.meta.url);
let ZKLib;
let isZKLibAvailable = true;
try {
    ZKLib = require('node-zklib');
    console.log("[INIT] node-zklib terdeteksi.");
} catch (e) {
    isZKLibAvailable = false;
    console.error("[INIT] node-zklib TIDAK DITEMUKAN. Jalankan 'npm install node-zklib'.");
}

const app = express();
const PORT = 3006;

app.use(cors({ origin: '*' }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function checkNetworkConnection(host, port, timeout = 3000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { resolve(false); });
        socket.connect(port, host);
    });
}

app.post('/api/clear-logs', async (req, res) => {
    console.log("[DANGER] Request: Membersihkan seluruh data attendance_logs...");
    try {
        const { error } = await supabase
            .from('attendance_logs')
            .delete()
            .neq('id', 0);

        if (error) throw error;
        
        console.log("[DANGER] Database berhasil dikosongkan.");
        res.status(200).json({ success: true, message: 'Database log berhasil dikosongkan.' });
    } catch (e) {
        console.error("[DANGER] Gagal mengosongkan data:", e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/test-connection', async (req, res) => {
    const { ips, port } = req.body;
    const logs = [];
    let overallSuccess = false;

    if (!isZKLibAvailable) {
        ips.forEach(ip => logs.push({ ip, status: 'Simulasi (Lib Missing)' }));
        return res.status(200).json({ success: true, status: 'success_simulation', logs });
    }

    for (const ip of ips) {
        try {
            const isReachable = await checkNetworkConnection(ip, port);
            if (!isReachable) {
                logs.push({ ip, status: 'Offline' });
                continue;
            }
            
            const zk = new ZKLib(ip, port, 10000, 4000);
            try {
                await zk.createSocket();
                logs.push({ ip, status: `Online` });
                overallSuccess = true;
                await zk.disconnect();
            } catch (e) {
                logs.push({ ip, status: `Error Protokol` });
            }
        } catch (err) {
            logs.push({ ip, status: 'Error Internal' });
        }
    }
    res.status(200).json({ success: overallSuccess, logs });
});

app.post('/api/sync-logs', async (req, res) => {
    const { ips, port, targetYear } = req.body;
    let totalLogsFormatted = [];
    const SYNC_YEAR = parseInt(targetYear); // 0 jika 'Semua Tahun'

    console.log(`\n[SYNC] Target Tahun: ${SYNC_YEAR === 0 ? 'SEMUA TAHUN' : SYNC_YEAR}`);

    if (!isZKLibAvailable) return res.status(500).json({ error: 'Library missing' });

    for (const ip of ips) {
        if (!await checkNetworkConnection(ip, port)) continue;

        const zk = new ZKLib(ip, port, 40000, 5000);
        try {
            await zk.createSocket();
            
            let logsFromMachine = await (zk.getAttendances ? zk.getAttendances() : zk.getAttendance());
            let rawData = Array.isArray(logsFromMachine) ? logsFromMachine : (logsFromMachine.data || []);

            console.log(`[SYNC] ${ip}: Menarik ${rawData.length} entri total.`);

            const yearCounts = {};
            const groupedLogs = {};
            let processedCount = 0;
            let ignoredCount = 0;

            rawData.forEach(log => {
                const recordTime = log.recordTime || log.timestamp;
                if (!recordTime) return;

                const logTime = new Date(recordTime);
                const actualYear = logTime.getFullYear();
                
                // Hitung statistik tahun yang ditemukan
                yearCounts[actualYear] = (yearCounts[actualYear] || 0) + 1;

                // Filter Tahun (Kecuali jika SYNC_YEAR adalah 0)
                if (SYNC_YEAR !== 0 && actualYear !== SYNC_YEAR) {
                    ignoredCount++;
                    return;
                }

                processedCount++;
                const dateStr = logTime.toISOString().split('T')[0];
                const timeStr = logTime.toTimeString().split(' ')[0].substring(0, 5);
                const isMorning = logTime.getHours() < 12;
                const userId = String(log.deviceUserId || log.userSn || log.uid);
                const key = `${userId}_${dateStr}`;

                if (!groupedLogs[key]) {
                    groupedLogs[key] = { fingerprint_id: userId, date: dateStr, check_in: isMorning ? timeStr : null, check_out: !isMorning ? timeStr : null };
                } else {
                    if (isMorning) {
                        if (!groupedLogs[key].check_in || timeStr < groupedLogs[key].check_in) groupedLogs[key].check_in = timeStr;
                    } else {
                        if (!groupedLogs[key].check_out || timeStr > groupedLogs[key].check_out) groupedLogs[key].check_out = timeStr;
                    }
                }
            });

            // LOG DETAIL TAHUN UNTUK USER
            console.log("[INFO] Ringkasan Tahun di Mesin:");
            Object.keys(yearCounts).forEach(yr => console.log(`   - Tahun ${yr}: ${yearCounts[yr]} data`));
            console.log(`[SYNC] Filter: ${processedCount} diproses, ${ignoredCount} diabaikan.`);

            const processed = Object.values(groupedLogs);
            for (const log of processed) {
                const { data: existing } = await supabase.from('attendance_logs').select('check_in, check_out').eq('fingerprint_id', log.fingerprint_id).eq('date', log.date).maybeSingle();
                const payload = { fingerprint_id: log.fingerprint_id, date: log.date, check_in: log.check_in || (existing ? existing.check_in : null), check_out: log.check_out || (existing ? existing.check_out : null) };
                const { error } = await supabase.from('attendance_logs').upsert(payload, { onConflict: 'fingerprint_id, date' });
                
                if (!error) {
                    totalLogsFormatted.push({
                        id: `sync-${log.fingerprint_id}-${log.date}`,
                        employeeId: 'unknown',
                        date: log.date,
                        day: new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long' }),
                        shiftIn: '08:00',
                        fingerprintIn: payload.check_in,
                        shiftOut: '17:00',
                        fingerprintOut: payload.check_out,
                        remarks: 'Data Sinkronisasi',
                        isLate: payload.check_in ? payload.check_in > '08:05' : false
                    });
                }
            }
        } catch (e) {
            console.error(`[SYNC] Error IP ${ip}:`, e.message);
        } finally {
            try { await zk.disconnect(); } catch (e) {}
        }
    }
    res.status(200).json(totalLogsFormatted);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[READY] Server di Port ${PORT}`);
    console.log(`-----------------------------------------------`);
});
