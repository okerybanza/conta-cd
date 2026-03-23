import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import referralService from '../services/referral.service';
import logger from '../utils/logger';

const router = Router();
router.use(authenticate as any);

// GET /api/v1/referral/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const stats = await referralService.getReferralStats(userId);
    res.json({ success: true, data: stats });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// GET /api/v1/referral/code
router.get('/code', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const code = await referralService.getOrCreateReferralCode(userId);
    const link = `https://conta.cd/register?ref=${code}`;
    res.json({ success: true, data: { code, link } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// PUT /api/v1/referral/reward-type
router.put('/reward-type', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { rewardType } = req.body;
    if (!['months', 'commission'].includes(rewardType)) {
      return res.status(400).json({ success: false, error: { message: 'rewardType doit être months ou commission' } });
    }
    await referralService.setRewardType(userId, rewardType);
    res.json({ success: true, data: { rewardType } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// POST /api/v1/referral/apply (appelé à l'inscription)
router.post('/apply', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: { message: 'code requis' } });
    const applied = await referralService.applyReferralCode(userId, code);
    res.json({ success: true, data: { applied, message: applied ? 'Code parrainage appliqué !' : 'Code invalide ou déjà utilisé' } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

export default router;
