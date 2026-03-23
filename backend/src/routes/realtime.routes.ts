import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.middleware';
import realtimeService from '../services/realtime.service';
import dashboardService from '../services/dashboard.service';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/realtime/dashboard
 * Connexion SSE pour les mises à jour du dashboard en temps réel
 */
router.get(
  '/dashboard',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      // Support du token en paramètre pour EventSource (qui ne supporte pas les headers)
      const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided',
        });
      }

      // Vérifier le token manuellement
      const jwt = require('jsonwebtoken');
      const env = require('../config/env').default;
      
      let decoded: any;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }

      // Récupérer l'utilisateur
      const prisma = require('../config/database').default;
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          email: decoded.email,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          companyId: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      const companyId = user.companyId;
      const sessionId = uuidv4();

      // Configurer les headers SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Désactiver le buffering Nginx

      // Envoyer un commentaire initial pour maintenir la connexion
      res.write(': connected\n\n');

      // Envoyer les stats initiales
      try {
        const initialStats = await dashboardService.getDashboardStats(companyId);
        res.write(`data: ${JSON.stringify({
          type: 'dashboard_stats',
          companyId,
          data: initialStats,
          timestamp: new Date(),
        })}\n\n`);
      } catch (error: any) {
        logger.error('Error sending initial dashboard stats', {
          companyId,
          error: error.message,
        });
      }

      // Enregistrer le client
      realtimeService.registerClient(sessionId, companyId, res);

      // Envoyer un heartbeat toutes les 30 secondes pour maintenir la connexion
      const heartbeatInterval = setInterval(() => {
        try {
          if (!res.writable || res.destroyed) {
            clearInterval(heartbeatInterval);
            return;
          }
          res.write(': heartbeat\n\n');
        } catch (error) {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Nettoyer lors de la déconnexion
      req.on('close', () => {
        clearInterval(heartbeatInterval);
        realtimeService.unregisterClient(sessionId, { companyId, res });
        logger.info('SSE connection closed', { sessionId, companyId });
      });

      logger.info('SSE connection established', { sessionId, companyId });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

