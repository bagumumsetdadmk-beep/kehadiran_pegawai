
import { createClient } from '@supabase/supabase-js';

// Helper to safely get environment variables
const getEnv = (key: string) => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // console.warn('Error reading environment variables:', e);
  }
  return undefined;
};

// 1. Coba ambil dari LocalStorage (Settingan User dari UI)
// 2. Jika tidak ada, ambil dari Environment Variable (.env)
const getSupabaseConfig = () => {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('SB_URL') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('SB_KEY') : null;

  const envUrl = getEnv('VITE_SUPABASE_URL');
  const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

  return {
    url: localUrl || envUrl,
    key: localKey || envKey
  };
};

const config = getSupabaseConfig();

export const supabase = (config.url && config.key) 
  ? createClient(config.url, config.key) 
  : null;

export const isSupabaseConfigured = () => {
  return !!supabase;
};

// Fungsi helper untuk mengetes koneksi
export const checkSupabaseConnection = async (customUrl?: string, customKey?: string) => {
  try {
    // Gunakan client sementara untuk tes input baru, atau client utama jika tidak ada input
    let clientToCheck = supabase;

    if (customUrl && customKey) {
      clientToCheck = createClient(customUrl, customKey);
    }

    if (!clientToCheck) return false;

    // Coba query ringan (menghitung jumlah sub bagian, karena tabelnya kecil dan pasti ada)
    const { count, error } = await clientToCheck
      .from('sub_bagian')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      // Quietly fail for connection checks to avoid console noise
      return false;
    }
    
    return true;
  } catch (err) {
    // Quietly fail for fetch errors (network down, etc)
    return false;
  }
};
