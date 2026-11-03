import express from 'express';
import cors from 'cors';
import authRouter from './auth.js';
import propertiesRouter from './properties.js';
import usersRouter from './users.js';
import storageRouter from './storage.js';

const app = express();

// Middleware
app.use(cors());
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

export default app;
