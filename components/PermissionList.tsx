
import React, { useState } from 'react';
import { PermissionRequest, PermissionStatus } from '../types';
import { History, Filter, Calendar, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

interface Props {
  permissions: PermissionRequest[];
}

const PermissionList: React.FC<Props> = ({ permissions }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const filteredPermissions = permissions.filter(p => p.startDate.startsWith(selectedMonth));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <History size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Daftar Pengajuan Izin Saya</h3>
            <p className="text-sm text-slate-500">Pantau status persetujuan pimpinan untuk setiap izin.</p>
          </div>
        </div>
        
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

      <div className="grid grid-cols-1 gap-4">
        {filteredPermissions.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
            <div className="flex flex-col items-center gap-3 opacity-30">
              <FileText size={48} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-500">Tidak ada pengajuan izin di periode ini.</p>
            </div>
          </div>
        ) : (
          filteredPermissions.map(perm => (
            <div key={perm.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:border-indigo-200 transition-all">
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex flex-col gap-1 w-32">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Calendar size={14} className="text-indigo-400" />
                    {perm.startDate}
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-32">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe</span>
                  <div className="text-sm font-black text-indigo-600 uppercase">
                    {perm.type}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alasan Pengajuan</span>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{perm.reason}"
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${
                    perm.status === PermissionStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                    perm.status === PermissionStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {perm.status === PermissionStatus.PENDING ? <Clock size={16} /> :
                     perm.status === PermissionStatus.APPROVED ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {perm.status === PermissionStatus.PENDING ? 'Menunggu' :
                     perm.status === PermissionStatus.APPROVED ? 'Disetujui' : 'Ditolak'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PermissionList;
