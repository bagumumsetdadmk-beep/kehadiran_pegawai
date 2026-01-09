
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Upload, 
  Save, 
  CheckCircle2, 
  FileJson, 
  ImageIcon, 
  X, 
  LayoutGrid, 
  Plus, 
  Trash2, 
  CalendarCheck2, 
  FileSpreadsheet, 
  User, 
  Download, 
  Users, 
  Clock, 
  CalendarRange, 
  Edit, 
  RotateCcw, 
  Server, 
  Wifi, 
  RefreshCw, 
  Power, 
  Database, 
  ArrowDownToLine, 
  Link, 
  Unplug, 
  Eye, 
  EyeOff,
  Network,
  AlertCircle,
  Skull,
  CalendarDays
} from 'lucide-react';
import { AttendanceRecord, Employee, Holiday, WorkSchedule, FingerprintMachine, OrganizationProfile } from '../types';
import { checkSupabaseConnection } from '../lib/supabaseClient';

interface Props {
  onImportFingerprint: (event: React.ChangeEvent<HTMLInputElement>) => void;
  opdProfile: OrganizationProfile;
  onUpdateOpdProfile: (profile: OrganizationProfile) => void;
  subBagianList: string[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  holidays: Holiday[];
  schedules?: WorkSchedule[];
  machineConfig?: FingerprintMachine;
  onAddSubBagian: (name: string) => void;
  onDeleteSubBagian: (name: string) => void;
  onAddSchedule?: (schedule: WorkSchedule) => void;
  onUpdateSchedule?: (schedule: WorkSchedule) => void;
  onDeleteSchedule?: (id: string) => void;
  onUpdateMachine?: (config: FingerprintMachine) => void;
  onSyncAttendance?: (records: AttendanceRecord[]) => void;
}

const SystemConfigView: React.FC<Props> = ({ 
  opdProfile, 
  onUpdateOpdProfile, 
  employees, 
  attendance, 
  machineConfig, 
  onUpdateMachine, 
  onSyncAttendance 
}) => {
  const [localOpdInfo, setLocalOpdInfo] = useState<OrganizationProfile>(opdProfile);
  const [dbConfig, setDbConfig] = useState({
    url: localStorage.getItem('SB_URL') || '',
    key: localStorage.getItem('SB_KEY') || ''
  });
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showDbKey, setShowDbKey] = useState(false);
  
  const [localMachineConfig, setLocalMachineConfig] = useState<FingerprintMachine>(
    machineConfig || {
      ipAddress: '192.168.1.201',
      port: '4370',
      commKey: '0',
      name: 'Mesin Utama',
      lastSync: null,
      status: 'Offline'
    }
  );
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed' | 'middleware_error' | 'success_simulation'>('idle'); 
  const [syncYear, setSyncYear] = useState('2026');

  const [middlewareUrl, setMiddlewareUrl] = useState(() => {
    return localStorage.getItem('MW_URL') || `http://127.0.0.1:3006`;
  });

  useEffect(() => {
    const initDbCheck = async () => {
      const isConnected = await checkSupabaseConnection();
      setDbStatus(isConnected ? 'connected' : 'disconnected');
    };
    initDbCheck();
  }, []);

