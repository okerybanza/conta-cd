import { Router } from 'express';
import reportingController from '../controllers/reporting.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Routes rapports de base
router.get('/revenue', reportingController.getRevenueReport.bind(reportingController) as any);
router.get('/unpaid-invoices', reportingController.getUnpaidInvoicesReport.bind(reportingController) as any);
router.get('/payments', reportingController.getPaymentsReport.bind(reportingController) as any);
router.get('/accounting-journal', reportingController.getAccountingJournal.bind(reportingController) as any);
router.get('/supplier-expenses', reportingController.getSupplierExpensesReport.bind(reportingController) as any);

// Routes rapports avancés
router.get('/aging', reportingController.getAgingReport.bind(reportingController) as any);
router.get('/customer-performance', reportingController.getCustomerPerformanceReport.bind(reportingController) as any);
router.get('/cash-flow', reportingController.getCashFlowReport.bind(reportingController) as any);
router.get('/tax', reportingController.getTaxReport.bind(reportingController) as any);
router.get('/profitability', reportingController.getProfitabilityReport.bind(reportingController) as any);
router.get('/forecast', reportingController.getForecastReport.bind(reportingController) as any);
router.get('/financial-summary', reportingController.getFinancialSummaryReport.bind(reportingController) as any);

// Routes export CSV
router.get('/export/revenue.csv', reportingController.exportRevenueCSV.bind(reportingController) as any);
router.get('/export/unpaid-invoices.csv', reportingController.exportUnpaidInvoicesCSV.bind(reportingController) as any);
router.get('/export/payments.csv', reportingController.exportPaymentsCSV.bind(reportingController) as any);
router.get('/export/accounting-journal.csv', reportingController.exportAccountingJournalCSV.bind(reportingController) as any);

export default router;

