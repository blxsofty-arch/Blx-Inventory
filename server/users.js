import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from './supabase.js';
import { requireAdmin, activeSessions } from './auth.js';

const router = express.Router();

// All routes in this router require ADMIN permissions
router.use(requireAdmin);

// Email validation helper
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

// GET /api/users - List all employee/staff accounts
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('staff_users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formattedUsers = (users || []).map((u) => ({
      ...u,
      role: u.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error listing users from Supabase:', error.message);
    res.status(500).json({ error: 'Failed to retrieve staff accounts' });
  }
});

// POST /api/users - Create new employee or admin account (Admin Only)
router.post('/', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Work email is required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid work email address' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const { data: existing, error: checkErr } = await supabase
      .from('staff_users')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (checkErr) throw checkErr;
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists' });
    }

    const normalizedRole = role && role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
    const id = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // Hash password with bcryptjs (cost factor 10)
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const { data: created, error: insertErr } = await supabase
      .from('staff_users')
      .insert([
        {
          id,
          email: cleanEmail,
          password: hashedPassword,
          name: name.trim(),
          role: normalizedRole,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id, email, name, role, created_at')
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json({
      message: `${normalizedRole === 'ADMIN' ? 'Administrator' : 'Employee'} account created successfully`,
      user: {
        ...created,
        role: created.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
      },
    });
  } catch (error) {
    console.error('Error creating user in Supabase:', error.message);
    res.status(500).json({ error: 'Failed to create staff account: ' + error.message });
  }
});

// PUT /api/users/:id - Update employee/staff account (Admin Only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password } = req.body;

    const { data: existing, error: fetchErr } = await supabase
      .from('staff_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return res.status(404).json({ error: 'Staff account not found' });
    }

    // Prevent an admin from demoting their own account if they are currently logged in
    if (req.user.id === id && role && role.toUpperCase() !== 'ADMIN') {
      return res.status(400).json({ error: 'You cannot remove administrative privileges from your own account' });
    }

    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (role) updates.role = role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';

    let passwordChanged = false;
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      updates.password = await bcrypt.hash(password.trim(), 10);
      passwordChanged = true;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('staff_users')
      .update(updates)
      .eq('id', id)
      .select('id, email, name, role, created_at')
      .single();

    if (updateErr) throw updateErr;

    // If password or role changed, invalidate user sessions so changes take effect immediately
    if (passwordChanged || (role && role.toUpperCase() !== existing.role.toUpperCase())) {
      await supabase.from('staff_sessions').delete().eq('user_id', id);
      for (const [t, u] of activeSessions.entries()) {
        if (u.id === id) activeSessions.delete(t);
      }
    }

    res.json({
      message: 'Staff account updated successfully',
      user: {
        ...updated,
        role: updated.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
      },
    });
  } catch (error) {
    console.error('Error updating staff user in Supabase:', error.message);
    res.status(500).json({ error: 'Failed to update staff account: ' + error.message });
  }
});

// POST /api/users/:id/reset-password - Admin-controlled direct password reset for staff
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('staff_users')
      .select('id, email, name')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return res.status(404).json({ error: 'Staff account not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    const { error: updateErr } = await supabase
      .from('staff_users')
      .update({ password: hashedPassword })
      .eq('id', id);

    if (updateErr) throw updateErr;

    // Invalidate old active sessions for this user
    await supabase.from('staff_sessions').delete().eq('user_id', id);
    for (const [t, u] of activeSessions.entries()) {
      if (u.id === id) activeSessions.delete(t);
    }

    res.json({
      message: `Password reset successfully for ${existing.name} (${existing.email}).`,
    });
  } catch (error) {
    console.error('Error in Admin reset-password:', error.message);
    res.status(500).json({ error: 'Failed to reset staff password' });
  }
});

// DELETE /api/users/:id - Delete employee/staff account (Admin Only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own active administrator account' });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('staff_users')
      .select('id, email, name')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return res.status(404).json({ error: 'Staff account not found' });
    }

    // Delete active sessions for this user
    await supabase.from('staff_sessions').delete().eq('user_id', id);
    for (const [t, u] of activeSessions.entries()) {
      if (u.id === id) activeSessions.delete(t);
    }

    const { error: deleteErr } = await supabase.from('staff_users').delete().eq('id', id);
    if (deleteErr) throw deleteErr;

    res.json({ message: 'Staff account deleted successfully', id });
  } catch (error) {
    console.error('Error deleting staff account from Supabase:', error.message);
    res.status(500).json({ error: 'Failed to delete staff account' });
  }
});

export default router;
