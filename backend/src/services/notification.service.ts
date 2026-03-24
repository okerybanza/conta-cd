import logger from '../utils/logger';

/**
 * Service de notifications (email / interne). Implémentation minimale pour le typage ;
 * brancher ici emailService / WhatsApp selon l’environnement si besoin.
 */
class NotificationService {
  async sendInvoiceNotification(data: Record<string, unknown>): Promise<void> {
    logger.debug('sendInvoiceNotification', { data });
  }

  async sendPaymentNotification(data: Record<string, unknown>): Promise<void> {
    logger.debug('sendPaymentNotification', { data });
  }

  async sendPaymentReminder(data: Record<string, unknown>): Promise<void> {
    logger.debug('sendPaymentReminder', { data });
  }

  async createInternalNotificationForOwner(
    companyId: string,
    title: string,
    message: string,
    meta?: Record<string, unknown>
  ): Promise<void> {
    logger.debug('createInternalNotificationForOwner', { companyId, title, message, meta });
  }

  async sendExpenseApprovalRequest(
    companyId: string,
    approverId: string,
    expenseId: string,
    payload: { expenseNumber?: string; amount: number; requesterName: string }
  ): Promise<void> {
    logger.debug('sendExpenseApprovalRequest', { companyId, approverId, expenseId, payload });
  }

  async sendExpenseApprovalResponse(
    companyId: string,
    userId: string,
    expenseId: string,
    payload: {
      status: string;
      expenseNumber?: string;
      approverName?: string;
      rejectorName?: string;
      reason?: string;
    }
  ): Promise<void> {
    logger.debug('sendExpenseApprovalResponse', { companyId, userId, expenseId, payload });
  }
}

export default new NotificationService();
