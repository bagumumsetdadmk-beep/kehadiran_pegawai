
import React, { useState } from 'react';
import { Employee } from '../types';
import { LogIn, UserCircle, ShieldCheck } from 'lucide-react';

interface Props {
  onLogin: (user: Employee) => void;
  logo: string | null;
  employees: Employee[];
}

const Login: React.FC<Props> = ({ onLogin, logo, employees }) => {
  const [nip, setNip] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = employees.find(u => u.nip === nip);
    if (user) {
      onLogin(user);
    } else {
      setError('NIP tidak ditemukan. Silakan hubungi admin Kepegawaian.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-indigo-700 p-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-md mx-auto flex items-center justify-center mb-6 overflow-hidden">
            {logo ? (
              <img src={logo} alt="OPD Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <ShieldCheck size={48} />
            )}
          </div>
          <h1 className="text-2xl font-bold">Portal AbsensiPintar</h1>
          <p className="text-indigo-200 mt-2 text-sm">Masuk menggunakan NIP Pegawai Anda</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <UserCircle size={16} /> Nomor Induk Pegawai (NIP)
            </label>
            <input 
              type="text"
              placeholder="Contoh: 19950520..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono"
              value={nip}
              onChange={(e) => {
                setNip(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
          >
            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" /> 
            Masuk Sekarang
          </button>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Instansi Pemerintah Pusat</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
