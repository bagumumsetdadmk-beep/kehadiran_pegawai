
import React from 'react';
import { AttendanceRecord, Employee, Holiday } from '../types';
import { User, CalendarDays, LayoutGrid, Award, Briefcase, MapPin, Users, ClockAlert, UserMinus } from 'lucide-react';

interface Props {
  user: Employee;
  holidays: Holiday[];
  subBagianCount: number;
  employees: Employee[];
  attendance: AttendanceRecord[];
}

const Dashboard: React.FC<Props> = ({ user, holidays, subBagianCount, employees, attendance }) => {
  // Hitung Statistik Hari Ini
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Total Pegawai Aktif
  const totalEmployees = employees.length;

  // Filter kehadiran hari ini
  // Catatan: Jika ini adalah demo dengan data mock masa lalu, data hari ini mungkin kosong (0).
  const todayAttendance = attendance.filter(a => a.date === todayDate);

  // Terlambat hari ini
  const lateTodayCount = todayAttendance.filter(a => a.isLate).length;

  // Yang sudah absen masuk (Hadir)
  const presentTodayCount = todayAttendance.filter(a => a.fingerprintIn).length;

  // Tidak Masuk / Belum Hadir (Total - Hadir)
  const absentTodayCount = totalEmployees - presentTodayCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Profil Pegawai Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 h-32 relative">
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-lg">
            <img 
              src={user.photoUrl} 
              alt={user.name} 
              className="w-24 h-24 rounded-2xl object-cover"
            />
          </div>
        </div>
        <div className="pt-16 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800">{user.name}</h1>
              <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                <Briefcase size={16} className="text-indigo-500" />
                {user.role} • {user.nip}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 self-start">
              <Award size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Status: Aktif</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 border-t border-slate-100 pt-8">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subbagian</p>
                <p className="text-sm font-bold text-slate-700">{user.subBagian}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis Kelamin</p>
                <p className="text-sm font-bold text-slate-700">{user.gender}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Kehadiran Hari Ini (Grid Baru) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Pegawai */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5 group hover:border-blue-300 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pegawai</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{totalEmployees}</p>
          </div>
        </div>

        {/* Terlambat Hari Ini */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5 group hover:border-amber-300 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <ClockAlert size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Terlambat Hari Ini</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{lateTodayCount}</p>
          </div>
        </div>

        {/* Tidak Masuk / Belum Hadir */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5 group hover:border-rose-300 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <UserMinus size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum Hadir / Absen</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{absentTodayCount}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid Lama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-6 group hover:border-purple-200 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarDays size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hari Libur (Luar Weekend)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-800">{holidays.length}</p>
              <p className="text-slate-400 font-bold text-sm">Hari Terdaftar</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-6 group hover:border-indigo-200 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <LayoutGrid size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Subbagian</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-800">{subBagianCount}</p>
              <p className="text-slate-400 font-bold text-sm">Struktur Organisasi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
