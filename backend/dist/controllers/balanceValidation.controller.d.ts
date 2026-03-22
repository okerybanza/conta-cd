import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Valider le solde d'un compte spécifique
 */
export declare const validateAccountBalance: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Valider tous les soldes d'une entreprise
 */
export declare const validateAllBalances: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Recalculer le solde d'un compte spécifique
 */
export declare const recalculateAccountBalance: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Recalculer tous les soldes d'une entreprise
 */
export declare const recalculateAllBalances: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=balanceValidation.controller.d.ts.map