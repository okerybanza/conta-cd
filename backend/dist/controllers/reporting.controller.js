"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const reporting_service_1 = __importDefault(require("../services/reporting.service"));
class ReportingController {
    // Rapport revenus
    async getRevenueReport(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                customerId: req.query.customerId,
                status: req.query.status,
            };
            const report = await reporting_service_1.default.generateRevenueReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Rapport factures impayées
    async getUnpaidInvoicesReport(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                customerId: req.query.customerId,
            };
            const report = await reporting_service_1.default.generateUnpaidInvoicesReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Rapport paiements
    async getPaymentsReport(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                customerId: req.query.customerId,
                paymentMethod: req.query.paymentMethod,
            };
            const report = await reporting_service_1.default.generatePaymentsReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Rapport dépenses par fournisseur
    async getSupplierExpensesReport(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                status: req.query.status,
                supplierId: req.query.supplierId,
            };
            const report = await reporting_service_1.default.generateSupplierExpensesReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Journal comptable
    async getAccountingJournal(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                customerId: req.query.customerId,
                status: req.query.status,
            };
            const journal = await reporting_service_1.default.generateAccountingJournal((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                data: journal,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Export CSV revenus
    async exportRevenueCSV(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                customerId: req.query.customerId,
            };
            const report = await reporting_service_1.default.generateRevenueReport((0, auth_middleware_1.getCompanyId)(req), filters);
            // Préparer les données CSV
            const csvData = report.byMonth.map((month) => ({
                Mois: month.month,
                Revenus: month.revenue,
                Factures: month.invoices,
                Paiements: month.payments,
            }));
            const csv = await reporting_service_1.default.exportToCSV(csvData, [
                'Mois',
                'Revenus',
                'Factures',
                'Paiements',
            ]);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="revenus-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send('\ufeff' + csv); // BOM UTF-8 pour Excel
        }
        catch (error) {
            next(error);
        }
    }
    // Export CSV factures impayées
    async exportUnpaidInvoicesCSV(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                customerId: req.query.customerId,
            };
            const report = await reporting_service_1.default.generateUnpaidInvoicesReport((0, auth_middleware_1.getCompanyId)(req), filters);
            const csvData = report.invoices.map((inv) => ({
                'Numéro facture': inv.invoiceNumber,
                Client: inv.customerName,
                'Date facture': new Date(inv.invoiceDate).toLocaleDateString('fr-FR'),
                'Date échéance': new Date(inv.dueDate).toLocaleDateString('fr-FR'),
                'Montant total': inv.totalTtc,
                'Solde restant': inv.remainingBalance,
                'Jours de retard': inv.daysOverdue,
                Devise: inv.currency,
            }));
            const csv = await reporting_service_1.default.exportToCSV(csvData, [
                'Numéro facture',
                'Client',
                'Date facture',
                'Date échéance',
                'Montant total',
                'Solde restant',
                'Jours de retard',
                'Devise',
            ]);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="factures-impayees-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send('\ufeff' + csv);
        }
        catch (error) {
            next(error);
        }
    }
    // Export CSV paiements
    async exportPaymentsCSV(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                customerId: req.query.customerId,
                paymentMethod: req.query.paymentMethod,
            };
            const report = await reporting_service_1.default.generatePaymentsReport((0, auth_middleware_1.getCompanyId)(req), filters);
            const csvData = report.payments.map((payment) => ({
                'Date paiement': new Date(payment.paymentDate).toLocaleDateString('fr-FR'),
                'Numéro facture': payment.invoiceNumber,
                Client: payment.customerName,
                Montant: payment.amount,
                Méthode: payment.method,
                Devise: payment.currency,
            }));
            const csv = await reporting_service_1.default.exportToCSV(csvData, [
                'Date paiement',
                'Numéro facture',
                'Client',
                'Montant',
                'Méthode',
                'Devise',
            ]);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="paiements-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send('\ufeff' + csv);
        }
        catch (error) {
            next(error);
        }
    }
    // Export CSV journal comptable
    async exportAccountingJournalCSV(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = {
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
                customerId: req.query.customerId,
                status: req.query.status,
            };
            const journal = await reporting_service_1.default.generateAccountingJournal((0, auth_middleware_1.getCompanyId)(req), filters);
            const csvData = journal.entries.map((entry) => ({
                Date: new Date(entry.date).toLocaleDateString('fr-FR'),
                Type: entry.type,
                Référence: entry.reference,
                Description: entry.description,
                Débit: entry.debit,
                Crédit: entry.credit,
                Solde: entry.balance,
                Devise: entry.currency,
            }));
            const csv = await reporting_service_1.default.exportToCSV(csvData, [
                'Date',
                'Type',
                'Référence',
                'Description',
                'Débit',
                'Crédit',
                'Solde',
                'Devise',
            ]);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="journal-comptable-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send('\ufeff' + csv);
        }
        catch (error) {
            next(error);
        }
    }
    // Rapports avancés
    async getAgingReport(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const report = await reporting_service_1.default.generateAgingReport((0, auth_middleware_1.getCompanyId)(req));
            res.json({ success: true, data: report });
        }
        catch (error) {
            next(error);
        }
    }
    async getCustomerPerformanceReport(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = {
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                customerId: req.query.customerId,
            };
            const report = await reporting_service_1.default.generateCustomerPerformanceReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({ success: true, data: report });
        }
        catch (error) {
            next(error);
        }
    }
    async getCashFlowReport(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = {
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            };
            const report = await reporting_service_1.default.generateCashFlowReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({ success: true, data: report });
        }
        catch (error) {
            next(error);
        }
    }
    async getTaxReport(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = {
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            };
            const report = await reporting_service_1.default.generateTaxReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({ success: true, data: report });
        }
        catch (error) {
            next(error);
        }
    }
    async getProfitabilityReport(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = {
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            };
            const report = await reporting_service_1.default.generateProfitabilityReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({ success: true, data: report });
        }
        catch (error) {
            next(error);
        }
    }
    async getForecastReport(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const report = await reporting_service_1.default.generateForecastReport((0, auth_middleware_1.getCompanyId)(req));
            res.json({ success: true, data: report });
        }
        catch (error) {
            next(error);
        }
    }
    async getFinancialSummaryReport(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = {
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            };
            const report = await reporting_service_1.default.generateFinancialSummaryReport((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({ success: true, data: report });
        }
        catch (error) {
            next(error);
        }
    }
    // ACCT-003: Rapport de conformité fiscale RDC (contrôles automatiques de base)
    async getRdcComplianceReport(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const { startDate, endDate } = req.query;
            const filters = {};
            if (startDate)
                filters.startDate = new Date(startDate);
            if (endDate)
                filters.endDate = new Date(endDate);
            const report = await reporting_service_1.default.generateRdcComplianceReport(companyId, filters);
            res.json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportingController = ReportingController;
exports.default = new ReportingController();
//# sourceMappingURL=reporting.controller.js.map