import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * Réconcilier les factures avec leurs paiements
 */
export declare const reconcileInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Réconcilier les transactions avec leurs écritures comptables
 */
export declare const reconcileJournalEntries: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Générer un rapport de réconciliation complet
 */
export declare const generateReconciliationReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=reconciliation.controller.d.ts.map