import { Request, Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from './auth.middleware';
import auditService from '../services/audit.service';

// Middleware pour logger automatiquement les actions CRUD
export const auditMiddleware = (
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ',
  entityType: string,
  getEntityId?: (req: Request) => string | undefined,
  getEntityData?: (req: Request) => Record<string, any>
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Sauvegarder la fonction send originale
    const originalSend = res.send;

    // Intercepter la réponse
    res.send = function (body: any) {
      // Si la réponse est un succès (2xx), logger l'action
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const authReq = req as AuthRequest;
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
              } catch (e) {
                // Ignorer erreur parsing
              }
            }

            auditService.logCreate(
              companyId,
              userId,
              userEmail,
              authReq.user?.role,
              entityType,
              createdEntityId || 'unknown',
              (entityData || req.body) as Record<string, any>,
              undefined,
              undefined,
              ipAddress,
              userAgent
            );
          } else if (action === 'UPDATE') {
            // Pour UPDATE, on devrait avoir l'ancien et le nouveau
            // Pour simplifier, on log juste les nouvelles données
            auditService.logUpdate(
              companyId,
              userId,
              userEmail,
              authReq.user?.role,
              entityType,
              entityId || 'unknown',
              {} as Record<string, any>, // Anciennes données (devrait être récupéré avant update)
              (entityData || req.body) as Record<string, any>,
              undefined,
              undefined,
              ipAddress,
              userAgent
            );
          } else if (action === 'DELETE') {
            auditService.logDelete(
              companyId,
              userId,
              userEmail,
              authReq.user?.role,
              entityType,
              entityId || 'unknown',
              (entityData || {}) as Record<string, any>,
              undefined,
              undefined,
              ipAddress,
              userAgent
            );
          } else if (action === 'READ') {
            // READ seulement pour actions sensibles
            // auditService.logRead(...)
          }
        } catch (error) {
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

// Helper pour logger des actions personnalisées
export const logCustomAction = async (
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, any>
) => {
  try {
    const companyId = req.user?.companyId ?? undefined;
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    await auditService.logCustom(
      companyId,
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent
    );
  } catch (error) {
    // Ne pas faire échouer l'opération
    console.error('Error logging custom action:', error);
  }
};
