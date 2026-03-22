import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
export declare const auditMiddleware: (action: "CREATE" | "UPDATE" | "DELETE" | "READ", entityType: string, getEntityId?: (req: Request) => string | undefined, getEntityData?: (req: Request) => Record<string, any>) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const logCustomAction: (req: AuthRequest, action: string, entityType: string, entityId?: string, metadata?: Record<string, any>) => Promise<void>;
//# sourceMappingURL=audit.middleware.d.ts.map