import prisma from '../config/database';
import logger from '../utils/logger';
import CustomError from '../utils/CustomError';

export type AgedBalanceType = 'receivables' | 'payables';

export interface AgedBalanceItem {
  id: string; // invoiceId ou expenseId
  number: string; // invoiceNumber ou expenseNumber
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  date: Date; // invoiceDate ou expenseDate
  dueDate: Date;
  amount: number; // remainingBalance ou amountTtc
  daysOverdue: number;
  current: number; // 0-30 jours
  days1_30: number; // 1-30 jours
  days31_60: number; // 31-60 jours
  days61_90: number; // 61-90 jours
  daysOver90: number; // > 90 jours
}

export interface AgedBalanceReport {
  type: AgedBalanceType;
  asOfDate: Date;
  items: AgedBalanceItem[];
  totals: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    daysOver90: number;
    total: number;
  };
  summary: {
    totalItems: number;
    totalAmount: number;
    averageDaysOverdue: number;
    itemsOver90Days: number;
    amountOver90Days: number;
  };
}

export class AgedBalanceService {
  /**
   * Calculer le nombre de jours de retard
   */
  private getDaysOverdue(dueDate: Date, asOfDate: Date): number {
    const diffTime = asOfDate.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Répartir un montant dans les tranches d'âge
   */
  private distributeAmountByAge(
    amount: number,
    daysOverdue: number
  ): {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    daysOver90: number;
  } {
    if (daysOverdue <= 0) {
      return {
        current: amount,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        daysOver90: 0,
      };
    } else if (daysOverdue <= 30) {
      return {
        current: 0,
        days1_30: amount,
        days31_60: 0,
        days61_90: 0,
        daysOver90: 0,
      };
    } else if (daysOverdue <= 60) {
      return {
        current: 0,
        days1_30: 0,
        days31_60: amount,
        days61_90: 0,
        daysOver90: 0,
      };
    } else if (daysOverdue <= 90) {
      return {
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: amount,
        daysOver90: 0,
      };
    } else {
      return {
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        daysOver90: amount,
      };
    }
  }

  /**
   * Générer la Balance Âgée des Créances Clients
   */
  async generateAgedReceivables(
    companyId: string,
    asOfDate?: Date
  ): Promise<AgedBalanceReport> {
    const date = asOfDate || new Date();

    // Récupérer toutes les factures non payées
    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        status: {
          in: ['sent', 'partially_paid'], // Factures envoyées ou partiellement payées
        },
      },
      include: {
        customers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            business_name: true,
            type: true,
          },
        },
      },
      orderBy: {
        due_date: 'asc',
      },
    });

    const items: AgedBalanceItem[] = [];

    for (const invoice of invoices) {
      // Calculer le solde restant (total_amount - paid_amount)
      const totalAmount = Number(invoice.total_amount);
      const paidAmount = Number(invoice.paid_amount || 0);
      const remainingBalance = totalAmount - paidAmount;

      // Ignorer les factures avec solde nul ou négatif
      if (remainingBalance <= 0) continue;

      const daysOverdue = this.getDaysOverdue(invoice.due_date, date);
      const ageDistribution = this.distributeAmountByAge(remainingBalance, daysOverdue);

      const customerName =
        invoice.customers.type === 'particulier'
          ? `${invoice.customers.first_name || ''} ${invoice.customers.last_name || ''}`.trim()
          : invoice.customers.business_name || '';

      items.push({
        id: invoice.id,
        number: invoice.invoice_number,
        customerId: invoice.customer_id,
        customerName,
        date: invoice.invoice_date,
        dueDate: invoice.due_date,
        amount: remainingBalance,
        daysOverdue,
        ...ageDistribution,
      });
    }

    // Calculer les totaux
    const totals = {
      current: items.reduce((sum, item) => sum + item.current, 0),
      days1_30: items.reduce((sum, item) => sum + item.days1_30, 0),
      days31_60: items.reduce((sum, item) => sum + item.days31_60, 0),
      days61_90: items.reduce((sum, item) => sum + item.days61_90, 0),
      daysOver90: items.reduce((sum, item) => sum + item.daysOver90, 0),
      total: items.reduce((sum, item) => sum + item.amount, 0),
    };

    // Calculer le résumé
    const itemsOver90Days = items.filter((item) => item.daysOverdue > 90).length;
    const amountOver90Days = items
      .filter((item) => item.daysOverdue > 90)
      .reduce((sum, item) => sum + item.amount, 0);
    const averageDaysOverdue =
      items.length > 0
        ? items.reduce((sum, item) => sum + item.daysOverdue, 0) / items.length
        : 0;

    logger.info(`Aged receivables generated for company ${companyId}`, {
      companyId,
      asOfDate: date,
      totalItems: items.length,
      totalAmount: totals.total,
      itemsOver90Days,
    });

    return {
      type: 'receivables',
      asOfDate: date,
      items,
      totals,
      summary: {
        totalItems: items.length,
        totalAmount: totals.total,
        averageDaysOverdue,
        itemsOver90Days,
        amountOver90Days,
      },
    };
  }

  /**
   * Générer la Balance Âgée des Dettes Fournisseurs
   */
  async generateAgedPayables(
    companyId: string,
    asOfDate?: Date
  ): Promise<AgedBalanceReport> {
    const date = asOfDate || new Date();

    // Récupérer toutes les dépenses non payées
    const expenses = await prisma.expenses.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        status: {
          in: ['validated', 'partially_paid'], // Dépenses validées ou partiellement payées
        },
      },
      include: {
        suppliers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expense_date: 'asc',
      },
    });

    const items: AgedBalanceItem[] = [];

    for (const expense of expenses) {
      // Calculer le solde restant (montant TTC - montant payé si disponible)
      const amountTtc = Number(expense.amount_ttc || expense.total_amount || 0);
      // Pour les dépenses, le statut 'paid' signifie qu'elles sont payées, sinon on considère le montant total comme dû
      const paidAmount = expense.status === 'paid' ? amountTtc : 0;
      const remainingBalance = amountTtc - paidAmount;

      // Ignorer les dépenses avec solde nul ou négatif
      if (remainingBalance <= 0) continue;

      // Utiliser expenseDate comme dueDate (les dépenses n'ont pas toujours de dueDate)
      const dueDate = expense.expense_date;
      const daysOverdue = this.getDaysOverdue(dueDate, date);
      const ageDistribution = this.distributeAmountByAge(remainingBalance, daysOverdue);

      items.push({
        id: expense.id,
        number: expense.expense_number,
        supplierId: expense.supplier_id || undefined,
        supplierName: (expense as any).suppliers?.name || expense.supplier_name || 'Non spécifié',
        date: expense.expense_date,
        dueDate,
        amount: remainingBalance,
        daysOverdue,
        ...ageDistribution,
      });
    }

    // Calculer les totaux
    const totals = {
      current: items.reduce((sum, item) => sum + item.current, 0),
      days1_30: items.reduce((sum, item) => sum + item.days1_30, 0),
      days31_60: items.reduce((sum, item) => sum + item.days31_60, 0),
      days61_90: items.reduce((sum, item) => sum + item.days61_90, 0),
      daysOver90: items.reduce((sum, item) => sum + item.daysOver90, 0),
      total: items.reduce((sum, item) => sum + item.amount, 0),
    };

    // Calculer le résumé
    const itemsOver90Days = items.filter((item) => item.daysOverdue > 90).length;
    const amountOver90Days = items
      .filter((item) => item.daysOverdue > 90)
      .reduce((sum, item) => sum + item.amount, 0);
    const averageDaysOverdue =
      items.length > 0
        ? items.reduce((sum, item) => sum + item.daysOverdue, 0) / items.length
        : 0;

    logger.info(`Aged payables generated for company ${companyId}`, {
      companyId,
      asOfDate: date,
      totalItems: items.length,
      totalAmount: totals.total,
      itemsOver90Days,
    });

    return {
      type: 'payables',
      asOfDate: date,
      items,
      totals,
      summary: {
        totalItems: items.length,
        totalAmount: totals.total,
        averageDaysOverdue,
        itemsOver90Days,
        amountOver90Days,
      },
    };
  }

  /**
   * Générer la Balance Âgée (créances ou dettes)
   */
  async generateAgedBalance(
    companyId: string,
    type: AgedBalanceType,
    asOfDate?: Date
  ): Promise<AgedBalanceReport> {
    if (type === 'receivables') {
      return this.generateAgedReceivables(companyId, asOfDate);
    } else {
      return this.generateAgedPayables(companyId, asOfDate);
    }
  }
}

export default new AgedBalanceService();

