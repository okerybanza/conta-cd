import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import webPushService from '../services/webPush.service';

const router = Router();

router.get('/vapid-key', (req, res) => {
  res.json({ success: true, data: { publicKey: webPushService.getVapidPublicKey() } });
});

router.post('/subscribe', authenticate as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ success: false, error: { message: 'subscription requis' } });
    await webPushService.saveSubscription(userId, subscription);
    res.json({ success: true, data: { message: 'Notifications activées' } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

router.post('/test', authenticate as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const sent = await webPushService.sendToUser(userId, {
      title: 'Conta.cd',
      body: 'Vos notifications push sont activées !',
      url: '/dashboard',
    });
    res.json({ success: true, data: { sent } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

export default router;
