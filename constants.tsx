
import { Employee, AttendanceRecord, PermissionStatus, PermissionRequest, WorkSchedule, FingerprintMachine } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  // Super Admin
  { 
    id: 'admin-001', 
    nip: 'ADMIN001',
    name: 'Administrator Utama', 
    role: 'Super Admin', 
    subBagian: 'Semua Subbagian',
    gender: 'Laki-laki',
    managerId: null, 
    isManager: false,
    isAdmin: true,
    photoUrl: 'https://i.pravatar.cc/150?u=admin',
    fingerprintId: '1'
  },

  // RT dan Perlengkapan
  { 
    id: 'mgr-001', 
    nip: '198501012010011001',
    name: 'Budi Santoso', 
    role: 'Kepala Subbagian RT', 
    subBagian: 'RT dan Perlengkapan',
    gender: 'Laki-laki',
    managerId: null, 
    isManager: true,
    isAdmin: false,
    photoUrl: 'https://i.pravatar.cc/150?u=budi',
    fingerprintId: '2'
  },
  { 
    id: 'emp-001', 
    nip: '199505202022031002',
    name: 'Ahmad Faisal', 
    role: 'Staf Administrasi RT', 
    subBagian: 'RT dan Perlengkapan',
    gender: 'Laki-laki',
    managerId: 'mgr-001', 
    isManager: false,
    isAdmin: false,
    photoUrl: 'https://i.pravatar.cc/150?u=ahmad',
    fingerprintId: '3'
  },
  { 
    id: 'emp-002', 
    nip: '199708152023012005',
    name: 'Siti Aminah', 
    role: 'Teknisi Perlengkapan', 
    subBagian: 'RT dan Perlengkapan',
    gender: 'Perempuan',
    managerId: 'mgr-001', 
    isManager: false,
    isAdmin: false,
    photoUrl: 'https://i.pravatar.cc/150?u=siti',
    fingerprintId: '4'
  },

  // TUP dan Kepegawaian
  { 
    id: 'mgr-002', 
    nip: '198703122011012003',
    name: 'Dewi Lestari', 
    role: 'Kepala Subbagian TUP', 
    subBagian: 'TUP dan Kepegawaian',
    gender: 'Perempuan',
    managerId: null, 
    isManager: true,
    isAdmin: false,
    photoUrl: 'https://i.pravatar.cc/150?u=dewi',
    fingerprintId: '5'
  },
  { 
    id: 'emp-003', 
    nip: '199411102020031008',
    name: 'Rian Hidayat', 
    role: 'Analis Kepegawaian', 
    subBagian: 'TUP dan Kepegawaian',
    gender: 'Laki-laki',
    managerId: 'mgr-002', 
    isManager: false,
    isAdmin: false,
    photoUrl: 'https://i.pravatar.cc/150?u=rian',
    fingerprintId: '6'
  },

  // Keuangan
  { 
    id: 'mgr-003', 
    nip: '198212252008011004',
    name: 'Andi Wijaya', 
    role: 'Kepala Subbagian Keuangan', 
    subBagian: 'Keuangan',
    gender: 'Laki-laki',
    managerId: null, 
    isManager: true,
    isAdmin: false,
    photoUrl: 'https://i.pravatar.cc/150?u=andi',
    fingerprintId: '7'
  },
  { 
    id: 'emp-004', 
    nip: '199602042021032011',
    name: 'Linda Sari', 
    role: 'Bendahara Pengeluaran', 
    subBagian: 'Keuangan',
    gender: 'Perempuan',
    managerId: 'mgr-003', 
    isManager: false,
    isAdmin: false,
    photoUrl: 'https://i.pravatar.cc/150?u=linda',
    fingerprintId: '8'
  },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: '1', employeeId: 'emp-001', date: '2024-05-20', day: 'Senin', shiftIn: '08:00', fingerprintIn: '07:55', shiftOut: '17:00', fingerprintOut: '17:05', remarks: 'Tepat Waktu', isLate: false },
  { id: '2', employeeId: 'emp-001', date: '2024-05-21', day: 'Selasa', shiftIn: '08:00', fingerprintIn: '08:15', shiftOut: '17:00', fingerprintOut: '17:00', remarks: 'Terlambat 15 menit', isLate: true },
  { id: '3', employeeId: 'emp-001', date: '2024-05-22', day: 'Rabu', shiftIn: '08:00', fingerprintIn: '08:02', shiftOut: '17:00', fingerprintOut: '17:10', remarks: 'Tepat Waktu', isLate: false },
  { id: '4', employeeId: 'emp-002', date: '2024-05-20', day: 'Senin', shiftIn: '08:00', fingerprintIn: '08:10', shiftOut: '17:00', fingerprintOut: '17:00', remarks: 'Terlambat 10 menit', isLate: true },
  { id: '5', employeeId: 'emp-003', date: '2024-05-20', day: 'Senin', shiftIn: '08:00', fingerprintIn: '07:50', shiftOut: '17:00', fingerprintOut: '17:05', remarks: 'Tepat Waktu', isLate: false },
];

export const MOCK_PERMISSIONS: PermissionRequest[] = [];

export const MOCK_SCHEDULES: WorkSchedule[] = [
  {
    id: 'sch-001',
    name: 'Reguler (Senin - Kamis)',
    days: ['Senin', 'Selasa', 'Rabu', 'Kamis'],
    startTime: '08:00',
    endTime: '17:00'
  },
  {
    id: 'sch-002',
    name: 'Reguler (Jumat)',
    days: ['Jumat'],
    startTime: '08:00',
    endTime: '16:00'
  }
];

export const MOCK_MACHINE: FingerprintMachine = {
  ipAddress: '192.168.1.201, 192.168.1.202, 192.168.1.203', // Support multiple IP
  port: '4370',
  commKey: '0',
  name: 'Cluster Mesin Kantor',
  lastSync: '2024-05-22 08:30:00',
  status: 'Online'
};
