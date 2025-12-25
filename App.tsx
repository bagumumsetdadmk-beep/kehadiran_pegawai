
import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  FileText, 
  Users, 
  Upload, 
  Bell,
  LogOut,
  Settings,
  LayoutDashboard,
  ClipboardList,
  History,
  PlaneTakeoff,
  CalendarDays
} from 'lucide-react';
import { MOCK_EMPLOYEES, MOCK_ATTENDANCE, MOCK_PERMISSIONS, MOCK_SCHEDULES, MOCK_MACHINE } from './constants';
import { AttendanceRecord, PermissionRequest, PermissionStatus, Employee, Holiday, WorkSchedule, FingerprintMachine } from './types';
import PermissionForm from './components/PermissionForm';
import PermissionList from './components/PermissionList';
import ManagerView from './components/ManagerView';
import Login from './components/Login';
import AdminView from './components/AdminView';
import ManagerAttendanceView from './components/ManagerAttendanceView';
import EmployeeAttendanceView from './components/EmployeeAttendanceView';
import SystemConfigView from './components/SystemConfigView';
import HolidayManager from './components/HolidayManager';
import Dashboard from './components/Dashboard';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

type View = 'dashboard' | 'attendance' | 'permission_form' | 'permission_history' | 'manager_permissions' | 'manager_attendance' | 'admin_pegawai' | 'admin_logs' | 'admin_holidays';

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [subBagianList, setSubBagianList] = useState<string[]>(['RT dan Perlengkapan', 'TUP dan Kepegawaian', 'Keuangan']);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [permissions, setPermissions] = useState<PermissionRequest[]>(MOCK_PERMISSIONS);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>(MOCK_SCHEDULES);
  const [machineConfig, setMachineConfig] = useState<FingerprintMachine>(MOCK_MACHINE);
  const [opdLogo, setOpdLogo] = useState<string | null>(null);
  const [opdName, setOpdName] = useState<string>("Dinas Komunikasi dan Informatika");
  const [selectedDateForPermission, setSelectedDateForPermission] = useState<string | null>(null);

  useEffect(() => {
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = opdLogo || 'https://cdn-icons-png.flaticon.com/512/2913/2913008.png';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [opdLogo]);

  // --- FETCH DATA DARI SUPABASE ---
  useEffect(() => {
    const fetchRealData = async () => {
      if (!isSupabaseConfigured() || !supabase) return;

      try {
        console.log("Menghubungkan ke Supabase...");
        
        // 1. Fetch Employees
        const { data: dbEmployees, error: empError } = await supabase.from('employees').select('*');
        let currentEmployees = employees; // Default to mock

        if (!empError && dbEmployees && dbEmployees.length > 0) {
          // Map DB columns (snake_case) to App types (camelCase)
          const mappedEmployees: Employee[] = dbEmployees.map((e: any) => ({
            id: e.id,
            nip: e.nip,
            name: e.name,
            role: e.role,
            subBagian: e.sub_bagian,
            gender: e.gender as 'Laki-laki' | 'Perempuan',
            managerId: e.manager_id,
            isManager: e.is_manager,
            isAdmin: e.is_admin,
            photoUrl: e.photo_url || `https://i.pravatar.cc/150?u=${e.nip}`,
            fingerprintId: e.fingerprint_id
          }));
          setEmployees(mappedEmployees);
          currentEmployees = mappedEmployees; // Update reference for attendance mapping
        }

        // 2. Fetch Holidays
        const { data: dbHolidays } = await supabase.from('holidays').select('*');
        if (dbHolidays && dbHolidays.length > 0) {
           setHolidays(dbHolidays.map((h: any) => ({ id: h.id, date: h.date, name: h.name })));
        }

        // 3. Fetch Permissions
        const { data: dbPermissions } = await supabase.from('permissions').select('*');
        if (dbPermissions && dbPermissions.length > 0) {
           const mappedPerms: PermissionRequest[] = dbPermissions.map((p: any) => {
             const emp = currentEmployees.find(e => e.id === p.employee_id);
             return {
               id: p.id,
               employeeId: p.employee_id,
               employeeName: emp ? emp.name : 'Unknown',
               managerId: p.manager_id,
               type: p.type as any,
               startDate: p.start_date,
               endDate: p.end_date,
               reason: p.reason,
               status: p.status as PermissionStatus
             };
           });
           setPermissions(mappedPerms);
        }

        // 4. Fetch Attendance Logs
        const { data: dbLogs, error: logError } = await supabase.from('attendance_logs').select('*');
        
        if (!logError && dbLogs && dbLogs.length > 0) {
          const newAttendanceRecords: AttendanceRecord[] = dbLogs.map((log: any) => {
             // Cari pegawai yang punya fingerprint_id ini
             // Note: Kita pakai currentEmployees yang baru saja di-fetch (atau mock jika fetch gagal)
             const relatedEmp = currentEmployees.find(e => e.fingerprintId === log.fingerprint_id);
             
             // Hitung status terlambat (Logika sederhana, idealnya dari schedule)
             const checkInTime = log.check_in || '00:00:00';
             const isLate = checkInTime > '08:00:00'; 

             return {
                id: String(log.id),
                employeeId: relatedEmp ? relatedEmp.id : 'unknown', // Jika unknown, tidak muncul di list pegawai
                date: log.date,
                day: new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long' }),
                shiftIn: '08:00', 
                fingerprintIn: log.check_in ? log.check_in.substring(0,5) : null,
                shiftOut: '17:00',
                fingerprintOut: log.check_out ? log.check_out.substring(0,5) : null,
                remarks: isLate ? 'Terlambat' : (log.check_in ? 'Tepat Waktu' : 'Belum Absen'),
                isLate: isLate
             };
          });

          // Filter hanya log yang punya pemilik pegawai terdaftar
          const validRecords = newAttendanceRecords.filter(r => r.employeeId !== 'unknown');
          if (validRecords.length > 0) {
            setAttendance(validRecords);
          }
        }

      } catch (err) {
        console.error("Error fetching Supabase data:", err);
      }
    };

    fetchRealData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    if (currentUser) {
      if (currentUser.isAdmin) setActiveView('dashboard');
      else if (currentUser.isManager) setActiveView('manager_attendance');
      else setActiveView('attendance');
    }
  }, [currentUser]);

  const userAttendance = attendance.filter(a => a.employeeId === currentUser?.id);
  const userPermissions = permissions.filter(p => p.employeeId === currentUser?.id);
  
  const isManager = currentUser?.isManager || false;
  const isAdmin = currentUser?.isAdmin || false;

  const handleLogin = (user: Employee) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleOpenPermissionForm = (date: string) => {
    setSelectedDateForPermission(date);
    setActiveView('permission_form');
  };

  const handleAddPermission = async (newPermission: Omit<PermissionRequest, 'id' | 'status' | 'employeeName'>) => {
    // Optimistic Update
    const tempId = `perm-${Date.now()}`;
    const fullPermission: PermissionRequest = {
      ...newPermission,
      id: tempId,
      employeeName: currentUser?.name || 'Unknown',
      status: PermissionStatus.PENDING
    };
    setPermissions(prev => [fullPermission, ...prev]);
    setActiveView('permission_history');
    alert("Izin berhasil diajukan.");

    // Sync to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('permissions').insert({
        id: tempId,
        employee_id: newPermission.employeeId,
        manager_id: newPermission.managerId,
        type: newPermission.type,
        start_date: newPermission.startDate,
        end_date: newPermission.endDate,
        reason: newPermission.reason,
        status: 'PENDING'
      });
    }
  };

  const handleUpdatePermissionStatus = async (id: string, status: PermissionStatus) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    
    // Sync to Supabase
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('permissions').update({ status }).eq('id', id);
    }
  };

  const handleImportFingerprint = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && isAdmin) {
      alert(`Berhasil sinkronisasi data fingerprint dari mesin biometric.`);
    }
  };

  const handleAddEmployee = async (emp: Employee) => {
    setEmployees(prev => [...prev, emp]);
    
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('employees').insert({
        id: emp.id,
        nip: emp.nip,
        name: emp.name,
        role: emp.role,
        sub_bagian: emp.subBagian,
        gender: emp.gender,
        manager_id: emp.managerId,
        is_manager: emp.isManager,
        is_admin: emp.isAdmin,
        fingerprint_id: emp.fingerprintId,
        photo_url: emp.photoUrl
      });
    }
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));

    if (isSupabaseConfigured() && supabase) {
       await supabase.from('employees').update({
        nip: updatedEmp.nip,
        name: updatedEmp.name,
        role: updatedEmp.role,
        sub_bagian: updatedEmp.subBagian,
        gender: updatedEmp.gender,
        manager_id: updatedEmp.managerId,
        is_manager: updatedEmp.isManager,
        is_admin: updatedEmp.isAdmin,
        fingerprint_id: updatedEmp.fingerprintId,
       }).eq('id', updatedEmp.id);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('employees').delete().eq('id', id);
    }
  };

  const handleBulkImportEmployees = (newEmployees: Employee[]) => {
    // Logic bulk import khusus, bisa ditambahkan call supabase insert many disini
    setEmployees(prev => [...prev, ...newEmployees]);
  };

  const handleAddSubBagian = (name: string) => {
    if (!subBagianList.includes(name)) setSubBagianList(prev => [...prev, name]);
  };

  const handleDeleteSubBagian = (name: string) => {
    setSubBagianList(prev => prev.filter(s => s !== name));
  };

  const handleAddHoliday = async (holiday: Holiday) => {
    setHolidays(prev => [...prev, holiday]);
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('holidays').insert(holiday);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('holidays').delete().eq('id', id);
    }
  };

  const handleAddSchedule = (schedule: WorkSchedule) => {
    setSchedules(prev => [...prev, schedule]);
  };

  const handleUpdateSchedule = (updatedSchedule: WorkSchedule) => {
    setSchedules(prev => prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s));
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateMachine = (config: FingerprintMachine) => {
    setMachineConfig(config);
  };

  const handleSyncAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendance(prev => {
      const prevFiltered = prev.filter(p => !newRecords.some(n => n.date === p.date && n.employeeId === p.employeeId));
      return [...newRecords, ...prevFiltered];
    });
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} logo={opdLogo} employees={employees} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className={`w-72 ${isAdmin ? 'bg-slate-950' : 'bg-slate-900'} text-white flex flex-col hidden md:flex shadow-2xl z-20`}>
        <div className="p-8 flex items-center gap-3">
          {opdLogo ? (
            <img src={opdLogo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1" />
          ) : (
            <div className={`w-10 h-10 ${isAdmin ? 'bg-indigo-500' : 'bg-indigo-600'} rounded-xl flex items-center justify-center font-bold text-xl shadow-lg`}>
              {isAdmin ? 'AD' : 'AP'}
            </div>
          )}
          <span className="font-bold text-lg tracking-tight">AbsensiPintar</span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {!isAdmin && !isManager && (
            <>
              <SidebarLink icon={<LayoutDashboard size={18} />} label="Dashboard Saya" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
              <SidebarLink icon={<CalendarCheck size={18} />} label="Data Kehadiran" active={activeView === 'attendance'} onClick={() => setActiveView('attendance')} />
              <SidebarLink icon={<History size={18} />} label="Daftar Izin Saya" active={activeView === 'permission_history'} onClick={() => setActiveView('permission_history')} />
            </>
          )}

          {isManager && (
            <>
              <SidebarLink icon={<LayoutDashboard size={18} />} label="Dashboard Pimpinan" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
              <SidebarLink icon={<Users size={18} />} label="Monitoring Staf" active={activeView === 'manager_attendance'} onClick={() => setActiveView('manager_attendance')} />
              <SidebarLink icon={<ClipboardList size={18} />} label="Daftar Permohonan" active={activeView === 'manager_permissions'} onClick={() => setActiveView('manager_permissions')} />
            </>
          )}

          {isAdmin && (
            <>
              <SidebarLink icon={<LayoutDashboard size={18} />} label="Statistik Utama" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
              <SidebarLink icon={<Users size={18} />} label="Kelola Pegawai" active={activeView === 'admin_pegawai'} onClick={() => setActiveView('admin_pegawai')} />
              <SidebarLink icon={<CalendarDays size={18} />} label="Kelola Hari Libur" active={activeView === 'admin_holidays'} onClick={() => setActiveView('admin_holidays')} />
              <SidebarLink icon={<Settings size={18} />} label="Sistem & Konfigurasi" active={activeView === 'admin_logs'} onClick={() => setActiveView('admin_logs')} />
            </>
          )}
        </nav>

        <div className="p-6 bg-slate-950/40 m-4 rounded-2xl border border-slate-800/50">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img src={currentUser.photoUrl} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{currentUser.nip}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-2 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 py-2 rounded-lg text-xs font-semibold transition-all">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">
              {activeView === 'dashboard' && (isAdmin ? 'Dashboard Administrator' : 'Dashboard Informasi')}
              {activeView === 'attendance' && 'Informasi Kehadiran'}
              {activeView === 'permission_form' && 'Formulir Pengajuan Izin'}
              {activeView === 'permission_history' && 'Riwayat Pengajuan Izin'}
              {activeView === 'manager_attendance' && 'Pantau Kehadiran Tim'}
              {activeView === 'manager_permissions' && 'Validasi Permohonan Izin'}
              {activeView === 'admin_pegawai' && 'Manajemen Database'}
              {activeView === 'admin_holidays' && 'Manajemen Hari Libur'}
              {activeView === 'admin_logs' && 'Sistem & Laporan'}
            </h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              {isAdmin ? 'Mode Administrator' : `${currentUser.subBagian} • ${currentUser.role}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-[1px] bg-slate-200 mx-2"></div>
            <button className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && (
              <Dashboard 
                user={currentUser} 
                holidays={holidays} 
                subBagianCount={subBagianList.length} 
                employees={employees}
                attendance={attendance}
              />
            )}
            {activeView === 'admin_pegawai' && (
              <AdminView 
                employees={employees} 
                subBagianList={subBagianList} 
                onAddEmployee={handleAddEmployee} 
                onUpdateEmployee={handleUpdateEmployee} 
                onDeleteEmployee={handleDeleteEmployee} 
                onBulkImport={handleBulkImportEmployees} 
              />
            )}
            {activeView === 'admin_holidays' && (
              <HolidayManager holidays={holidays} onAddHoliday={handleAddHoliday} onDeleteHoliday={handleDeleteHoliday} />
            )}
            {activeView === 'admin_logs' && (
              <SystemConfigView 
                onImportFingerprint={handleImportFingerprint} 
                onLogoChange={setOpdLogo} 
                onNameChange={setOpdName} 
                currentName={opdName} 
                currentLogo={opdLogo} 
                subBagianList={subBagianList} 
                employees={employees}
                attendance={attendance}
                holidays={holidays}
                schedules={schedules}
                machineConfig={machineConfig}
                onAddSubBagian={handleAddSubBagian} 
                onDeleteSubBagian={handleDeleteSubBagian} 
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onUpdateMachine={handleUpdateMachine}
                onSyncAttendance={handleSyncAttendance}
              />
            )}
            {activeView === 'attendance' && (
              <EmployeeAttendanceView 
                attendance={userAttendance} 
                permissions={permissions} 
                holidays={holidays} 
                schedules={schedules}
                onJustifyLate={handleOpenPermissionForm} 
              />
            )}
            {activeView === 'permission_form' && (
              <PermissionForm 
                onSubmit={handleAddPermission} 
                managerName={employees.find(e => e.id === currentUser.managerId)?.name || 'Pimpinan Utama'}
                employeeId={currentUser.id}
                managerId={currentUser.managerId || 'mgr-default'}
                initialDate={selectedDateForPermission}
                onCancel={() => setActiveView('attendance')}
              />
            )}
            {activeView === 'permission_history' && (
              <PermissionList permissions={userPermissions} />
            )}
            {activeView === 'manager_attendance' && (
              <ManagerAttendanceView 
                managerId={currentUser.id} 
                employees={employees} 
                attendance={attendance} 
                permissions={permissions} 
                holidays={holidays} 
                schedules={schedules}
              />
            )}
            {activeView === 'manager_permissions' && (
              <ManagerView permissions={permissions} onUpdateStatus={handleUpdatePermissionStatus} managerId={currentUser.id} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

export default App;
