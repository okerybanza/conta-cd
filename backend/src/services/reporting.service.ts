import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import pdfService from './pdf.service';
import logger from '../utils/logger';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import quotaService from './quota.service';
import { CustomError } from '../middleware/error.middleware';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  status?: string;
  paymentMethod?: string;
  supplierId?: string;
}

export interface RevenueReportData {
  period?: string;
  totalRevenue?: number;
  totalInvoices?: number;
  totalPayments?: number;
  averageInvoice?: number;
  averagePayment?: number;
  byMonth?: Array<{
    month?: string;
    revenue?: number;
    invoices?: number;
    payments?: number;
  }>;
  byCustomer: Array<{
    customerId: string;
    customerName: string;
    revenue: number;
    invoices: number;
  }>;
}

export interface UnpaidInvoicesReportData {
  totalCount?: number;
  totalAmount?: number;
  overdueCount?: number;
  overdueAmount?: number;
  invoices?: Array<{
    invoiceNumber?: string;
    customerName?: string;
    invoiceDate?: string;
    dueDate?: string;
    totalTtc?: number;
    remainingBalance?: number;
    daysOverdue?: number;
    currency?: string;
  }>;
}

export interface PaymentsReportData {
  totalAmount?: number;
  totalCount?: number;
  byMethod?: Array<{
    method?: string;
    count?: number;
    amount?: number;
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
  entries?: Array<{
    date?: string;
    type?: string;
    reference?: string;
    description?: string;
    debit?: number;
    credit?: number;
    balance?: number;
    currency?: string;
  }>;
  totals: {
    totalDebit: number;
    totalCredit: number;
    finalBalance: number;
  };
}

export interface SupplierExpensesReportData {
  totalSuppliers?: number;
  totalExpenses?: number;
  items?: Array<{
    supplierId?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    country?: string | null;
    totalAmount?: number;
    expenseCount?: number;
  }>;
}

export class ReportingService {
  // Générer rapport revenus
  async generateRevenueReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<RevenueReportData> {
    // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
    // (bloquera notamment le plan Gratuit)
    const hasAdvancedReports = await quotaService.checkFeature(companyId, 'advanced_reports' as any);
    if (!hasAdvancedReports) {
      throw new CustomError(
        'Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.',
        403,
        'FEATURE_NOT_AVAILABLE',
        { feature: 'advanced_reports' }
      );
    }

    const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate || new Date();

    // Revenus totaux
    const payments = await prisma.payments.findMany({
      where: {
        company_id: companyId,
        status: 'confirmed',
        payment_date: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.customerId && {
          invoices: {
            customer_id: filters.customerId,
          },
        }),
      },
      include: {
        invoices: {
          include: {
            customers: true,
          },
        },
      },
    });

    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: ['draft', 'cancelled'], // Exclure les factures en brouillon et annulées
        },
        ...(filters.customerId && {
          customer_id: filters.customerId,
        }),
        ...(filters.status && {
          status: filters.status,
        }),
      },
      include: {
        customers: true,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalInvoices = invoices.length;
    const totalPayments = payments.length;
    const averageInvoice =
      totalInvoices > 0
        ? invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0) / totalInvoices
        : 0;
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;

    // Par mois
    const byMonth = this.groupByMonth(payments, invoices, startDate, endDate);

    // Par client
    const byCustomer = this.groupByCustomer(payments, invoices);

    return {
      period: `${format(startDate, 'dd MMM yyyy', { locale: fr })} - ${format(endDate, 'dd MMM yyyy', { locale: fr })}`,
      totalRevenue,
      totalInvoices,
      totalPayments,
      averageInvoice,
      averagePayment,
      byMonth,
      byCustomer,
    };
  }

  // Générer rapport factures impayées
  async generateUnpaidInvoicesReport(
    companyId: string,
    filters?: { customerId?: string }
  ): Promise<UnpaidInvoicesReportData> {
    // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
    const hasAdvancedReports = await quotaService.checkFeature(companyId, 'advanced_reports' as any);
    if (!hasAdvancedReports) {
      throw new CustomError(
        'Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.',
        403,
        'FEATURE_NOT_AVAILABLE',
        { feature: 'advanced_reports' }
      );
    }
    
    const now = new Date();

    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        status: {
          in: ['sent', 'partially_paid'],
        },
        ...(filters?.customerId && {
          customer_id: filters.customerId,
        }),
      },
      include: {
        customers: true,
      },
      orderBy: {
        due_date: 'asc',
      },
    });

    const totalAmount = invoices.reduce(
      (sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount || 0)),
      0
    );

    const overdueInvoices = invoices.filter(
      (inv) => inv.due_date && new Date(inv.due_date) < now
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount || 0)),
      0
    );

    const invoiceData = invoices.map((inv) => {
      const customer = inv.customers;
      const customerName =
        customer.type === 'particulier'
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : customer.business_name || '';

      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
      const daysOverdue = dueDate && dueDate < now
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        invoiceNumber: inv.invoice_number,
        customerName,
        invoiceDate: inv.invoice_date.toISOString(),
        dueDate: inv.due_date ? inv.due_date.toISOString() : '',
        totalTtc: Number(inv.total_amount),
        remainingBalance: Number(inv.total_amount) - Number(inv.paid_amount || 0),
        daysOverdue,
        currency: inv.currency || 'CDF',
      };
    });

    return {
      totalCount: invoices.length,
      totalAmount,
      overdueCount: overdueInvoices.length,
      overdueAmount,
      invoices: invoiceData,
    };
  }

  // Générer rapport paiements
  async generatePaymentsReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<PaymentsReportData> {
    // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
    const hasAdvancedReports = await quotaService.checkFeature(companyId, 'advanced_reports' as any);
    if (!hasAdvancedReports) {
      throw new CustomError(
        'Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.',
        403,
        'FEATURE_NOT_AVAILABLE',
        { feature: 'advanced_reports' }
      );
    }
    
    const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate || new Date();

    const payments = await prisma.payments.findMany({
      where: {
        company_id: companyId,
        status: 'confirmed',
        payment_date: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.customerId && {
          invoices: {
            customer_id: filters.customerId,
          },
        }),
        ...(filters.paymentMethod && {
          payment_method: filters.paymentMethod,
        }),
      },
      include: {
        invoices: {
          include: {
            customers: true,
          },
        },
      },
      orderBy: {
        payment_date: 'desc',
      },
    });

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalCount = payments.length;

    // Par méthode
    const byMethod = this.groupPaymentsByMethod(payments);

    // Par mois
    const byMonth = this.groupPaymentsByMonth(payments, startDate, endDate);

    // Détails paiements
    const paymentData = payments.map((p) => {
      const customer = p.invoices.customers;
      const customerName =
        customer.type === 'particulier'
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : customer.business_name || '';

      return {
        paymentDate: p.payment_date.toISOString(),
        invoiceNumber: p.invoices.invoice_number,
        customerName,
        amount: Number(p.amount),
        method: p.payment_method,
        currency: p.currency || 'CDF',
      };
    });

    return {
      totalAmount,
      totalCount,
      byMethod,
      byMonth,
      payments: paymentData,
    };
  }

  /**
   * Générer un rapport des dépenses par fournisseur
   */
  async generateSupplierExpensesReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<SupplierExpensesReportData> {
    // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
    const hasAdvancedReports = await quotaService.checkFeature(companyId, 'advanced_reports' as any);
    if (!hasAdvancedReports) {
      throw new CustomError(
        'Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.',
        403,
        'FEATURE_NOT_AVAILABLE',
        { feature: 'advanced_reports' }
      );
    }
    
    const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate || new Date();

    const expenses = await prisma.expenses.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        expense_date: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.status && { status: filters.status }),
        ...(filters.supplierId && { supplier_id: filters.supplierId }),
      },
      include: {
        suppliers: true,
      },
    });

    const bySupplier = new Map<
      string,
      {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
        city?: string | null;
        country?: string | null;
        totalAmount: number;
        expenseCount: number;
      }
    >();

    for (const exp of expenses) {
      const supplierId = exp.supplier_id || 'no-supplier';
      const supplierName =
        exp.suppliers?.name || exp.supplier_name || 'Sans fournisseur';

      const entry = bySupplier.get(supplierId) || {
        id: supplierId,
        name: supplierName,
        email: exp.suppliers?.email || null,
        phone: exp.suppliers?.phone || null,
        city: exp.suppliers?.city || null,
        country: exp.suppliers?.country || null,
        totalAmount: 0,
        expenseCount: 0,
      };

      entry.totalAmount += Number(exp.amount_ttc || exp.total_amount || 0);
      entry.expenseCount += 1;

      bySupplier.set(supplierId, entry);
    }

    const items = Array.from(bySupplier.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    const totalExpenses = items.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    return {
      totalSuppliers: items.length,
      totalExpenses,
      items: items.map((item) => ({
        supplierId: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        city: item.city,
        country: item.country,
        totalAmount: item.totalAmount,
        expenseCount: item.expenseCount,
      })),
    };
  }

  // Générer journal comptable
  async generateAccountingJournal(
    companyId: string,
    filters: ReportFilters
  ): Promise<AccountingJournalData> {
    // Vérifier que la fonctionnalité de rapports avancés est disponible dans le plan
    const hasAdvancedReports = await quotaService.checkFeature(companyId, 'advanced_reports' as any);
    if (!hasAdvancedReports) {
      throw new CustomError(
        'Les rapports avancés ne sont pas disponibles dans votre formule actuelle. Veuillez upgrader votre abonnement.',
        403,
        'FEATURE_NOT_AVAILABLE',
        { feature: 'advanced_reports' }
      );
    }
    
    const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate || new Date();

    // Récupérer toutes les transactions
    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.customerId && {
          customer_id: filters.customerId,
        }),
        ...(filters.status && {
          status: filters.status,
        }),
      },
      include: {
        customers: true,
      },
      orderBy: {
        invoice_date: 'asc',
      },
    });

    const payments = await prisma.payments.findMany({
      where: {
        company_id: companyId,
        status: 'confirmed',
        payment_date: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters.customerId && {
          invoices: {
            customer_id: filters.customerId,
          },
        }),
      },
      include: {
        invoices: {
          include: {
            customers: true,
          },
        },
      },
      orderBy: {
        payment_date: 'asc',
      },
    });

    // Créer les entrées
    const entries: AccountingJournalData['entries'] = [];
    let balance = 0;

    // Factures (créances)
    for (const invoice of invoices) {
      const customer = invoice.customers;
      const customerName =
        customer.type === 'particulier'
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : customer.business_name || '';

      const amount = Number(invoice.total_amount);
      balance += amount;

      entries.push({
        date: invoice.invoice_date.toISOString(),
        type: 'Facture',
        reference: invoice.invoice_number,
        description: `Facture ${invoice.invoice_number} - ${customerName}`,
        debit: amount,
        credit: 0,
        balance,
        currency: invoice.currency || 'CDF',
      });
    }

    // Paiements (encaissements)
    for (const payment of payments) {
      const customer = payment.invoices.customers;
      const customerName =
        customer.type === 'particulier'
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : customer.business_name || '';

      const amount = Number(payment.amount);
      balance -= amount;

      entries.push({
        date: payment.payment_date.toISOString(),
        type: 'Paiement',
        reference: payment.reference || payment.id,
        description: `Paiement ${payment.invoices.invoice_number} - ${customerName} (${payment.payment_method})`,
        debit: 0,
        credit: amount,
        balance,
        currency: payment.currency || 'CDF',
      });
    }

    // Trier par date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculer les totaux
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    const finalBalance = totalDebit - totalCredit;

    return {
      entries,
      totals: {
        totalDebit,
        totalCredit,
        finalBalance,
      },
    };
  }

  // Exporter en CSV
  async exportToCSV(data: any[], headers: string[]): Promise<string> {
    const csvRows: string[] = [];

    // Headers
    csvRows.push(headers.join(','));

    // Data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header] || '';
        // Échapper les virgules et guillemets
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  // Helper: Grouper par mois
  private groupByMonth(
    payments: any[],
    invoices: any[],
    startDate: Date,
    endDate: Date
  ): Array<{ month: string; revenue: number; invoices: number; payments: number }> {
    const months: Map<string, { revenue: number; invoices: number; payments: number }> = new Map();

    // Initialiser tous les mois
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthKey = format(current, 'MMM yyyy', { locale: fr });
      months.set(monthKey, { revenue: 0, invoices: 0, payments: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    // Ajouter les paiements
    for (const payment of payments) {
      const monthKey = format(payment.payment_date, 'MMM yyyy', { locale: fr });
      const month = months.get(monthKey);
      if (month) {
        month.revenue += Number(payment.amount);
        month.payments += 1;
      }
    }

    // Ajouter les factures
    for (const invoice of invoices) {
      const monthKey = format(invoice.invoice_date, 'MMM yyyy', { locale: fr });
      const month = months.get(monthKey);
      if (month) {
        month.invoices += 1;
      }
    }

    return Array.from(months.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  // Helper: Grouper par client
  private groupByCustomer(
    payments: any[],
    invoices: any[]
  ): Array<{ customerId: string; customerName: string; revenue: number; invoices: number }> {
    const customers: Map<
      string,
      { customerId: string; customerName: string; revenue: number; invoices: number }
    > = new Map();

    // Ajouter les paiements
    for (const payment of payments) {
      const customer = payment.invoices.customers;
      const customerId = customer.id;
      const customerName =
        customer.type === 'particulier'
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
          : customer.business_name || '';

      if (!customers.has(customerId)) {
        customers.set(customerId, {
          customerId,
          customerName,
          revenue: 0,
          invoices: 0,
        });
      }

      const customerData = customers.get(customerId)!;
      customerData.revenue += Number(payment.amount);
    }

    // Ajouter les factures
    for (const invoice of invoices) {
      const customerId = invoice.customer_id;
      if (!customers.has(customerId)) {
        const customer = invoice.customers;
        const customerName =
          customer.type === 'particulier'
            ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
            : customer.business_name || '';

        customers.set(customerId, {
          customerId,
          customerName,
          revenue: 0,
          invoices: 0,
        });
      }

      const customerData = customers.get(customerId)!;
      customerData.invoices += 1;
    }

    return Array.from(customers.values()).sort((a, b) => b.revenue - a.revenue);
  }

  // Helper: Grouper paiements par méthode
  private groupPaymentsByMethod(
    payments: any[]
  ): Array<{ method: string; count: number; amount: number }> {
    const methods: Map<string, { count: number; amount: number }> = new Map();

    for (const payment of payments) {
      const method = payment.payment_method;
      if (!methods.has(method)) {
        methods.set(method, { count: 0, amount: 0 });
      }

      const methodData = methods.get(method)!;
      methodData.count += 1;
      methodData.amount += Number(payment.amount);
    }

    return Array.from(methods.entries()).map(([method, data]) => ({
      method,
      ...data,
    }));
  }

  // Helper: Grouper paiements par mois
  private groupPaymentsByMonth(
    payments: any[],
    startDate: Date,
    endDate: Date
  ): Array<{ month: string; count: number; amount: number }> {
    const months: Map<string, { count: number; amount: number }> = new Map();

    // Initialiser tous les mois
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthKey = format(current, 'MMM yyyy', { locale: fr });
      months.set(monthKey, { count: 0, amount: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    // Ajouter les paiements
    for (const payment of payments) {
      const monthKey = format(payment.payment_date, 'MMM yyyy', { locale: fr });
      const month = months.get(monthKey);
      if (month) {
        month.count += 1;
        month.amount += Number(payment.amount);
      }
    }

    return Array.from(months.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  // 4. Rapport de vieillissement des créances (Aging Report)
  async generateAgingReport(companyId: string): Promise<{
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
  }> {
    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        status: { in: ['sent', 'partially_paid'] },
      },
      include: { 
        customers: true,
        payments: {
          where: {
            status: 'confirmed',
            deleted_at: null,
          },
          select: {
            amount: true,
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });

    // Filtrer les factures avec solde restant > 0
    const invoicesWithBalance = invoices.filter((invoice) => {
      const totalAmount = Number(invoice.total_amount);
      const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      return totalAmount - paidAmount > 0;
    });

    const now = new Date();
    const byPeriod = [
      { period: '0-30 jours', min: 0, max: 30, count: 0, amount: 0 },
      { period: '31-60 jours', min: 31, max: 60, count: 0, amount: 0 },
      { period: '61-90 jours', min: 61, max: 90, count: 0, amount: 0 },
      { period: 'Plus de 90 jours', min: 91, max: Infinity, count: 0, amount: 0 },
    ];

    const invoiceDetails = invoicesWithBalance.map((invoice) => {
      // Calculer le solde restant
      const totalAmount = Number(invoice.total_amount);
      const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const remainingBalance = totalAmount - paidAmount;
      const dueDate = new Date(invoice.due_date || invoice.invoice_date);
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000)));
      
      let ageCategory = '0-30 jours';
      if (daysOverdue > 90) ageCategory = 'Plus de 90 jours';
      else if (daysOverdue > 60) ageCategory = '61-90 jours';
      else if (daysOverdue > 30) ageCategory = '31-60 jours';

      const period = byPeriod.find((p) => daysOverdue >= p.min && daysOverdue <= p.max);
      if (period) {
        period.count += 1;
        period.amount += remainingBalance;
      }

      const customerName =
        invoice.customers.type === 'particulier'
          ? `${invoice.customers.first_name || ''} ${invoice.customers.last_name || ''}`.trim()
          : invoice.customers.business_name || '';

      return {
        invoiceNumber: invoice.invoice_number,
        customerName,
        invoiceDate: invoice.invoice_date.toISOString().split('T')[0],
        dueDate: invoice.due_date?.toISOString().split('T')[0] || invoice.invoice_date.toISOString().split('T')[0],
        totalTtc: Number(invoice.total_amount),
        remainingBalance: remainingBalance,
        daysOverdue,
        ageCategory,
        currency: invoice.currency || 'CDF',
      };
    });

    return {
      totalOutstanding: invoiceDetails.reduce((sum, inv) => sum + inv.remainingBalance, 0),
      byPeriod: byPeriod.map(({ period, count, amount }) => ({ period, count, amount })),
      invoices: invoiceDetails,
    };
  }

  // 5. Rapport de performance clients (Customer Performance)
  async generateCustomerPerformanceReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<{
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
  }> {
    const where: Prisma.invoicesWhereInput = {
      company_id: companyId,
      deleted_at: null,
      status: {
        not: 'draft', // Exclure les factures en brouillon
      },
    };

    if (filters.startDate || filters.endDate) {
      where.invoice_date = {};
      if (filters.startDate) where.invoice_date.gte = filters.startDate;
      if (filters.endDate) where.invoice_date.lte = filters.endDate;
    }

    if (filters.customerId) {
      where.customer_id = filters.customerId;
    }

    const invoices = await prisma.invoices.findMany({
      where,
      include: {
        customers: true,
        payments: {
          orderBy: { payment_date: 'desc' },
          take: 1,
        },
      },
      orderBy: { invoice_date: 'desc' },
    });

    const customerMap = new Map<string, any>();

    for (const invoice of invoices) {
      const customerId = invoice.customer_id;
      if (!customerMap.has(customerId)) {
        const customerName =
          invoice.customers.type === 'particulier'
            ? `${invoice.customers.first_name || ''} ${invoice.customers.last_name || ''}`.trim()
            : invoice.customers.business_name || '';

        customerMap.set(customerId, {
          customerId,
          customerName,
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          invoiceCount: 0,
          lastInvoiceDate: undefined,
          lastPaymentDate: undefined,
        });
      }

      const customer = customerMap.get(customerId)!;
      const totalAmount = Number(invoice.total_amount);
      const paidAmount = Number(invoice.paid_amount || 0);
      const remainingBalance = totalAmount - paidAmount;
      
      customer.totalInvoiced += totalAmount;
      customer.totalPaid += paidAmount;
      customer.totalOutstanding += remainingBalance;
      customer.invoiceCount += 1;

      if (!customer.lastInvoiceDate || invoice.invoice_date > new Date(customer.lastInvoiceDate)) {
        customer.lastInvoiceDate = invoice.invoice_date.toISOString().split('T')[0];
      }

      if (invoice.payments.length > 0) {
        const lastPayment = invoice.payments[0];
        if (!customer.lastPaymentDate || lastPayment.payment_date > new Date(customer.lastPaymentDate)) {
          customer.lastPaymentDate = lastPayment.payment_date.toISOString().split('T')[0];
        }
      }
    }

    const customers = Array.from(customerMap.values()).map((customer) => ({
      ...customer,
      averageInvoice: customer.invoiceCount > 0 ? customer.totalInvoiced / customer.invoiceCount : 0,
      paymentRate: customer.totalInvoiced > 0 ? (customer.totalPaid / customer.totalInvoiced) * 100 : 0,
    }));

    const summary = {
      totalCustomers: customers.length,
      totalInvoiced: customers.reduce((sum, c) => sum + c.totalInvoiced, 0),
      totalPaid: customers.reduce((sum, c) => sum + c.totalPaid, 0),
      totalOutstanding: customers.reduce((sum, c) => sum + c.totalOutstanding, 0),
      averagePaymentRate:
        customers.length > 0
          ? customers.reduce((sum, c) => sum + c.paymentRate, 0) / customers.length
          : 0,
    };

    return { customers: customers.sort((a, b) => b.totalInvoiced - a.totalInvoiced), summary };
  }

  // 6. Rapport de produits/services les plus vendus
  async generateTopProductsReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<{
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
  }> {
    const where: Prisma.invoicesWhereInput = {
      company_id: companyId,
      deleted_at: null,
      status: {
        not: 'draft', // Exclure les factures en brouillon
      },
    };

    if (filters.startDate || filters.endDate) {
      where.invoice_date = {};
      if (filters.startDate) where.invoice_date.gte = filters.startDate;
      if (filters.endDate) where.invoice_date.lte = filters.endDate;
    }

    const invoices = await prisma.invoices.findMany({
      where,
      include: {
        invoice_lines: {
          include: { products: true },
        },
      },
    });

    const productMap = new Map<string, any>();

    for (const invoice of invoices) {
      for (const line of invoice.invoice_lines) {
        const productId = line.product_id || `custom-${line.description || line.id}`;
        const productName = line.products?.name || line.description || 'Article sans nom';

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId: line.product_id || undefined,
            productName,
            quantity: 0,
            revenue: 0,
            invoiceCount: 0,
          });
        }

        const product = productMap.get(productId)!;
        product.quantity += Number(line.quantity);
        product.revenue += Number(line.total);
        product.invoiceCount += 1;
      }
    }

    const products = Array.from(productMap.values())
      .map((product) => ({
        ...product,
        averagePrice: product.quantity > 0 ? product.revenue / product.quantity : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      products,
      summary: {
        totalProducts: products.length,
        totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
        totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
      },
    };
  }

  // 7. Rapport de trésorerie (Cash Flow)
  async generateCashFlowReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<{
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
  }> {
    const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate || new Date();

    const payments = await prisma.payments.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        payment_date: { gte: startDate, lte: endDate },
      },
      include: { invoices: true },
    });

    const periods: Map<string, { income: number; expenses: number }> = new Map();
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthKey = format(current, 'MMM yyyy', { locale: fr });
      periods.set(monthKey, { income: 0, expenses: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    for (const payment of payments) {
      const monthKey = format(payment.payment_date, 'MMM yyyy', { locale: fr });
      const period = periods.get(monthKey);
      if (period) {
        period.income += Number(payment.amount);
      }
    }

    // Récupérer les dépenses de la période
    const expensesData = await prisma.expenses.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        expense_date: { gte: startDate, lte: endDate },
      },
      select: {
        expense_date: true,
        amount_ttc: true,
      },
    });

    // Grouper les dépenses par période
    for (const expense of expensesData) {
      const monthKey = format(expense.expense_date, 'MMM yyyy', { locale: fr });
      const period = periods.get(monthKey);
      if (period) {
        period.expenses += Number(expense.amount_ttc);
      }
    }

    let openingBalance = 0;
    const periodData = Array.from(periods.entries()).map(([period, data]) => {
      const closingBalance = openingBalance + data.income - data.expenses;
      const result = {
        period,
        openingBalance,
        income: data.income,
        expenses: data.expenses,
        closingBalance,
      };
      openingBalance = closingBalance;
      return result;
    });

    return {
      periods: periodData,
      summary: {
        totalIncome: periodData.reduce((sum, p) => sum + p.income, 0),
        totalExpenses: periodData.reduce((sum, p) => sum + p.expenses, 0),
        netCashFlow: periodData.reduce((sum, p) => sum + p.income - p.expenses, 0),
      },
    };
  }

  // 8. Rapport de taxes (Tax Report)
  async generateTaxReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<{
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
  }> {
    const where: Prisma.invoicesWhereInput = {
      company_id: companyId,
      deleted_at: null,
      status: {
        not: 'draft', // Exclure les factures en brouillon
      },
    };

    if (filters.startDate || filters.endDate) {
      where.invoice_date = {};
      if (filters.startDate) where.invoice_date.gte = filters.startDate;
      if (filters.endDate) where.invoice_date.lte = filters.endDate;
    }

    const invoices = await prisma.invoices.findMany({
      where,
      include: {
        customers: true,
        invoice_lines: true,
      },
    });

    const taxMap = new Map<number, { taxableAmount: number; taxAmount: number; invoiceCount: number }>();
    const invoiceDetails: any[] = [];

    for (const invoice of invoices) {
      let invoiceTaxable = 0;
      let invoiceTax = 0;
      const taxRates = new Set<number>();

      for (const line of invoice.invoice_lines) {
        const lineTotal = Number(line.total);
        const taxRate = Number(line.tax_rate || 0);
        const taxable = lineTotal / (1 + taxRate / 100);
        const tax = lineTotal - taxable;

        invoiceTaxable += taxable;
        invoiceTax += tax;
        taxRates.add(taxRate);

        if (!taxMap.has(taxRate)) {
          taxMap.set(taxRate, { taxableAmount: 0, taxAmount: 0, invoiceCount: 0 });
        }

        const taxData = taxMap.get(taxRate)!;
        taxData.taxableAmount += taxable;
        taxData.taxAmount += tax;
      }

      if (invoiceTaxable > 0) {
        taxMap.forEach((data, rate) => {
          if (taxRates.has(rate)) {
            data.invoiceCount += 1;
          }
        });

        const customerName =
          invoice.customers.type === 'particulier'
            ? `${invoice.customers.first_name || ''} ${invoice.customers.last_name || ''}`.trim()
            : invoice.customers.business_name || '';

        invoiceDetails.push({
          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.invoice_date.toISOString().split('T')[0],
          customerName,
          taxableAmount: invoiceTaxable,
          taxAmount: invoiceTax,
          taxRate: Array.from(taxRates)[0] || 0,
          currency: invoice.currency || 'CDF',
        });
      }
    }

    return {
      byRate: Array.from(taxMap.entries())
        .map(([taxRate, data]) => ({ taxRate, ...data }))
        .sort((a, b) => b.taxRate - a.taxRate),
      summary: {
        totalTaxable: Array.from(taxMap.values()).reduce((sum, d) => sum + d.taxableAmount, 0),
        totalTax: Array.from(taxMap.values()).reduce((sum, d) => sum + d.taxAmount, 0),
      },
      invoices: invoiceDetails,
    };
  }

  // 9. Rapport de rentabilité par période
  async generateProfitabilityReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<{
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
  }> {
    const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const endDate = filters.endDate || new Date();

    const [invoices, expenses] = await Promise.all([
      prisma.invoices.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          status: {
            not: 'draft', // Exclure les factures en brouillon
          },
          invoice_date: { gte: startDate, lte: endDate },
        },
        include: { invoice_lines: true },
      }),
      prisma.expenses.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          expense_date: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const periods: Map<string, { revenue: number; costs: number; invoiceCount: number }> = new Map();
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthKey = format(current, 'MMM yyyy', { locale: fr });
      periods.set(monthKey, { revenue: 0, costs: 0, invoiceCount: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    // Calculer les revenus
    for (const invoice of invoices) {
      const monthKey = format(invoice.invoice_date, 'MMM yyyy', { locale: fr });
      const period = periods.get(monthKey);
      if (period) {
        period.revenue += Number(invoice.total_amount);
        period.invoiceCount += 1;
      }
    }

    // Calculer les coûts réels à partir des dépenses
    for (const expense of expenses) {
      const monthKey = format(expense.expense_date, 'MMM yyyy', { locale: fr });
      const period = periods.get(monthKey);
      if (period) {
        period.costs += Number(expense.amount_ttc);
      }
    }

    const periodData = Array.from(periods.entries()).map(([period, data]) => {
      const profit = data.revenue - data.costs;
      return {
        period,
        revenue: data.revenue,
        costs: data.costs,
        profit,
        profitMargin: data.revenue > 0 ? (profit / data.revenue) * 100 : 0,
        invoiceCount: data.invoiceCount,
      };
    });

    const totalRevenue = periodData.reduce((sum, p) => sum + p.revenue, 0);
    const totalCosts = periodData.reduce((sum, p) => sum + p.costs, 0);
    const totalProfit = totalRevenue - totalCosts;

    return {
      periods: periodData,
      summary: {
        totalRevenue,
        totalCosts,
        totalProfit,
        averageProfitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      },
    };
  }

  // 10. Rapport de prévisions (Forecast Report)
  async generateForecastReport(companyId: string): Promise<{
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
  }> {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    // const next90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Revenus des 30 derniers jours
    const recentPayments = await prisma.payments.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        payment_date: { gte: last30Days, lte: now },
      },
    });

    const recentRevenue = recentPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Factures en attente (non payées uniquement)
    const pendingInvoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        status: { in: ['sent', 'partially_paid'] },
        due_date: { lte: next30Days },
      },
      include: {
        payments: {
          where: {
            status: 'confirmed',
            deleted_at: null,
          },
          select: {
            amount: true,
          },
        },
      },
    });

    // Calculer le solde restant pour chaque facture
    const invoicesWithBalance = pendingInvoices.map((inv) => {
      const totalAmount = Number(inv.total_amount);
      const paidAmount = inv.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      return {
        ...inv,
        remainingBalance: totalAmount - paidAmount,
      };
    }).filter((inv) => inv.remainingBalance > 0);

    const expectedRevenue = invoicesWithBalance.reduce((sum, inv) => sum + inv.remainingBalance, 0);
    const overdueRisk = invoicesWithBalance
      .filter((inv) => inv.due_date && new Date(inv.due_date) < now)
      .reduce((sum, inv) => sum + inv.remainingBalance, 0);

    // Revenus des 90 derniers jours pour calculer la tendance
    const last90Payments = await prisma.payments.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        payment_date: { gte: last90Days, lte: now },
      },
    });

    const last90Revenue = last90Payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const averageMonthlyRevenue = last90Revenue / 3;
    const growthRate = recentRevenue > 0 ? ((recentRevenue - last90Revenue / 3) / (last90Revenue / 3)) * 100 : 0;
    const projectedRevenue = averageMonthlyRevenue * (1 + growthRate / 100);

    return {
      next30Days: {
        expectedRevenue,
        expectedInvoices: invoicesWithBalance.length,
        overdueRisk,
      },
      next90Days: {
        expectedRevenue: expectedRevenue * 3, // Estimation simple
        expectedInvoices: invoicesWithBalance.length * 3,
      },
      trends: {
        averageMonthlyRevenue,
        growthRate,
        projectedRevenue,
      },
    };
  }

  // 11. Rapport de comparaison période (Period Comparison)
  async generatePeriodComparisonReport(
    companyId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): Promise<{
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
  }> {
    const [period1Invoices, period1Payments, period2Invoices, period2Payments] = await Promise.all([
      prisma.invoices.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          status: {
            not: 'draft', // Exclure les factures en brouillon
          },
          invoice_date: { gte: period1Start, lte: period1End },
        },
      }),
      prisma.payments.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          payment_date: { gte: period1Start, lte: period1End },
        },
      }),
      prisma.invoices.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          status: {
            not: 'draft', // Exclure les factures en brouillon
          },
          invoice_date: { gte: period2Start, lte: period2End },
        },
      }),
      prisma.payments.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          payment_date: { gte: period2Start, lte: period2End },
        },
      }),
    ]);

    const period1Revenue = period1Payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const period2Revenue = period2Payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const period1 = {
      revenue: period1Revenue,
      invoices: period1Invoices.length,
      payments: period1Payments.length,
      averageInvoice: period1Invoices.length > 0 ? period1Revenue / period1Invoices.length : 0,
    };

    const period2 = {
      revenue: period2Revenue,
      invoices: period2Invoices.length,
      payments: period2Payments.length,
      averageInvoice: period2Invoices.length > 0 ? period2Revenue / period2Invoices.length : 0,
    };

    return {
      period1,
      period2,
      comparison: {
        revenueChange: period2Revenue - period1Revenue,
        revenueChangePercent: period1Revenue > 0 ? ((period2Revenue - period1Revenue) / period1Revenue) * 100 : 0,
        invoiceChange: period2Invoices.length - period1Invoices.length,
        invoiceChangePercent:
          period1Invoices.length > 0
            ? ((period2Invoices.length - period1Invoices.length) / period1Invoices.length) * 100
            : 0,
      },
    };
  }

  // 12. Rapport de synthèse financière (Financial Summary)
  async generateFinancialSummaryReport(
    companyId: string,
    filters: ReportFilters
  ): Promise<{
    revenue: {
      total: number;
      byMonth: Array<{ month: string; amount: number }>;
      byCustomer: Array<{ customerName: string; amount: number }>;
    };
    outstanding: {
      total: number;
      overdue: number;
      aging: Array<{ period: string; amount: number }>;
    };
    payments: {
      total: number;
      byMethod: Array<{ method: string; amount: number }>;
    };
    keyMetrics: {
      averageInvoice: number;
      averagePayment: number;
      collectionRate: number;
      daysToPay: number;
    };
  }> {
    const revenueReport = await this.generateRevenueReport(companyId, filters);
    const agingReport = await this.generateAgingReport(companyId);
    const paymentsReport = await this.generatePaymentsReport(companyId, filters);

    // Calculer les métriques clés
    const allInvoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        status: {
          notIn: ['draft', 'cancelled'], // Exclure les factures en brouillon et annulées
        },
        ...(filters.startDate || filters.endDate
          ? {
              invoice_date: {
                ...(filters.startDate ? { gte: filters.startDate } : {}),
                ...(filters.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      include: { payments: true },
    });

    const totalInvoiced = allInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalPaid = allInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
    const averageInvoice = allInvoices.length > 0 ? totalInvoiced / allInvoices.length : 0;

    // Calculer le délai moyen de paiement
    let totalDaysToPay = 0;
    let paidInvoicesCount = 0;

    for (const invoice of allInvoices) {
      if (invoice.payments.length > 0) {
        const firstPayment = invoice.payments.sort(
          (a, b) => a.payment_date.getTime() - b.payment_date.getTime()
        )[0];
        const daysToPay = Math.floor(
          (firstPayment.payment_date.getTime() - invoice.invoice_date.getTime()) / (24 * 60 * 60 * 1000)
        );
        totalDaysToPay += daysToPay;
        paidInvoicesCount += 1;
      }
    }

    const daysToPay = paidInvoicesCount > 0 ? totalDaysToPay / paidInvoicesCount : 0;

    return {
      revenue: {
        total: revenueReport.totalRevenue,
        byMonth: revenueReport.byMonth.map((m) => ({ month: m.month, amount: m.revenue })),
        byCustomer: revenueReport.byCustomer.slice(0, 10).map((c) => ({ customerName: c.customerName, amount: c.revenue })),
      },
      outstanding: {
        total: agingReport.totalOutstanding,
        overdue: agingReport.invoices
          .filter((inv) => inv.daysOverdue > 0)
          .reduce((sum, inv) => sum + inv.remainingBalance, 0),
        aging: agingReport.byPeriod,
      },
      payments: {
        total: paymentsReport.totalAmount,
        byMethod: (paymentsReport.byMethod as any),
      },
      keyMetrics: {
        averageInvoice,
        averagePayment: paymentsReport.totalCount > 0 ? paymentsReport.totalAmount / paymentsReport.totalCount : 0,
        collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
        daysToPay,
      },
    };
  }
}

export default new ReportingService();

