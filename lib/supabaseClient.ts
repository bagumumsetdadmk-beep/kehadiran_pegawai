import { createClient } from '@supabase/supabase-js';

// Helper to safely get environment variables
const getEnv = (key: string) => {
  try {
    // Check for Vite's import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
    // Check for process.env (Node/Webpack)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    console.warn('Error reading environment variables:', e);
  }
  return undefined;
};

// Pastikan Anda membuat file .env di root project dan mengisi variabel ini
// VITE_SUPABASE_URL=https://xyz.supabase.co
// VITE_SUPABASE_ANON_KEY=eyJhb...

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Fallback agar aplikasi tidak crash jika env belum diset (Mode Dev/Mock)
const isConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = () => {
  return !!supabase;
};