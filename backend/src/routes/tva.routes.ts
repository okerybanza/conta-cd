import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import tvaService from '../services/tva.service';
import logger from '../utils/logger';

const router = Router();
router.use(authenticate as any);

// GET /api/v1/tva/declaration?startDate=2024-01-01&endDate=2024-01-31
router.get('/declaration', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId as string;
    const { startDate, endDate } = req.query as any;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: { message: 'startDate et endDate requis' } });
    }
    const declaration = await tvaService.generateDeclaration(companyId, new Date(startDate), new Date(endDate));
    res.json({ success: true, data: declaration });
  } catch (e: any) {
    logger.error('TVA declaration error', { error: e.message });
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// GET /api/v1/tva/history?year=2024
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId as string;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const history = await tvaService.getDeclarationHistory(companyId, year);
    res.json({ success: true, data: { year, months: history } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { message: e.message } });
  }
});

export default router;
