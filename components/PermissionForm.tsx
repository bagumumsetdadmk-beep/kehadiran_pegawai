
import React, { useState, useEffect } from 'react';
import { Send, FileText, Info, XCircle } from 'lucide-react';
import { PermissionRequest } from '../types';

interface Props {
  onSubmit: (data: Omit<PermissionRequest, 'id' | 'status' | 'employeeName'>) => void;
  managerName: string;
  employeeId: string;
  managerId: string;
  initialDate?: string | null;
  onCancel: () => void;
}

const PermissionForm: React.FC<Props> = ({ onSubmit, managerName, employeeId, managerId, initialDate, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'Alasan Penting' as const,
    startDate: initialDate || new Date().toISOString().split('T')[0],
    endDate: initialDate || new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    if (initialDate) {
      setFormData(prev => ({ ...prev, startDate: initialDate, endDate: initialDate }));
    }
  }, [initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, employeeId, managerId });
  };

  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white relative">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FileText size={28} /> Pengajuan Izin
          </h2>
          <p className="mt-2 text-indigo-100 opacity-90">Klarifikasi ketidakhadiran atau keterlambatan Anda.</p>
          <button 
            onClick={onCancel}
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 text-blue-700">
            <Info size={20} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Anda sedang mengajukan izin untuk tanggal <strong>{formData.startDate}</strong> yang akan dikirimkan kepada <strong>{managerName}</strong> untuk divalidasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jenis Izin</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
              >
                <option value="Sakit">Sakit</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Alasan Penting">Alasan Penting</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tujuan Persetujuan</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 font-bold italic">
                {managerName}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tanggal Mulai</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tanggal Selesai</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Detail Alasan</label>
            <textarea 
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              placeholder="Berikan keterangan jelas terkait keterlambatan/ketidakhadiran..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={onCancel}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-xl transition-all"
            >
              Batalkan
            </button>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              <Send size={20} /> Kirim Izin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionForm;
