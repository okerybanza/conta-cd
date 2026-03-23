import Redis from 'ioredis';
import logger from '../utils/logger';

const getRedisConfig = () => {
  // Si REDIS_DISABLED est défini, désactiver Redis
  if (process.env.REDIS_DISABLED === 'true') {
    return null;
  }

  // Si REDIS_URL est défini, l'utiliser directement
  if (process.env.REDIS_URL) {
    return { 
      url: process.env.REDIS_URL,
      retryStrategy: (times: number) => {
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
      retryStrategy: (times: number) => {
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
export const redis = redisConfig ? new Redis(redisConfig) : null as any;

// Gestion des événements - seulement si Redis est configuré
if (redis) {
  redis.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  redis.on('ready', () => {
    logger.info('✅ Redis ready to accept commands');
  });

  redis.on('error', (err: Error) => {
    logger.error('❌ Redis error:', err);
  });

  redis.on('close', () => {
    logger.warn('⚠️  Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('🔄 Redis reconnecting...');
  });
} else {
  logger.info('⚠️  Redis disabled (not configured)');
}

// Ne pas se connecter au démarrage - laisser Redis se connecter automatiquement quand nécessaire
// Avec lazyConnect: true, Redis se connectera seulement lors de la première commande
// Cela évite de bloquer le démarrage du serveur

export default redis;

