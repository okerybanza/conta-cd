"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = __importDefault(require("./config/env"));
const logger_1 = __importDefault(require("./utils/logger"));
const pdf_service_1 = __importDefault(require("./services/pdf.service"));
const queue_service_1 = require("./services/queue.service");
const scheduler_service_1 = __importDefault(require("./services/scheduler.service"));
const cacheWarming_service_1 = __importDefault(require("./services/cache/cacheWarming.service"));
const PORT = parseInt(String(env_1.default.PORT)) || 3001;
// Gestion arrêt propre
const gracefulShutdown = async () => {
    logger_1.default.info('Shutting down gracefully');
    try {
        scheduler_service_1.default.stop();
        await pdf_service_1.default.closeBrowser();
        await (0, queue_service_1.closeQueues)();
        await (0, database_1.disconnectDatabase)();
        logger_1.default.info('Shutdown complete');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Error during shutdown', error);
        process.exit(1);
    }
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Gestion erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection', { reason, promise });
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception', error);
    process.exit(1);
});
// Démarrer serveur
async function startServer() {
    try {
        // Connecter base de données
        await (0, database_1.connectDatabase)();
        // Démarrer les schedulers (factures récurrentes, rappels paiement, expirations trial)
        scheduler_service_1.default.start();
        logger_1.default.info('✅ Schedulers started');
        // Démarrer serveur
        const server = app_1.default.listen(PORT, '0.0.0.0', () => {
            logger_1.default.info(`🚀 Server running on port ${PORT}`);
            logger_1.default.info(`📝 Environment: ${env_1.default.NODE_ENV}`);
            logger_1.default.info(`🌐 Frontend URL: ${env_1.default.FRONTEND_URL}`);
            logger_1.default.info(`⏰ Schedulers: ACTIVE`);
            // SPRINT 3 - TASK 3.2: Warm caches after startup
            // Use setImmediate to not block the main startup flow
            setImmediate(() => {
                cacheWarming_service_1.default.warmAllActiveCompanies();
            });
        });
        // Gestion erreurs serveur
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger_1.default.error(`Port ${PORT} is already in use`);
            }
            else {
                logger_1.default.error('Server error:', error);
            }
            process.exit(1);
        });
        server.on('clientError', (error, socket) => {
            logger_1.default.error('Client error:', error);
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map