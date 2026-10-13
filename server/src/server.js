const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/database');

const server = app.listen(env.port, () => {
  logger.info(`VMS API server running on port ${env.port} [${env.nodeEnv}]`);
  logger.info(`Swagger docs available at ${env.apiBaseUrl}/api-docs`);
});

// Handle port-in-use errors with a clear, actionable message instead of
// crashing with an opaque stack trace and sending nodemon into a restart loop.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(
      `[FATAL] Port ${env.port} is already in use. ` +
      `Another server instance may still be running. ` +
      `Run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${env.port}).OwningProcess -Force`
    );
    process.exit(1);
  } else {
    logger.error(`[FATAL] Server error: ${err.message}`);
    process.exit(1);
  }
});

// --- Graceful shutdown -----------------------------------------------------
async function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('HTTP server closed and database connection released.');
    process.exit(0);
  });

  // Force-exit if something hangs longer than 10s.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch anything that slips past asyncHandler / error middleware.
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack}`);
  process.exit(1);
});
