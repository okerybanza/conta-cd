import redis from '../config/redis';
import logger from '../utils/logger';

export class CacheService {
  /**
   * Obtenir une valeur du cache
   * @param key Clé du cache
   * @returns Valeur désérialisée ou null si non trouvée
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Vérifier si Redis est disponible (non bloquant)
      if (redis.status === 'end' || redis.status === 'close') {
        return null; // Redis non disponible, continuer sans cache
      }
      const value = await redis.get(key);
      if (value) {
        // SPRINT 3 - TASK 3.2: Record hit
        const { default: cacheMonitoring } = await import('./cache/cacheMonitoring.service');
        cacheMonitoring.recordHit();

        return JSON.parse(value) as T;
      }

      // SPRINT 3 - TASK 3.2: Record miss
      const { default: cacheMonitoring } = await import('./cache/cacheMonitoring.service');
      cacheMonitoring.recordMiss();

      return null;
    } catch (error: any) {
      // Ignorer les erreurs Redis silencieusement - continuer sans cache
      return null;
    }
  }

  /**
   * Définir une valeur dans le cache
   * @param key Clé du cache
   * @param value Valeur à mettre en cache (sera sérialisée en JSON)
   * @param ttlSeconds Durée de vie en secondes (optionnel)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      // Vérifier si Redis est disponible (non bloquant)
      if (redis.status === 'end' || redis.status === 'close') {
        return; // Redis non disponible, ignorer silencieusement
      }
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error: any) {
      // Ignorer les erreurs Redis silencieusement
    }
  }

  /**
   * Supprimer une clé du cache
   * @param key Clé à supprimer
   */
  async delete(key: string): Promise<void> {
    try {
      if (redis.status === 'end' || redis.status === 'close') {
        return; // Redis non disponible
      }
      await redis.del(key);
    } catch (error: any) {
      // Ignorer les erreurs silencieusement
    }
  }

  /**
   * Supprimer toutes les clés correspondant à un pattern (Utilise SCAN pour la performance)
   * @param pattern Pattern à rechercher (ex: "dashboard:stats:company-*")
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (redis.status === 'end' || redis.status === 'close') {
        return;
      }

      let cursor = '0';
      let totalDeleted = 0;

      do {
        // SCAN renvoie [nextCursor, keys[]]
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      if (totalDeleted > 0) {
        logger.info(`Cache invalidated: ${totalDeleted} keys matching pattern ${pattern}`);
      }
    } catch (error: any) {
      logger.error(`Error invalidating cache pattern ${pattern}`, error);
    }
  }

  /**
   * Invalider le cache d'une entreprise
   * Supprime toutes les clés contenant l'ID de l'entreprise
   * @param companyId ID de l'entreprise
   */
  async invalidateCompany(companyId: string): Promise<void> {
    const patterns = [
      `dashboard:stats:${companyId}:*`,
      `subscription:active:${companyId}`,
      `quota:summary:${companyId}`,
      `package:features:${companyId}`,
      `package:limits:${companyId}`,
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  /**
   * Vérifier si une clé existe dans le cache
   * @param key Clé à vérifier
   * @returns true si la clé existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (redis.status === 'end' || redis.status === 'close') {
        return false;
      }
      const result = await redis.exists(key);
      return result === 1;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Obtenir le TTL (Time To Live) d'une clé
   * @param key Clé à vérifier
   * @returns TTL en secondes, -1 si pas de TTL, -2 si la clé n'existe pas
   */
  async getTTL(key: string): Promise<number> {
    try {
      if (redis.status === 'end' || redis.status === 'close') {
        return -2;
      }
      return await redis.ttl(key);
    } catch (error: any) {
      return -2;
    }
  }

  /**
   * Vider complètement le cache (à utiliser avec précaution)
   */
  async flushAll(): Promise<void> {
    try {
      if (redis.status === 'end' || redis.status === 'close') {
        return;
      }
      await redis.flushdb();
      logger.warn('⚠️  Cache flushed (all keys deleted)');
    } catch (error: any) {
      // Ignorer les erreurs
    }
  }
}

export default new CacheService();

