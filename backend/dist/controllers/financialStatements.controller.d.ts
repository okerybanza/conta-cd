import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Obtenir le Compte de Résultat
 */
export declare const getIncomeStatement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Obtenir le Bilan
 */
export declare const getBalanceSheet: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Obtenir le Tableau de Flux de Trésorerie
 */
export declare const getCashFlowStatement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Valider l'équation comptable
 */
export declare const validateAccountingEquation: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=financialStatements.controller.d.ts.map