"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
const getRedisConfig = () => {
    // Si REDIS_DISABLED est défini, désactiver Redis
    if (process.env.REDIS_DISABLED === 'true') {
        return null;
    }
    // Si REDIS_URL est défini, l'utiliser directement
    if (process.env.REDIS_URL) {
        return {
            url: process.env.REDIS_URL,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        };
    }
    // Si REDIS_ENABLED=true, utiliser les paramètres individuels
    if (process.env.REDIS_ENABLED === 'true') {
        return {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        };
    }
    // PAR DÉFAUT: Redis est DÉSACTIVÉ
    return null;
};
const redisConfig = getRedisConfig();
// Créer l'instance Redis seulement si configuré
exports.redis = redisConfig ? new ioredis_1.default(redisConfig) : null;
// Gestion des événements - seulement si Redis est configuré
if (exports.redis) {
    exports.redis.on('connect', () => {
        logger_1.default.info('✅ Redis connected successfully');
    });
    exports.redis.on('ready', () => {
        logger_1.default.info('✅ Redis ready to accept commands');
    });
    exports.redis.on('error', (err) => {
        logger_1.default.error('❌ Redis error:', err);
    });
    exports.redis.on('close', () => {
        logger_1.default.warn('⚠️  Redis connection closed');
    });
    exports.redis.on('reconnecting', () => {
        logger_1.default.info('🔄 Redis reconnecting...');
    });
}
else {
    logger_1.default.info('⚠️  Redis disabled (not configured)');
}
// Ne pas se connecter au démarrage - laisser Redis se connecter automatiquement quand nécessaire
// Avec lazyConnect: true, Redis se connectera seulement lors de la première commande
// Cela évite de bloquer le démarrage du serveur
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map