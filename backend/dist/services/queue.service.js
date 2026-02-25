"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeQueues = exports.queueWhatsApp = exports.queueEmail = exports.whatsappQueue = exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const crypto_1 = require("crypto");
const logger_1 = __importDefault(require("../utils/logger"));
const email_service_1 = __importDefault(require("./email.service"));
// SMS service désactivé - ne garder que Email et WhatsApp
const whatsapp_service_1 = __importDefault(require("./whatsapp/whatsapp.service"));
const database_1 = __importDefault(require("../config/database"));
// Configuration Redis - DÉSACTIVÉ PAR DÉFAUT
// Pour activer Redis, définir REDIS_ENABLED=true ou REDIS_URL
const getRedisConnection = () => {
    // Redis doit être explicitement activé
    // Option 1: REDIS_ENABLED=true
    // Option 2: REDIS_URL défini
    // Option 3: REDIS_DISABLED=false ET (REDIS_HOST ou REDIS_PORT défini)
    if (process.env.REDIS_DISABLED === 'true') {
        return null;
    }
    // Si REDIS_URL est défini, l'utiliser directement
    if (process.env.REDIS_URL) {
        return { url: process.env.REDIS_URL };
    }
    // Si REDIS_ENABLED=true, utiliser les paramètres individuels
    if (process.env.REDIS_ENABLED === 'true') {
        return {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: null,
        };
    }
    // Par défaut, Redis est DÉSACTIVÉ
    return null;
};
const redisConnection = getRedisConnection();
let redisAvailable = redisConnection !== null;
// Queues - créées seulement si Redis est disponible, avec gestion d'erreur
let emailQueue = null;
exports.emailQueue = emailQueue;
let whatsappQueue = null; // SPRINT 5 - TASK 5.2
exports.whatsappQueue = whatsappQueue;
if (redisAvailable && redisConnection) {
    try {
        const defaultOptions = {
            attempts: 5, // Augmenté pour plus de résilience
            backoff: {
                type: 'exponential',
                delay: 5000, // Attendre 5s avant premier retry
            },
            removeOnComplete: { age: 24 * 3600, count: 1000 },
            removeOnFail: { age: 7 * 24 * 3600 },
        };
        exports.emailQueue = emailQueue = new bullmq_1.Queue('email', {
            connection: redisConnection,
            defaultJobOptions: defaultOptions,
        });
        exports.whatsappQueue = whatsappQueue = new bullmq_1.Queue('whatsapp', {
            connection: redisConnection,
            defaultJobOptions: defaultOptions,
        });
    }
    catch (error) {
        logger_1.default.warn('⚠️  Failed to create queues, Redis may not be available', error);
        redisAvailable = false;
        exports.emailQueue = emailQueue = null;
        exports.whatsappQueue = whatsappQueue = null;
    }
}
// Workers
const emailWorker = (redisAvailable && emailQueue) ? new bullmq_1.Worker('email', async (job) => {
    const { to, subject, template, data, attachments, from } = job.data;
    // Idempotency check: Don't resend if already recorded as successful
    const existing = await database_1.default.notifications.findFirst({
        where: {
            company_id: data.companyId,
            type: 'email',
            title: subject,
            message: { contains: to },
            created_at: { gte: new Date(Date.now() - 24 * 3600 * 1000) } // Last 24h
        }
    });
    if (existing) {
        logger_1.default.info('Email already sent, skipping (idempotency)', { jobId: job.id, to });
        return { success: true, skipped: true };
    }
    try {
        const success = await email_service_1.default.sendEmail({ to, subject, template, data, from, attachments });
        if (success) {
            await database_1.default.notifications.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    company_id: data.companyId,
                    type: 'email',
                    title: subject,
                    message: `Email envoyé à ${to}`,
                    updated_at: new Date(),
                    data,
                },
            });
        }
        return { success };
    }
    catch (error) {
        logger_1.default.error('Email job failed', { jobId: job.id, error: error.message });
        throw error;
    }
}, { connection: redisConnection, concurrency: 5 }) : null;
// SPRINT 5 - TASK 5.4: WhatsApp Worker with Idempotency
const whatsappWorker = (redisAvailable && whatsappQueue) ? new bullmq_1.Worker('whatsapp', async (job) => {
    const { to, message, companyId, relatedType, relatedId, notificationId } = job.data;
    // Check if already delivered
    if (notificationId) {
        const existing = await database_1.default.notifications.findUnique({ where: { id: notificationId } });
        if (existing?.data && existing.data.status === 'delivered') {
            logger_1.default.info('WhatsApp already delivered, skipping (idempotency)', { jobId: job.id, to });
            return { success: true, skipped: true };
        }
    }
    try {
        const result = await whatsapp_service_1.default.sendText({ to, message });
        if (result.ok) {
            if (notificationId) {
                await database_1.default.notifications.update({
                    where: { id: notificationId },
                    data: {
                        message,
                        data: {
                            relatedType,
                            relatedId,
                            recipient: to,
                            status: 'delivered',
                            sentAt: new Date().toISOString(),
                            providerMessageId: result.providerMessageId,
                        },
                    },
                });
            }
            return { success: true, providerMessageId: result.providerMessageId };
        }
        else {
            throw new Error(result.error || 'WhatsApp provider error');
        }
    }
    catch (error) {
        logger_1.default.error('WhatsApp job failed', { jobId: job.id, to, error: error.message });
        throw error;
    }
}, { connection: redisConnection, concurrency: 2 }) : null;
// Event listeners pour monitoring
if (redisAvailable && emailQueue && emailWorker) {
    emailWorker.on('failed', (job, err) => logger_1.default.error('Email job failed', { jobId: job?.id, error: err.message }));
}
if (redisAvailable && whatsappQueue && whatsappWorker) {
    whatsappWorker.on('failed', (job, err) => logger_1.default.error('WhatsApp job failed', { jobId: job?.id, error: err.message }));
}
// Fonctions utilitaires
const queueEmail = async (companyId, to, subject, template, data, attachments, from) => {
    if (!redisAvailable || !emailQueue)
        return null;
    return emailQueue.add('send-email', { to, subject, template, data: { ...data, companyId }, from, attachments });
};
exports.queueEmail = queueEmail;
const queueWhatsApp = async (data) => {
    if (!redisAvailable || !whatsappQueue) {
        logger_1.default.warn('⚠️  Redis not available, WhatsApp queuing disabled');
        return null;
    }
    return whatsappQueue.add('send-whatsapp', data);
};
exports.queueWhatsApp = queueWhatsApp;
// Fermer les queues proprement
const closeQueues = async () => {
    if (redisAvailable) {
        if (emailWorker)
            await emailWorker.close();
        if (emailQueue)
            await emailQueue.close();
        if (whatsappWorker)
            await whatsappWorker.close();
        if (whatsappQueue)
            await whatsappQueue.close();
        logger_1.default.info('Queues closed');
    }
};
exports.closeQueues = closeQueues;
if (redisAvailable) {
    logger_1.default.info('✅ Queue service initialized with Redis (Email & WhatsApp)');
}
else {
    logger_1.default.warn('⚠️  Queue service initialized without Redis (queues disabled)');
}
//# sourceMappingURL=queue.service.js.map