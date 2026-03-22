"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = __importDefault(require("../services/dashboard.service"));
const quota_service_1 = __importDefault(require("../services/quota.service"));
class DashboardController {
    // Obtenir les statistiques du dashboard
    async getStats(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : undefined;
            const endDate = req.query.endDate
                ? new Date(req.query.endDate)
                : undefined;
            // Certains utilisateurs (ex: expert comptable, superadmin sans entreprise) n'ont pas de companyId.
            // Dans ce cas, on renvoie un dashboard vide (toutes les valeurs à 0) plutôt qu'une erreur pour ne pas casser l'UI.
            if (!req.user.companyId) {
                const emptyStats = {
                    totalRevenue: 0,
                    revenueThisMonth: 0,
                    revenueLastMonth: 0,
                    revenueGrowth: 0,
                    totalInvoiced: 0,
                    collectionRate: 0,
                    totalInvoices: 0,
                    invoicesThisMonth: 0,
                    unpaidInvoices: 0,
                    unpaidAmount: 0,
                    overdueInvoices: 0,
                    overdueAmount: 0,
                    totalPayments: 0,
                    paymentsThisMonth: 0,
                    averagePayment: 0,
                    averageDaysToPay: 0,
                    totalExpenses: 0,
                    expensesThisMonth: 0,
                    expensesLastMonth: 0,
                    expensesGrowth: 0,
                    profit: 0,
                    profitMargin: 0,
                    totalCustomers: 0,
                    activeCustomers: 0,
                    topCustomers: [],
                    revenueByMonth: [],
                    expensesByMonth: [],
                    profitByMonth: [],
                    outstandingByMonth: [],
                    invoicesByStatus: [],
                    recentPayments: [],
                    topSuppliers: [],
                };
                return res.json({
                    success: true,
                    data: emptyStats,
                });
            }
            const stats = await dashboard_service_1.default.getDashboardStats(req.user.companyId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir le résumé des quotas et fonctionnalités
    async getQuotaSummary(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            if (!req.user.companyId) {
                // Renvoyer un quota summary vide pour les utilisateurs sans entreprise
                const emptyQuotaSummary = {
                    packageCode: 'none',
                    packageName: 'Aucun plan',
                    features: {},
                    limits: {},
                    usage: {},
                    remaining: {},
                };
                return res.json({
                    success: true,
                    data: emptyQuotaSummary,
                });
            }
            const quotaSummary = await quota_service_1.default.getQuotaSummary(req.user.companyId);
            res.json({
                success: true,
                data: quotaSummary,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
exports.default = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map