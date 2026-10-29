import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

const startServer = async () => {
  const app = createApp();

  // Attempt DB connection in background so server can immediately respond to health/status probes
  connectDatabase().catch((err) => {
    console.error('[Database] Unexpected connection error caught at startup:', err);
  });

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 CareerBridge Backend API Server`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🩺 Health: http://localhost:${config.port}/api/health`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`====================================================`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('[Server] Fatal startup error:', error);
  process.exit(1);
});
