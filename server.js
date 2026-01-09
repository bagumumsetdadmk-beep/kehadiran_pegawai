
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

// Endpoint untuk menghapus seluruh log
app.post('/api/clear-logs', async (req, res) => {
    console.log("[DANGER] Membersihkan seluruh data attendance_logs...");
    try {
        const { error } = await supabase
            .from('attendance_logs')
            .delete()
            .neq('id', 0); // Trik untuk menghapus semua baris (id != 0)

        if (error) throw error;
        
        console.log("[DANGER] Data berhasil dikosongkan.");
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
                logs.push({ ip, status: 'Offline (Ping Gagal)' });
                continue;
            }
            
            const zk = new ZKLib(ip, port, 10000, 4000);
            try {
                await zk.createSocket();
                let info = "Koneksi OK";
                if (typeof zk.getTime === 'function') {
                    try { info = `Waktu: ${await zk.getTime()}`; } catch(e) {}
                }
                logs.push({ ip, status: `Online (${info})` });
                overallSuccess = true;
                await zk.disconnect();
            } catch (e) {
                logs.push({ ip, status: `Error Protokol: ${e.message.substring(0, 30)}` });
            }
        } catch (err) {
            logs.push({ ip, status: 'Error Internal Server' });
        }
    }
    res.status(200).json({ success: overallSuccess, logs });
});

app.post('/api/sync-logs', async (req, res) => {
    const { ips, port } = req.body;
    let totalLogsFormatted = [];
    const TARGET_YEAR = 2026;

    if (!isZKLibAvailable) return res.status(500).json({ error: 'Library node-zklib tidak terpasang' });

    for (const ip of ips) {
        console.log(`\n[SYNC-2026] IP: ${ip}`);
        
        if (!await checkNetworkConnection(ip, port)) {
            console.log(`[SYNC] ${ip}: Jaringan tidak terjangkau.`);
            continue;
        }

        const zk = new ZKLib(ip, port, 30000, 5000);
        try {
            await zk.createSocket();
            
            let logsFromMachine = null;
            if (typeof zk.getAttendances === 'function') {
                logsFromMachine = await zk.getAttendances();
            } else if (typeof zk.getAttendance === 'function') {
                logsFromMachine = await zk.getAttendance();
            }

            let rawData = [];
            if (logsFromMachine && Array.isArray(logsFromMachine)) {
                rawData = logsFromMachine;
            } else if (logsFromMachine && logsFromMachine.data && Array.isArray(logsFromMachine.data)) {
                rawData = logsFromMachine.data;
            }

            console.log(`[SYNC] ${ip}: Menarik ${rawData.length} total entri dari mesin.`);

            const groupedLogs = {};
            let ignoredCount = 0;

            rawData.forEach(log => {
                const recordTime = log.recordTime || log.timestamp;
                if (!recordTime) return;

                const logTime = new Date(recordTime);
                if (isNaN(logTime.getTime())) return;

                if (logTime.getFullYear() !== TARGET_YEAR) {
                    ignoredCount++;
                    return;
                }

                const dateStr = logTime.toISOString().split('T')[0];
                const timeStr = logTime.toTimeString().split(' ')[0].substring(0, 5);
                const isMorning = logTime.getHours() < 12;
                const userId = String(log.deviceUserId || log.userSn || log.uid);
                
                const key = `${userId}_${dateStr}`;

                if (!groupedLogs[key]) {
                    groupedLogs[key] = {
                        fingerprint_id: userId,
                        date: dateStr,
                        check_in: isMorning ? timeStr : null,
                        check_out: !isMorning ? timeStr : null
                    };
                } else {
                    if (isMorning) {
                        if (!groupedLogs[key].check_in || timeStr < groupedLogs[key].check_in) {
                            groupedLogs[key].check_in = timeStr;
                        }
                    } else {
                        if (!groupedLogs[key].check_out || timeStr > groupedLogs[key].check_out) {
                            groupedLogs[key].check_out = timeStr;
                        }
                    }
                }
            });

            const processed = Object.values(groupedLogs);
            console.log(`[SYNC] Filter Tahun ${TARGET_YEAR}: ${processed.length} data diproses, ${ignoredCount} data tahun lain diabaikan.`);

            for (const log of processed) {
                const { data: existing } = await supabase
                    .from('attendance_logs')
                    .select('check_in, check_out')
                    .eq('fingerprint_id', log.fingerprint_id)
                    .eq('date', log.date)
                    .maybeSingle();

                const payload = {
                    fingerprint_id: log.fingerprint_id,
                    date: log.date,
                    check_in: log.check_in || (existing ? existing.check_in : null),
                    check_out: log.check_out || (existing ? existing.check_out : null)
                };

                const { error } = await supabase
                    .from('attendance_logs')
                    .upsert(payload, { onConflict: 'fingerprint_id, date' });
                
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
                        remarks: 'Data Tahun 2026',
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
    console.log(`\n[READY] Middleware Filter Tahun 2026 di Port ${PORT}`);
    console.log(`-----------------------------------------------`);
});
