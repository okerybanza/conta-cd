import { Router } from 'express';
import datarissageController from '../controllers/datarissage.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Compléter le datarissage
router.post('/complete', datarissageController.complete.bind(datarissageController) as any);

// Obtenir l'état du datarissage
router.get('/status', datarissageController.getStatus.bind(datarissageController) as any);

// Vérifier si un champ est verrouillé
router.get('/locked/:field', datarissageController.checkLocked.bind(datarissageController) as any);

export default router;

