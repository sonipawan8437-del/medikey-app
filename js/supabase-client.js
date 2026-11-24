/**
 * MediKey | Supabase Client Configuration & Connection (supabase-client.js)
 */

export const SUPABASE_CONFIG = {
  url: 'https://dplqchnemrdckjzmrtrc.supabase.co',
  publishableKey: 'sb_publishable_Th5qKZynF1gi5OJFU9MUng_YAsdhSmg'
};

const hasSdk = typeof window !== 'undefined' && typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function';

export const supabase = hasSdk
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export function isSupabaseConnected() {
  return supabase !== null;
}
