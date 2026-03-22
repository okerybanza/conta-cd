"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheMonitoringService = void 0;
const redis_1 = __importDefault(require("../../config/redis"));
const logger_1 = __importDefault(require("../../utils/logger"));
class CacheMonitoringService {
    hits = 0;
    misses = 0;
    lastReset = new Date();
    /**
     * Record a cache hit
     */
    recordHit() {
        this.hits++;
    }
    /**
     * Record a cache miss
     */
    recordMiss() {
        this.misses++;
    }
    /**
     * Get cache hit rate percentage
     */
    getHitRate() {
        const total = this.hits + this.misses;
        return total > 0 ? (this.hits / total) * 100 : 0;
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        const total = this.hits + this.misses;
        const hitRate = this.getHitRate();
        const totalKeys = await this.getTotalKeys();
        const memoryUsage = await this.getMemoryUsage();
        return {
            hits: this.hits,
            misses: this.misses,
            total,
            hitRate: Math.round(hitRate * 100) / 100,
            totalKeys,
            memoryUsage,
            lastReset: this.lastReset,
            uptime: Date.now() - this.lastReset.getTime(),
        };
    }
    /**
     * Get total number of keys in Redis
     */
    async getTotalKeys() {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return 0;
            }
            const keys = await redis_1.default.keys('*');
            return keys.length;
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Get Redis memory usage
     */
    async getMemoryUsage() {
        try {
            if (redis_1.default.status === 'end' || redis_1.default.status === 'close') {
                return 'N/A';
            }
            const info = await redis_1.default.info('memory');
            const match = info.match(/used_memory_human:(.+)/);
            return match ? match[1].trim() : 'N/A';
        }
        catch (error) {
            return 'N/A';
        }
    }
    /**
     * Reset statistics
     */
    reset() {
        this.hits = 0;
        this.misses = 0;
        this.lastReset = new Date();
        logger_1.default.info('Cache monitoring statistics reset');
    }
    /**
     * Log current statistics
     */
    async logStats() {
        const stats = await this.getStats();
        logger_1.default.info('Cache Statistics', stats);
    }
}
exports.CacheMonitoringService = CacheMonitoringService;
exports.default = new CacheMonitoringService();
//# sourceMappingURL=cacheMonitoring.service.js.map