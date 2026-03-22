"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
class CacheService {
    /**
     * Obtenir une valeur du cache
     * @param key Clé du cache
     * @returns Valeur désérialisée ou null si non trouvée
     */
    async get(key) {
        try {
            // Vérifier si Redis est disponible (non bloquant)
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return null; // Redis non disponible, continuer sans cache
            }
            const value = await redis_1.default.get(key);
            if (value) {
                // SPRINT 3 - TASK 3.2: Record hit
                const { default: cacheMonitoring } = await Promise.resolve().then(() => __importStar(require('./cache/cacheMonitoring.service')));
                cacheMonitoring.recordHit();
                return JSON.parse(value);
            }
            // SPRINT 3 - TASK 3.2: Record miss
            const { default: cacheMonitoring } = await Promise.resolve().then(() => __importStar(require('./cache/cacheMonitoring.service')));
            cacheMonitoring.recordMiss();
            return null;
        }
        catch (error) {
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
    async set(key, value, ttlSeconds) {
        try {
            // Vérifier si Redis est disponible (non bloquant)
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return; // Redis non disponible, ignorer silencieusement
            }
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await redis_1.default.setex(key, ttlSeconds, serialized);
            }
            else {
                await redis_1.default.set(key, serialized);
            }
        }
        catch (error) {
            // Ignorer les erreurs Redis silencieusement
        }
    }
    /**
     * Supprimer une clé du cache
     * @param key Clé à supprimer
     */
    async delete(key) {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return; // Redis non disponible
            }
            await redis_1.default.del(key);
        }
        catch (error) {
            // Ignorer les erreurs silencieusement
        }
    }
    /**
     * Supprimer toutes les clés correspondant à un pattern (Utilise SCAN pour la performance)
     * @param pattern Pattern à rechercher (ex: "dashboard:stats:company-*")
     */
    async deletePattern(pattern) {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return;
            }
            let cursor = '0';
            let totalDeleted = 0;
            do {
                // SCAN renvoie [nextCursor, keys[]]
                const [nextCursor, keys] = await redis_1.default.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;
                if (keys.length > 0) {
                    await redis_1.default.del(...keys);
                    totalDeleted += keys.length;
                }
            } while (cursor !== '0');
            if (totalDeleted > 0) {
                logger_1.default.info(`Cache invalidated: ${totalDeleted} keys matching pattern ${pattern}`);
            }
        }
        catch (error) {
            logger_1.default.error(`Error invalidating cache pattern ${pattern}`, error);
        }
    }
    /**
     * Invalider le cache d'une entreprise
     * Supprime toutes les clés contenant l'ID de l'entreprise
     * @param companyId ID de l'entreprise
     */
    async invalidateCompany(companyId) {
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
    async exists(key) {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return false;
            }
            const result = await redis_1.default.exists(key);
            return result === 1;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Obtenir le TTL (Time To Live) d'une clé
     * @param key Clé à vérifier
     * @returns TTL en secondes, -1 si pas de TTL, -2 si la clé n'existe pas
     */
    async getTTL(key) {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return -2;
            }
            return await redis_1.default.ttl(key);
        }
        catch (error) {
            return -2;
        }
    }
    /**
     * Vider complètement le cache (à utiliser avec précaution)
     */
    async flushAll() {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return;
            }
            await redis_1.default.flushdb();
            logger_1.default.warn('⚠️  Cache flushed (all keys deleted)');
        }
        catch (error) {
            // Ignorer les erreurs
        }
    }
}
exports.CacheService = CacheService;
exports.default = new CacheService();
//# sourceMappingURL=cache.service.js.map