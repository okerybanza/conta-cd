"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reporting_controller_1 = __importDefault(require("../controllers/reporting.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes rapports de base
router.get('/revenue', reporting_controller_1.default.getRevenueReport.bind(reporting_controller_1.default));
router.get('/unpaid-invoices', reporting_controller_1.default.getUnpaidInvoicesReport.bind(reporting_controller_1.default));
router.get('/payments', reporting_controller_1.default.getPaymentsReport.bind(reporting_controller_1.default));
router.get('/accounting-journal', reporting_controller_1.default.getAccountingJournal.bind(reporting_controller_1.default));
router.get('/supplier-expenses', reporting_controller_1.default.getSupplierExpensesReport.bind(reporting_controller_1.default));
// ACCT-003: Rapport de conformité fiscale RDC
router.get('/compliance/rdc', reporting_controller_1.default.getRdcComplianceReport.bind(reporting_controller_1.default));
// Routes rapports avancés
router.get('/aging', reporting_controller_1.default.getAgingReport.bind(reporting_controller_1.default));
router.get('/customer-performance', reporting_controller_1.default.getCustomerPerformanceReport.bind(reporting_controller_1.default));
router.get('/cash-flow', reporting_controller_1.default.getCashFlowReport.bind(reporting_controller_1.default));
router.get('/tax', reporting_controller_1.default.getTaxReport.bind(reporting_controller_1.default));
router.get('/profitability', reporting_controller_1.default.getProfitabilityReport.bind(reporting_controller_1.default));
router.get('/forecast', reporting_controller_1.default.getForecastReport.bind(reporting_controller_1.default));
router.get('/financial-summary', reporting_controller_1.default.getFinancialSummaryReport.bind(reporting_controller_1.default));
// Routes export CSV
router.get('/export/revenue.csv', reporting_controller_1.default.exportRevenueCSV.bind(reporting_controller_1.default));
router.get('/export/unpaid-invoices.csv', reporting_controller_1.default.exportUnpaidInvoicesCSV.bind(reporting_controller_1.default));
router.get('/export/payments.csv', reporting_controller_1.default.exportPaymentsCSV.bind(reporting_controller_1.default));
router.get('/export/accounting-journal.csv', reporting_controller_1.default.exportAccountingJournalCSV.bind(reporting_controller_1.default));
exports.default = router;
//# sourceMappingURL=reporting.routes.js.map