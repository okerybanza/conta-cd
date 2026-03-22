import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Importer un relevé bancaire
 */
export declare const importBankStatement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Parser un fichier CSV
 */
export declare const parseCSV: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Rapprocher un relevé bancaire
 */
export declare const reconcileStatement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Obtenir un relevé bancaire
 */
export declare const getBankStatement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Lister les relevés bancaires
 */
export declare const listBankStatements: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Rapprocher manuellement une transaction
 */
export declare const manualReconcile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=bankReconciliation.controller.d.ts.map