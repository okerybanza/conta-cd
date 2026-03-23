import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import ohadaExportController from '../controllers/ohadaExport.controller';

const router = Router();
router.use(authenticate);

router.get('/bilan', (req, res) => ohadaExportController.exportBilan(req as any, res));
router.get('/compte-resultat', (req, res) => ohadaExportController.exportCompteResultat(req as any, res));

export default router;
