export interface InvoiceNotificationData {
    invoiceId: string;
    companyId: string;
    customerId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    totalTTC: number;
    currency: string;
    remainingBalance: number;
    invoiceUrl?: string;
    notes?: string;
    methods: ('email' | 'whatsapp')[];
}
export interface PaymentNotificationData {
    invoiceId: string;
    companyId: string;
    customerId: string;
    invoiceNumber: string;
    paymentDate: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    remainingBalance: number;
    methods: ('email' | 'whatsapp')[];
}
export interface PaymentReminderData {
    invoiceId: string;
    companyId: string;
    customerId: string;
    invoiceNumber: string;
    dueDate: string;
    remainingBalance: number;
    currency: string;
    daysOverdue?: number;
    invoiceUrl?: string;
    methods: ('email' | 'whatsapp')[];
}
export declare class NotificationService {
    sendInvoiceNotification(data: InvoiceNotificationData): Promise<void>;
    sendPaymentNotification(data: PaymentNotificationData): Promise<void>;
    sendPaymentReminder(data: PaymentReminderData): Promise<void>;
    formatPhoneNumber(phone: string | null | undefined): string | null;
    formatPaymentMethod(method: string): string;
    /**
     * Envoyer notification de demande d'approbation de dépense
     */
    sendExpenseApprovalRequest(companyId: string, approverId: string, expenseId: string, data: {
        expenseNumber: string;
        amount: number;
        requesterName: string;
    }): Promise<void>;
    /**
     * Envoyer notification de réponse d'approbation (approuvé/rejeté)
     */
    sendExpenseApprovalResponse(companyId: string, requesterId: string, expenseId: string, data: {
        status: 'approved' | 'rejected';
        expenseNumber: string;
        approverName?: string;
        rejectorName?: string;
        reason?: string;
    }): Promise<void>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notification.service.d.ts.map