import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://vgnmtuegjidmlmurmzqb.supabase.co';
// Use backend service role key if present for elevated backend actions; fallback to anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_KEY) {
  console.warn('⚠️ [SUPABASE] Warning: No Supabase API key found in environment.');
} else {
  // Safe log: Never print keys or secrets
  console.log('⚡ [SUPABASE] Initialized database client successfully.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || 'unconfigured', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const isSupabaseReady = () => Boolean(SUPABASE_KEY && SUPABASE_KEY !== 'unconfigured');
