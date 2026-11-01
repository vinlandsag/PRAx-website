import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import tasksRoutes from './routes/tasks.js';
import submissionsRoutes from './routes/submissions.js';
import membersRoutes from './routes/members.js';
import chatRoutes from './routes/chat.js';
import auditRoutes from './routes/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seeds (preserves existing data safely with CREATE TABLE IF NOT EXISTS)
try {
  initDatabase();
} catch (dbErr) {
  console.error('❌ Failed to initialize database schema/seeds:', dbErr.message);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Configurable CORS Origin
const corsOrigin = process.env.CORS_ORIGIN
  ? (process.env.CORS_ORIGIN.includes(',')
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : process.env.CORS_ORIGIN)
  : true;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Request logging for API diagnostics (scrubbing sensitive headers and body keys)
app.use('/api', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    // Verify DB connectivity
    db.prepare('SELECT 1').get();
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (dbErr) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      error: dbErr.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/admin/members', membersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin/audit-logs', auditRoutes);

// Deny-by-default: Any unhandled /api endpoint returns standard 404 JSON error
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}. Endpoint not found or unimplemented.` });
});

// Serve built frontend assets in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// For SPA routing in production
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // In dev mode, frontend runs via Vite dev server
      res.status(200).send('Praxora Backend API is running. Vite frontend active on port 5173.');
    }
  });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDev ? { stack: err.stack } : {}),
  });
});

// Start listening if run directly as the main module
const currentFilePath = fileURLToPath(import.meta.url);
const entryFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isMainModule = Boolean(
  entryFilePath && (
    entryFilePath === currentFilePath ||
    entryFilePath === path.dirname(currentFilePath) ||
    entryFilePath.endsWith('server\\index.js') ||
    entryFilePath.endsWith('server/index.js') ||
    entryFilePath.endsWith('server')
  )
);

if (isMainModule && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Praxora Admin Backend API server listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });
}
