
import { WorkSchedule } from '../types';

/**
 * Mendapatkan aturan jadwal kerja untuk tanggal dan hari tertentu.
 * Prioritas:
 * 1. Jadwal Khusus dengan Rentang Tanggal (misal: Puasa)
 * 2. Jadwal Reguler Mingguan
 */
export const getScheduleForDate = (dateStr: string, dayName: string, schedules: WorkSchedule[]): { shiftIn: string, shiftOut: string } => {
  
  // 1. Cari jadwal yang memiliki rentang tanggal (StartDate & EndDate) dan mencakup tanggal ini
  const specificSchedule = schedules.find(s => {
    if (s.startDate && s.endDate && s.days.includes(dayName)) {
      return dateStr >= s.startDate && dateStr <= s.endDate;
    }
    return false;
  });

  if (specificSchedule) {
    return { shiftIn: specificSchedule.startTime, shiftOut: specificSchedule.endTime };
  }

  // 2. Jika tidak ada jadwal khusus, cari jadwal reguler (tanpa rentang tanggal) untuk hari ini
  const regularSchedule = schedules.find(s => {
    if ((!s.startDate || !s.endDate) && s.days.includes(dayName)) {
      return true;
    }
    return false;
  });

  if (regularSchedule) {
    return { shiftIn: regularSchedule.startTime, shiftOut: regularSchedule.endTime };
  }

  // 3. Default fallback jika tidak ada konfigurasi sama sekali
  return { shiftIn: '08:00', shiftOut: '17:00' };
};
