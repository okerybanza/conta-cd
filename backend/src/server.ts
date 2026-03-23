import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import env from './config/env';
import logger from './utils/logger';
import pdfService from './services/pdf.service';
import { closeQueues } from './services/queue.service';
import schedulerService from './services/scheduler.service';
import cacheWarmingService from './services/cache/cacheWarming.service';

const PORT = parseInt(String(env.PORT)) || 3001;

// Gestion arrêt propre
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully');
  try {
    schedulerService.stop();
    await pdfService.closeBrowser();
    await closeQueues();
    await disconnectDatabase();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Gestion erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Démarrer serveur
async function startServer() {
  try {
    // Connecter base de données
    await connectDatabase();

    // Démarrer les schedulers (temporairement désactivé pour debug)
    // schedulerService.start();

    // Démarrer serveur
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
      logger.info(`⏰ Schedulers active`);

      // SPRINT 3 - TASK 3.2: Warm caches after startup
      // Use setImmediate to not block the main startup flow
      setImmediate(() => {
        cacheWarmingService.warmAllActiveCompanies();
      });
    });

    // Gestion erreurs serveur
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

    server.on('clientError', (error: any, socket: any) => {
      logger.error('Client error:', error);
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();

