export declare class CacheMonitoringService {
    private hits;
    private misses;
    private lastReset;
    /**
     * Record a cache hit
     */
    recordHit(): void;
    /**
     * Record a cache miss
     */
    recordMiss(): void;
    /**
     * Get cache hit rate percentage
     */
    getHitRate(): number;
    /**
     * Get cache statistics
     */
    getStats(): Promise<{
        hits: number;
        misses: number;
        total: number;
        hitRate: number;
        totalKeys: number;
        memoryUsage: string;
        lastReset: Date;
        uptime: number;
    }>;
    /**
     * Get total number of keys in Redis
     */
    private getTotalKeys;
    /**
     * Get Redis memory usage
     */
    private getMemoryUsage;
    /**
     * Reset statistics
     */
    reset(): void;
    /**
     * Log current statistics
     */
    logStats(): Promise<void>;
}
declare const _default: CacheMonitoringService;
export default _default;
//# sourceMappingURL=cacheMonitoring.service.d.ts.map