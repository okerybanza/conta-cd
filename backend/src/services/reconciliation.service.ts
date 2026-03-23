import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import CustomError from '../utils/CustomError';
import journalEntryService from './journalEntry.service';

export interface ReconciliationPeriod {
  startDate: Date;
  endDate: Date;
}

export interface InvoiceReconciliationResult {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: Date;
  dueDate: Date;
  expectedAmount: number;
  totalPayments: number;
  difference: number;
  isReconciled: boolean;
  lastReconciledAt: Date | null;
  issues: string[];
}

export interface JournalEntryReconciliationResult {
  transactionId: string;
  transactionType: 'invoice' | 'payment' | 'expense' | 'payroll';
  transactionDate: Date;
  transactionAmount: number;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  isReconciled: boolean;
  issues: string[];
}

export interface ReconciliationReport {
  period: ReconciliationPeriod;
  generatedAt: Date;
  invoices: {
    total: number;
    reconciled: number;
    unreconciled: number;
    totalDifference: number;
    results: InvoiceReconciliationResult[];
  };
  journalEntries: {
    total: number;
    reconciled: number;
    unreconciled: number;
    missingEntries: number;
    amountMismatches: number;
    results: JournalEntryReconciliationResult[];
  };
  summary: {
    hasIssues: boolean;
    totalIssues: number;
    criticalIssues: number;
  };
}

