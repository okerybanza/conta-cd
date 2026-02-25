import { Request, Response } from 'express';
export declare class WebhookController {
    /**
     * WhatsApp Cloud API (Meta) - vérification du webhook (challenge)
     * GET /api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
     */
    whatsappVerify(req: Request, res: Response): Promise<Response>;
    /**
     * WhatsApp Cloud API (Meta) - réception des événements
     * POST /api/v1/webhooks/whatsapp
     *
     * On retourne toujours 200 pour éviter les retries agressifs et on log/trace côté serveur.
     */
    whatsapp(req: Request, res: Response): Promise<Response>;
    /**
     * Extraire et valider les données du webhook WhatsApp
     */
    private extractWhatsAppWebhook;
}
declare const _default: WebhookController;
export default _default;
//# sourceMappingURL=webhook.controller.d.ts.map