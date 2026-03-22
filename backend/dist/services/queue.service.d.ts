import { Queue } from 'bullmq';
declare let emailQueue: Queue | null;
declare let whatsappQueue: Queue | null;
export { emailQueue, whatsappQueue };
export declare const queueEmail: (companyId: string, to: string, subject: string, template: string, data: Record<string, any>, attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
}>, from?: string) => Promise<import("bullmq").Job<any, any, string> | null>;
export declare const queueWhatsApp: (data: {
    companyId: string;
    to: string;
    message: string;
    relatedType: string;
    relatedId: string;
    notificationId?: string;
}) => Promise<import("bullmq").Job<any, any, string> | null>;
export declare const closeQueues: () => Promise<void>;
//# sourceMappingURL=queue.service.d.ts.map