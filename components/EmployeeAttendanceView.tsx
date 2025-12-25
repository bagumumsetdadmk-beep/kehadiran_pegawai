
import React, { useState } from 'react';
import { AttendanceRecord, PermissionRequest, Holiday, WorkSchedule } from '../types';
import AttendanceTable from './AttendanceTable';
import { Calendar, Filter } from 'lucide-react';
import { getScheduleForDate } from '../utils/scheduleUtils';

interface Props {
  attendance: AttendanceRecord[];
  permissions: PermissionRequest[];
  holidays: Holiday[];
  schedules?: WorkSchedule[];
  onJustifyLate: (date: string) => void;
}

const EmployeeAttendanceView: React.FC<Props> = ({ attendance, permissions, holidays, schedules = [], onJustifyLate }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  // Fungsi untuk menghasilkan data satu bulan penuh
  const generateFullMonthData = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const fullMonthData: AttendanceRecord[] = [];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const existingRecord = attendance.find(a => a.date === dateStr);
      
      const dateObj = new Date(year, month - 1, d);
      const dayName = dayNames[dateObj.getDay()];
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      
      // Cari apakah tanggal ini merupakan hari libur yang diatur admin
      const holiday = holidays.find(h => h.date === dateStr);

      // Hitung jadwal kerja dinamis berdasarkan konfigurasi admin
      const schedule = getScheduleForDate(dateStr, dayName, schedules);

      if (existingRecord) {
        // Jika ada record fingerprint (Masuk kerja)
        let finalRecord = { ...existingRecord };
        
        // Logika Khusus: Jika masuk pada Hari Libur / Weekend
        if (isWeekend || holiday) {
             finalRecord.isLate = false; // Tidak bisa terlambat di hari libur
             finalRecord.remarks = existingRecord.remarks.includes('Terlambat') ? 'Hadir (Lembur)' : existingRecord.remarks;
             // Opsional: Kita bisa override shiftIn/Out visual agar tidak membingungkan
             finalRecord.shiftIn = '--:--';
             finalRecord.shiftOut = '--:--';
        } else {
             // Jika hari kerja biasa, pastikan shift info sesuai jadwal saat ini
             finalRecord.shiftIn = schedule.shiftIn;
             finalRecord.shiftOut = schedule.shiftOut;
        }

        fullMonthData.push(finalRecord);
      } else {
        // Jika tidak ada record (Absen/Libur)
        fullMonthData.push({
          id: `empty-${dateStr}`,
          employeeId: '',
          date: dateStr,
          day: dayName,
          shiftIn: (isWeekend || holiday) ? '--:--' : schedule.shiftIn,
          fingerprintIn: null,
          shiftOut: (isWeekend || holiday) ? '--:--' : schedule.shiftOut,
          fingerprintOut: null,
          remarks: holiday ? holiday.name : (isWeekend ? 'Libur Akhir Pekan' : 'Belum Ada Data'),
          isLate: false
        });
      }
    }
    return fullMonthData;
  };

  const fullMonthAttendance = generateFullMonthData();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Daftar Kehadiran Lengkap</h3>
            <p className="text-sm text-slate-500">Menampilkan seluruh hari pada periode bulan yang dipilih.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Filter size={14} /> Pilih Bulan:
            </div>
            <input 
              type="month" 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      <AttendanceTable 
        attendance={fullMonthAttendance} 
        permissions={permissions}
        holidays={holidays}
        onJustifyLate={onJustifyLate} 
      />
    </div>
  );
};

export default EmployeeAttendanceView;
