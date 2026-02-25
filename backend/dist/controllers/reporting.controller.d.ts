import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ReportingController {
    getRevenueReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getUnpaidInvoicesReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getPaymentsReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getSupplierExpensesReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getAccountingJournal(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    exportRevenueCSV(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    exportUnpaidInvoicesCSV(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    exportPaymentsCSV(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    exportAccountingJournalCSV(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getAgingReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getCustomerPerformanceReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getCashFlowReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getTaxReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getProfitabilityReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getForecastReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getFinancialSummaryReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getRdcComplianceReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: ReportingController;
export default _default;
//# sourceMappingURL=reporting.controller.d.ts.map