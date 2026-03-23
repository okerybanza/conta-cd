import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import assistantService from '../services/assistant.service';

const router = Router();
router.use(authenticate as any);

router.get('/insights', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId as string;
    const insights = await assistantService.getInsights(companyId);
    res.json({ success: true, data: { insights } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

router.get('/forecast', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId as string;
    const forecast = await assistantService.getFinancialForecast(companyId);
    res.json({ success: true, data: forecast });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

export default router;
