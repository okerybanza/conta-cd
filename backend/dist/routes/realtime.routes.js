"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const realtime_service_1 = __importDefault(require("../services/realtime.service"));
const dashboard_service_1 = __importDefault(require("../services/dashboard.service"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * GET /api/v1/realtime/dashboard
 * Connexion SSE pour les mises à jour du dashboard en temps réel
 */
router.get('/dashboard', async (req, res, next) => {
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
        let decoded;
        try {
            decoded = jwt.verify(token, env.JWT_SECRET);
        }
        catch (error) {
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
        const sessionId = (0, uuid_1.v4)();
        // Configurer les headers SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Désactiver le buffering Nginx
        // Envoyer un commentaire initial pour maintenir la connexion
        res.write(': connected\n\n');
        // Envoyer les stats initiales
        try {
            const initialStats = await dashboard_service_1.default.getDashboardStats(companyId);
            res.write(`data: ${JSON.stringify({
                type: 'dashboard_stats',
                companyId,
                data: initialStats,
                timestamp: new Date(),
            })}\n\n`);
        }
        catch (error) {
            logger_1.default.error('Error sending initial dashboard stats', {
                companyId,
                error: error.message,
            });
        }
        // Enregistrer le client
        realtime_service_1.default.registerClient(sessionId, companyId, res);
        // Envoyer un heartbeat toutes les 30 secondes pour maintenir la connexion
        const heartbeatInterval = setInterval(() => {
            try {
                if (!res.writable || res.destroyed) {
                    clearInterval(heartbeatInterval);
                    return;
                }
                res.write(': heartbeat\n\n');
            }
            catch (error) {
                clearInterval(heartbeatInterval);
            }
        }, 30000);
        // Nettoyer lors de la déconnexion
        req.on('close', () => {
            clearInterval(heartbeatInterval);
            realtime_service_1.default.unregisterClient(sessionId, { companyId, res });
            logger_1.default.info('SSE connection closed', { sessionId, companyId });
        });
        logger_1.default.info('SSE connection established', { sessionId, companyId });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=realtime.routes.js.map