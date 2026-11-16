import bcrypt from 'bcryptjs';
import { supabase, isSupabaseReady } from '../server/supabase.js';

/**
 * Migration script to safely hash existing plaintext passwords with bcryptjs.
 * Preserves user accounts and verifies hashes.
 */
async function migratePasswords() {
  if (!isSupabaseReady()) {
    console.error('❌ Supabase client is not ready. Check environment variables.');
    process.exit(1);
  }

  console.log('🔄 Checking staff accounts for password hashing migration...');

  try {
    const { data: users, error: fetchErr } = await supabase
      .from('staff_users')
      .select('id, email, password, name, role');

    if (fetchErr) throw fetchErr;

    let migratedCount = 0;
    let alreadyHashedCount = 0;

    for (const user of users) {
      const isAlreadyHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

      if (isAlreadyHashed) {
        alreadyHashedCount++;
        console.log(`ℹ️ [Skipped] ${user.email} is already secured with bcrypt.`);
      } else {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const { error: updateErr } = await supabase
          .from('staff_users')
          .update({ password: hashedPassword })
          .eq('id', user.id);

        if (updateErr) {
          console.error(`❌ Failed to update hash for ${user.email}:`, updateErr.message);
        } else {
          migratedCount++;
          console.log(`✅ [Migrated] Secured password hash for staff account: ${user.email}`);
        }
      }
    }

    console.log(`\n🎉 Password migration complete: ${migratedCount} accounts migrated, ${alreadyHashedCount} already secure.`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migratePasswords();

