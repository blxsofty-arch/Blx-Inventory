import { supabase } from './supabase.js';

const email = process.argv[2];
const newPasscode = process.argv[3];

if (!email || !newPasscode) {
  console.log('\n======================================================');
  console.log('   BLX REALTY PORTAL - ADMINISTRATIVE PASSCODE RESET   ');
  console.log('======================================================');
  console.log('\nUsage: node server/reset-passcode.js <email> <new_passcode>\n');
  console.log('Example:');
  console.log('  node server/reset-passcode.js admin@theblxrealty.com MyNewSecurePass123\n');
  process.exit(1);
}

const cleanEmail = email.toLowerCase().trim();
const cleanPasscode = newPasscode.trim();

if (cleanPasscode.length < 6) {
  console.error('\nError: Passcode must be at least 6 characters long.\n');
  process.exit(1);
}

async function runReset() {
  try {
    const { data: user, error: fetchErr } = await supabase
      .from('staff_users')
      .select('id, email, name, role')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (fetchErr) {
      console.error('Supabase lookup error:', fetchErr.message);
      process.exit(1);
    }

    if (!user) {
      console.error(`\nError: No staff account found for email "${cleanEmail}".\n`);
      process.exit(1);
    }

    const { error: updateErr } = await supabase
      .from('staff_users')
      .update({ password: cleanPasscode })
      .ilike('email', cleanEmail);

    if (updateErr) {
      console.error('Error updating passcode in Supabase:', updateErr.message);
      process.exit(1);
    }

    // Clear active sessions for this user so they must log in with new credentials
    await supabase.from('staff_sessions').delete().ilike('email', cleanEmail);

    console.log('\n======================================================');
    console.log('✅ PASSCODE RESET SUCCESSFUL (SUPABASE)');
    console.log('======================================================');
    console.log(`User Account : ${user.name} (${user.email})`);
    console.log(`Role         : ${user.role}`);
    console.log(`Status       : Passcode updated successfully in Supabase.`);
    console.log('You can now log in to the portal with your new passcode.\n');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error resetting passcode:', err);
    process.exit(1);
  }
}

runReset();
