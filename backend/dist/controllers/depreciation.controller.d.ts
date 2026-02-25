import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Créer un plan d'amortissement
 */
export declare const createDepreciation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Obtenir un plan d'amortissement par ID
 */
export declare const getDepreciation: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Lister les plans d'amortissement
 */
export declare const listDepreciations: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Mettre à jour un plan d'amortissement
 */
export declare const updateDepreciation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Calculer l'amortissement mensuel
 */
export declare const calculateMonthlyDepreciation: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Générer une écriture d'amortissement
 */
export declare const generateDepreciationEntry: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Générer le tableau d'amortissement
 */
export declare const generateDepreciationTable: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Supprimer un plan d'amortissement
 */
export declare const deleteDepreciation: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=depreciation.controller.d.ts.map