import prisma from '../config/database';
import logger from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

export interface BankTransactionImport {
  date?: Date;
  valueDate?: Date;
  description: string;
  reference?: string;
  amount: number; // Positif = crédit, Négatif = débit
  balance?: number;
}

export interface BankStatementImport {
  accountId: string;
  statementNumber: string;
  startDate?: Date;
  endDate?: Date;
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransactionImport[];
}

export interface ReconciliationMatch {
  bankTransactionId: string;
  accountingTransactionId: string;
  matchType: 'automatic' | 'manual';
  confidence: number;
  matchedAmount: number;
  difference?: number;
}

export class BankReconciliationService {
  /**
   * Parser CSV simple pour relevés bancaires
   * Format attendu: Date,Description,Montant,Reference (optionnel)
   */
  parseCSV(csvContent: string): BankTransactionImport[] {
    const lines = csvContent.split('\n').filter((line) => line.trim());
    const transactions: BankTransactionImport[] = [];

    // Ignorer la première ligne si c'est un en-tête
    const startIndex = lines[0]?.toLowerCase().includes('date') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parser CSV simple (gérer les virgules dans les guillemets)
      const parts = this.parseCSVLine(line);
      if (parts.length < 3) continue;

      try {
        const date = new Date(parts[0]);
        const description = parts[1]?.replace(/"/g, '') || '';
        const amount = parseFloat(parts[2]?.replace(/,/g, '') || '0');
        const reference = parts[3]?.replace(/"/g, '') || undefined;

        if (isNaN(date.getTime()) || isNaN(amount)) {
          logger.warn(`Ligne ${i + 1} ignorée: format invalide`, { line });
          continue;
        }

        transactions.push({
          date,
          description,
          amount,
          reference,
        });
      } catch (error) {
        logger.warn(`Erreur parsing ligne ${i + 1}`, { error, line });
      }
    }

    return transactions;
  }

  /**
   * Parser une ligne CSV en gérant les guillemets
   */
  private parseCSVLine(line: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    return parts;
  }

  /**
   * Importer un relevé bancaire
   */
  async importBankStatement(
    companyId: string,
    accountId: string,
    statementData: BankStatementImport
  ): Promise<any> {
    // Vérifier que le compte existe et appartient à l'entreprise
    const account = await prisma.accounts.findFirst({
      where: {
        id: accountId,
        companyId,
        type: 'asset', // Seuls les comptes d'actif peuvent être bancaires
      },
    });

    if (!account) {
      throw new Error('Compte bancaire introuvable ou invalide');
    }

    // Vérifier que le numéro de relevé n'existe pas déjà
    const existing = await (prisma as any).bankStatement.findFirst({
      where: {
        companyId,
        statementNumber: statementData.statementNumber,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new Error('Un relevé avec ce numéro existe déjà');
    }

    // Créer le relevé bancaire
    const statement = await (prisma as any).bankStatement.create({
      data: {
        companyId,
        accountId,
        statementNumber: statementData.statementNumber,
        startDate: statementData.startDate,
        endDate: statementData.endDate,
        openingBalance: statementData.openingBalance,
        closingBalance: statementData.closingBalance,
        status: 'imported',
        importedAt: new Date(),
      },
    });

    // Créer les transactions
    const transactions = [];
    for (const tx of statementData.transactions) {
      const transaction = await (prisma as any).bankTransaction.create({
        data: {
          statementId: statement.id,
          transactionDate: tx.date,
          valueDate: tx.valueDate || tx.date,
          description: tx.description,
          reference: tx.reference,
          amount: tx.amount,
          balance: tx.balance,
          type: tx.amount >= 0 ? 'credit' : 'debit',
          isReconciled: false,
        },
      });
      transactions.push(transaction);
    }

    logger.info(`Bank statement imported`, {
      companyId,
      statementId: statement.id,
      transactionsCount: transactions.length,
    });

    // Lancer le rapprochement automatique
    await this.reconcileStatement(statement.id);

    return {
      ...statement,
      transactions,
    };
  }

  /**
   * Rapprocher automatiquement un relevé bancaire
   */
  async reconcileStatement(statementId: string): Promise<void> {
    const statement = await (prisma as any).bankStatement.findUnique({
      where: { id: statementId },
      include: {
        transactions: true,
        account: true,
      },
    });

    if (!statement) {
      throw new Error('Relevé bancaire introuvable');
    }

    const companyId = statement.companyId;
    const accountId = statement.accountId;

    // Récupérer les transactions comptables dans la période
    const payments = await prisma.payments.findMany({
      where: {
        company_id: companyId,
        payment_date: {
          gte: statement.startDate,
          lte: statement.endDate,
        },
        deleted_at: null,
      },
      include: {
        invoices: true,
      },
    });

    const expenses = await prisma.expenses.findMany({
      where: {
        company_id: companyId,
        expense_date: {
          gte: statement.startDate,
          lte: statement.endDate,
        },
        deleted_at: null,
      },
    });

    const journalEntries = await prisma.journal_entries.findMany({
      where: {
        company_id: companyId,
        entry_date: {
          gte: statement.startDate,
          lte: statement.endDate,
        },
        status: 'posted',
        journal_entry_lines: {
          some: {
            account_id: accountId,
          },
        },
      },
      include: {
        journal_entry_lines: {
          where: {
            account_id: accountId,
          },
        },
      },
    });

    // Rapprocher chaque transaction bancaire
    let reconciledCount = 0;

    for (const bankTx of statement.transactions) {
      const bestMatch = this.findBestMatch(
        bankTx,
        payments,
        expenses,
        journalEntries,
        accountId
      );

      if (bestMatch) {
        await (prisma as any).bankTransaction.update({
          where: { id: bankTx.id },
          data: {
            isReconciled: true,
            reconciledAt: new Date(),
            reconciledWith: bestMatch.id,
            reconciledType: bestMatch.type,
            notes: `Rapproché automatiquement avec ${bestMatch.type}`,
          },
        });
        reconciledCount++;
      }
    }

    // Mettre à jour le statut du relevé
    const allReconciled =
      statement.transactions.length > 0 &&
      reconciledCount === statement.transactions.length;

    await (prisma as any).bankStatement.update({
      where: { id: statementId },
      data: {
        status: allReconciled ? 'reconciled' : 'imported',
        reconciledAt: allReconciled ? new Date() : null,
      },
    });

    logger.info(`Bank statement reconciled`, {
      statementId,
      totalTransactions: statement.transactions.length,
      reconciledCount,
    });
  }

  /**
   * Trouver la meilleure correspondance pour une transaction bancaire
   */
  private findBestMatch(
    bankTx: any,
    payments: any[],
    expenses: any[],
    journalEntries: any[],
    accountId: string
  ): { id: string; type: string; confidence: number } | null {
    const bankAmount = Math.abs(Number(bankTx.amount));
    const tolerance = 0.01; // Tolérance de 1 centime

    // 1. Chercher dans les paiements
    for (const payment of payments) {
      const paymentAmount = Number(payment.amount);
      const dateDiff = Math.abs(
        new Date(bankTx.transactionDate).getTime() -
          new Date(payment.payment_date).getTime()
      );
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);

      // Correspondance par montant et date (max 7 jours d'écart)
      if (
        Math.abs(bankAmount - paymentAmount) <= tolerance &&
        daysDiff <= 7
      ) {
        return {
          id: payment.id,
          type: 'payment',
          confidence: daysDiff === 0 ? 1.0 : 0.9,
        };
      }
    }

    // 2. Chercher dans les dépenses
    for (const expense of expenses) {
      const expenseAmount = Number(expense.amount_ttc);
      const dateDiff = Math.abs(
        new Date(bankTx.transactionDate).getTime() -
          new Date(expense.expense_date).getTime()
      );
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);

      if (
        Math.abs(bankAmount - expenseAmount) <= tolerance &&
        daysDiff <= 7
      ) {
        return {
          id: expense.id,
          type: 'expense',
          confidence: daysDiff === 0 ? 1.0 : 0.9,
        };
      }
    }

    // 3. Chercher dans les écritures comptables
    for (const entry of journalEntries) {
      for (const line of entry.journal_entry_lines) {
        if (line.account_id !== accountId) continue;

        const lineAmount = Math.abs(Number(line.debit - line.credit));
        const dateDiff = Math.abs(
          new Date(bankTx.transactionDate).getTime() -
            new Date(entry.entry_date).getTime()
        );
        const daysDiff = dateDiff / (1000 * 60 * 60 * 24);

        if (
          Math.abs(bankAmount - lineAmount) <= tolerance &&
          daysDiff <= 30
        ) {
          return {
            id: entry.id,
            type: 'journal_entry',
            confidence: daysDiff === 0 ? 0.95 : 0.85,
          };
        }
      }
    }

    return null;
  }

  /**
   * Obtenir un relevé bancaire avec ses transactions
   */
  async getBankStatement(statementId: string, companyId: string): Promise<any> {
    const statement = await (prisma as any).bankStatement.findFirst({
      where: {
        id: statementId,
        companyId,
        deletedAt: null,
      },
      include: {
        transactions: {
          orderBy: {
            transactionDate: 'asc',
          },
        },
        account: true,
      },
    });

    return statement;
  }

  /**
   * Lister les relevés bancaires d'une entreprise
   */
  async listBankStatements(
    companyId: string,
    accountId?: string
  ): Promise<any[]> {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (accountId) {
      where.accountId = accountId;
    }

    const statements = await (prisma as any).bankStatement.findMany({
      where,
      include: {
        account: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    return statements;
  }

  /**
   * Rapprocher manuellement une transaction
   */
  async manualReconcile(
    bankTransactionId: string,
    accountingTransactionId: string,
    accountingTransactionType: string
  ): Promise<void> {
    await (prisma as any).bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        isReconciled: true,
        reconciledAt: new Date(),
        reconciledWith: accountingTransactionId,
        reconciledType: accountingTransactionType,
        notes: 'Rapproché manuellement',
      },
    });
  }
}

export default new BankReconciliationService();

