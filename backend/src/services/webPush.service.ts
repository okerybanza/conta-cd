import webpush from 'web-push';
import prisma from '../config/database';
import logger from '../utils/logger';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@conta.cd',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export class WebPushService {

  async saveSubscription(userId: string, subscription: any): Promise<void> {
    await (prisma as any).users.update({
      where: { id: userId },
      data: { preferences: { push_subscription: subscription } as any },
    });
    logger.info('Push subscription saved', { userId });
  }

  async getSubscription(userId: string): Promise<any> {
    const user = await (prisma as any).users.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    return (user?.preferences as any)?.push_subscription || null;
  }

  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      logger.debug('No push subscription for user', { userId });
      return false;
    }
    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/icon-72.png',
        url: payload.url || '/dashboard',
        tag: payload.tag || 'conta-notification',
      }));
      logger.info('Push notification sent', { userId, title: payload.title });
      return true;
    } catch (e: any) {
      if (e.statusCode === 410) {
        // Subscription expirée — la supprimer
        await (prisma as any).users.update({
          where: { id: userId },
          data: { preferences: {} as any },
        });
        logger.info('Push subscription removed (expired)', { userId });
      } else {
        logger.error('Push notification failed', { userId, error: e.message });
      }
      return false;
    }
  }

  async sendToCompany(companyId: string, payload: PushNotificationPayload): Promise<number> {
    const users = await (prisma as any).users.findMany({
      where: { company_id: companyId, deleted_at: null },
      select: { id: true },
    });
    let sent = 0;
    for (const user of users) {
      const ok = await this.sendToUser(user.id, payload);
      if (ok) sent++;
    }
    logger.info('Push notifications sent to company', { companyId, sent, total: users.length });
    return sent;
  }

  getVapidPublicKey(): string {
    return process.env.VAPID_PUBLIC_KEY || '';
  }
}

export default new WebPushService();
