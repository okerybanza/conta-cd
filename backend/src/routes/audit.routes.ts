import { Router } from 'express';
import auditController from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Routes audit
router.get('/', auditController.getLogs.bind(auditController) as any);
router.get('/verify', auditController.verifyIntegrity.bind(auditController) as any);
router.get('/:id', auditController.getLog.bind(auditController) as any);

export default router;