  const handleSaveDBConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbStatus('checking');
    const isSuccess = await checkSupabaseConnection(dbConfig.url, dbConfig.key);
    if (isSuccess) {
      localStorage.setItem('SB_URL', dbConfig.url);
      localStorage.setItem('SB_KEY', dbConfig.key);
      setDbStatus('connected');
      alert("Koneksi Database Berhasil!");
      window.location.reload();
    } else {
      setDbStatus('disconnected');
      alert("Gagal terhubung ke Database.");
    }
  };

  const handleSaveMachine = () => {
    if(onUpdateMachine) {
        onUpdateMachine(localMachineConfig);
    }
    alert("Konfigurasi Mesin disimpan.");
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');

    const ips = localMachineConfig.ipAddress.split(',').map(i => i.trim()).filter(i => i.length > 0);
    
    try {
      const baseUrl = middlewareUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ips, 
          port: parseInt(localMachineConfig.port),
          commKey: parseInt(localMachineConfig.commKey)
        })
      });

      if (response.ok) {
        const result = await response.json();
        setConnectionStatus(result.status === 'success_simulation' ? 'success_simulation' : (result.success ? 'success' : 'failed'));
        setLocalMachineConfig(prev => ({...prev, status: result.success ? 'Online' : 'Offline'}));
      } else {
        setConnectionStatus('middleware_error');
      }
    } catch (error) {
      setConnectionStatus('middleware_error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSyncLogs = async () => {
    if (!onSyncAttendance) return;
    setIsSyncing(true);
    
    try {
      const baseUrl = middlewareUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/sync-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ips: localMachineConfig.ipAddress.split(',').map(i => i.trim()),
          port: parseInt(localMachineConfig.port),
          commKey: parseInt(localMachineConfig.commKey),
          targetYear: parseInt(syncYear)
        }),
      });

      if (response.ok) {
        const logs = await response.json();
        if (Array.isArray(logs)) {
            onSyncAttendance(logs); 
            setLocalMachineConfig(prev => ({...prev, lastSync: new Date().toLocaleString()}));
            alert(`Selesai! Berhasil memproses ${logs.length} data untuk tahun ${syncYear}.`);
        }
      } else {
        alert("Gagal menarik data.");
      }
    } catch (error) {
      alert("Error: Gagal menghubungi middleware.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("HAPUS SEMUA DATA? Peringatan: Seluruh log di database akan dikosongkan.")) return;

    setIsClearing(true);
    try {
      const baseUrl = middlewareUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/clear-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
          if (onSyncAttendance) onSyncAttendance([]);
          alert("Database dikosongkan.");
      } else {
          alert("Gagal mengosongkan database.");
      }
    } catch (err) {
        alert("Gagal menghubungi middleware.");
    } finally {
        setIsClearing(false);
    }
  };

  const handleResetMiddlewareUrl = () => {
      const defaultUrl = `http://127.0.0.1:3006`;
      setMiddlewareUrl(defaultUrl);
      localStorage.setItem('MW_URL', defaultUrl);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Mesin Fingerprint */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Server size={20} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-800">Koneksi Mesin Fingerprint</h3>
               <p className="text-xs text-slate-500">Tarik data presensi dari mesin lokal.</p>
             </div>
          </div>
          <div className="p-8 space-y-6 flex-1">
             <div className={`flex items-center gap-4 p-4 rounded-xl border ${localMachineConfig.status === 'Online' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${localMachineConfig.status === 'Online' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                 <Wifi size={20} />
               </div>
               <div className="flex-1">
                 <p className="text-xs font-bold text-slate-400 uppercase">Status Mesin</p>
                 <p className={`text-sm font-bold ${localMachineConfig.status === 'Online' ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {localMachineConfig.status}
                 </p>
               </div>
               {localMachineConfig.lastSync && (
                 <div className="text-right">
                    <p className="text-[10px] text-slate-400">Sync Terakhir</p>
                    <p className="text-xs font-mono text-slate-600">{localMachineConfig.lastSync}</p>
                 </div>
               )}
             </div>

             <div className="space-y-4">
                <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Network size={12} /> IP Address Mesin
                     </label>
                     <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold" value={localMachineConfig.ipAddress} onChange={(e) => setLocalMachineConfig({...localMachineConfig, ipAddress: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">Port</label>
                     <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={localMachineConfig.port} onChange={(e) => setLocalMachineConfig({...localMachineConfig, port: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Comm Key</label>
                      <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={localMachineConfig.commKey} onChange={(e) => setLocalMachineConfig({...localMachineConfig, commKey: e.target.value})} />
                   </div>
                </div>
                
                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Alamat Middleware</label>
                      <button onClick={handleResetMiddlewareUrl} className="text-[9px] font-bold text-indigo-600 flex items-center gap-1">
                         <RotateCcw size={10} /> Reset
                      </button>
                   </div>
                   <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono" value={middlewareUrl} onChange={(e) => {setMiddlewareUrl(e.target.value); localStorage.setItem('MW_URL', e.target.value);}} />
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                   <label className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1">
                      <CalendarDays size={12} /> Pilih Tahun Sinkronisasi
                   </label>
                   <select 
                     className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-700 outline-none"
                     value={syncYear}
                     onChange={(e) => setSyncYear(e.target.value)}
                   >
                      <option value="2024">Tahun 2024</option>
                      <option value="2025">Tahun 2025</option>
                      <option value="2026">Tahun 2026</option>
                   </select>
                   <p className="text-[9px] text-slate-400">Data dari tahun lain akan diabaikan secara otomatis.</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <button onClick={handleTestConnection} disabled={isTestingConnection} className="py-3 bg-white border border-slate-300 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                 {isTestingConnection ? <RefreshCw size={16} className="animate-spin" /> : <Power size={16} />} Tes Koneksi
               </button>
               <button onClick={handleSaveMachine} className="py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                 <Save size={16} /> Simpan Config
               </button>
             </div>

             <button 
               onClick={handleSyncLogs}
               disabled={isSyncing}
               className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-3 shadow-lg"
             >
                {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <ArrowDownToLine size={20} />}
                {isSyncing ? 'Proses Sinkronisasi...' : `Tarik Data Tahun ${syncYear}`}
             </button>

             {connectionStatus === 'middleware_error' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex gap-3 text-xs text-rose-700">
                   <AlertCircle className="shrink-0" size={18} />
                   <p>Middleware tidak merespon. Pastikan <code>node server.js</code> sudah berjalan di komputer Anda.</p>
                </div>
             )}
          </div>
          
          <div className="p-8 bg-rose-50/50 border-t border-rose-100">
             <div className="flex items-center gap-2 text-rose-600 mb-4">
                <Skull size={18} />
                <h4 className="text-sm font-black uppercase">Zona Berbahaya</h4>
             </div>
             <button onClick={handleClearLogs} disabled={isClearing} className="w-full py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center justify-center gap-2">
                {isClearing ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Kosongkan Database Log
             </button>
          </div>
        </div>

        {/* Database Config */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Database size={20} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-800">Koneksi Database Cloud</h3>
               <p className="text-xs text-slate-500">Konfigurasi Supabase.</p>
             </div>
          </div>
          <div className="p-8 space-y-6">
             <div className={`flex items-center gap-4 p-4 rounded-xl border ${dbStatus === 'connected' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dbStatus === 'connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                 {dbStatus === 'connected' ? <Link size={20} /> : <RefreshCw size={20} className={dbStatus === 'checking' ? 'animate-spin' : ''} />}
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase">Status DB</p>
                 <p className={`text-sm font-bold ${dbStatus === 'connected' ? 'text-emerald-600' : 'text-slate-600'}`}>
                   {dbStatus === 'connected' ? 'Terhubung' : 'Terputus'}
                 </p>
               </div>
             </div>

             <form onSubmit={handleSaveDBConfig} className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Supabase URL</label>
                   <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono" value={dbConfig.url} onChange={(e) => setDbConfig({...dbConfig, url: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Supabase Anon Key</label>
                   <div className="relative">
                     <input type={showDbKey ? "text" : "password"} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono pr-10" value={dbConfig.key} onChange={(e) => setDbConfig({...dbConfig, key: e.target.value})} />
                     <button type="button" onClick={() => setShowDbKey(!showDbKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showDbKey ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                   </div>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <Save size={16} /> Update Database
                </button>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigView;
