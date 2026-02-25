"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
class ReconciliationService {
    /**
     * Réconcilier les factures avec leurs paiements
     */
    async reconcileInvoicesPayments(companyId, period) {
        // Récupérer toutes les factures de la période
        const invoices = await database_1.default.invoices.findMany({
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
        const results = [];
        for (const invoice of invoices) {
            // Calculer le total des paiements
            const totalPayments = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            const expectedAmount = Number(invoice.totalAmount);
            const difference = expectedAmount - totalPayments;
            const isReconciled = Math.abs(difference) < 0.01;
            // Détecter les problèmes
            const issues = [];
            if (!isReconciled) {
                if (difference > 0.01) {
                    issues.push(`Facture partiellement payée : ${difference.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CDF restants`);
                }
                else if (difference < -0.01) {
                    issues.push(`Surpaiement détecté : ${Math.abs(difference).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} CDF`);
                }
            }
            // Vérifier si le statut de la facture correspond
            if (invoice.status === 'paid' && !isReconciled) {
                issues.push('Statut "payé" mais montant non réconcilié');
            }
            else if (invoice.status === 'sent' && isReconciled) {
                issues.push('Facture payée mais statut toujours "envoyé"');
            }
            // Vérifier les dates de paiement
            const hasFuturePayments = invoice.payments.some((p) => new Date(p.paymentDate) > new Date());
            if (hasFuturePayments) {
                issues.push('Paiements avec dates futures détectés');
            }
            const customerName = invoice.customer.type === 'particulier'
                ? `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim()
                : invoice.customer.businessName || '';
            results.push({
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                customerId: invoice.customerId,
                customerName,
                invoiceDate: invoice.invoice_date,
                dueDate: invoice.dueDate,
                expectedAmount,
                totalPayments,
                difference,
                isReconciled,
                lastReconciledAt: new Date(),
                issues,
            });
        }
        logger_1.default.info(`Reconciled ${invoices.length} invoices for company ${companyId}`, {
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
    async reconcileJournalEntries(companyId, period) {
        const results = [];
        // 1. Vérifier les factures
        const invoices = await database_1.default.invoices.findMany({
            where: {
                companyId,
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
            const journalEntry = await database_1.default.journal_entries.findFirst({
                where: {
                    companyId,
                    sourceType: 'invoice',
                    sourceId: invoice.id,
                    status: 'posted',
                },
            });
            const issues = [];
            if (!journalEntry) {
                issues.push('Écriture comptable manquante');
            }
            else {
                // Vérifier la cohérence des montants
                const entryLines = await database_1.default.journal_entry_lines.findMany({
                    where: {
                        journalEntryId: journalEntry.id,
                    },
                });
                const totalDebit = entryLines.reduce((sum, line) => sum + Number(line.debit), 0);
                const totalCredit = entryLines.reduce((sum, line) => sum + Number(line.credit), 0);
                // Vérifier que le montant de l'écriture correspond à la facture
                const invoiceAmount = Number(invoice.totalAmount);
                if (Math.abs(totalDebit - invoiceAmount) > 0.01 && Math.abs(totalCredit - invoiceAmount) > 0.01) {
                    issues.push(`Incohérence de montant : facture ${invoiceAmount.toLocaleString('fr-FR')} vs écriture ${totalDebit.toLocaleString('fr-FR')}`);
                }
            }
            results.push({
                transactionId: invoice.id,
                transactionType: 'invoice',
                transactionDate: invoice.invoice_date,
                transactionAmount: Number(invoice.totalAmount),
                journalEntryId: journalEntry?.id || null,
                journalEntryNumber: journalEntry?.entryNumber || null,
                isReconciled: !!journalEntry && issues.length === 0,
                issues,
            });
        }
        // 2. Vérifier les paiements
        const payments = await database_1.default.payment.findMany({
            where: {
                companyId,
                paymentDate: {
                    gte: period.startDate,
                    lte: period.endDate,
                },
                deleted_at: null,
                status: 'confirmed',
            },
        });
        for (const payment of payments) {
            const journalEntry = await database_1.default.journal_entries.findFirst({
                where: {
                    companyId,
                    sourceType: 'payment',
                    sourceId: payment.id,
                    status: 'posted',
                },
            });
            const issues = [];
            if (!journalEntry) {
                issues.push('Écriture comptable manquante');
            }
            else {
                const entryLines = await database_1.default.journal_entry_lines.findMany({
                    where: {
                        journalEntryId: journalEntry.id,
                    },
                });
                const totalDebit = entryLines.reduce((sum, line) => sum + Number(line.debit), 0);
                const paymentAmount = Number(payment.amount);
                if (Math.abs(totalDebit - paymentAmount) > 0.01) {
                    issues.push(`Incohérence de montant : paiement ${paymentAmount.toLocaleString('fr-FR')} vs écriture ${totalDebit.toLocaleString('fr-FR')}`);
                }
            }
            results.push({
                transactionId: payment.id,
                transactionType: 'payment',
                transactionDate: payment.paymentDate,
                transactionAmount: Number(payment.amount),
                journalEntryId: journalEntry?.id || null,
                journalEntryNumber: journalEntry?.entryNumber || null,
                isReconciled: !!journalEntry && issues.length === 0,
                issues,
            });
        }
        // 3. Vérifier les dépenses
        const expenses = await database_1.default.expense.findMany({
            where: {
                companyId,
                expenseDate: {
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
            const journalEntry = await database_1.default.journal_entries.findFirst({
                where: {
                    companyId,
                    sourceType: 'expense',
                    sourceId: expense.id,
                    status: 'posted',
                },
            });
            const issues = [];
            if (!journalEntry) {
                issues.push('Écriture comptable manquante');
            }
            else {
                const entryLines = await database_1.default.journal_entry_lines.findMany({
                    where: {
                        journalEntryId: journalEntry.id,
                    },
                });
                const totalCredit = entryLines.reduce((sum, line) => sum + Number(line.credit), 0);
                const expenseAmount = Number(expense.amountTtc);
                if (Math.abs(totalCredit - expenseAmount) > 0.01) {
                    issues.push(`Incohérence de montant : dépense ${expenseAmount.toLocaleString('fr-FR')} vs écriture ${totalCredit.toLocaleString('fr-FR')}`);
                }
            }
            results.push({
                transactionId: expense.id,
                transactionType: 'expense',
                transactionDate: expense.expenseDate,
                transactionAmount: Number(expense.amountTtc),
                journalEntryId: journalEntry?.id || null,
                journalEntryNumber: journalEntry?.entryNumber || null,
                isReconciled: !!journalEntry && issues.length === 0,
                issues,
            });
        }
        // 4. Vérifier les fiches de paie
        const payrolls = await database_1.default.payroll.findMany({
            where: {
                companyId,
                // Filtrer sur la date de paie (champ payDate dans le modèle Prisma)
                payDate: {
                    gte: period.startDate,
                    lte: period.endDate,
                },
                status: 'paid',
            },
        });
        for (const payroll of payrolls) {
            const journalEntry = await database_1.default.journal_entries.findFirst({
                where: {
                    companyId,
                    sourceType: 'payroll',
                    sourceId: payroll.id,
                    status: 'posted',
                },
            });
            const issues = [];
            if (!journalEntry) {
                issues.push('Écriture comptable manquante');
            }
            else {
                const entryLines = await database_1.default.journal_entry_lines.findMany({
                    where: {
                        journalEntryId: journalEntry.id,
                    },
                });
                const totalDebit = entryLines.reduce((sum, line) => sum + Number(line.debit), 0);
                // Le coût total pour l'entreprise (salaire brut + charges patronales)
                const payrollCost = Number(payroll.grossSalary) + (Number(payroll.totalDeductions) || 0);
                if (Math.abs(totalDebit - payrollCost) > 0.01) {
                    issues.push(`Incohérence de montant : paie ${payrollCost.toLocaleString('fr-FR')} vs écriture ${totalDebit.toLocaleString('fr-FR')}`);
                }
            }
            results.push({
                transactionId: payroll.id,
                transactionType: 'payroll',
                // Utiliser la date de paie (payDate) comme date de transaction,
                // avec repli sur createdAt si jamais absente (par sécurité)
                transactionDate: payroll.payDate || payroll.createdAt,
                transactionAmount: Number(payroll.netSalary),
                journalEntryId: journalEntry?.id || null,
                journalEntryNumber: journalEntry?.entryNumber || null,
                isReconciled: !!journalEntry && issues.length === 0,
                issues,
            });
        }
        logger_1.default.info(`Reconciled journal entries for company ${companyId}`, {
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
    async generateReconciliationReport(companyId, period) {
        const [invoiceResults, journalEntryResults] = await Promise.all([
            this.reconcileInvoicesPayments(companyId, period),
            this.reconcileJournalEntries(companyId, period),
        ]);
        const unreconciledInvoices = invoiceResults.filter((r) => !r.isReconciled);
        const unreconciledEntries = journalEntryResults.filter((r) => !r.isReconciled);
        const missingEntries = journalEntryResults.filter((r) => !r.journalEntryId);
        const amountMismatches = journalEntryResults.filter((r) => r.journalEntryId && r.issues.some((issue) => issue.includes('Incohérence de montant')));
        const totalIssues = unreconciledInvoices.length +
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
                totalDifference: unreconciledInvoices.reduce((sum, r) => sum + Math.abs(r.difference), 0),
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
exports.ReconciliationService = ReconciliationService;
exports.default = new ReconciliationService();
//# sourceMappingURL=reconciliation.service.js.map