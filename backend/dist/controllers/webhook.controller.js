"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class WebhookController {
    /**
     * WhatsApp Cloud API (Meta) - vérification du webhook (challenge)
     * GET /api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
     */
    async whatsappVerify(req, res) {
        try {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];
            // Vérifier le mode et le token
            if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
                logger_1.default.info('WhatsApp webhook verified successfully');
                return res.status(200).send(challenge);
            }
            else {
                logger_1.default.warn('WhatsApp webhook verification failed', {
                    mode,
                    tokenProvided: !!token,
                    expectedToken: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
                });
                return res.status(403).send('Forbidden');
            }
        }
        catch (error) {
            logger_1.default.error('Error verifying WhatsApp webhook', { error: error.message });
            return res.status(500).send('Internal Server Error');
        }
    }
    /**
     * WhatsApp Cloud API (Meta) - réception des événements
     * POST /api/v1/webhooks/whatsapp
     *
     * On retourne toujours 200 pour éviter les retries agressifs et on log/trace côté serveur.
     */
    async whatsapp(req, res) {
        try {
            // Retourner 200 immédiatement pour éviter les retries
            res.status(200).send('OK');
            // Traiter les événements de manière asynchrone
            const webhookData = this.extractWhatsAppWebhook(req.body);
            if (webhookData) {
                logger_1.default.info('WhatsApp webhook received', {
                    object: webhookData.object,
                    entryCount: webhookData.entry?.length || 0,
                });
                // Traiter chaque entrée
                if (webhookData.entry) {
                    for (const entry of webhookData.entry) {
                        if (entry.changes) {
                            for (const change of entry.changes) {
                                if (change.value) {
                                    // Traiter les messages entrants
                                    if (change.value.messages) {
                                        for (const message of change.value.messages) {
                                            logger_1.default.info('WhatsApp message received', {
                                                from: message.from,
                                                messageId: message.id,
                                                type: message.type,
                                                timestamp: message.timestamp,
                                            });
                                            // TODO: Implémenter la logique de traitement des messages entrants
                                            // Par exemple: répondre automatiquement, enregistrer dans la base de données, etc.
                                        }
                                    }
                                    // Traiter les statuts de messages (delivered, read, etc.)
                                    if (change.value.statuses) {
                                        for (const status of change.value.statuses) {
                                            logger_1.default.info('WhatsApp message status update', {
                                                messageId: status.id,
                                                status: status.status,
                                                timestamp: status.timestamp,
                                            });
                                            // TODO: Mettre à jour le statut dans la base de données
                                            // Par exemple: mettre à jour la notification correspondante
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                logger_1.default.warn('WhatsApp webhook received but no valid data extracted');
            }
            return res;
        }
        catch (error) {
            logger_1.default.error('Error processing WhatsApp webhook', { error: error.message });
            // On a déjà retourné 200, donc on ne peut plus modifier la réponse
            return res;
        }
    }
    /**
     * Extraire et valider les données du webhook WhatsApp
     */
    extractWhatsAppWebhook(body) {
        try {
            // Format attendu de Meta Cloud API
            if (body.object === 'whatsapp_business_account') {
                return body;
            }
            // Autres formats possibles
            return body;
        }
        catch (error) {
            logger_1.default.error('Error extracting WhatsApp webhook data', { error: error.message });
            return null;
        }
    }
}
exports.WebhookController = WebhookController;
exports.default = new WebhookController();
//# sourceMappingURL=webhook.controller.js.map