
import React from 'react';
import { AttendanceRecord, PermissionRequest, PermissionStatus } from '../types';
import { AlertTriangle, CheckCircle2, Clock, MessageSquareQuote, CalendarCheck, Timer, ShieldQuestion, ShieldAlert, ShieldCheck, Coffee, PlaneTakeoff, Briefcase } from 'lucide-react';

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
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Lembur/Tugas</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Terlambat</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-300"></div> Libur</div>
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
                // Catatan: row.remarks biasanya diisi 'Libur Akhir Pekan' atau Nama Hari Libur oleh parent component jika kosong
                const isWeekend = row.day === 'Sabtu' || row.day === 'Minggu';
                // Cek apakah remarks mengandung kata libur tapi BUKAN karena kehadiran
                const isHoliday = !isWeekend && (row.remarks === 'Belum Ada Data' ? false : (row.remarks.includes('Libur') || row.remarks.includes('Cuti Bersama')));

                // Cek apakah HADIR di hari libur (Lembur)
                const isPresentOnHoliday = (isWeekend || isHoliday) && row.fingerprintIn;

                return (
                  <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors group ${(!isPresentOnHoliday && (isWeekend || isHoliday)) ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-8 py-6 text-sm font-mono text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${isWeekend || isHoliday ? 'text-rose-400' : 'text-slate-700'}`}>{row.day}</span>
                        <span className="text-xs text-slate-400">{row.date}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-semibold text-slate-400">
                      {/* Jika hadir di hari libur, jadwalnya dianggap Flexibel/Lembur */}
                      {isPresentOnHoliday ? <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded">LEMBUR</span> : row.shiftIn}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-sm font-black ${
                        row.isLate && !isPresentOnHoliday ? 'text-rose-600' : 
                        row.fingerprintIn ? (isPresentOnHoliday ? 'text-blue-600' : 'text-emerald-600') : 'text-slate-300'
                      }`}>
                        {row.fingerprintIn || '--:--'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-semibold text-slate-400">
                      {isPresentOnHoliday ? <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded">TUGAS</span> : row.shiftOut}
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-bold text-slate-700">
                      <span className={row.fingerprintOut ? (isPresentOnHoliday ? 'text-blue-600' : 'text-slate-700') : 'text-slate-300'}>
                        {row.fingerprintOut || '--:--'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                          isPresentOnHoliday 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' // Prioritas: Hadir di Hari Libur (Biru)
                            : row.isLate 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : isHoliday
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
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
                          
                          {/* Teks Status */}
                          {isPresentOnHoliday ? 'Hadir (Hari Libur)' : row.remarks}
                        </div>
                        
                        {/* Tombol Izin hanya muncul jika terlambat dan bukan hari libur/lembur */}
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
