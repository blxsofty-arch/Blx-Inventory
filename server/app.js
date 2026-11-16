import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './auth.js';
import propertiesRouter from './properties.js';
import usersRouter from './users.js';
import storageRouter from './storage.js';

const app = express();

// Trust reverse proxy for accurate client IP identification on Vercel / serverless
app.set('trust proxy', 1);

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite SPA delivers client scripts and styles
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

// Parse and validate ALLOWED_ORIGINS
const rawOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

// In production, reject any wildcard (*) origins and require explicit configuration
const allowedOrigins = rawOrigins.filter((origin) => {
  if (isProduction && origin === '*') {
    console.error(
      '⚠️ [Security Warning] Wildcard (*) in ALLOWED_ORIGINS is strictly prohibited in production and has been rejected.'
    );
    return false;
  }
  return true;
});

if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    '⚠️ [Security Alert] ALLOWED_ORIGINS is not configured in production. Cross-origin requests will be rejected by policy.'
  );
}

// Preserve legitimate same-origin browser requests.
// Browsers include an Origin header on same-origin non-GET requests; the SPA and
// /api share the same host in production, so treat it as trusted without echoing
// a cross-origin ACAO header. Host cannot be spoofed by browser JavaScript.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) {
        delete req.headers.origin;
      }
    } catch {
      // Malformed Origin: leave it in place and let the CORS policy reject it.
    }
  }

  next();
});

// Hardened CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow legitimate requests with no origin header
      // (e.g. same-origin browser requests, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Development / Test environment: Allow localhost / 127.0.0.1 on any port, plus any configured origins
      if (!isProduction) {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (isLocalhost || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked: Origin "${origin}" not authorized in development.`));
      }

      // 3. Production environment: Strictly require origin to be explicitly listed in allowedOrigins (no wildcards)
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS blocked: Origin "${origin}" not authorized by production ALLOWED_ORIGINS policy.`)
      );
    },
    credentials: true,
  })
);

// Body parsing with safe limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger for debugging (never logs headers, tokens, or body secrets)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/users', usersRouter);
app.use('/api/storage', storageRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BLX Realty Inventory API',
    database: 'Supabase PostgreSQL',
    storage: 'Supabase Storage (property-images, property-documents, internal-records)',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler (handles CORS errors and unhandled exceptions gracefully)
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('CORS blocked:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
