import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { supabase } from './supabase.js';

const router = express.Router();

// Active sessions cache in memory for low-latency requests
// Value: { id, email, name, role, createdAt }
export const activeSessions = new Map();

// 7 days maximum session lifetime
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Rate limiting: 10 login requests per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP. Please try again after 15 minutes.' },
});

// Rate limiting: 5 password recovery requests per 15 minutes per IP
export const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many recovery attempts. Please try again after 15 minutes.' },
});

/**
 * Extracts and verifies the current session user from the Authorization header.
 * Enforces automatic 7-day session expiration and database synchronization.
 */
export async function getSessionUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const now = Date.now();

  // 1. Check in-memory session cache
  const cached = activeSessions.get(token);
  if (cached) {
    if (cached.createdAt && (now - new Date(cached.createdAt).getTime() > SESSION_MAX_AGE_MS)) {
      activeSessions.delete(token);
      try {
        await supabase.from('staff_sessions').delete().eq('token', token);
      } catch (e) {
        // Ignore
      }
      return null;
    }
    return cached;
  }

  // 2. Check Supabase staff_sessions table
  try {
    const { data: session, error } = await supabase
      .from('staff_sessions')
      .select('token, user_id, email, name, role, created_at')
      .eq('token', token)
      .maybeSingle();

    if (error || !session) {
      return null;
    }

    // Enforce 7-day session expiration
    if (session.created_at && (now - new Date(session.created_at).getTime() > SESSION_MAX_AGE_MS)) {
      activeSessions.delete(token);
      await supabase.from('staff_sessions').delete().eq('token', token);
      return null;
    }

    // Verify user role and active status directly from staff_users
    const { data: user } = await supabase
      .from('staff_users')
      .select('id, email, name, role')
      .eq('id', session.user_id)
      .maybeSingle();

    if (!user) {
      // User was deleted; invalidate session
      activeSessions.delete(token);
      await supabase.from('staff_sessions').delete().eq('token', token);
      return null;
    }

    const finalRole = user.role || session.role;
    const normalizedRole = finalRole.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
    const verifiedUser = {
      id: session.user_id,
      email: user.email || session.email,
      name: user.name || session.name,
      role: normalizedRole,
      createdAt: session.created_at,
    };

    activeSessions.set(token, verifiedUser);
    return verifiedUser;
  } catch (err) {
    console.error('Session lookup error from Supabase:', err.message);
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
router.post('/login', loginLimiter, async (req, res) => {
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
      console.error('Supabase query error during login:', error.message);
      return res.status(500).json({ error: 'Database error during authentication' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password with bcryptjs (with transparent migration fallback)
    let isMatch = false;
    const isBcryptHash = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

    if (isBcryptHash) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (user.password === password);
      // Auto-migrate plaintext password to bcrypt hash on valid login
      if (isMatch) {
        try {
          const newHash = await bcrypt.hash(password, 10);
          await supabase.from('staff_users').update({ password: newHash }).eq('id', user.id);
        } catch (e) {
          // Non-blocking fallback
        }
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const normalizedRole = user.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
    const token = `blx_sess_${Math.random().toString(36).substring(2)}${Date.now()}`;
    const createdAt = new Date().toISOString();
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizedRole,
      createdAt,
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
        created_at: createdAt,
      });
    } catch (e) {
      console.warn('Could not persist session token to Supabase:', e.message);
    }

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
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
      console.error('Supabase error finding user for reset:', error.message);
      return res.status(500).json({ error: 'Database error searching for staff account' });
    }

    // Always respond with a generic success message even if account does not exist
    // to prevent email enumeration attacks
    if (!user) {
      return res.json({
        success: true,
        message: 'If this registered staff account exists, recovery instructions have been initiated. Please check your email or contact an administrator for your verification code.',
        email: cleanEmail,
        expiresInMinutes: 15,
      });
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
      console.error('Error creating password reset record in Supabase:', insertErr.message);
      return res.status(500).json({ error: 'Failed to record passcode reset request in database' });
    }

    // SECURITY: The recovery code is NEVER returned in the API response.
    // It is stored in the database with a 15-minute expiration and can only be used once.
    // Admins can also issue/reset staff passcodes directly via the portal.
    return res.json({
      success: true,
      message: 'If this registered staff account exists, a 15-minute recovery code has been recorded. Please check your email or contact an administrator for your verification code.',
      email: cleanEmail,
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error('Forgot passcode error:', error.message);
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

    // Look up active reset token in Supabase (must be unused and unexpired)
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

    // Hash the new passcode with bcryptjs (cost factor 10)
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    // Update staff user password in Supabase
    const { error: updateErr } = await supabase
      .from('staff_users')
      .update({ password: hashedPassword })
      .ilike('email', cleanEmail);

    if (updateErr) {
      console.error('Error updating staff user password:', updateErr.message);
      return res.status(500).json({ error: 'Failed to update passcode in database' });
    }

    // Mark reset code as used immediately (single-use enforcement)
    await supabase
      .from('password_resets')
      .update({ used: 1 })
      .eq('id', record.id);

    // Invalidate old active sessions for this user across database & cache
    await supabase
      .from('staff_sessions')
      .delete()
      .ilike('email', cleanEmail);

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
    console.error('Reset passcode error:', error.message);
    return res.status(500).json({ error: 'Server error updating passcode' });
  }
}

// POST /api/auth/forgot-passcode (with rate limiting)
router.post('/forgot-passcode', recoveryLimiter, handleForgotPasscode);

// POST /api/auth/reset-passcode (with rate limiting)
router.post('/reset-passcode', recoveryLimiter, handleResetPasscode);

export default router;
