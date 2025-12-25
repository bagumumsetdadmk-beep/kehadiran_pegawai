
import React, { useState, useRef } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  AlertTriangle,
  Download,
  FileUp,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Briefcase
} from 'lucide-react';
import { exportEmployeesToExcel, downloadEmployeeTemplate } from '../utils/exportUtils';

interface Props {
  employees: Employee[];
  subBagianList: string[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onBulkImport: (newEmployees: Employee[]) => void;
}

const AdminView: React.FC<Props> = ({ 
  employees, 
  subBagianList, 
  onAddEmployee, 
  onUpdateEmployee, 
  onDeleteEmployee, 
  onBulkImport 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.nip.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter list pegawai yang berstatus sebagai Pimpinan untuk dropdown
  const managerList = employees.filter(e => e.isManager);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (emp: Employee) => {
    setDeletingEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const employeeData: Employee = {
      id: editingEmployee?.id || `emp-${Date.now()}`,
      nip: formData.get('nip') as string,
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      subBagian: formData.get('subBagian') as string,
      gender: formData.get('gender') as 'Laki-laki' | 'Perempuan',
      managerId: formData.get('managerId') as string || null,
      photoUrl: editingEmployee?.photoUrl || `https://i.pravatar.cc/150?u=${formData.get('nip')}`,
      isManager: formData.get('isManager') === 'on',
      isAdmin: formData.get('isAdmin') === 'on',
      fingerprintId: formData.get('fingerprintId') as string || '',
    };

    if (editingEmployee) {
      onUpdateEmployee(employeeData);
    } else {
      onAddEmployee(employeeData);
    }
    setIsFormModalOpen(false);
  };

  const confirmDelete = () => {
    if (deletingEmployee) {
      onDeleteEmployee(deletingEmployee.id);
      setIsDeleteModalOpen(false);
      setDeletingEmployee(null);
    }
  };

  const parseCSVLine = (line: string) => {
    const result = [];
    let curVal = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(curVal);
        curVal = "";
      } else {
        curVal += char;
      }
    }
    result.push(curVal);
    return result;
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length <= 1) return alert("File kosong atau hanya berisi header.");

        const newEmployees: Employee[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < 5) continue;

          newEmployees.push({
            id: `emp-import-${Date.now()}-${i}`,
            nip: values[0].trim(),
            name: values[1].trim(),
            role: values[2].trim(),
            subBagian: values[3].trim(),
            gender: values[4].trim() as any,
            managerId: values[5]?.trim() || null,
            photoUrl: `https://i.pravatar.cc/150?u=${values[0].trim()}`,
            isManager: values[6]?.toUpperCase() === 'TRUE',
            isAdmin: values[7]?.toUpperCase() === 'TRUE',
            fingerprintId: values[8]?.trim() || '',
          });
        }
        
        if (newEmployees.length > 0) {
          onBulkImport(newEmployees);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
          <Users size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Database Pegawai</h3>
          <p className="text-sm text-slate-500">Manajemen data profil dan struktur organisasi pegawai.</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari NIP atau Nama..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button 
              onClick={() => exportEmployeesToExcel(employees, 'Data_Pegawai')}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" /> Export List
            </button>
            <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>
            <button 
              onClick={downloadEmployeeTemplate}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-100 transition-all"
            >
              <Download size={16} /> Template
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all"
            >
              <FileUp size={16} /> Impor
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
            </button>
            <button 
              onClick={handleOpenAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              <UserPlus size={16} /> Tambah Pegawai
            </button>
          </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-8 py-5">No</th>
                <th className="px-8 py-5">Pegawai</th>
                <th className="px-8 py-5 text-center">NIP / PIN Mesin</th>
                <th className="px-8 py-5">Subbagian</th>
                <th className="px-8 py-5">Jabatan</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                    Tidak ada data pegawai ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 text-sm text-slate-400 font-mono">
                      {((currentPage - 1) * itemsPerPage + idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <img src={emp.photoUrl} alt="" className="w-9 h-9 rounded-full border border-slate-200 object-cover" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{emp.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{emp.gender}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-mono text-slate-500">{emp.nip}</span>
                        {emp.fingerprintId && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md mt-1 flex items-center gap-1">
                            <Fingerprint size={10} /> PIN: {emp.fingerprintId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                        {emp.subBagian}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                      {emp.role}
                      {emp.isManager && <span className="ml-2 text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase">Pimpinan</span>}
                    </td>
                    <td className="px-8 py-5 text-sm">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEditModal(emp)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 size={18} /></button>
                        <button onClick={() => handleOpenDeleteModal(emp)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-white'}`}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white border border-transparent hover:border-slate-200'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === totalPages ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-white'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {editingEmployee ? <Edit3 size={20} /> : <UserPlus size={20} />}
                {editingEmployee ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Lengkap</label>
                  <input name="name" defaultValue={editingEmployee?.name} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">NIP</label>
                  <input name="nip" defaultValue={editingEmployee?.nip} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Subbagian</label>
                  <select name="subBagian" defaultValue={editingEmployee?.subBagian} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    {subBagianList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Jabatan / Role</label>
                  <input name="role" defaultValue={editingEmployee?.role} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Jenis Kelamin</label>
                  <select name="gender" defaultValue={editingEmployee?.gender} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Fingerprint size={12} /> ID User pada Mesin (PIN/UID)</label>
                   <input name="fingerprintId" defaultValue={editingEmployee?.fingerprintId || ''} placeholder="Contoh: 101" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                   <p className="text-[9px] text-slate-400">Nomor User ID yang terdaftar di dalam mesin absensi.</p>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Briefcase size={12} /> Atasan Langsung (Pimpinan)</label>
                <select 
                  name="managerId" 
                  defaultValue={editingEmployee?.managerId || ''} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Tidak Ada / Pimpinan Tertinggi --</option>
                  {managerList.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" name="isManager" defaultChecked={editingEmployee?.isManager} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Set sebagai Pimpinan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" name="isAdmin" defaultChecked={editingEmployee?.isAdmin} className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-rose-600 transition-colors">Set sebagai Administrator</span>
                </label>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2">
                  <Save size={18} /> Simpan Data Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Pegawai?</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-700">{deletingEmployee.name}</span>?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
                <button onClick={confirmDelete} className="py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100">Ya, Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
