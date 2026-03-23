import prisma from '../config/database';
import logger from '../utils/logger';
import cacheService from './cache.service';

export interface AssistantInsight {
  type: 'warning' | 'tip' | 'alert' | 'success';
  category: 'cash_flow' | 'invoices' | 'expenses' | 'tax' | 'accounting' | 'growth';
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
  priority: number;
}

export class AssistantService {

  async getInsights(companyId: string): Promise<AssistantInsight[]> {
    const cacheKey = `assistant:insights:${companyId}`;
    const cached = await cacheService.get<AssistantInsight[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const insights: AssistantInsight[] = [];

    const [overdueInvoices, unpaidInvoices, expenses, recentPayments, journalEntries] = await Promise.all([
      (prisma as any).invoices.findMany({
        where: { company_id: companyId, status: 'overdue', deleted_at: null },
        select: { id: true, total_ttc: true, due_date: true, invoice_number: true },
      }),
      (prisma as any).invoices.findMany({
        where: { company_id: companyId, status: { in: ['sent', 'partially_paid'] }, deleted_at: null },
        select: { id: true, total_ttc: true, due_date: true },
      }),
      (prisma as any).expenses.findMany({
        where: { company_id: companyId, expense_date: { gte: startOfMonth }, deleted_at: null },
        select: { amount: true, category: true },
      }),
      (prisma as any).payments.findMany({
        where: { company_id: companyId, payment_date: { gte: startOfMonth }, deleted_at: null },
        select: { amount: true },
      }),
      (prisma as any).journal_entries.count({
        where: { company_id: companyId, status: 'draft', deleted_at: null },
      }),
    ]);

    // 1. Factures en retard
    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((s: number, i: any) => s + Number(i.total_ttc || 0), 0);
      insights.push({
        type: 'alert',
        category: 'invoices',
        title: `${overdueInvoices.length} facture${overdueInvoices.length > 1 ? 's' : ''} en retard`,
        message: `${totalOverdue.toLocaleString('fr-FR')} CDF de créances en retard. Relancez vos clients pour améliorer votre trésorerie.`,
        action: 'Voir les factures en retard',
        actionUrl: '/invoices?status=overdue',
        priority: 10,
      });
    }

    // 2. Factures bientôt dues (dans 7 jours)
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 7);
    const soonDue = unpaidInvoices.filter((i: any) => new Date(i.due_date) <= soon && new Date(i.due_date) >= now);
    if (soonDue.length > 0) {
      insights.push({
        type: 'warning',
        category: 'invoices',
        title: `${soonDue.length} facture${soonDue.length > 1 ? 's' : ''} à échéance cette semaine`,
        message: 'Anticipez les relances pour éviter les retards de paiement.',
        action: 'Envoyer des relances',
        actionUrl: '/invoices',
        priority: 8,
      });
    }

    // 3. Dépenses élevées ce mois
    const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    const totalRevenue = recentPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    if (totalExpenses > 0 && totalRevenue > 0) {
      const ratio = totalExpenses / totalRevenue;
      if (ratio > 0.8) {
        insights.push({
          type: 'warning',
          category: 'expenses',
          title: 'Dépenses élevées ce mois',
          message: `Vos dépenses représentent ${(ratio * 100).toFixed(0)}% de vos recettes. Analysez vos charges pour optimiser votre marge.`,
          action: 'Analyser les dépenses',
          actionUrl: '/expenses',
          priority: 7,
        });
      }
    }

    // 4. Écritures comptables en brouillon
    if (journalEntries > 0) {
      insights.push({
        type: 'tip',
        category: 'accounting',
        title: `${journalEntries} écriture${journalEntries > 1 ? 's' : ''} en brouillon`,
        message: 'Des écritures comptables sont en attente de validation. Validez-les pour avoir une comptabilité à jour.',
        action: 'Valider les écritures',
        actionUrl: '/journal',
        priority: 5,
      });
    }

    // 5. Conseil TVA mensuel
    const dayOfMonth = now.getDate();
    if (dayOfMonth >= 25) {
      insights.push({
        type: 'tip',
        category: 'tax',
        title: 'Déclaration TVA à préparer',
        message: 'Fin de mois approche. Préparez votre déclaration TVA mensuelle pour la DGI.',
        action: 'Générer la déclaration TVA',
        actionUrl: '/tva',
        priority: 6,
      });
    }

    // 6. Bonne performance
    if (overdueInvoices.length === 0 && totalRevenue > totalExpenses) {
      insights.push({
        type: 'success',
        category: 'growth',
        title: 'Bonne santé financière',
        message: `Vos recettes dépassent vos dépenses ce mois. Continuez sur cette lancée !`,
        priority: 1,
      });
    }

    // Trier par priorité
    insights.sort((a, b) => b.priority - a.priority);
    await cacheService.set(cacheKey, insights, 1800);
    logger.info('Assistant insights generated', { companyId, count: insights.length });
    return insights;
  }

  async getFinancialForecast(companyId: string): Promise<any> {
    const months = 3;
    const history = [];

    for (let i = months; i >= 1; i--) {
      const start = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const end = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);

      const [payments, expenses] = await Promise.all([
        (prisma as any).payments.aggregate({
          where: { company_id: companyId, payment_date: { gte: start, lte: end }, deleted_at: null },
          _sum: { amount: true },
        }),
        (prisma as any).expenses.aggregate({
          where: { company_id: companyId, expense_date: { gte: start, lte: end }, deleted_at: null },
          _sum: { amount: true },
        }),
      ]);

      history.push({
        month: start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: Number(payments._sum?.amount || 0),
        expenses: Number(expenses._sum?.amount || 0),
      });
    }

    // Prévision mois prochain (moyenne pondérée)
    const avgRevenue = history.reduce((s, h) => s + h.revenue, 0) / history.length;
    const avgExpenses = history.reduce((s, h) => s + h.expenses, 0) / history.length;
    const trend = history.length > 1 ? (history[history.length - 1].revenue - history[0].revenue) / history.length : 0;

    return {
      history,
      forecast: {
        month: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        estimatedRevenue: Math.round(avgRevenue + trend),
        estimatedExpenses: Math.round(avgExpenses),
        estimatedProfit: Math.round(avgRevenue + trend - avgExpenses),
      },
    };
  }
}

export default new AssistantService();
