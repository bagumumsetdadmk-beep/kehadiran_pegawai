
export enum PermissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Changed to string to support dynamic additions
export type SubBagian = string;

export interface OrganizationProfile {
  name: string;
  address: string;
  headName: string;
  headNip: string;
  website: string;
  logoUrl: string | null;
}

export interface Employee {
  id: string;
  nip: string;
  name: string;
  role: string;
  subBagian: SubBagian;
  gender: 'Laki-laki' | 'Perempuan';
  managerId: string | null;
  photoUrl: string;
  isManager: boolean;
  isAdmin: boolean;
  fingerprintId?: string; // ID User yang terdaftar di mesin Fingerprint
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  day: string;
  shiftIn: string;
  fingerprintIn: string | null;
  shiftOut: string;
  fingerprintOut: string | null;
  remarks: string;
  isLate: boolean;
}

// Tipe data raw dari Database Supabase (biasanya snake_case)
export interface AttendanceDBRow {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  created_at?: string;
}

export interface PermissionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  type: 'Sakit' | 'Terlambat' | 'Alasan Penting' | 'Cuti';
  startDate: string;
  endDate: string;
  reason: string;
  status: PermissionStatus;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface WorkSchedule {
  id: string;
  name: string; // e.g., "Reguler Senin-Kamis", "Bulan Puasa"
  days: string[]; // ['Senin', 'Selasa', ...]
  startTime: string; // "07:30"
  endTime: string; // "16:00"
  // If startDate and endDate are present, this is a special temporary schedule (e.g., Ramadan)
  startDate?: string | null; 
  endDate?: string | null;
}

export interface FingerprintMachine {
  ipAddress: string;
  port: string;
  commKey: string;
  name: string;
  lastSync: string | null;
  // Fix: Add 'Online (Simulasi)' to the status type to resolve type errors
  status: 'Online' | 'Offline' | 'Online (Simulasi)';
}
