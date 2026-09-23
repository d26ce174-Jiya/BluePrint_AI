import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { testConnection } from './db/connection.js';
import authRoutes from './routes/auth.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import sessionRoutes from './routes/session.routes.js';
import exportRoutes from './routes/export.routes.js';
import llmRoutes from './routes/llm.routes.js';
import aiRoutes from './routes/ai.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { compileAiClient } from './services/ai/compileAiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG REQUEST] [${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health Check
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  const compileAiStatus = await compileAiClient.isHealthy();
  res.json({
    status: 'online',
    project: 'Compile / BlueprintAI',
    database: dbStatus ? 'connected (MySQL)' : 'disconnected',
    compileAiModelServer: compileAiStatus ? 'active (http://127.0.0.1:8000)' : 'starting/offline',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);

// Global Error Handler
app.use(errorHandler);

// Start HTTP Server
const PORT = env.PORT;
app.listen(PORT, async () => {
  console.log(`\n==============================================`);
  console.log(`🚀 Compile API Server running on port ${PORT}`);
  console.log(`📡 Local endpoint: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Target DB: MySQL on ${env.DB_HOST}:${env.DB_PORT} (Database: ${env.DB_NAME})`);
  console.log(`==============================================\n`);

  // Verify connection to MySQL
  await testConnection();

  // Check & launch Python Compile AI FastAPI model server on port 8000 if needed
  const isHealthy = await compileAiClient.isHealthy();
  if (isHealthy) {
    console.log(`✅ Compile AI Python model server is active on http://127.0.0.1:8000`);
  } else {
    console.log(`⚡ Launching Compile AI Python model server on http://127.0.0.1:8000...`);
    const pythonApiDir = path.resolve(__dirname, '../../Compile AI/compile-ai/api');
    const pythonProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: pythonApiDir,
      shell: true,
      stdio: 'inherit',
    });

    pythonProcess.on('error', (err) => {
      console.error('❌ Failed to start Compile AI Python server process:', err.message);
    });
  }

  let secondCounter = 0;
  setInterval(() => {
    secondCounter++;
    const now = new Date().toISOString().replace('T', ' ').substring(11, 19);
    const heapMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    console.log(`[DEBUG 1s] [${now}] [Tick #${secondCounter}] Server :${PORT} Active | Heap: ${heapMb}MB | DB: ${env.DB_NAME}`);
  }, 1000);
});
