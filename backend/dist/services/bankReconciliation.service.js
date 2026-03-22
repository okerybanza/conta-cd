"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankReconciliationService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
class BankReconciliationService {
    /**
     * Parser CSV simple pour relevés bancaires
     * Format attendu: Date,Description,Montant,Reference (optionnel)
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter((line) => line.trim());
        const transactions = [];
        // Ignorer la première ligne si c'est un en-tête
        const startIndex = lines[0]?.toLowerCase().includes('date') ? 1 : 0;
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            // Parser CSV simple (gérer les virgules dans les guillemets)
            const parts = this.parseCSVLine(line);
            if (parts.length < 3)
                continue;
            try {
                const date = new Date(parts[0]);
                const description = parts[1]?.replace(/"/g, '') || '';
                const amount = parseFloat(parts[2]?.replace(/,/g, '') || '0');
                const reference = parts[3]?.replace(/"/g, '') || undefined;
                if (isNaN(date.getTime()) || isNaN(amount)) {
                    logger_1.default.warn(`Ligne ${i + 1} ignorée: format invalide`, { line });
                    continue;
                }
                transactions.push({
                    date,
                    description,
                    amount,
                    reference,
                });
            }
            catch (error) {
                logger_1.default.warn(`Erreur parsing ligne ${i + 1}`, { error, line });
            }
        }
        return transactions;
    }
    /**
     * Parser une ligne CSV en gérant les guillemets
     */
    parseCSVLine(line) {
        const parts = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        parts.push(current.trim());
        return parts;
    }
    /**
     * Importer un relevé bancaire
     */
    async importBankStatement(companyId, accountId, statementData) {
        // Vérifier que le compte existe et appartient à l'entreprise
        const account = await database_1.default.accounts.findFirst({
            where: {
                id: accountId,
                company_id: companyId,
                type: 'asset', // Seuls les comptes d'actif peuvent être bancaires
            },
        });
        if (!account) {
            throw new Error('Compte bancaire introuvable ou invalide');
        }
        // Vérifier que le numéro de relevé n'existe pas déjà
        const existing = await database_1.default.bank_statements.findFirst({
            where: {
                company_id: companyId,
                statement_number: statementData.statementNumber,
                deleted_at: null,
            },
        });
        if (existing) {
            throw new Error('Un relevé avec ce numéro existe déjà');
        }
        // Créer le relevé bancaire
        const statement = await database_1.default.bank_statements.create({
            data: {
                company_id: companyId,
                accountId,
                statement_number: statementData.statementNumber,
                start_date: statementData.startDate,
                end_date: statementData.endDate,
                opening_balance: statementData.openingBalance,
                closing_balance: statementData.closingBalance,
                status: 'imported',
                imported_at: new Date(),
            },
        });
        // Créer les transactions
        const transactions = [];
        for (const tx of statementData.transactions) {
            const transaction = await database_1.default.bank_transactions.create({
                data: {
                    statementId: statement.id,
                    transactionDate: tx.date,
                    valueDate: tx.valueDate || tx.date,
                    description: tx.description,
                    reference: tx.reference,
                    amount: tx.amount,
                    balance: tx.balance,
                    type: tx.amount >= 0 ? 'credit' : 'debit',
                    is_reconciled: false,
                },
            });
            transactions.push(transaction);
        }
        logger_1.default.info(`Bank statement imported`, {
            company_id: companyId,
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
    async reconcileStatement(statementId) {
        const statement = await database_1.default.bank_statements.findUnique({
            where: { id: statementId },
            include: {
                bank_transactions: true,
                accounts: true,
            },
        });
        if (!statement) {
            throw new Error('Relevé bancaire introuvable');
        }
        const companyId = statement.company_id;
        const accountId = statement.account_id;
        // Récupérer les transactions comptables dans la période
        const payments = await database_1.default.payments.findMany({
            where: {
                company_id: companyId,
                paymentDate: {
                    gte: statement.startDate,
                    lte: statement.endDate,
                },
                deleted_at: null,
            },
            include: {
                invoice: true,
            },
        });
        const expenses = await database_1.default.expenses.findMany({
            where: {
                company_id: companyId,
                expenseDate: {
                    gte: statement.startDate,
                    lte: statement.endDate,
                },
                deleted_at: null,
            },
        });
        const journalEntries = await database_1.default.journal_entries.findMany({
            where: {
                company_id: companyId,
                entryDate: {
                    gte: statement.startDate,
                    lte: statement.endDate,
                },
                status: 'posted',
                lines: {
                    some: {
                        accountId,
                    },
                },
            },
            include: {
                lines: {
                    where: {
                        accountId,
                    },
                },
            },
        });
        // Rapprocher chaque transaction bancaire
        let reconciledCount = 0;
        for (const bankTx of statement.transactions) {
            const bestMatch = this.findBestMatch(bankTx, payments, expenses, journalEntries, accountId);
            if (bestMatch) {
                await database_1.default.bank_transactions.update({
                    where: { id: bankTx.id },
                    data: {
                        is_reconciled: true,
                        reconciled_at: new Date(),
                        reconciledWith: bestMatch.id,
                        reconciledType: bestMatch.type,
                        notes: `Rapproché automatiquement avec ${bestMatch.type}`,
                    },
                });
                reconciledCount++;
            }
        }
        // Mettre à jour le statut du relevé
        const allReconciled = statement.transactions.length > 0 &&
            reconciledCount === statement.transactions.length;
        await database_1.default.bank_statements.update({
            where: { id: statementId },
            data: {
                status: allReconciled ? 'reconciled' : 'imported',
                reconciled_at: allReconciled ? new Date() : null,
            },
        });
        logger_1.default.info(`Bank statement reconciled`, {
            statementId,
            totalTransactions: statement.transactions.length,
            reconciledCount,
        });
    }
    /**
     * Trouver la meilleure correspondance pour une transaction bancaire
     */
    findBestMatch(bankTx, payments, expenses, journalEntries, accountId) {
        const bankAmount = Math.abs(Number(bankTx.amount));
        const tolerance = 0.01; // Tolérance de 1 centime
        // 1. Chercher dans les paiements
        for (const payment of payments) {
            const paymentAmount = Number(payment.amount);
            const dateDiff = Math.abs(new Date(bankTx.transactionDate).getTime() -
                new Date(payment.paymentDate).getTime());
            const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
            // Correspondance par montant et date (max 7 jours d'écart)
            if (Math.abs(bankAmount - paymentAmount) <= tolerance &&
                daysDiff <= 7) {
                return {
                    id: payment.id,
                    type: 'payment',
                    confidence: daysDiff === 0 ? 1.0 : 0.9,
                };
            }
        }
        // 2. Chercher dans les dépenses
        for (const expense of expenses) {
            const expenseAmount = Number(expense.amountTtc);
            const dateDiff = Math.abs(new Date(bankTx.transactionDate).getTime() -
                new Date(expense.expenseDate).getTime());
            const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
            if (Math.abs(bankAmount - expenseAmount) <= tolerance &&
                daysDiff <= 7) {
                return {
                    id: expense.id,
                    type: 'expense',
                    confidence: daysDiff === 0 ? 1.0 : 0.9,
                };
            }
        }
        // 3. Chercher dans les écritures comptables
        for (const entry of journalEntries) {
            for (const line of entry.lines) {
                if (line.accountId !== accountId)
                    continue;
                const lineAmount = Math.abs(Number(line.debit - line.credit));
                const dateDiff = Math.abs(new Date(bankTx.transactionDate).getTime() -
                    new Date(entry.entryDate).getTime());
                const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
                if (Math.abs(bankAmount - lineAmount) <= tolerance &&
                    daysDiff <= 30) {
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
    async getBankStatement(statementId, companyId) {
        const statement = await database_1.default.bank_statements.findFirst({
            where: {
                id: statementId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                transactions: {
                    orderBy: {
                        transactionDate: 'asc',
                    },
                },
                accounts: true,
            },
        });
        return statement;
    }
    /**
     * Lister les relevés bancaires d'une entreprise
     */
    async listBankStatements(companyId, accountId) {
        const where = {
            company_id: companyId,
            deleted_at: null,
        };
        if (accountId) {
            where.accountId = accountId;
        }
        const statements = await database_1.default.bank_statements.findMany({
            where,
            include: {
                accounts: true,
                _count: {
                    select: {
                        bank_transactions: true,
                    },
                },
            },
            orderBy: {
                end_date: 'desc',
            },
        });
        return statements;
    }
    /**
     * Rapprocher manuellement une transaction
     */
    async manualReconcile(bankTransactionId, accountingTransactionId, accountingTransactionType) {
        await database_1.default.bank_transactions.update({
            where: { id: bankTransactionId },
            data: {
                is_reconciled: true,
                reconciled_at: new Date(),
                reconciledWith: accountingTransactionId,
                reconciledType: accountingTransactionType,
                notes: 'Rapproché manuellement',
            },
        });
    }
}
exports.BankReconciliationService = BankReconciliationService;
exports.default = new BankReconciliationService();
//# sourceMappingURL=bankReconciliation.service.js.map