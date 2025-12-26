
import * as XLSX from 'xlsx';
import { AttendanceRecord, Employee } from '../types';

/**
 * Utilitas helper untuk menyimpan data sebagai file .xlsx
 */
const saveAsExcel = (data: any[][], fileName: string, sheetName: string = 'Sheet1') => {
  // 1. Buat Workbook baru
  const wb = XLSX.utils.book_new();
  
  // 2. Buat Worksheet dari array of arrays
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 3. Tambahkan worksheet ke workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 4. Tulis file (Browser akan otomatis mengunduh)
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/**
 * Ekspor Rekap Bulanan Seluruh Pegawai dalam format Matriks/Cross-Table Excel (.xlsx).
 * Updated: Menambahkan parameter category ('all' | 'staff' | 'manager')
 */
export const exportAllEmployeesMonthlyAttendanceExcel = (
  employees: Employee[], 
  attendance: AttendanceRecord[], 
  month: string, 
  opdName: string,
  category: 'all' | 'staff' | 'manager' = 'all'
) => {
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  
  // Tentukan Label Kategori untuk Judul Laporan & Nama File
  let categoryLabel = 'SELURUH PEGAWAI';
  let fileSuffix = 'Global';
  
  if (category === 'staff') {
    categoryLabel = 'PEGAWAI (STAF)';
    fileSuffix = 'Pegawai_Staf';
  } else if (category === 'manager') {
    categoryLabel = 'PIMPINAN (MANAGER)';
    fileSuffix = 'Pimpinan';
  }

  // Header Metadata
  const metadata = [
    [`NAMA INSTANSI/OPD: ${opdName.toUpperCase()}`],
    [`LAPORAN REKAPITULASI KEHADIRAN: ${categoryLabel}`],
    [`PERIODE: ${month}`],
    [`WAKTU CETAK: ${new Date().toLocaleString('id-ID')}`],
    [`Keterangan: ✔ = Hadir, ─ = Tidak Hadir`],
    [''] // Spasi kosong
  ];

  // Header Tabel Tanggal (01, 02, ..., 31)
  const dateHeaders = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  const tableHeaders = ['No', 'Nama Pegawai', 'NIP', 'Jabatan', ...dateHeaders];
  
  // Data Pegawai
  const dataRows = employees.map((emp, index) => {
    const row: (string | number)[] = [index + 1, emp.name, emp.nip, emp.role];
    
    // Cek kehadiran untuk setiap tanggal
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = attendance.find(a => a.employeeId === emp.id && a.date === dateStr);
      
      row.push(record && record.fingerprintIn ? '✔' : '─');
    }
    return row;
  });

  // Gabungkan semua
  const finalData = [...metadata, tableHeaders, ...dataRows];

  saveAsExcel(finalData, `Rekap_Kehadiran_${fileSuffix}_${month}`, `Rekap ${fileSuffix}`);
};

/**
 * Ekspor data kehadiran individual ke Excel (.xlsx)
 */
export const exportAttendanceToExcel = (data: AttendanceRecord[], fileName: string) => {
  const headers = ['No', 'Tanggal', 'Hari', 'Jadwal Masuk', 'Finger In', 'Jadwal Pulang', 'Finger Out', 'Keterangan'];
  const rows = data.map((item, index) => [
    index + 1,
    item.date,
    item.day,
    item.shiftIn,
    item.fingerprintIn || '--:--',
    item.shiftOut,
    item.fingerprintOut || '--:--',
    item.remarks
  ]);

  const finalData = [headers, ...rows];
  saveAsExcel(finalData, fileName, 'Log Kehadiran');
};

/**
 * Ekspor data pegawai ke Excel (.xlsx)
 */
export const exportEmployeesToExcel = (data: Employee[], fileName: string) => {
  const headers = ['NIP', 'Nama', 'Role', 'Subbagian', 'Gender', 'ID_Manager', 'Is_Manager', 'Is_Admin'];
  const rows = data.map(emp => [
    emp.nip,
    emp.name,
    emp.role,
    emp.subBagian,
    emp.gender,
    emp.managerId || '',
    emp.isManager ? 'TRUE' : 'FALSE',
    emp.isAdmin ? 'TRUE' : 'FALSE'
  ]);

  const finalData = [headers, ...rows];
  saveAsExcel(finalData, fileName, 'Data Pegawai');
};

/**
 * Unduh template import pegawai Excel (.xlsx)
 */
export const downloadEmployeeTemplate = () => {
  const headers = ['NIP', 'Nama', 'Role', 'Subbagian', 'Gender', 'ID_Manager', 'Is_Manager', 'Is_Admin'];
  const exampleRow = [
    '199001012023011001', 
    'Nama Pegawai Contoh, S.T.', 
    'Staf IT', 
    'TUP dan Kepegawaian', 
    'Laki-laki', 
    'mgr-001', 
    'FALSE', 
    'FALSE'
  ];

  const finalData = [headers, exampleRow];
  saveAsExcel(finalData, 'Template_Import_Pegawai', 'Template');
};
