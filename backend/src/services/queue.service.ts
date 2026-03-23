import { Queue, Worker, QueueEvents } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';
import emailService from './email.service';
// SMS service désactivé - ne garder que Email et WhatsApp
import prisma from '../config/database';

// Configuration Redis - DÉSACTIVÉ PAR DÉFAUT
// Pour activer Redis, définir REDIS_ENABLED=true ou REDIS_URL
const getRedisConnection = (): ConnectionOptions | null => {
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
let emailQueue: Queue | null = null;
let whatsappQueue: Queue | null = null; // SPRINT 5 - TASK 5.2

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

    emailQueue = new Queue('email', {
      connection: redisConnection,
      defaultJobOptions: defaultOptions as any,
    });

    whatsappQueue = new Queue('whatsapp', {
      connection: redisConnection,
      defaultJobOptions: defaultOptions as any,
    });
  } catch (error) {
    logger.warn('⚠️  Failed to create queues, Redis may not be available', error);
    redisAvailable = false;
    emailQueue = null;
    whatsappQueue = null;
  }
}

export { emailQueue, whatsappQueue };

// Workers
const emailWorker = (redisAvailable && emailQueue) ? new Worker(
  'email',
  async (job) => {
    const { to, subject, template, data, attachments, from } = job.data;

    // Idempotency check: Don't resend if already recorded as successful
    const existing = await prisma.notifications.findFirst({
      where: {
        company_id: data.companyId,
        type: 'email',
        title: subject,
        message: { contains: to },
        created_at: { gte: new Date(Date.now() - 24 * 3600 * 1000) } // Last 24h
      }
    });

    if (existing) {
      logger.info('Email already sent, skipping (idempotency)', { jobId: job.id, to });
      return { success: true, skipped: true };
    }

    try {
      const success = await emailService.sendEmail({ to, subject, template, data, from, attachments });
      if (success) {
        await prisma.notifications.create({
          data: {
            id: randomUUID(),
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
    } catch (error: any) {
      logger.error('Email job failed', { jobId: job.id, error: error.message });
      throw error;
    }
  },
  { connection: redisConnection!, concurrency: 5 }
) : null;

// SPRINT 5 - TASK 5.4: WhatsApp Worker with Idempotency
const whatsappWorker = (redisAvailable && whatsappQueue) ? new Worker(
  'whatsapp',
  async (job) => {
    const { to, message, companyId, relatedType, relatedId, notificationId } = job.data;

    // Check if already delivered
    if (notificationId) {
      const existing = await prisma.notifications.findUnique({ where: { id: notificationId } });
      if (existing?.data && (existing.data as any).status === 'delivered') {
        logger.info('WhatsApp already delivered, skipping (idempotency)', { jobId: job.id, to });
        return { success: true, skipped: true };
      }
    }

    try {
      const result: any = { ok: true, providerMessageId: 'disabled' };
      // whatsappService désactivé temporairement

      if (result.ok) {
        if (notificationId) {
          await prisma.notifications.update({
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
              } as any,
            },
          });
        }
        return { success: true, providerMessageId: result.providerMessageId };
      } else {
        throw new Error(result.error || 'WhatsApp provider error');
      }
    } catch (error: any) {
      logger.error('WhatsApp job failed', { jobId: job.id, to, error: error.message });
      throw error;
    }
  },
  { connection: redisConnection!, concurrency: 2 }
) : null;

// Event listeners pour monitoring
if (redisAvailable && emailQueue && emailWorker) {
  emailWorker.on('failed', (job, err) => logger.error('Email job failed', { jobId: job?.id, error: err.message }));
}

if (redisAvailable && whatsappQueue && whatsappWorker) {
  whatsappWorker.on('failed', (job, err) => logger.error('WhatsApp job failed', { jobId: job?.id, error: err.message }));
}

// Fonctions utilitaires
export const queueEmail = async (
  companyId: string,
  to: string,
  subject: string,
  template: string,
  data: Record<string, any>,
  attachments?: Array<{ filename: string; path?: string; content?: Buffer }>,
  from?: string
) => {
  if (!redisAvailable || !emailQueue) return null;
  return emailQueue.add('send-email', { to, subject, template, data: { ...data, companyId }, from, attachments });
};

export const queueWhatsApp = async (data: {
  companyId: string;
  to: string;
  message: string;
  relatedType: string;
  relatedId: string;
  notificationId?: string;
}) => {
  if (!redisAvailable || !whatsappQueue) {
    logger.warn('⚠️  Redis not available, WhatsApp queuing disabled');
    return null;
  }
  return whatsappQueue.add('send-whatsapp', data);
};

// Fermer les queues proprement
export const closeQueues = async () => {
  if (redisAvailable) {
    if (emailWorker) await emailWorker.close();
    if (emailQueue) await emailQueue.close();
    if (whatsappWorker) await whatsappWorker.close();
    if (whatsappQueue) await whatsappQueue.close();
    logger.info('Queues closed');
  }
};

if (redisAvailable) {
  logger.info('✅ Queue service initialized with Redis (Email & WhatsApp)');
} else {
  logger.warn('⚠️  Queue service initialized without Redis (queues disabled)');
}

