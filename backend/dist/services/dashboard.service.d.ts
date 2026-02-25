export interface DashboardStats {
    totalRevenue: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueGrowth: number;
    totalInvoiced: number;
    collectionRate: number;
    totalInvoices: number;
    invoicesThisMonth: number;
    unpaidInvoices: number;
    unpaidAmount: number;
    overdueInvoices: number;
    overdueAmount: number;
    totalPayments: number;
    paymentsThisMonth: number;
    averagePayment: number;
    averageDaysToPay: number;
    totalCustomers: number;
    activeCustomers: number;
    totalExpenses: number;
    expensesThisMonth: number;
    expensesLastMonth: number;
    expensesGrowth: number;
    profit: number;
    profitMargin: number;
    topCustomers: any[];
    revenueByMonth: any[];
    expensesByMonth: any[];
    profitByMonth: any[];
    outstandingByMonth: any[];
    invoicesByStatus: any[];
    recentPayments: any[];
    topSuppliers: any[];
}
export declare class DashboardService {
    /**
     * Obtenir les statistiques du tableau de bord pour une entreprise
     */
    getDashboardStats(companyId: string): Promise<DashboardStats>;
    private getTotalRevenue;
    private getRevenueForPeriod;
    private getTotalInvoices;
    private getInvoicesForPeriod;
    private getUnpaidInvoicesStats;
    private getOverdueInvoicesStats;
    private getTotalPayments;
    private getPaymentsForPeriod;
    private getAveragePayment;
    private getTotalCustomers;
    private getActiveCustomers;
    private getRevenueByMonth;
    private getTotalInvoiced;
    private getTotalExpenses;
    private getExpensesForPeriod;
    private getAverageDaysToPay;
    private getTopCustomers;
    private getProfitByMonth;
    private getOutstandingByMonth;
    private getExpensesByMonth;
    private getInvoicesByStatus;
    private getRecentPayments;
    /**
     * Invalider le cache du dashboard pour une entreprise
     */
    invalidateCache(companyId: string): Promise<void>;
}
declare const _default: DashboardService;
export default _default;
//# sourceMappingURL=dashboard.service.d.ts.map