export interface ReportFilters {
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
    status?: string;
    paymentMethod?: string;
    supplierId?: string;
}
export interface RevenueReportData {
    period: string;
    totalRevenue: number;
    totalInvoices: number;
    totalPayments: number;
    averageInvoice: number;
    averagePayment: number;
    byMonth: Array<{
        month: string;
        revenue: number;
        invoices: number;
        payments: number;
    }>;
    byCustomer: Array<{
        customerId: string;
        customerName: string;
        revenue: number;
        invoices: number;
    }>;
}
export interface UnpaidInvoicesReportData {
    totalCount: number;
    totalAmount: number;
    overdueCount: number;
    overdueAmount: number;
    invoices: Array<{
        invoiceNumber: string;
        customerName: string;
        invoiceDate: string;
        dueDate: string;
        totalTtc: number;
        remainingBalance: number;
        daysOverdue: number;
        currency: string;
    }>;
}
export interface PaymentsReportData {
    totalAmount: number;
    totalCount: number;
    byMethod: Array<{
        method: string;
        count: number;
        amount: number;
    }>;
    byMonth: Array<{
        month: string;
        count: number;
        amount: number;
    }>;
    payments: Array<{
        paymentDate: string;
        invoiceNumber: string;
        customerName: string;
        amount: number;
        method: string;
        currency: string;
    }>;
}
export interface AccountingJournalData {
    entries: Array<{
        date: string;
        type: string;
        reference: string;
        description: string;
        debit: number;
        credit: number;
        balance: number;
        currency: string;
    }>;
    totals: {
        totalDebit: number;
        totalCredit: number;
        finalBalance: number;
    };
}
export interface SupplierExpensesReportData {
    totalSuppliers: number;
    totalExpenses: number;
    items: Array<{
        supplierId: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        city?: string | null;
        country?: string | null;
        totalAmount: number;
        expenseCount: number;
    }>;
}
export interface RdcComplianceIssue {
    type: 'UNBALANCED_ENTRY' | 'PERIOD_VIOLATION';
    severity: 'warning' | 'error';
    message: string;
    details?: Record<string, any>;
}
export interface RdcComplianceReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    issues: RdcComplianceIssue[];
}
export declare class ReportingService {
    generateRevenueReport(companyId: string, filters: ReportFilters): Promise<RevenueReportData>;
    generateUnpaidInvoicesReport(companyId: string, filters?: {
        customerId?: string;
    }): Promise<UnpaidInvoicesReportData>;
    generatePaymentsReport(companyId: string, filters: ReportFilters): Promise<PaymentsReportData>;
    /**
     * Générer un rapport des dépenses par fournisseur
     */
    generateSupplierExpensesReport(companyId: string, filters: ReportFilters): Promise<SupplierExpensesReportData>;
    generateAccountingJournal(companyId: string, filters: ReportFilters): Promise<AccountingJournalData>;
    exportToCSV(data: any[], headers: string[]): Promise<string>;
    private groupByMonth;
    private groupByCustomer;
    private groupPaymentsByMethod;
    private groupPaymentsByMonth;
    generateAgingReport(companyId: string): Promise<{
        totalOutstanding: number;
        byPeriod: Array<{
            period: string;
            count: number;
            amount: number;
        }>;
        invoices: Array<{
            invoiceNumber: string;
            customerName: string;
            invoiceDate: string;
            dueDate: string;
            totalTtc: number;
            remainingBalance: number;
            daysOverdue: number;
            ageCategory: string;
            currency: string;
        }>;
    }>;
    generateCustomerPerformanceReport(companyId: string, filters: ReportFilters): Promise<{
        customers: Array<{
            customerId: string;
            customerName: string;
            totalInvoiced: number;
            totalPaid: number;
            totalOutstanding: number;
            invoiceCount: number;
            averageInvoice: number;
            paymentRate: number;
            lastInvoiceDate?: string;
            lastPaymentDate?: string;
        }>;
        summary: {
            totalCustomers: number;
            totalInvoiced: number;
            totalPaid: number;
            totalOutstanding: number;
            averagePaymentRate: number;
        };
    }>;
    generateTopProductsReport(companyId: string, filters: ReportFilters): Promise<{
        products: Array<{
            productId?: string;
            productName: string;
            quantity: number;
            revenue: number;
            invoiceCount: number;
            averagePrice: number;
        }>;
        summary: {
            totalProducts: number;
            totalQuantity: number;
            totalRevenue: number;
        };
    }>;
    generateCashFlowReport(companyId: string, filters: ReportFilters): Promise<{
        periods: Array<{
            period: string;
            openingBalance: number;
            income: number;
            expenses: number;
            closingBalance: number;
        }>;
        summary: {
            totalIncome: number;
            totalExpenses: number;
            netCashFlow: number;
        };
    }>;
    generateTaxReport(companyId: string, filters: ReportFilters): Promise<{
        byRate: Array<{
            taxRate: number;
            taxableAmount: number;
            taxAmount: number;
            invoiceCount: number;
        }>;
        summary: {
            totalTaxable: number;
            totalTax: number;
        };
        invoices: Array<{
            invoiceNumber: string;
            invoiceDate: string;
            customerName: string;
            taxableAmount: number;
            taxAmount: number;
            taxRate: number;
            currency: string;
        }>;
    }>;
    generateProfitabilityReport(companyId: string, filters: ReportFilters): Promise<{
        periods: Array<{
            period: string;
            revenue: number;
            costs: number;
            profit: number;
            profitMargin: number;
            invoiceCount: number;
        }>;
        summary: {
            totalRevenue: number;
            totalCosts: number;
            totalProfit: number;
            averageProfitMargin: number;
        };
    }>;
    generateRdcComplianceReport(companyId: string, filters: ReportFilters): Promise<RdcComplianceReport>;
    generateForecastReport(companyId: string): Promise<{
        next30Days: {
            expectedRevenue: number;
            expectedInvoices: number;
            overdueRisk: number;
        };
        next90Days: {
            expectedRevenue: number;
            expectedInvoices: number;
        };
        trends: {
            averageMonthlyRevenue: number;
            growthRate: number;
            projectedRevenue: number;
        };
    }>;
    generatePeriodComparisonReport(companyId: string, period1Start: Date, period1End: Date, period2Start: Date, period2End: Date): Promise<{
        period1: {
            revenue: number;
            invoices: number;
            payments: number;
            averageInvoice: number;
        };
        period2: {
            revenue: number;
            invoices: number;
            payments: number;
            averageInvoice: number;
        };
        comparison: {
            revenueChange: number;
            revenueChangePercent: number;
            invoiceChange: number;
            invoiceChangePercent: number;
        };
    }>;
    generateFinancialSummaryReport(companyId: string, filters: ReportFilters): Promise<{
        revenue: {
            total: number;
            byMonth: Array<{
                month: string;
                amount: number;
            }>;
            byCustomer: Array<{
                customerName: string;
                amount: number;
            }>;
        };
        outstanding: {
            total: number;
            overdue: number;
            aging: Array<{
                period: string;
                amount: number;
            }>;
        };
        payments: {
            total: number;
            byMethod: Array<{
                method: string;
                amount: number;
            }>;
        };
        keyMetrics: {
            averageInvoice: number;
            averagePayment: number;
            collectionRate: number;
            daysToPay: number;
        };
    }>;
}
declare const _default: ReportingService;
export default _default;
//# sourceMappingURL=reporting.service.d.ts.map