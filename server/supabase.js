import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Strict validation: Require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY exclusively.
// Never fall back to browser/anon or alternate secret keys on the backend.
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  const message = `❌ [Supabase Configuration Error] Critical environment variable(s) missing: ${missing.join(
    ', '
  )}. The backend requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to operate.`;

  if (process.env.NODE_ENV === 'production') {
    // Fail safely at startup instead of serving requests with an unusable client.
    console.error(message);
    throw new Error('Supabase configuration error: missing required server environment variables.');
  }

  console.error(message);
} else {
  // Safe confirmation: Never logs the key or secrets
  console.log('⚡ [SUPABASE] Initialized database client successfully with service-role privileges.');
}

export const isSupabaseReady = () => Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

export const supabase = isSupabaseReady()
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : new Proxy(
      {},
      {
        get(target, prop) {
          throw new Error(
            `Supabase client is not configured: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment. Attempted to access property: "${String(
              prop
            )}"`
          );
        },
      }
    );
