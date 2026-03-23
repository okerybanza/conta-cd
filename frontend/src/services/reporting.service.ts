import api from './api';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  status?: string;
  paymentMethod?: string;
  supplierId?: string;
}

export interface RevenueReport {
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

export interface UnpaidInvoicesReport {
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

export interface PaymentsReport {
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

export interface AccountingJournal {
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

export interface SupplierExpensesReport {
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

class ReportingService {
  async getRevenueReport(filters?: ReportFilters): Promise<RevenueReport> {
    const response = await api.get('/reporting/revenue', { params: filters });
    return response.data.data;
  }

  async getUnpaidInvoicesReport(filters?: { customerId?: string }): Promise<UnpaidInvoicesReport> {
    const response = await api.get('/reports/unpaid-invoices', { params: filters });
    return response.data.data;
  }

  async getPaymentsReport(filters?: ReportFilters): Promise<PaymentsReport> {
    const response = await api.get('/reports/payments', { params: filters });
    return response.data.data;
  }

  async getAccountingJournal(filters?: ReportFilters): Promise<AccountingJournal> {
    const response = await api.get('/reports/accounting-journal', { params: filters });
    return response.data.data;
  }

  async getSupplierExpensesReport(filters?: ReportFilters): Promise<SupplierExpensesReport> {
    const response = await api.get('/reports/supplier-expenses', { params: filters });
    return response.data.data;
  }

  // Rapports avancés
  async getAgingReport(): Promise<any> {
    const response = await api.get('/reports/aging');
    return response.data.data;
  }

  async getCustomerPerformanceReport(filters?: ReportFilters): Promise<any> {
    const response = await api.get('/reports/customer-performance', { params: filters });
    return response.data.data;
  }

  async getCashFlowReport(filters?: ReportFilters): Promise<any> {
    const response = await api.get('/reports/cash-flow', { params: filters });
    return response.data.data;
  }

  async getTaxReport(filters?: ReportFilters): Promise<any> {
    const response = await api.get('/reports/tax', { params: filters });
    return response.data.data;
  }

  async getProfitabilityReport(filters?: ReportFilters): Promise<any> {
    const response = await api.get('/reports/profitability', { params: filters });
    return response.data.data;
  }

  async getForecastReport(): Promise<any> {
    const response = await api.get('/reports/forecast');
    return response.data.data;
  }

  async getFinancialSummaryReport(filters?: ReportFilters): Promise<any> {
    const response = await api.get('/reports/financial-summary', { params: filters });
    return response.data.data;
  }

  // Export PDF
  async exportPDF(reportType: string, filters?: ReportFilters): Promise<Blob> {
    const response = await api.get(`/reports/export/${reportType}.pdf`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  // Exports CSV
  exportRevenueCSV(filters?: ReportFilters): string {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.customerId) params.append('customerId', filters.customerId);

    return `${api.defaults.baseURL}/reports/export/revenue.csv?${params.toString()}`;
  }

  exportUnpaidInvoicesCSV(filters?: { customerId?: string }): string {
    const params = new URLSearchParams();
    if (filters?.customerId) params.append('customerId', filters.customerId);

    return `${api.defaults.baseURL}/reports/export/unpaid-invoices.csv?${params.toString()}`;
  }

  exportPaymentsCSV(filters?: ReportFilters): string {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);

    return `${api.defaults.baseURL}/reports/export/payments.csv?${params.toString()}`;
  }

  exportAccountingJournalCSV(filters?: ReportFilters): string {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.status) params.append('status', filters.status);

    return `${api.defaults.baseURL}/reports/export/accounting-journal.csv?${params.toString()}`;
  }
}

export default new ReportingService();

