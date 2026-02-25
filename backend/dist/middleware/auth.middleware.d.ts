import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        companyId: string | null;
        role: string;
        isSuperAdmin?: boolean;
        isContaUser?: boolean;
    };
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(...allowedRoles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireCompany(req: AuthRequest, res: Response, next: NextFunction): void;
/**
 * Fonction utilitaire pour obtenir le companyId de manière sûre
 * Lance une erreur si companyId est null (utilisateurs sans entreprise)
 */
export declare function getCompanyId(req: AuthRequest): string;
export declare function getUserId(req: AuthRequest): string;
//# sourceMappingURL=auth.middleware.d.ts.map