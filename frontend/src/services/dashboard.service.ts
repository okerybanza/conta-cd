import api from './api';

export interface DashboardStats {
  // Revenus
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number;
  totalInvoiced: number;
  collectionRate: number;

  // Factures
  totalInvoices: number;
  invoicesThisMonth: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  overdueInvoices: number;
  overdueAmount: number;

  // Paiements
  totalPayments: number;
  paymentsThisMonth: number;
  averagePayment: number;
  averageDaysToPay: number;

  // Dépenses
  totalExpenses: number;
  expensesThisMonth: number;
  expensesLastMonth: number;
  expensesGrowth: number;

  // Bénéfice
  profit: number;
  profitMargin: number;

  // Clients
  totalCustomers: number;
  activeCustomers: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalRevenue: number;
    invoiceCount: number;
  }>;

  // Évolution
  revenueByMonth: Array<{ month: string; revenue: number }>;
  expensesByMonth: Array<{ month: string; expenses: number }>;
  profitByMonth: Array<{ month: string; profit: number }>;
  outstandingByMonth: Array<{ month: string; amount: number }>;
  invoicesByStatus: Array<{ status: string; count: number }>;
  recentPayments: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    paymentDate: string;
    customerName: string;
  }>;

  // Fournisseurs
  topSuppliers?: Array<{
    supplierId: string;
    name: string;
    totalExpenses: number;
    expenseCount: number;
  }>;
}

class DashboardService {
  async getStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    // Si aucune date n'est fournie, ne pas envoyer de paramètres (toutes les données)

    const response = await api.get('/dashboard/stats', { params });
    return response.data.data;
  }
}

export default new DashboardService();

