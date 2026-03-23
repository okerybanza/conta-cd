import { Router } from 'express';
import supportController from '../controllers/support.controller';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Créer un ticket de support
router.post('/tickets', (req, res, next) => supportController.createTicket(req as AuthRequest, res, next));

// Lister les tickets de l'entreprise
router.get('/tickets', (req, res, next) => supportController.listTickets(req as AuthRequest, res, next));

// Récupérer un ticket spécifique
router.get('/tickets/:ticketId', (req, res, next) => supportController.getTicket(req as unknown as AuthRequest, res, next));

// Mettre à jour un ticket
router.patch('/tickets/:ticketId', (req, res, next) => supportController.updateTicket(req as unknown as AuthRequest, res, next));

export default router;

