import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';
import maxicashController from '../controllers/maxicash.controller';

const router = Router();

// Les webhooks sont publics (pas d'authentification JWT)
// mais sécurisés via tokens/signatures spécifiques

// WhatsApp Business API (Meta Cloud API)
router.get('/whatsapp', webhookController.whatsappVerify.bind(webhookController) as any);
router.post('/whatsapp', webhookController.whatsapp.bind(webhookController) as any);

// MaxiCash - Webhook de confirmation paiement (public, non authentifié)
router.post('/maxicash', maxicashController.webhook.bind(maxicashController) as any);

export default router;

