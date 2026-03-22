import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getSalesJournal: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPurchaseJournal: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getGeneralLedger: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTrialBalance: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAgedBalance: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=accountingReports.controller.d.ts.map