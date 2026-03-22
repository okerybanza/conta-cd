import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Créer un exercice comptable
 */
export declare const createFiscalPeriod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Obtenir un exercice par ID
 */
export declare const getFiscalPeriod: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Lister les exercices
 */
export declare const listFiscalPeriods: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Obtenir l'exercice en cours
 */
export declare const getCurrentFiscalPeriod: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Clôturer un exercice
 */
export declare const closeFiscalPeriod: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Rouvrir un exercice
 */
export declare const reopenFiscalPeriod: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Verrouiller une période
 */
export declare const lockFiscalPeriod: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Déverrouiller une période
 */
export declare const unlockFiscalPeriod: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Mettre à jour un exercice
 */
export declare const updateFiscalPeriod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Supprimer un exercice
 */
export declare const deleteFiscalPeriod: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=fiscalPeriod.controller.d.ts.map