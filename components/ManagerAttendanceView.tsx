
import React, { useState } from 'react';
import { AttendanceRecord, Employee, PermissionRequest, Holiday, WorkSchedule } from '../types';
import AttendanceTable from './AttendanceTable';
import { User, Filter } from 'lucide-react';
import { getScheduleForDate } from '../utils/scheduleUtils';

interface Props {
  managerId: string;
  employees: Employee[];
  attendance: AttendanceRecord[];
  permissions?: PermissionRequest[];
  holidays: Holiday[];
  schedules?: WorkSchedule[];
}

const ManagerAttendanceView: React.FC<Props> = ({ managerId, employees, attendance, permissions = [], holidays, schedules = [] }) => {
  const subordinates = employees.filter(e => e.managerId === managerId);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  // Fungsi untuk menghasilkan data satu bulan penuh untuk monitoring pimpinan
  const generateDisplayData = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    // Jika melihat semua staf, kita hanya tampilkan record yang ada (Active Logs)
    if (selectedEmployeeId === 'all') {
      const filtered = attendance.filter(att => {
        const isSubordinate = subordinates.some(s => s.id === att.employeeId);
        return isSubordinate && att.date.startsWith(selectedMonth);
      });
      
      return filtered.map(att => {
        const emp = subordinates.find(s => s.id === att.employeeId);
        const dateObj = new Date(att.date);
        const dayName = dayNames[dateObj.getDay()];
        const schedule = getScheduleForDate(att.date, dayName, schedules);
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        const holiday = holidays.find(h => h.date === att.date);
        
        // Logika override jika lembur di hari libur
        const isHolidayWork = isWeekend || holiday;

        return {
          ...att,
          shiftIn: isHolidayWork ? '--:--' : schedule.shiftIn,
          shiftOut: isHolidayWork ? '--:--' : schedule.shiftOut,
          isLate: isHolidayWork ? false : att.isLate,
          remarks: isHolidayWork ? `Hadir (Lembur) - ${emp?.name}` : `${att.remarks}${emp ? ` (${emp.name})` : ''}`
        };
      });
    }

    // Jika melihat spesifik 1 pegawai, tampilkan kalender lengkap
    const fullMonthData: AttendanceRecord[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const existingRecord = attendance.find(a => a.employeeId === selectedEmployeeId && a.date === dateStr);
      
      const dateObj = new Date(year, month - 1, d);
      const dayName = dayNames[dateObj.getDay()];
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const holiday = holidays.find(h => h.date === dateStr);
      const schedule = getScheduleForDate(dateStr, dayName, schedules);

      if (existingRecord) {
        let finalRecord = { ...existingRecord };
        if (isWeekend || holiday) {
             finalRecord.isLate = false;
             finalRecord.remarks = existingRecord.remarks.includes('Terlambat') ? 'Hadir (Lembur)' : existingRecord.remarks;
             finalRecord.shiftIn = '--:--';
             finalRecord.shiftOut = '--:--';
        } else {
             finalRecord.shiftIn = schedule.shiftIn;
             finalRecord.shiftOut = schedule.shiftOut;
        }
        fullMonthData.push(finalRecord);
      } else {
        fullMonthData.push({
          id: `empty-${dateStr}`,
          employeeId: selectedEmployeeId,
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

  const displayAttendance = generateDisplayData();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Monitoring Kehadiran Staf</h3>
          <p className="text-xs text-slate-500">Tinjau log fingerprint dan status hari libur anggota tim.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Filter size={14} /> Bulan:
            </div>
            <input 
              type="month" 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <User size={14} /> Pegawai:
            </div>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[180px]"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="all">Semua Pegawai Tim</option>
              {subordinates.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <AttendanceTable attendance={displayAttendance} permissions={permissions} holidays={holidays} />
    </div>
  );
};

export default ManagerAttendanceView;
