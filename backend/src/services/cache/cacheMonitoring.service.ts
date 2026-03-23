import redis from '../../config/redis';
import logger from '../../utils/logger';

export class CacheMonitoringService {
    private hits = 0;
    private misses = 0;
    private lastReset = new Date();

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
    getHitRate(): number {
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
    private async getTotalKeys(): Promise<number> {
        try {
            if (redis.status === 'end' || redis.status === 'close') {
                return 0;
            }
            const keys = await redis.keys('*');
            return keys.length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get Redis memory usage
     */
    private async getMemoryUsage(): Promise<string> {
        try {
            if (redis.status === 'end' || redis.status === 'close') {
                return 'N/A';
            }
            const info = await redis.info('memory');
            const match = info.match(/used_memory_human:(.+)/);
            return match ? match[1].trim() : 'N/A';
        } catch (error) {
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
        logger.info('Cache monitoring statistics reset');
    }

    /**
     * Log current statistics
     */
    async logStats() {
        const stats = await this.getStats();
        logger.info('Cache Statistics', stats);
    }
}

export default new CacheMonitoringService();
