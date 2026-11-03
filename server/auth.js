import express from 'express';
import { supabase } from './supabase.js';

const router = express.Router();

// Active sessions cache in memory for low-latency requests
export const activeSessions = new Map();

/**
 * Extracts and verifies the current session user from the Authorization header.
 * Checks memory cache first, then verifies in Supabase database to persist across restarts/serverless calls.
 */
export async function getSessionUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  // 1. Check in-memory session cache
  const cachedUser = activeSessions.get(token);
  if (cachedUser) {
    return cachedUser;
  }

  // 2. Check Supabase staff_sessions table
  try {
    const { data: session, error } = await supabase
      .from('staff_sessions')
      .select('token, user_id, email, name, role')
      .eq('token', token)
      .maybeSingle();

    if (error || !session) {
      return null;
    }

    // Verify user role directly from staff_users
    const { data: user } = await supabase
      .from('staff_users')
      .select('id, email, name, role')
      .eq('id', session.user_id)
      .maybeSingle();

    const finalRole = user?.role || session.role;
    const normalizedRole = finalRole.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
    const verifiedUser = {
      id: session.user_id,
      email: user?.email || session.email,
      name: user?.name || session.name,
      role: normalizedRole,
    };

    activeSessions.set(token, verifiedUser);
    return verifiedUser;
  } catch (err) {
    console.error('Session lookup error from Supabase:', err);
    return null;
  }
}

/**
 * Middleware: Requires the user to be authenticated (either ADMIN or EMPLOYEE).
 */
export async function requireAuth(req, res, next) {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required',
      message: 'You must be logged in with a valid staff account to perform this action.',
    });
  }
  req.user = user;
  next();
}

/**
 * Middleware: Requires ADMIN role.
 * Strictly blocks EMPLOYEE or unauthenticated requests with 403 Forbidden.
 */
export async function requireAdmin(req, res, next) {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required',
      message: 'You must be logged in with an administrator account to access this endpoint.',
    });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden: Administrative access required',
      message: 'Employees have strictly limited read-only access. You do not have permission to perform this action.',
      role: user.role,
      requiredRole: 'ADMIN',
    });
  }

  req.user = user;
  next();
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('staff_users')
      .select('id, email, password, name, role')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) {
      console.error('Supabase query error during login:', error);
      return res.status(500).json({ error: 'Database error: ' + error.message });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const normalizedRole = user.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
    const token = `blx_sess_${Math.random().toString(36).substring(2)}${Date.now()}`;
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizedRole,
    };

    // Store in-memory cache
    activeSessions.set(token, userData);

    // Persist session to Supabase
    try {
      await supabase.from('staff_sessions').upsert({
        token,
        user_id: user.id,
        email: user.email,
        name: user.name,
        role: normalizedRole,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not persist session token to Supabase:', e.message);
    }

    return res.json({
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  return res.json({ user });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    activeSessions.delete(token);
    try {
      await supabase.from('staff_sessions').delete().eq('token', token);
    } catch (e) {
      // Ignore
    }
  }
  return res.json({ message: 'Logged out successfully' });
});

// Helper for forgot passcode request
async function handleForgotPasscode(req, res) {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Registered staff email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { data: user, error } = await supabase
      .from('staff_users')
      .select('id, email, name, role')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) {
      console.error('Supabase error finding user for reset:', error);
      return res.status(500).json({ error: 'Database error searching for staff account' });
    }

    if (!user) {
      return res.status(404).json({ error: 'No staff account found with this email address' });
    }

    // Generate secure 6-digit one-time recovery code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const resetId = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Mark previous unused codes for this email as used
    await supabase
      .from('password_resets')
      .update({ used: 1 })
      .ilike('email', cleanEmail)
      .eq('used', 0);

    // Insert new reset record
    const { error: insertErr } = await supabase.from('password_resets').insert({
      id: resetId,
      email: cleanEmail,
      token: code,
      expires_at: expiresAt,
      used: 0,
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error('Error creating password reset record in Supabase:', insertErr);
      return res.status(500).json({ error: 'Failed to record passcode reset request in database' });
    }

    return res.json({
      success: true,
      message: 'Recovery code generated. Please enter your verification code and choose a new passcode.',
      verificationCode: code,
      email: cleanEmail,
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error('Forgot passcode error:', error);
    return res.status(500).json({ error: 'Server error processing passcode recovery request' });
  }
}

// Helper for reset passcode completion
async function handleResetPasscode(req, res) {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ error: '6-digit recovery code is required' });
    }
    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({ error: 'New passcode is required' });
    }
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'Passcode must be at least 6 characters long' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passcodes do not match' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    // Look up active reset token in Supabase
    const { data: record, error } = await supabase
      .from('password_resets')
      .select('id, email, token, expires_at, used')
      .ilike('email', cleanEmail)
      .eq('token', cleanCode)
      .eq('used', 0)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !record) {
      return res.status(400).json({
        error: 'Invalid or expired verification code. Please request a new recovery code.',
      });
    }

    // Update staff user password in Supabase
    const { error: updateErr } = await supabase
      .from('staff_users')
      .update({ password: newPassword.trim() })
      .ilike('email', cleanEmail);

    if (updateErr) {
      console.error('Error updating staff user password:', updateErr);
      return res.status(500).json({ error: 'Failed to update passcode in database' });
    }

    // Mark reset code as used
    await supabase
      .from('password_resets')
      .update({ used: 1 })
      .eq('id', record.id);

    // Invalidate old active sessions for this user
    await supabase
      .from('staff_sessions')
      .delete()
      .ilike('email', cleanEmail);

    // Clear matching memory sessions
    for (const [t, u] of activeSessions.entries()) {
      if (u.email.toLowerCase() === cleanEmail) {
        activeSessions.delete(t);
      }
    }

    return res.json({
      success: true,
      message: 'Passcode successfully reset. You can now log in with your new passcode.',
    });
  } catch (error) {
    console.error('Reset passcode error:', error);
    return res.status(500).json({ error: 'Server error updating passcode' });
  }
}

// POST /api/auth/forgot-passcode
router.post('/forgot-passcode', handleForgotPasscode);

// POST /api/auth/reset-passcode
router.post('/reset-passcode', handleResetPasscode);

export default router;
