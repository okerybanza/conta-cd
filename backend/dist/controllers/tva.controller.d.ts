import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Obtenir le rapport TVA
 */
export declare const getVATReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Calculer la TVA collectée
 */
export declare const getVATCollected: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Calculer la TVA déductible
 */
export declare const getVATDeductible: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Calculer la TVA à payer
 */
export declare const getVATToPay: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Générer une déclaration TVA
 */
export declare const generateVATDeclaration: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=tva.controller.d.ts.map