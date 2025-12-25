
import React from 'react';
import { PermissionRequest, PermissionStatus } from '../types';
import { Check, X, User, Calendar, FileText, Filter } from 'lucide-react';

interface Props {
  permissions: PermissionRequest[];
  onUpdateStatus: (id: string, status: PermissionStatus) => void;
  managerId: string;
}

const ManagerView: React.FC<Props> = ({ permissions, onUpdateStatus, managerId }) => {
  const filteredPermissions = permissions.filter(p => p.managerId === managerId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Panel Persetujuan Tim</h3>
          <p className="text-slate-500">Kelola dan tinjau permohonan izin dari anggota tim Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filter Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPermissions.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            <p className="font-medium text-lg">Tidak ada permohonan masuk.</p>
          </div>
        ) : (
          filteredPermissions.map(perm => (
            <div key={perm.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{perm.employeeName}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      perm.type === 'Sakit' ? 'text-rose-500' : 
                      perm.type === 'Cuti' ? 'text-indigo-500' : 'text-amber-500'
                    }`}>
                      {perm.type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Dari</span>
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <Calendar size={12} /> {perm.startDate}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sampai</span>
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <Calendar size={12} /> {perm.endDate}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Alasan</span>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    "{perm.reason}"
                  </p>
                </div>
              </div>

              {perm.status === PermissionStatus.PENDING ? (
                <div className="grid grid-cols-2 border-t border-slate-100">
                  <button 
                    onClick={() => onUpdateStatus(perm.id, PermissionStatus.REJECTED)}
                    className="flex items-center justify-center gap-2 py-4 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors border-r border-slate-100"
                  >
                    <X size={18} /> Tolak
                  </button>
                  <button 
                    onClick={() => onUpdateStatus(perm.id, PermissionStatus.APPROVED)}
                    className="flex items-center justify-center gap-2 py-4 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <Check size={18} /> Setujui
                  </button>
                </div>
              ) : (
                <div className={`py-4 text-center text-sm font-bold uppercase tracking-wider ${
                  perm.status === PermissionStatus.APPROVED ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {perm.status === PermissionStatus.APPROVED ? 'Disetujui' : 'Ditolak'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagerView;
