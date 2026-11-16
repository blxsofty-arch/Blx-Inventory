import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseReady } from '../server/supabase.js';

/**
 * Reusable database backup and export script.
 * Dumps all properties and sanitized staff profiles into a timestamped JSON file.
 * Passwords, auth tokens, and session secrets are strictly excluded.
 */
async function runBackup() {
  if (!isSupabaseReady()) {
    console.error('❌ Supabase client is not ready. Check environment variables.');
    process.exit(1);
  }

  console.log('🔄 Initiating secure BLX Realty database backup...');

  try {
    // 1. Fetch properties
    const { data: properties, error: propErr } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (propErr) throw propErr;

    // 2. Fetch staff records - strictly omit passwords
    const { data: staff, error: staffErr } = await supabase
      .from('staff_users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: true });

    if (staffErr) throw staffErr;

    // 3. Ensure backup directory exists
    const backupDir = path.resolve('backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 4. Generate unique timestamped filename (never overwrites existing backups)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `blx_backup_${timestamp}.json`);

    const backupPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      counts: {
        properties: properties.length,
        staff: staff.length,
      },
      sanitized: true,
      description: 'Production backup of BLX Realty property listings and staff profiles. Passwords and credentials omitted.',
      properties,
      staff,
    };

    fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf-8');

    console.log(`✅ Backup successfully created at: ${backupPath}`);
    console.log(`📦 Verified: ${properties.length} properties and ${staff.length} staff records preserved.`);
    return backupPath;
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    process.exit(1);
  }
}

runBackup();

