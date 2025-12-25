
import React, { useState } from 'react';
import { Holiday } from '../types';
import { Plus, Trash2, Calendar, PlaneTakeoff, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  holidays: Holiday[];
  onAddHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
}

const HolidayManager: React.FC<Props> = ({ holidays, onAddHoliday, onDeleteHoliday }) => {
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHoliday.date && newHoliday.name) {
      onAddHoliday({
        id: `holiday-${Date.now()}`,
        date: newHoliday.date,
        name: newHoliday.name,
      });
      setNewHoliday({ date: '', name: '' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
            <PlaneTakeoff size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Manajemen Hari Libur</h3>
            <p className="text-sm text-slate-500 mt-1">Tambahkan hari libur nasional atau khusus instansi di sini.</p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Libur</label>
            <input 
              type="date"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Hari Libur</label>
            <input 
              type="text"
              placeholder="Contoh: Hari Raya Idul Fitri"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              required
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Tambah Libur
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <h4 className="font-bold text-slate-800">Daftar Libur Terdaftar</h4>
          <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-400">
            {holidays.length} Hari
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-8 py-5">No</th>
                <th className="px-8 py-5">Tanggal</th>
                <th className="px-8 py-5">Keterangan Hari Libur</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Sparkles size={48} className="text-slate-400" />
                      <p className="text-sm font-bold text-slate-500">Belum ada hari libur khusus yang ditambahkan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                holidays.sort((a,b) => a.date.localeCompare(b.date)).map((h, idx) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 text-sm font-mono text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <Calendar size={14} className="text-rose-400" />
                        {h.date}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-600 font-medium">
                      {h.name}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => onDeleteHoliday(h.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Hapus Hari Libur"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HolidayManager;
