import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import mobileMoneyService from '../services/mobilemoney/mobileMoney.service';
import logger from '../utils/logger';

const router = Router();

// GET /api/v1/mobile-money/providers
router.get('/providers', (req: Request, res: Response) => {
  res.json({ success: true, data: { providers: mobileMoneyService.getAvailableProviders() } });
});

// POST /api/v1/mobile-money/initiate
router.post('/initiate', authenticate as any, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, phoneNumber, amount, currency = 'CDF', reference, description } = req.body;
    if (!provider || !phoneNumber || !amount || !reference) {
      return res.status(400).json({ success: false, error: { message: 'provider, phoneNumber, amount, reference requis' } });
    }
    const callbackUrl = `${process.env.BACKEND_URL || 'https://conta.cd'}/api/v1/mobile-money/webhook/${provider}`;
    const result = await mobileMoneyService.initiatePayment(provider, {
      amount: Number(amount), currency, phoneNumber, reference, description: description || `Paiement Conta.cd - ${reference}`, callbackUrl,
    });
    res.json({ success: result.success, data: result });
  } catch (e: any) {
    logger.error('Mobile money initiate error', { error: e.message });
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// GET /api/v1/mobile-money/status/:provider/:transactionId
router.get('/status/:provider/:transactionId', authenticate as any, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, transactionId } = req.params;
    const result = await mobileMoneyService.checkStatus(provider, transactionId);
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// POST /api/v1/mobile-money/webhook/:provider
router.post('/webhook/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const signature = req.headers['x-signature'] as string || '';
    const valid = mobileMoneyService.validateWebhook(provider, req.body, signature);
    if (!valid) return res.status(400).json({ success: false, error: { message: 'Invalid webhook signature' } });
    logger.info('Mobile money webhook received', { provider, body: req.body });
    // TODO: mettre à jour le statut du paiement en base
    res.json({ success: true });
  } catch (e: any) {
    logger.error('Mobile money webhook error', { error: e.message });
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

export default router;
