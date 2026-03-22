import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Exporter la déclaration TVA
 */
export declare const exportVATDeclaration: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Exporter pour contrôle fiscal
 */
export declare const exportFiscalControl: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=fiscalExport.controller.d.ts.map