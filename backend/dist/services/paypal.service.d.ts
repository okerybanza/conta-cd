export interface PayPalOrderData {
    invoiceId?: string;
    subscriptionId?: string;
    packageId?: string;
    amount: number;
    currency: string;
    description?: string;
    returnUrl: string;
    cancelUrl: string;
    type: 'invoice' | 'subscription';
}
export interface PayPalCaptureData {
    orderId: string;
    invoiceId?: string;
    subscriptionId?: string;
    packageId?: string;
    type: 'invoice' | 'subscription';
}
export declare class PayPalService {
    /**
     * Initialise le client PayPal selon le mode (sandbox/live)
     * Pour les abonnements, utilise la config Super Admin
     * Pour les factures, utilise la config de l'entreprise
     */
    private getPayPalClient;
    /**
     * Obtient le controller Orders
     */
    private getOrdersController;
    /**
     * Crée une Order PayPal pour une facture ou un abonnement
     */
    createOrder(companyId: string, data: PayPalOrderData): Promise<{
        orderId: string | undefined;
        status: import("@paypal/paypal-server-sdk").OrderStatus | undefined;
        links: import("@paypal/paypal-server-sdk").LinkDescription[] | undefined;
        invoiceId: string | undefined;
        subscriptionId: string | undefined;
        packageId: string | undefined;
        amount: number;
        currency: string;
        type: "invoice" | "subscription";
    }>;
    /**
     * Capture une Order PayPal après approbation
     */
    captureOrder(companyId: string, data: PayPalCaptureData): Promise<{
        success: boolean;
        message: string;
        subscriptionId: any;
        orderId: string;
        captureId: string | undefined;
        amount: number;
        currency: string;
    } | {
        success: boolean;
        message: string;
        paymentId: any;
        orderId: string;
        captureId: string | undefined;
        amount: number;
        currency: string;
    } | {
        success: boolean;
        message: string;
        paymentId: any;
    }>;
    /**
     * Capture un paiement PayPal pour une facture
     */
    private captureInvoicePayment;
    /**
     * Capture un paiement PayPal pour un abonnement
     */
    private captureSubscriptionPayment;
    /**
     * Récupère les détails d'une Order PayPal
     */
    getOrderDetails(companyId: string, orderId: string): Promise<import("@paypal/paypal-server-sdk").Order>;
    /**
     * Valide un webhook PayPal (à implémenter selon la doc PayPal)
     */
    validateWebhook(headers: any, body: any, company: any): Promise<boolean>;
    /**
     * Traite un webhook PayPal
     */
    processWebhook(payload: any, headers: any, companyId: string): Promise<{
        success: boolean;
        message: string;
        paymentId: any;
        subscriptionId?: undefined;
    } | {
        success: boolean;
        message: string;
        paymentId?: undefined;
        subscriptionId?: undefined;
    } | {
        success: boolean;
        message: string;
        subscriptionId: any;
        paymentId?: undefined;
    }>;
}
declare const _default: PayPalService;
export default _default;
//# sourceMappingURL=paypal.service.d.ts.map