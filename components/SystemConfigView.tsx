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
  EyeOff
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
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed' | 'middleware_error'>('idle');

  const weekDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Helper: Get API URL based on current hostname to support LAN access
  const getApiUrl = (endpoint: string) => {
    const hostname = window.location.hostname;
    // Assume middleware is running on port 3001 on the same host
    return `http://${hostname}:3001${endpoint}`;
  };

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

    const ips = localMachineConfig.ipAddress.split(',').map(i => i.trim()).filter(i => i.length > 0);
    
    if (ips.length === 0) {
        alert("Mohon isi IP Address terlebih dahulu.");
        setIsTestingConnection(false);
        return;
    }

    try {
      const apiUrl = getApiUrl('/api/test-connection');
      console.log("Connecting to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ips: ips, 
          port: parseInt(localMachineConfig.port),
          commKey: parseInt(localMachineConfig.commKey)
        }),
      });

      if (response.ok) {
        setConnectionStatus('success');
        setLocalMachineConfig(prev => ({...prev, status: 'Online', lastSync: new Date().toLocaleString()}));
      } else {
        setConnectionStatus('failed');
        setLocalMachineConfig(prev => ({...prev, status: 'Offline'}));
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
      const apiUrl = getApiUrl('/api/sync-logs');
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
        const logs = await response.json();
        const newRecords: AttendanceRecord[] = logs.map((log: any) => {
            return log as AttendanceRecord; 
        });

        onSyncAttendance(newRecords); 
        setLocalMachineConfig(prev => ({...prev, lastSync: new Date().toLocaleString()}));
        alert(`Berhasil menarik ${logs.length} data log baru dari mesin.`);
      } else {
        alert("Gagal menarik data. Cek koneksi mesin.");
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert(`Gagal menghubungi server middleware di ${window.location.hostname}:3001.`);
    } finally {
      setIsSyncing(false);
    }
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Export Center */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl shadow-xl text-white border border-slate-700 overflow-hidden">
        <div className="p-8 border-b border-white/10 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
            <CalendarCheck2 size={28} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Pusat Laporan & Ekspor</h3>
            <p className="text-slate-400 text-sm">Unduh data kehadiran dalam format Excel (.xlsx).</p>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <FileSpreadsheet size={16} /> Rekapitulasi Global
            </h4>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Ekspor tabel matriks kehadiran. Pilih kategori pegawai yang ingin disertakan.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Kategori Data</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setExportCategory('staff')} className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${exportCategory === 'staff' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}>Hanya Staf</button>
                  <button onClick={() => setExportCategory('manager')} className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${exportCategory === 'manager' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}>Pimpinan</button>
                  <button onClick={() => setExportCategory('all')} className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${exportCategory === 'all' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}>Semua</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Periode</label>
                <input type="month" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}/>
              </div>
              <button onClick={handleExportMonthlyAll} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                <Download size={18} /> Unduh Rekap {exportCategory === 'staff' ? 'Staf' : exportCategory === 'manager' ? 'Pimpinan' : 'Global'}
              </button>
            </div>
          </div>
          <div className="space-y-4">
             <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <User size={16} /> Laporan Individual
            </h4>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Ekspor detail kehadiran lengkap satu pegawai termasuk status izin dan hari libur.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Pegawai</label>
                  <select className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedEmployeeForExport} onChange={(e) => setSelectedEmployeeForExport(e.target.value)}>
                    <option value="">-- Pilih Nama --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Periode</label>
                   <input type="month" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}/>
                </div>
              </div>
              <button onClick={handleExportIndividual} disabled={!selectedEmployeeForExport} className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${!selectedEmployeeForExport ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                <Download size={18} /> Unduh Laporan Pegawai
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Database Configuration (NEW) */}
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
        
        {/* Machine Configuration */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-1">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Server size={20} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-800">Koneksi Mesin Fingerprint</h3>
               <p className="text-xs text-slate-500">Konfigurasi alamat IP mesin untuk sinkronisasi (Membutuhkan Middleware).</p>
             </div>
          </div>
          <div className="p-8 space-y-6">
             <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${localMachineConfig.status === 'Online' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                 <Wifi size={20} />
               </div>
               <div className="flex-1">
                 <p className="text-xs font-bold text-slate-400 uppercase">Status Koneksi</p>
                 <p className={`text-sm font-bold ${localMachineConfig.status === 'Online' ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Grup Mesin</label>
                   <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={localMachineConfig.name} onChange={(e) => setLocalMachineConfig({...localMachineConfig, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase">IP Address (Pisahkan koma jika banyak)</label>
                     <input type="text" placeholder="192.168.1.201, 192.168.1.202" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono" value={localMachineConfig.ipAddress} onChange={(e) => setLocalMachineConfig({...localMachineConfig, ipAddress: e.target.value})} />
                   </div>
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

             {/* Action Button: Sync Logs */}
             <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={handleSyncLogs}
                  disabled={isSyncing || localMachineConfig.status !== 'Online'}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${localMachineConfig.status === 'Online' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                  {isSyncing ? 'Sedang Menarik Data...' : 'Tarik Data Log Sekarang'}
                </button>
             </div>

             {connectionStatus === 'middleware_error' && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-100">
                   <strong>Error:</strong> Tidak bisa menghubungi server middleware di <code>{window.location.hostname}:3001</code>. 
                   <br/>Pastikan Anda telah menjalankan <code>node server.js</code> (di port 3001) dan firewall tidak memblokir.
                </div>
             )}
          </div>
        </div>

        {/* Structure & Fingerprint Import (Moved to grid) */}
        <div className="space-y-8 lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><LayoutGrid size={20} /></div>
              <div><h3 className="text-lg font-bold text-slate-800">Manajemen Subbagian</h3><p className="text-xs text-slate-500">Kelola struktur organisasi instansi.</p></div>
            </div>
            <div className="p-8 space-y-6">
               <div className="flex gap-2">
                 <input type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nama subbagian baru..." value={newSubBagian} onChange={(e) => setNewSubBagian(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddSub()} />
                 <button onClick={handleAddSub} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow-md transition-all active:scale-95"><Plus size={20} /></button>
               </div>
               <div className="space-y-2">
                 {subBagianList.map(sub => (
                   <div key={sub} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-indigo-100 transition-all">
                     <span className="text-sm font-semibold text-slate-700">{sub}</span>
                     <button onClick={() => onDeleteSubBagian(sub)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Upload size={20} /></div>
              <div><h3 className="text-lg font-bold text-slate-800">Import Log Manual</h3><p className="text-xs text-slate-500">Alternatif jika koneksi mesin offline.</p></div>
            </div>
            <div className="p-8">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center hover:border-indigo-300 transition-colors group">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><FileJson size={24} /></div>
                <div><p className="text-sm font-bold text-slate-700">Pilih File Log (.csv)</p><p className="text-[10px] text-slate-400 mt-1">Download dari mesin via USB</p></div>
                <label className="cursor-pointer bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95">Browse File<input type="file" className="hidden" onChange={onImportFingerprint} accept=".csv" /></label>
              </div>
            </div>
          </div>
        </div>

        {/* Work Schedule Configuration (Full Width or Grid) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Konfigurasi Jam Kerja</h3>
              <p className="text-xs text-slate-500">Atur jam masuk dan pulang untuk hari tertentu atau periode khusus (misal: Puasa).</p>
            </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <h4 className="text-sm font-bold text-slate-700">{editingScheduleId ? 'Edit Aturan' : 'Buat Aturan Baru'}</h4>
                 {editingScheduleId && (
                   <button onClick={handleCancelEdit} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded transition-colors">
                     <RotateCcw size={10} /> Batal Edit
                   </button>
                 )}
              </div>
              
              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Aturan</label>
                  <input type="text" placeholder="Contoh: Jam Kerja Puasa" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" value={newSchedule.name} onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})} required />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Jam Masuk</label>
                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" value={newSchedule.startTime} onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Jam Pulang</label>
                    <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" value={newSchedule.endTime} onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Hari Berlaku</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${newSchedule.days?.includes(day) ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-200 hover:border-amber-200'}`}>
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                   <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <CalendarRange size={14} />
                      <span className="text-xs font-bold">Periode Khusus (Opsional)</span>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Mulai</label>
                      <input type="date" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none" value={newSchedule.startDate || ''} onChange={(e) => setNewSchedule({...newSchedule, startDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Selesai</label>
                      <input type="date" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none" value={newSchedule.endDate || ''} onChange={(e) => setNewSchedule({...newSchedule, endDate: e.target.value})} />
                    </div>
                   </div>
                   <p className="text-[10px] text-slate-400 leading-tight">Biarkan kosong jika aturan berlaku permanen.</p>
                </div>

                <button type="submit" className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all ${editingScheduleId ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                  {editingScheduleId ? <><Save size={16} /> Perbarui Aturan</> : <><Plus size={16} /> Simpan Aturan</>}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
               <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Daftar Jam Kerja Aktif</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schedules.map(sch => (
                    <div key={sch.id} className={`border p-4 rounded-xl flex flex-col justify-between transition-all shadow-sm ${editingScheduleId === sch.id ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' : 'bg-white border-slate-200 hover:border-amber-200'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                           <div>
                             <h5 className="font-bold text-slate-800 text-sm">{sch.name}</h5>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">{sch.startTime} - {sch.endTime}</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-1">
                              <button onClick={() => handleEditSchedule(sch)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Aturan">
                                <Edit size={16} />
                              </button>
                              {onDeleteSchedule && (
                                <button onClick={() => onDeleteSchedule(sch.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus Aturan">
                                  <Trash2 size={16} />
                                </button>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {sch.days.map(d => (
                            <span key={d} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{d.substring(0,3)}</span>
                          ))}
                        </div>
                      </div>
                      
                      {sch.startDate && sch.endDate ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white bg-indigo-500 px-3 py-1.5 rounded-lg self-start">
                           <CalendarRange size={12} />
                           {sch.startDate} s/d {sch.endDate}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg self-start">
                           <CheckCircle2 size={12} />
                           Permanen
                        </div>
                      )}
                    </div>
                  ))}
                  {schedules.length === 0 && (
                     <div className="col-span-full py-10 text-center text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                       Belum ada aturan jam kerja. Sistem akan menggunakan default (08:00 - 17:00).
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* OPD Configuration */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
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
    </div>
  );
};

export default SystemConfigView;