"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
// Configuration du client Prisma
// Note: Pour le logging des requêtes en développement, on utilise une configuration
// qui préserve le typage tout en permettant le logging via $on
// SPRINT 5 - TASK 5.1 (PERF-001): Connection Pooling & DB Optimization
// Advanced Prisma Client with Extensions for scale and resiliency
// Initialiser le client de base
const prismaBase = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? [
            { level: 'query', emit: 'event' },
            'error',
            'warn',
        ]
        : ['error', 'warn'],
});
// SPRINT 5: Support pour les réplicas de lecture (Read Replicas)
// Si DATABASE_READ_URL est fourni, on crée un client séparé pour les lectures
const readUrl = process.env.DATABASE_READ_URL;
const prismaReadBase = readUrl
    ? new client_1.PrismaClient({ datasourceUrl: readUrl })
    : prismaBase;
/**
 * Extension pour la Performance & la Résilience
 * Ajoute des timeouts et du logging de performance
 */
const applyExtensions = (client) => {
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ operation, model, args, query }) {
                    // ACCT-011: Audit log is append-only — no UPDATE/DELETE from application code
                    if (model === 'audit_logs' && (operation === 'update' || operation === 'delete')) {
                        throw new Error('ACCT-011: audit_logs is append-only. Updates and deletes are prohibited. Use AuditService.createLog only.');
                    }
                    const start = Date.now();
                    // Timeout par défaut: 5s. Plus long pour les rapports.
                    const isHeavyReport = ['accountingReports', 'financialStatements'].includes(model);
                    const timeoutSeconds = isHeavyReport ? 30 : 5;
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Prisma timeout: ${model}.${operation} took > ${timeoutSeconds}s`)), timeoutSeconds * 1000));
                    try {
                        const result = await Promise.race([
                            query(args),
                            timeoutPromise
                        ]);
                        const duration = Date.now() - start;
                        if (duration > 1000) {
                            logger_1.default.warn(`Slow Query: ${model}.${operation} took ${duration}ms`, {
                                model, operation, duration
                            });
                        }
                        return result;
                    }
                    catch (error) {
                        throw error;
                    }
                },
            },
        },
    });
};
const prismaExtended = applyExtensions(prismaBase);
const prismaReadExtended = readUrl ? applyExtensions(prismaReadBase) : prismaExtended;
/**
 * SPRINT 5: Proxy de routage Lecture/Écriture
 * Route automatiquement les 'find*' et 'count' vers le réplica
 */
const readOperations = ['findUnique', 'findMany', 'findFirst', 'count', 'aggregate', 'groupBy'];
const prisma = new Proxy(prismaExtended, {
    get(target, prop) {
        // Si on accède à un modèle (ex: prisma.users)
        if (typeof prop === 'string' && prop in target) {
            const model = target[prop];
            // On retourne un proxy du modèle pour intercepter les méthodes
            return new Proxy(model, {
                get(modelTarget, method) {
                    const originalMethod = modelTarget[method];
                    if (typeof originalMethod === 'function') {
                        return (...args) => {
                            // Routage vers le réplica si c'est une opération de lecture
                            const useRead = readUrl && readOperations.includes(method);
                            const clientToUse = useRead ? prismaReadExtended[prop] : modelTarget;
                            if (useRead) {
                                logger_1.default.debug(`Routing read operation to replica: ${prop}.${method}`);
                            }
                            return clientToUse[method](...args);
                        };
                    }
                    return originalMethod;
                }
            });
        }
        return target[prop];
    }
});
// Log des requêtes en développement (via le client de base)
if (process.env.NODE_ENV === 'development') {
    prismaBase.$on('query', (e) => {
        logger_1.default.debug('Query', { query: e.query, params: e.params, duration: `${e.duration}ms` });
    });
}
// Test connexion
async function connectDatabase() {
    try {
        await prismaBase.$connect();
        if (readUrl) {
            await prismaReadBase.$connect();
            logger_1.default.info('✅ Read Replica connected');
        }
        logger_1.default.info('✅ Database connected with Sprint 5 optimizations (R/W Splitting & Timeouts)');
        return true;
    }
    catch (error) {
        logger_1.default.error('❌ Database connection failed', error);
        throw error;
    }
}
// Déconnexion propre
async function disconnectDatabase() {
    await prismaBase.$disconnect();
    if (readUrl)
        await prismaReadBase.$disconnect();
    logger_1.default.info('Database disconnected');
}
exports.default = prisma;
//# sourceMappingURL=database.js.map