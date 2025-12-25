
import React from 'react';
import { AttendanceRecord, PermissionRequest, PermissionStatus } from '../types';
import { CheckCircle2, Clock, MessageSquareQuote, CalendarCheck, ShieldQuestion, ShieldAlert, ShieldCheck, Coffee, PlaneTakeoff, Briefcase } from 'lucide-react';

interface Props {
  attendance: AttendanceRecord[];
  permissions?: PermissionRequest[];
  onJustifyLate?: (date: string) => void;
}

const AttendanceTable: React.FC<Props> = ({ attendance, permissions = [], onJustifyLate }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Log Presensi Pegawai</h3>
          <p className="text-sm text-slate-500 mt-1">Laporan harian presensi mencakup hari kerja, akhir pekan, dan hari libur nasional.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 bg-white border border-slate-200 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Normal</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Lembur/Tugas</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Terlambat</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-600"></div> Tgl Merah</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Akhir Pekan</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
              <th className="px-8 py-5">No</th>
              <th className="px-8 py-5">Hari / Tanggal</th>
              <th className="px-8 py-5 text-center">Jadwal Masuk</th>
              <th className="px-8 py-5 text-center">Finger In</th>
              <th className="px-8 py-5 text-center">Jadwal Pulang</th>
              <th className="px-8 py-5 text-center">Finger Out</th>
              <th className="px-8 py-5">Status & Izin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <CalendarCheck size={48} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-500">Belum ada periode yang dipilih</p>
                  </div>
                </td>
              </tr>
            ) : (
              attendance.map((row, idx) => {
                const permission = permissions.find(p => p.startDate === row.date);
                
                // Deteksi Hari Libur / Weekend
                const isWeekend = row.day === 'Sabtu' || row.day === 'Minggu';
                const isHoliday = !isWeekend && (row.remarks === 'Belum Ada Data' ? false : (row.remarks.includes('Libur') || row.remarks.includes('Cuti Bersama')));

                // Cek apakah HADIR di hari libur (Lembur)
                const isPresentOnHoliday = (isWeekend || isHoliday) && row.fingerprintIn;

                // Tentukan warna background baris
                // HARI LIBUR: Tetap Putih (hover sedikit abu) agar teks Merah terlihat kontras
                // WEEKEND: Sedikit abu-abu
                let rowBackgroundClass = 'hover:bg-slate-50/80'; 
                if (isWeekend) {
                  rowBackgroundClass = 'bg-slate-50/50'; 
                }

                return (
                  <tr key={row.id} className={`${rowBackgroundClass} transition-colors group border-b border-slate-100 last:border-0`}>
                    <td className="px-8 py-6 text-sm font-mono text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                    
                    {/* Kolom Hari & Tanggal */}
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${
                          isHoliday ? 'text-rose-600' : // Merah Tegas untuk Hari Libur
                          isWeekend ? 'text-slate-500' : 'text-slate-700'
                        }`}>
                          {row.day}
                        </span>
                        <span className={`text-xs ${isHoliday ? 'text-rose-400' : 'text-slate-400'}`}>{row.date}</span>
                      </div>
                    </td>

                    {/* Kolom Jadwal Masuk */}
                    <td className="px-8 py-6 text-center text-sm font-semibold text-slate-400">
                      {isPresentOnHoliday ? (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">EXTRA</span>
                      ) : (
                        <span className={isHoliday ? 'text-rose-300 font-medium' : ''}>{row.shiftIn}</span>
                      )}
                    </td>

                    {/* Kolom Finger In (Highlight Biru jika masuk saat libur) */}
                    <td className="px-8 py-6 text-center">
                      <span className={`text-sm font-black ${
                        isPresentOnHoliday ? 'text-blue-600' : // Biru jika lembur
                        row.isLate ? 'text-rose-600' : 
                        row.fingerprintIn ? 'text-emerald-600' : 
                        isHoliday ? 'text-rose-300' : 'text-slate-300' 
                      }`}>
                        {row.fingerprintIn || '--:--'}
                      </span>
                    </td>

                    {/* Kolom Jadwal Pulang */}
                    <td className="px-8 py-6 text-center text-sm font-semibold text-slate-400">
                      {isPresentOnHoliday ? (
                         <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">TASK</span>
                      ) : (
                         <span className={isHoliday ? 'text-rose-300 font-medium' : ''}>{row.shiftOut}</span>
                      )}
                    </td>

                    {/* Kolom Finger Out */}
                    <td className="px-8 py-6 text-center text-sm font-bold">
                      <span className={`${
                         isPresentOnHoliday && row.fingerprintOut ? 'text-blue-600' :
                         row.fingerprintOut ? 'text-slate-700' : 
                         isHoliday ? 'text-rose-300' : 'text-slate-300'
                      }`}>
                        {row.fingerprintOut || '--:--'}
                      </span>
                    </td>

                    {/* Kolom Status & Aksi */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                          isPresentOnHoliday 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200' // Biru solid mencolok untuk Lembur
                            : row.isLate 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : isHoliday
                            ? 'bg-white text-rose-600 border border-rose-200 shadow-sm' // Background Putih, Text Merah (Sesuai Request)
                            : isWeekend
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : row.fingerprintIn
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                          {isPresentOnHoliday ? <Briefcase size={12} /> : 
                           row.isLate ? <Clock size={12} /> : 
                           isHoliday ? <PlaneTakeoff size={12} /> : 
                           isWeekend ? <Coffee size={12} /> : 
                           <CheckCircle2 size={12} />}
                          
                          {isPresentOnHoliday ? 'Hadir (Lembur)' : row.remarks}
                        </div>
                        
                        {/* Tombol Justify (Izin) */}
                        {row.isLate && !permission && !isPresentOnHoliday && (
                          <button 
                            onClick={() => onJustifyLate?.(row.date)}
                            className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-1.5 pr-3"
                            title="Ajukan Izin"
                          >
                            <MessageSquareQuote size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Justify</span>
                          </button>
                        )}

                        {permission && (
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
                            permission.status === PermissionStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            permission.status === PermissionStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {permission.status === PermissionStatus.PENDING ? <ShieldQuestion size={14} /> : 
                             permission.status === PermissionStatus.APPROVED ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                            <span className="text-[9px] font-bold uppercase">
                              {permission.status === PermissionStatus.PENDING ? 'Menunggu' :
                               permission.status === PermissionStatus.APPROVED ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