export class ReconciliationService {
  /**
   * Réconcilier les factures avec leurs paiements
   */
  async reconcileInvoicesPayments(
    companyId: string,
    period: ReconciliationPeriod
  ): Promise<InvoiceReconciliationResult[]> {
    // Récupérer toutes les factures de la période
    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        invoice_date: {
          gte: period.startDate,
          lte: period.endDate,
        },
        deleted_at: null,
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
        payments: {
          where: {
            deleted_at: null,
            status: 'confirmed',
          },
        },
      },
    });

    const results: InvoiceReconciliationResult[] = [];

    for (const invoice of invoices) {
      // Calculer le total des paiements
      const totalPayments = invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      const expectedAmount = Number(invoice.total_amount);
      const difference = expectedAmount - totalPayments;
      const isReconciled = Math.abs(difference) < 0.01;

      // Détecter les problèmes
      const issues: string[] = [];

      if (!isReconciled) {
        if (difference > 0.01) {
          issues.push(`Facture partiellement payée : ${difference.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CDF restants`);
        } else if (difference < -0.01) {
          issues.push(`Surpaiement détecté : ${Math.abs(difference).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CDF`);
        }
      }

      // Vérifier si le statut de la facture correspond
      if (invoice.status === 'paid' && !isReconciled) {
        issues.push('Statut "payé" mais montant non réconcilié');
      } else if (invoice.status === 'sent' && isReconciled) {
        issues.push('Facture payée mais statut toujours "envoyé"');
      }

      // Vérifier les dates de paiement
      const hasFuturePayments = invoice.payments.some(
        (p) => new Date(p.payment_date) > new Date()
      );
      if (hasFuturePayments) {
        issues.push('Paiements avec dates futures détectés');
      }

      const customerName =
        invoice.customers.type === 'particulier'
          ? `${invoice.customers.first_name || ''} ${invoice.customers.last_name || ''}`.trim()
          : invoice.customers.business_name || '';

      results.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerId: invoice.customer_id,
        customerName,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        expectedAmount,
        totalPayments,
        difference,
        isReconciled,
        lastReconciledAt: new Date(),
        issues,
      });
    }

    logger.info(`Reconciled ${invoices.length} invoices for company ${companyId}`, {
      companyId,
      period,
      reconciled: results.filter((r) => r.isReconciled).length,
      unreconciled: results.filter((r) => !r.isReconciled).length,
    });

    return results;
  }

  /**
   * Réconcilier les transactions avec leurs écritures comptables
   */
  async reconcileJournalEntries(
    companyId: string,
    period: ReconciliationPeriod
  ): Promise<JournalEntryReconciliationResult[]> {
    const results: JournalEntryReconciliationResult[] = [];

    // 1. Vérifier les factures
    const invoices = await prisma.invoices.findMany({
      where: {
        company_id: companyId,
        invoice_date: {
          gte: period.startDate,
          lte: period.endDate,
        },
        deleted_at: null,
        status: {
          not: 'cancelled',
        },
      },
    });

    for (const invoice of invoices) {
      const journalEntry = await prisma.journal_entries.findFirst({
        where: {
          company_id: companyId,
          source_type: 'invoice',
          source_id: invoice.id,
          status: 'posted',
        },
      });

      const issues: string[] = [];

      if (!journalEntry) {
        issues.push('Écriture comptable manquante');
      } else {
        // Vérifier la cohérence des montants
        const entryLines = await prisma.journal_entry_lines.findMany({
          where: {
            journal_entry_id: journalEntry.id,
          },
        });

        const totalDebit = entryLines.reduce(
          (sum, line) => sum + Number(line.debit),
          0
        );
        const totalCredit = entryLines.reduce(
          (sum, line) => sum + Number(line.credit),
          0
        );

        // Vérifier que le montant de l'écriture correspond à la facture
        const invoiceAmount = Number(invoice.total_amount);
        if (Math.abs(totalDebit - invoiceAmount) > 0.01 && Math.abs(totalCredit - invoiceAmount) > 0.01) {
          issues.push(`Incohérence de montant : facture ${invoiceAmount.toLocaleString('fr-FR')} vs écriture ${totalDebit.toLocaleString('fr-FR')}`);
        }
      }

      results.push({
        transactionId: invoice.id,
        transactionType: 'invoice',
        transactionDate: invoice.invoice_date,
        transactionAmount: Number(invoice.total_amount),
        journalEntryId: journalEntry?.id || null,
        journalEntryNumber: journalEntry?.entry_number || null,
        isReconciled: !!journalEntry && issues.length === 0,
        issues,
      });
    }

    // 2. Vérifier les paiements
    const payments = await prisma.payments.findMany({
      where: {
        company_id: companyId,
        payment_date: {
          gte: period.startDate,
          lte: period.endDate,
        },
        deleted_at: null,
        status: 'confirmed',
      },
    });

    for (const payment of payments) {
      const journalEntry = await prisma.journal_entries.findFirst({
        where: {
          company_id: companyId,
          source_type: 'payment',
          source_id: payment.id,
          status: 'posted',
        },
      });

      const issues: string[] = [];

      if (!journalEntry) {
        issues.push('Écriture comptable manquante');
      } else {
        const entryLines = await prisma.journal_entry_lines.findMany({
          where: {
            journal_entry_id: journalEntry.id,
          },
        });

        const totalDebit = entryLines.reduce(
          (sum, line) => sum + Number(line.debit),
          0
        );
        const paymentAmount = Number(payment.amount);

        if (Math.abs(totalDebit - paymentAmount) > 0.01) {
          issues.push(`Incohérence de montant : paiement ${paymentAmount.toLocaleString('fr-FR')} vs écriture ${totalDebit.toLocaleString('fr-FR')}`);
        }
      }

      results.push({
        transactionId: payment.id,
        transactionType: 'payment',
        transactionDate: payment.payment_date,
        transactionAmount: Number(payment.amount),
        journalEntryId: journalEntry?.id || null,
        journalEntryNumber: journalEntry?.entry_number || null,
        isReconciled: !!journalEntry && issues.length === 0,
        issues,
      });
    }

    // 3. Vérifier les dépenses
    const expenses = await prisma.expenses.findMany({
      where: {
        company_id: companyId,
        expense_date: {
          gte: period.startDate,
          lte: period.endDate,
        },
        deleted_at: null,
        status: {
          in: ['validated', 'paid'],
        },
      },
    });

    for (const expense of expenses) {
      const journalEntry = await prisma.journal_entries.findFirst({
        where: {
          company_id: companyId,
          source_type: 'expense',
          source_id: expense.id,
          status: 'posted',
        },
      });

      const issues: string[] = [];

      if (!journalEntry) {
        issues.push('Écriture comptable manquante');
      } else {
        const entryLines = await prisma.journal_entry_lines.findMany({
          where: {
            journal_entry_id: journalEntry.id,
          },
        });

        const totalCredit = entryLines.reduce(
          (sum, line) => sum + Number(line.credit),
          0
        );
        const expenseAmount = Number(expense.amount_ttc);

        if (Math.abs(totalCredit - expenseAmount) > 0.01) {
          issues.push(`Incohérence de montant : dépense ${expenseAmount.toLocaleString('fr-FR')} vs écriture ${totalCredit.toLocaleString('fr-FR')}`);
        }
      }

      results.push({
        transactionId: expense.id,
        transactionType: 'expense',
        transactionDate: expense.expense_date,
        transactionAmount: Number(expense.amount_ttc),
        journalEntryId: journalEntry?.id || null,
        journalEntryNumber: journalEntry?.entry_number || null,
        isReconciled: !!journalEntry && issues.length === 0,
        issues,
      });
    }

    // 4. Vérifier les fiches de paie
    const payrolls = await prisma.payrolls.findMany({
      where: {
        company_id: companyId,
        pay_date: {
          gte: period.startDate,
          lte: period.endDate,
        },
        status: 'paid',
      },
    });

    for (const payroll of payrolls) {
      const journalEntry = await prisma.journal_entries.findFirst({
        where: {
          company_id: companyId,
          source_type: 'payroll',
          source_id: payroll.id,
          status: 'posted',
        },
      });

      const issues: string[] = [];

      if (!journalEntry) {
        issues.push('Écriture comptable manquante');
      } else {
        const entryLines = await prisma.journal_entry_lines.findMany({
          where: {
            journal_entry_id: journalEntry.id,
          },
        });

        const totalDebit = entryLines.reduce(
          (sum, line) => sum + Number(line.debit),
          0
        );
        // Le coût total pour l'entreprise (salaire brut + charges patronales)
        const payrollCost = Number(payroll.gross_salary) + (Number(payroll.total_deductions) || 0);

        if (Math.abs(totalDebit - payrollCost) > 0.01) {
          issues.push(`Incohérence de montant : paie ${payrollCost.toLocaleString('fr-FR')} vs écriture ${totalDebit.toLocaleString('fr-FR')}`);
        }
      }

      results.push({
        transactionId: payroll.id,
        transactionType: 'payroll',
        transactionDate: payroll.pay_date || payroll.created_at,
        transactionAmount: Number(payroll.net_salary),
        journalEntryId: journalEntry?.id || null,
        journalEntryNumber: journalEntry?.entry_number || null,
        isReconciled: !!journalEntry && issues.length === 0,
        issues,
      });
    }

    logger.info(`Reconciled journal entries for company ${companyId}`, {
      companyId,
      period,
      totalTransactions: results.length,
      reconciled: results.filter((r) => r.isReconciled).length,
      unreconciled: results.filter((r) => !r.isReconciled).length,
    });

    return results;
  }

  /**
   * Générer un rapport de réconciliation complet
   */
  async generateReconciliationReport(
    companyId: string,
    period: ReconciliationPeriod
  ): Promise<ReconciliationReport> {
    const [invoiceResults, journalEntryResults] = await Promise.all([
      this.reconcileInvoicesPayments(companyId, period),
      this.reconcileJournalEntries(companyId, period),
    ]);

    const unreconciledInvoices = invoiceResults.filter((r) => !r.isReconciled);
    const unreconciledEntries = journalEntryResults.filter((r) => !r.isReconciled);
    const missingEntries = journalEntryResults.filter((r) => !r.journalEntryId);
    const amountMismatches = journalEntryResults.filter(
      (r) => r.journalEntryId && r.issues.some((issue) => issue.includes('Incohérence de montant'))
    );

    const totalIssues =
      unreconciledInvoices.length +
      missingEntries.length +
      amountMismatches.length;
    const criticalIssues = missingEntries.length + amountMismatches.length;

    return {
      period,
      generatedAt: new Date(),
      invoices: {
        total: invoiceResults.length,
        reconciled: invoiceResults.filter((r) => r.isReconciled).length,
        unreconciled: unreconciledInvoices.length,
        totalDifference: unreconciledInvoices.reduce(
          (sum, r) => sum + Math.abs(r.difference),
          0
        ),
        results: invoiceResults,
      },
      journalEntries: {
        total: journalEntryResults.length,
        reconciled: journalEntryResults.filter((r) => r.isReconciled).length,
        unreconciled: unreconciledEntries.length,
        missingEntries: missingEntries.length,
        amountMismatches: amountMismatches.length,
        results: journalEntryResults,
      },
      summary: {
        hasIssues: totalIssues > 0,
        totalIssues,
        criticalIssues,
      },
    };
  }
}

export default new ReconciliationService();

