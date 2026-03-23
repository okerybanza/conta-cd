import prisma from '../config/database';
import logger from '../utils/logger';
import cacheService from './cache.service';

export interface TVADeclaration {
  period: string;
  startDate: Date;
  endDate: Date;
  taxableRevenue: number;
  tvaCollectee: number;
  taxableExpenses: number;
  tvaDeduite: number;
  tvaAVerser: number;
  tvaCredit: number;
  invoices: any[];
  expenses: any[];
  summary?: any;
  vatToPay?: number;
}

export class TVAService {

  async generateDeclaration(companyId: string, startDate: Date, endDate: Date): Promise<TVADeclaration> {
    const cacheKey = `tva:${companyId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = await cacheService.get<TVADeclaration>(cacheKey);
    if (cached) return cached;

    const invoices = await (prisma as any).invoices.findMany({
      where: { company_id: companyId, status: { in: ['paid', 'partially_paid', 'sent', 'overdue'] }, issue_date: { gte: startDate, lte: endDate }, deleted_at: null },
      include: { invoice_lines: true },
    });

    const expenses = await (prisma as any).expenses.findMany({
      where: { company_id: companyId, expense_date: { gte: startDate, lte: endDate }, deleted_at: null },
    });

    let taxableRevenue = 0, tvaCollectee = 0;
    const invoiceDetails: any[] = [];
    for (const invoice of invoices) {
      let ht = 0, tax = 0;
      for (const line of invoice.invoice_lines || []) {
        const lineHT = Number(line.unit_price || 0) * Number(line.quantity || 1);
        ht += lineHT;
        tax += lineHT * (Number(line.tax_rate || 0) / 100);
      }
      taxableRevenue += ht;
      tvaCollectee += tax;
      if (tax > 0) invoiceDetails.push({ number: invoice.invoice_number, date: invoice.issue_date, ht, tva: tax });
    }

    let taxableExpenses = 0, tvaDeduite = 0;
    const expenseDetails: any[] = [];
    for (const expense of expenses) {
      const amount = Number(expense.amount || 0);
      const tax = amount * (Number(expense.tax_rate || 0) / 100);
      if (tax > 0) { taxableExpenses += amount; tvaDeduite += tax; expenseDetails.push({ description: expense.description, date: expense.expense_date, ht: amount, tva: tax }); }
    }

    const solde = tvaCollectee - tvaDeduite;
    const declaration: TVADeclaration = {
      period: startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      startDate, endDate,
      taxableRevenue: parseFloat(taxableRevenue.toFixed(2)),
      tvaCollectee: parseFloat(tvaCollectee.toFixed(2)),
      taxableExpenses: parseFloat(taxableExpenses.toFixed(2)),
      tvaDeduite: parseFloat(tvaDeduite.toFixed(2)),
      tvaAVerser: solde > 0 ? parseFloat(solde.toFixed(2)) : 0,
      tvaCredit: solde < 0 ? parseFloat(Math.abs(solde).toFixed(2)) : 0,
      invoices: invoiceDetails,
      expenses: expenseDetails,
      vatToPay: solde > 0 ? parseFloat(solde.toFixed(2)) : 0,
      summary: { vatToPay: solde > 0 ? parseFloat(solde.toFixed(2)) : 0, vatCredit: solde < 0 ? parseFloat(Math.abs(solde).toFixed(2)) : 0 },
    };

    await cacheService.set(cacheKey, declaration, 3600);
    return declaration;
  }

  async generateVATReport(companyId: string, filters: any) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filters.endDate ? new Date(filters.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return this.generateDeclaration(companyId, start, end);
  }

  async generateVATDeclaration(companyId: string, filters: any) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filters.endDate ? new Date(filters.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return this.generateDeclaration(companyId, start, end);
  }

  async calculateVATCollected(companyId: string, filters: any) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filters.endDate ? new Date(filters.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const d = await this.generateDeclaration(companyId, start, end);
    return { amount: d.tvaCollectee, taxableRevenue: d.taxableRevenue };
  }

  async calculateVATDeductible(companyId: string, filters: any) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filters.endDate ? new Date(filters.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const d = await this.generateDeclaration(companyId, start, end);
    return { amount: d.tvaDeduite, taxableExpenses: d.taxableExpenses };
  }

  async calculateVATToPay(companyId: string, filters: any) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = filters.endDate ? new Date(filters.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const d = await this.generateDeclaration(companyId, start, end);
    return { tvaAVerser: d.tvaAVerser, tvaCredit: d.tvaCredit, vatToPay: d.tvaAVerser };
  }

  async getDeclarationHistory(companyId: string, year: number) {
    const declarations = [];
    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      if (start > new Date()) break;
      const d = await this.generateDeclaration(companyId, start, end);
      declarations.push({ month: month + 1, period: d.period, tvaCollectee: d.tvaCollectee, tvaDeduite: d.tvaDeduite, tvaAVerser: d.tvaAVerser, tvaCredit: d.tvaCredit });
    }
    return declarations;
  }
}

export default new TVAService();
