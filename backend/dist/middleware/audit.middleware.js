"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCustomAction = exports.auditMiddleware = void 0;
const audit_service_1 = __importDefault(require("../services/audit.service"));
// Middleware pour logger automatiquement les actions CRUD
const auditMiddleware = (action, entityType, getEntityId, getEntityData) => {
    return async (req, res, next) => {
        // Sauvegarder la fonction send originale
        const originalSend = res.send;
        // Intercepter la réponse
        res.send = function (body) {
            // Si la réponse est un succès (2xx), logger l'action
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const authReq = req;
                    const companyId = authReq.user?.companyId ?? undefined;
                    const userId = authReq.user?.id;
                    const userEmail = authReq.user?.email;
                    const entityId = getEntityId ? getEntityId(req) : req.params.id;
                    const entityData = getEntityId ? getEntityData?.(req) : undefined;
                    const ipAddress = req.ip || req.socket.remoteAddress;
                    const userAgent = req.get('user-agent');
                    if (action === 'CREATE') {
                        // Pour CREATE, on peut extraire l'ID de la réponse
                        let createdEntityId = entityId;
                        if (!createdEntityId && body) {
                            try {
                                const parsed = typeof body === 'string' ? JSON.parse(body) : body;
                                if (parsed.data?.id) {
                                    createdEntityId = parsed.data.id;
                                }
                            }
                            catch (e) {
                                // Ignorer erreur parsing
                            }
                        }
                        audit_service_1.default.logCreate(companyId, userId, userEmail, authReq.user?.role, entityType, createdEntityId || 'unknown', (entityData || req.body), undefined, undefined, ipAddress, userAgent);
                    }
                    else if (action === 'UPDATE') {
                        // Pour UPDATE, on devrait avoir l'ancien et le nouveau
                        // Pour simplifier, on log juste les nouvelles données
                        audit_service_1.default.logUpdate(companyId, userId, userEmail, authReq.user?.role, entityType, entityId || 'unknown', {}, // Anciennes données (devrait être récupéré avant update)
                        (entityData || req.body), undefined, undefined, ipAddress, userAgent);
                    }
                    else if (action === 'DELETE') {
                        audit_service_1.default.logDelete(companyId, userId, userEmail, authReq.user?.role, entityType, entityId || 'unknown', (entityData || {}), undefined, undefined, ipAddress, userAgent);
                    }
                    else if (action === 'READ') {
                        // READ seulement pour actions sensibles
                        // auditService.logRead(...)
                    }
                }
                catch (error) {
                    // Ne pas faire échouer la requête si l'audit échoue
                    console.error('Audit middleware error:', error);
                }
            }
            // Appeler la fonction send originale
            return originalSend.call(this, body);
        };
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
// Helper pour logger des actions personnalisées
const logCustomAction = async (req, action, entityType, entityId, metadata) => {
    try {
        const companyId = req.user?.companyId ?? undefined;
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        await audit_service_1.default.logCustom(companyId, userId, userEmail, action, entityType, entityId, metadata, ipAddress, userAgent);
    }
    catch (error) {
        // Ne pas faire échouer l'opération
        console.error('Error logging custom action:', error);
    }
};
exports.logCustomAction = logCustomAction;
//# sourceMappingURL=audit.middleware.js.map