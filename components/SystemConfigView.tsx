
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
  CalendarDays,
  Info
} from 'lucide-react';
import { AttendanceRecord, Employee, Holiday, WorkSchedule, FingerprintMachine, OrganizationProfile } from '../types';
import { checkSupabaseConnection } from '../lib/supabaseClient';

// Fixed: Extended Props interface to match properties passed from App.tsx
interface Props {
  onImportFingerprint?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  opdProfile: OrganizationProfile;
  onUpdateOpdProfile: (profile: OrganizationProfile) => void;
  subBagianList?: string[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  holidays?: Holiday[];
  schedules?: WorkSchedule[];
  machineConfig?: FingerprintMachine;
  onAddSubBagian?: (name: string) => void;
  onDeleteSubBagian?: (name: string) => void;
  onAddSchedule?: (schedule: WorkSchedule) => void;
  onUpdateSchedule?: (updatedSchedule: WorkSchedule) => void;
  onDeleteSchedule?: (id: string) => void;
  onUpdateMachine?: (config: FingerprintMachine) => void;
  onSyncAttendance?: (records: AttendanceRecord[]) => void;
}

const SystemConfigView: React.FC<Props> = ({ 
  opdProfile, 
  onUpdateOpdProfile, 
  machineConfig, 
  onUpdateMachine, 
  onSyncAttendance,
  // Fixed: Destructuring remaining props passed from App.tsx to resolve unused/missing errors
  onImportFingerprint,
  subBagianList,
  employees,
  attendance,
  holidays,
  schedules,
  onAddSubBagian,
  onDeleteSubBagian,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule
}) => {
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
    if(onUpdateMachine) onUpdateMachine(localMachineConfig);
    alert("Konfigurasi Mesin disimpan.");
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const baseUrl = middlewareUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ips: localMachineConfig.ipAddress.split(','), port: parseInt(localMachineConfig.port) })
      });
      if (response.ok) {
        const result = await response.json();
        setLocalMachineConfig(prev => ({...prev, status: result.success ? 'Online' : 'Offline'}));
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
          targetYear: parseInt(syncYear)
        }),
      });

      if (response.ok) {
        const logs = await response.json();
        if (Array.isArray(logs)) {
            onSyncAttendance(logs); 
            setLocalMachineConfig(prev => ({...prev, lastSync: new Date().toLocaleString()}));
            if (logs.length === 0) {
                alert("Berhasil Terhubung, tetapi 0 data ditarik. \n\nHal ini biasanya karena Tahun di Mesin berbeda dengan Tahun yang Anda pilih di dropdown. \n\nSilakan cek Terminal Server untuk melihat daftar tahun yang tersedia di mesin Anda.");
            } else {
                alert(`Selesai! Berhasil memproses ${logs.length} data.`);
            }
        }
      }
    } catch (error) {
      alert("Error: Gagal menghubungi middleware.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("HAPUS SEMUA DATA?")) return;
    setIsClearing(true);
    try {
      const baseUrl = middlewareUrl.trim().replace(/\/$/, '');
      await fetch(`${baseUrl}/api/clear-logs`, { method: 'POST' });
      if (onSyncAttendance) onSyncAttendance([]);
      alert("Database dikosongkan.");
    } catch (err) {
      alert("Gagal.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Server size={20} /></div>
             <div><h3 className="text-lg font-bold text-slate-800">Koneksi Mesin</h3></div>
          </div>
          <div className="p-8 space-y-6 flex-1">
             <div className="space-y-4">
                <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">IP Address Mesin</label>
                     <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold" value={localMachineConfig.ipAddress} onChange={(e) => setLocalMachineConfig({...localMachineConfig, ipAddress: e.target.value})} />
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
                      <option value="0">Semua Tahun (Tanpa Filter)</option>
                      <option value="2024">Tahun 2024</option>
                      <option value="2025">Tahun 2025</option>
                      <option value="2026">Tahun 2026</option>
                   </select>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <button onClick={handleTestConnection} disabled={isTestingConnection} className="py-3 bg-white border border-slate-300 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                 {isTestingConnection ? <RefreshCw size={16} className="animate-spin" /> : <Power size={16} />} Tes Koneksi
               </button>
               <button onClick={handleSaveMachine} className="py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                 <Save size={16} /> Simpan
               </button>
             </div>

             <button onClick={handleSyncLogs} disabled={isSyncing} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-3 shadow-lg">
                {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <ArrowDownToLine size={20} />}
                Tarik Data {syncYear === '0' ? 'Semua Tahun' : `Tahun ${syncYear}`}
             </button>

             <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 text-xs text-indigo-700">
                <Info className="shrink-0" size={18} />
                <p>Jika data ditarik 0, pilih <strong>"Semua Tahun"</strong> atau cek terminal <code>server.js</code> untuk melihat tahun apa saja yang terdeteksi di mesin Anda.</p>
             </div>
          </div>
          
          <div className="p-8 bg-rose-50/50 border-t border-rose-100">
             <button onClick={handleClearLogs} disabled={isClearing} className="w-full py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center justify-center gap-2">
                <Trash2 size={14} /> Kosongkan Database Log
             </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Database size={20} /></div>
             <div><h3 className="text-lg font-bold text-slate-800">Database Cloud</h3></div>
          </div>
          <div className="p-8 space-y-6">
             <form onSubmit={handleSaveDBConfig} className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Supabase URL</label>
                   <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono" value={dbConfig.url} onChange={(e) => setDbConfig({...dbConfig, url: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Supabase Anon Key</label>
                   <div className="relative">
                     <input type={showDbKey ? "text" : "password"} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono pr-10" value={dbConfig.key} onChange={(e) => setDbConfig({...dbConfig, key: e.target.value})} />
                     <button type="button" onClick={() => setShowDbKey(!showDbKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showDbKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                   </div>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Save size={16} /> Update Database</button>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigView;
