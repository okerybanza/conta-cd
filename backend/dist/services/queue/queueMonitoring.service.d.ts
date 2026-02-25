export interface QueueMetrics {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
}
export declare class QueueMonitoringService {
    /**
     * Récupère les métriques globales des files d'attente
     */
    getGlobalMetrics(): Promise<{
        timestamp: string;
        queues: {
            email: QueueMetrics | null;
            whatsapp: QueueMetrics | null;
        };
        healthy: boolean;
    }>;
    private getQueueMetrics;
    /**
     * Liste les jobs échoués récemment pour diagnostic
     */
    getFailedJobs(queueName: 'email' | 'whatsapp', limit?: number): Promise<{
        id: any;
        name: any;
        data: any;
        failedReason: any;
        finishedOn: string | null;
        attempts: any;
    }[]>;
    /**
     * Relance un job échoué
     */
    retryJob(queueName: 'email' | 'whatsapp', jobId: string): Promise<boolean>;
}
declare const _default: QueueMonitoringService;
export default _default;
//# sourceMappingURL=queueMonitoring.service.d.ts.map