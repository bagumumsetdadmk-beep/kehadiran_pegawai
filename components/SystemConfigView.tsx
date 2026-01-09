
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Upload, 
  Save, 
  CheckCircle2, 
  FileJson, 
  Image as ImageIcon, 
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
  Network
} from 'lucide-react';
import { AttendanceRecord, Employee, Holiday, WorkSchedule, FingerprintMachine, OrganizationProfile } from '../types';
import { exportAllEmployeesMonthlyAttendanceExcel, exportAttendanceToExcel } from '../utils/exportUtils';
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
  onImportFingerprint, 
  opdProfile, 
  onUpdateOpdProfile, 
  subBagianList, 
  employees, 
  attendance, 
  holidays, 
  schedules = [], 
  machineConfig, 
  onAddSubBagian, 
  onDeleteSubBagian, 
  onAddSchedule, 
  onUpdateSchedule, 
  onDeleteSchedule, 
  onUpdateMachine, 
  onSyncAttendance 
}) => {
  const [localOpdInfo, setLocalOpdInfo] = useState<OrganizationProfile>(opdProfile);
  const [newSubBagian, setNewSubBagian] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  
  useEffect(() => {
    setLocalOpdInfo(opdProfile);
  }, [opdProfile]);

  // State for Exports
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().substring(0, 7));
  const [exportCategory, setExportCategory] = useState<'all' | 'staff' | 'manager'>('staff'); 
  const [selectedEmployeeForExport, setSelectedEmployeeForExport] = useState<string>('');

  // State for Schedules
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<WorkSchedule>>({
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    days: [],
    startDate: '',
    endDate: ''
  });

  // State for Database Config
  const [dbConfig, setDbConfig] = useState({
    url: localStorage.getItem('SB_URL') || '',
    key: localStorage.getItem('SB_KEY') || ''
  });
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showDbKey, setShowDbKey] = useState(false);
  
  // Machine Config State
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
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed' | 'middleware_error' | 'success_simulation'>('idle'); 
  const [testDetails, setTestDetails] = useState<any[]>([]); // Log dari hasil tes koneksi

  // Middleware URL Configuration (Editable by user)
  const [middlewareUrl, setMiddlewareUrl] = useState(() => {
    // Priority: LocalStorage (user's custom setting) > Dynamic Hostname > Localhost Fallback
    let url = localStorage.getItem('MW_URL');
    
    if (url) return url;
    
    const hostname = window.location.hostname;
    const effectiveHost = (!hostname || hostname === 'localhost') ? '127.0.0.1' : hostname;
    // Default URL for middleware server.
    return `http://${effectiveHost}:3006`;
  });

  const weekDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Effect untuk cek koneksi database saat load
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
    
    // Tes koneksi dengan kredensial baru
    const isSuccess = await checkSupabaseConnection(dbConfig.url, dbConfig.key);
    
    if (isSuccess) {
      localStorage.setItem('SB_URL', dbConfig.url);
      localStorage.setItem('SB_KEY', dbConfig.key);
      setDbStatus('connected');
      alert("Koneksi Database Berhasil & Tersimpan! Halaman akan dimuat ulang.");
      window.location.reload(); // Reload agar supabaseClient mengambil config baru
    } else {
      setDbStatus('disconnected');
      alert("Gagal terhubung ke Database. Periksa URL dan Anon Key Anda.");
    }
  };

  const handleSaveOPD = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOpdProfile(localOpdInfo);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalOpdInfo(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSub = () => {
    if (newSubBagian.trim()) {
      onAddSubBagian(newSubBagian.trim());
      setNewSubBagian('');
    }
  };

  const toggleDay = (day: string) => {
    setNewSchedule(prev => {
      const currentDays = prev.days || [];
      if (currentDays.includes(day)) {
        return { ...prev, days: currentDays.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...currentDays, day] };
      }
    });
  };

  const handleEditSchedule = (schedule: WorkSchedule) => {
    setEditingScheduleId(schedule.id);
    setNewSchedule({
      name: schedule.name,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      days: schedule.days,
      startDate: schedule.startDate || '',
      endDate: schedule.endDate || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingScheduleId(null);
    setNewSchedule({
      name: '',
      startTime: '08:00',
      endTime: '17:00',
      days: [],
      startDate: '',
      endDate: ''
    });
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSchedule.name && newSchedule.startTime && newSchedule.endTime && newSchedule.days && newSchedule.days.length > 0) {
      
      const scheduleData: WorkSchedule = {
        id: editingScheduleId || `sch-${Date.now()}`,
        name: newSchedule.name,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        days: newSchedule.days,
        startDate: newSchedule.startDate || null,
        endDate: newSchedule.endDate || null
      };

      if (editingScheduleId && onUpdateSchedule) {
        onUpdateSchedule(scheduleData);
      } else if (onAddSchedule) {
        onAddSchedule(scheduleData);
      }

      handleCancelEdit(); // Reset form
    } else {
      alert("Mohon lengkapi nama aturan, jam kerja, dan pilih minimal satu hari.");
    }
  };

  const handleSaveMachine = () => {
    if(onUpdateMachine) {
        onUpdateMachine(localMachineConfig);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setTestDetails([]);

    const ips = localMachineConfig.ipAddress.split(',').map(i => i.trim()).filter(i => i.length > 0);
    
    if (ips.length === 0) {
        alert("Mohon isi IP Address terlebih dahulu.");
        setIsTestingConnection(false);
        return;
    }

    try {
      // Membersihkan URL dari trailing slash
      const baseUrl = middlewareUrl.trim().replace(/\/$/, '');
      const targetUrl = `${baseUrl}/api/test-connection`; // Ganti dengan endpoint Node.js

      console.log("Connecting to:", targetUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ips: ips, 
          port: parseInt(localMachineConfig.port),
          commKey: parseInt(localMachineConfig.commKey)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        
        if (result.status === 'success_simulation') {
            setConnectionStatus('success_simulation');
            setLocalMachineConfig(prev => ({...prev, status: 'Online (Simulasi)', lastSync: new Date().toLocaleString()}));
        } else if (result.success) { // Menggunakan 'success' dari Node.js backend
            setConnectionStatus('success');
            setLocalMachineConfig(prev => ({...prev, status: 'Online', lastSync: new Date().toLocaleString()}));
        } else {
            setConnectionStatus('failed');
            setLocalMachineConfig(prev => ({...prev, status: 'Offline'}));
        }

        if (result.logs) { 
            setTestDetails(result.logs); // Menggunakan logs dari Node.js
        }
        
      } else {
        const text = await response.text();
        console.error("Response Error:", text);
        setConnectionStatus('middleware_error'); 
        setLocalMachineConfig(prev => ({...prev, status: 'Offline'}));
        alert(`Server middleware merespon dengan status ${response.status}, tapi bukan JSON valid. Pastikan URL Middleware benar dan server backend berjalan dengan benar.`);
      }
    } catch (error) {
      console.error("Middleware error:", error);
      setConnectionStatus('middleware_error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSyncLogs = async () => {
    if (!onSyncAttendance) return;
    setIsSyncing(true);
    
    const ips = localMachineConfig.ipAddress.split(',').map(i => i.trim()).filter(i => i.length > 0);
    
    if (ips.length === 0) {
        alert("Mohon isi IP Address.");
        setIsSyncing(false);
        return;
    }

    try {
      const baseUrl = middlewareUrl.trim().replace(/\/$/, '');
      const apiUrl = `${baseUrl}/api/sync-logs`; // Ganti dengan endpoint Node.js
      console.log("Syncing from:", apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ips: ips,
          port: parseInt(localMachineConfig.port),
          commKey: parseInt(localMachineConfig.commKey),
        }),
      });

      if (response.ok) {
        const logs: AttendanceRecord[] = await response.json(); // Node.js akan langsung mengembalikan AttendanceRecord[]
        
        if (Array.isArray(logs)) {
            // Note: employeeId diisi 'unknown' dari backend. Frontend akan menanganinya saat update state.
            onSyncAttendance(logs); 
            setLocalMachineConfig(prev => ({...prev, lastSync: new Date().toLocaleString()}));
            alert(`Berhasil menarik ${logs.length} data log baru dari mesin.`);
        } else {
            console.error("Format data salah:", logs);
            alert("Format data dari server tidak sesuai array.");
        }
      } else {
        const errorText = await response.text();
        console.error("Gagal menarik data. Server error:", response.status, errorText);
        alert(`Gagal menarik data. Server error ${response.status}: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert(`Gagal menghubungi server middleware di ${middlewareUrl}. Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetMiddlewareUrl = () => {
      const hostname = window.location.hostname;
      const effectiveHost = (!hostname || hostname === 'localhost') ? '127.0.0.1' : hostname;
      const defaultUrl = `http://${effectiveHost}:3006`;
      setMiddlewareUrl(defaultUrl);
      localStorage.setItem('MW_URL', defaultUrl);
  };

  const handleExportMonthlyAll = () => {
    let dataToExport = employees;
    if (exportCategory === 'staff') {
      dataToExport = employees.filter(e => !e.isManager);
    } else if (exportCategory === 'manager') {
      dataToExport = employees.filter(e => e.isManager);
    }
    
    exportAllEmployeesMonthlyAttendanceExcel(
      dataToExport, 
      attendance, 
      exportMonth, 
      opdProfile.name, 
      exportCategory
    );
  };

  const handleExportIndividual = () => {
    if (!selectedEmployeeForExport) {
      alert("Silakan pilih pegawai terlebih dahulu.");
      return;
    }
    const employee = employees.find(e => e.id === selectedEmployeeForExport);
    if (!employee) return;
    const [year, month] = exportMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    const fullMonthData: AttendanceRecord[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const existingRecord = attendance.find(a => a.employeeId === selectedEmployeeForExport && a.date === dateStr);
      
      const dateObj = new Date(year, month - 1, d);
      const dayName = dayNames[dateObj.getDay()];
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const holiday = holidays.find(h => h.date === dateStr);

      if (existingRecord) {
        fullMonthData.push(existingRecord);
      } else {
        fullMonthData.push({
          id: `empty-${dateStr}`,
          employeeId: selectedEmployeeForExport,
          date: dateStr,
          day: dayName,
          shiftIn: (isWeekend || holiday) ? '--:--' : '08:00',
          fingerprintIn: null,
          shiftOut: (isWeekend || holiday) ? '--:--' : '17:00',
          fingerprintOut: null,
          remarks: holiday ? holiday.name : (isWeekend ? 'Libur Akhir Pekan' : 'Belum Ada Data'),
          isLate: false
        });
      }
    }
    exportAttendanceToExcel(fullMonthData, `Laporan_${employee.name.replace(/\s+/g, '_')}_${exportMonth}`);
  };

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Machine Configuration */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-1">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Server size={20} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-800">Koneksi Mesin Fingerprint</h3>
               <p className="text-xs text-slate-500">Hubungkan aplikasi dengan IP mesin ZKTeco.</p>
             </div>
          </div>
          <div className="p-8 space-y-6">
             <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${localMachineConfig.status === 'Online' || localMachineConfig.status === 'Online (Simulasi)' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                 <Wifi size={20} />
               </div>
               <div className="flex-1">
                 <p className="text-xs font-bold text-slate-400 uppercase">Status Koneksi</p>
                 <p className={`text-sm font-bold ${localMachineConfig.status === 'Online' || localMachineConfig.status === 'Online (Simulasi)' ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {localMachineConfig.status}
                 </p>
               </div>
               {localMachineConfig.lastSync && (
                 <div className="text-right">
                    <p className="text-[10px] text-slate-400">Terakhir Sync</p>
                    <p className="text-xs font-mono text-slate-600">{localMachineConfig.lastSync}</p>
                 </div>
               )}
             </div>

             <div className="space-y-4">
                <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Network size={12} /> IP Address Mesin
                     </label>
                     <input type="text" placeholder="Contoh: 192.168.1.201" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-700" value={localMachineConfig.ipAddress} onChange={(e) => setLocalMachineConfig({...localMachineConfig, ipAddress: e.target.value})} />
                     <p className="text-[9px] text-slate-400">Pastikan IP ini satu jaringan dengan komputer ini.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Port</label>
                        <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">Default: 4370</span>
                     </div>
                     <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono" value={localMachineConfig.port} onChange={(e) => setLocalMachineConfig({...localMachineConfig, port: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Comm Key</label>
                          <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">Default: 0</span>
                      </div>
                      <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono" value={localMachineConfig.commKey} onChange={(e) => setLocalMachineConfig({...localMachineConfig, commKey: e.target.value})} />
                   </div>
                </div>
                
                {/* Middleware URL Configuration */}
                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">URL Server Backend (Node.js)</label>
                      <button onClick={handleResetMiddlewareUrl} className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                         <RotateCcw size={10} /> Reset Default
                      </button>
                   </div>
                   <input 
                     type="text" 
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-600 focus:ring-2 focus:ring-slate-400 outline-none" 
                     value={middlewareUrl} 
                     onChange={(e) => {
                       setMiddlewareUrl(e.target.value);
                       localStorage.setItem('MW_URL', e.target.value);
                     }} 
                   />
                   <p className="text-[9px] text-slate-400 leading-tight">
                     Alamat server Node.js yang menjalankan middleware (file <code>server.js</code>).
                   </p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3 pt-2">
               <button 
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${isTestingConnection ? 'bg-slate-100 text-slate-400' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
               >
                 {isTestingConnection ? <RefreshCw size={16} className="animate-spin" /> : <Power size={16} />} 
                 {isTestingConnection ? 'Menghubungkan...' : 'Tes Koneksi'}
               </button>
               <button onClick={handleSaveMachine} className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all">
                 <Save size={16} /> Simpan Config
               </button>
             </div>

             {/* Test Details Log */}
             {testDetails.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Log Koneksi:</p>
                    {testDetails.map((log, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs mb-1">
                            <span className="font-mono text-slate-600">{log.ip}</span>
                            <span className={`font-bold ${log.status.includes('OK') ? 'text-emerald-600' : (log.status.includes('Simulasi') ? 'text-amber-600' : 'text-rose-600')}`}>{log.status}</span>
                        </div>
                    ))}
                </div>
             )}

             {/* Action Button: Sync Logs */}
             <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={handleSyncLogs}
                  disabled={isSyncing || (localMachineConfig.status !== 'Online' && localMachineConfig.status !== 'Online (Simulasi)')}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${localMachineConfig.status === 'Online' || localMachineConfig.status === 'Online (Simulasi)' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                  {isSyncing ? 'Sedang Menarik Data...' : 'Tarik Data Log Sekarang'}
                </button>
             </div>

             {(connectionStatus === 'middleware_error' || connectionStatus === 'failed') && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-100">
                   <strong>Error:</strong> Tidak bisa menghubungi server middleware di <code>{middlewareUrl}</code>. 
                   <br/>Pastikan server Node.js (file <code>server.js</code>) sudah berjalan dan konfigurasi IP mesin benar.
                </div>
             )}
             {connectionStatus === 'success_simulation' && (
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium border border-amber-100">
                    <strong>Peringatan:</strong> Koneksi menggunakan mode simulasi. Library <code>node-zklib</code> tidak ditemukan di server backend.
                    <br/>Jalankan <code>npm install node-zklib</code> di folder <code>server.js</code> untuk fungsionalitas penuh.
                </div>
             )}
          </div>
        </div>

        {/* Database Configuration */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-1">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Database size={20} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-800">Koneksi Database</h3>
               <p className="text-xs text-slate-500">Konfigurasi URL dan Key Supabase.</p>
             </div>
          </div>
          <div className="p-8 space-y-6">
             <div className={`flex items-center gap-4 p-4 rounded-xl border ${
               dbStatus === 'connected' ? 'bg-emerald-50 border-emerald-200' : 
               dbStatus === 'disconnected' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
             }`}>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                 dbStatus === 'connected' ? 'bg-emerald-100 text-emerald-600' : 
                 dbStatus === 'disconnected' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'
               }`}>
                 {dbStatus === 'connected' ? <Link size={20} /> : 
                  dbStatus === 'disconnected' ? <Unplug size={20} /> : <RefreshCw size={20} className="animate-spin" />}
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-400 uppercase">Status Koneksi</p>
                 <p className={`text-sm font-bold ${
                   dbStatus === 'connected' ? 'text-emerald-600' : 
                   dbStatus === 'disconnected' ? 'text-rose-600' : 'text-slate-600'
                 }`}>
                   {dbStatus === 'connected' ? 'Terhubung dengan Database' : 
                    dbStatus === 'disconnected' ? 'Terputus / Tidak Valid' : 'Memeriksa...'}
                 </p>
               </div>
             </div>

             <form onSubmit={handleSaveDBConfig} className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Supabase URL</label>
                   <input 
                     type="text" 
                     placeholder="https://xyz.supabase.co" 
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" 
                     value={dbConfig.url} 
                     onChange={(e) => setDbConfig({...dbConfig, url: e.target.value})} 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Supabase Anon Key</label>
                   <div className="relative">
                     <input 
                       type={showDbKey ? "text" : "password"} 
                       placeholder="eyJhbGciOiJIUzI1NiIsInR..." 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono pr-10" 
                       value={dbConfig.key} 
                       onChange={(e) => setDbConfig({...dbConfig, key: e.target.value})} 
                     />
                     <button type="button" onClick={() => setShowDbKey(!showDbKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showDbKey ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                   </div>
                </div>
                
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all">
                  <Save size={16} /> Simpan & Tes Koneksi
                </button>
             </form>
          </div>
        </div>

      </div>

      {/* OPD Profile Section */}
      <div className="mt-8 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Profil Instansi (OPD)</h3>
              <p className="text-xs text-slate-500">Konfigurasi identitas organisasi perangkat daerah.</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveOPD} className="p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Logo Instansi</label>
              <div className="flex items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {localOpdInfo.logoUrl ? (
                    <>
                      <img src={localOpdInfo.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                      <button type="button" onClick={() => setLocalOpdInfo(prev => ({...prev, logoUrl: null}))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><X size={20} /></button>
                    </>
                  ) : (
                    <ImageIcon className="text-slate-300" size={32} />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-slate-500">Gunakan file gambar persegi (PNG/JPG).</p>
                  <label className="inline-flex cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm">
                    Ganti Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Instansi / OPD</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={localOpdInfo.name} onChange={(e) => setLocalOpdInfo({...localOpdInfo, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Alamat Kantor</label>
              <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={localOpdInfo.address} onChange={(e) => setLocalOpdInfo({...localOpdInfo, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Pimpinan</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={localOpdInfo.headName} onChange={(e) => setLocalOpdInfo({...localOpdInfo, headName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">NIP Pimpinan</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={localOpdInfo.headNip} onChange={(e) => setLocalOpdInfo({...localOpdInfo, headNip: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
              {isSaved ? <><CheckCircle2 size={18} /> Tersimpan</> : <><Save size={18} /> Simpan Perubahan</>}
            </button>
          </form>
        </div>
    </div>
  );
};

export default SystemConfigView;