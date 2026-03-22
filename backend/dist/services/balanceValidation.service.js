"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceValidationService = void 0;
/**
 * BalanceValidationService — ARCH-008 (Sprint 1)
 *
 * Point unique autorisé pour écrire le champ accounts.balance.
 * Le solde est un cache dérivé des journal_entry_lines (source de vérité).
 * Toute mise à jour doit résulter d’un recalcul (calculateBalanceFromEntries / calculateBalancesMany),
 * jamais d’une écriture directe arbitraire.
 * account.service.updateBalance() est dépréciée et lève une erreur.
 */
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const CustomError_1 = __importDefault(require("../utils/CustomError"));
class BalanceValidationService {
    /**
     * CHECKLIST ÉTAPE 3 : POINT UNIQUE DE CALCUL DES SOLDES
     * Cette méthode est le point unique de calcul des soldes depuis les écritures comptables.
     * Tous les autres services doivent utiliser cette méthode pour calculer les soldes.
     * Source de vérité : journal_entry_lines (écritures postées uniquement)
     */
    async calculateBalanceFromEntries(companyId, accountId, asOfDate) {
        const results = await this.calculateBalancesMany(companyId, [accountId], asOfDate);
        return results.get(accountId) || 0;
    }
    /**
     * Calculer les soldes pour plusieurs comptes en une seule requête
     * OPTIMISATION SPRINT 5 - Final Mile
     */
    async calculateBalancesMany(companyId, accountIds, asOfDate, status = ['posted']) {
        if (!accountIds || accountIds.length === 0) {
            return new Map();
        }
        // Récupérer les types de comptes pour savoir comment calculer le solde (débit vs crédit)
        const accounts = await database_1.default.accounts.findMany({
            where: {
                id: { in: accountIds },
                company_id: companyId
            },
            select: {
                id: true,
                type: true
            }
        });
        const accountTypeMap = new Map();
        const balanceMap = new Map();
        for (const acc of accounts) {
            accountTypeMap.set(acc.id, acc.type);
            balanceMap.set(acc.id, 0); // Init
        }
        // Agréger les lignes d'écritures
        const where = {
            account_id: { in: accountIds },
            journal_entries: {
                company_id: companyId,
                status: { in: status },
                reversed_at: null,
            }
        };
        if (asOfDate) {
            where.journal_entries.entry_date = {
                lte: asOfDate
            };
        }
        const aggregations = await database_1.default.journal_entry_lines.groupBy({
            by: ['account_id'],
            where: where,
            _sum: {
                debit: true,
                credit: true
            }
        });
        for (const agg of aggregations) {
            const accountId = agg.account_id;
            const type = accountTypeMap.get(accountId);
            const debit = Number(agg._sum.debit || 0);
            const credit = Number(agg._sum.credit || 0);
            let balance = 0;
            if (['asset', 'expense'].includes(type || '')) {
                balance = debit - credit;
            }
            else {
                balance = credit - debit;
            }
            balanceMap.set(accountId, balance);
        }
        return balanceMap;
    }
    /**
     * Valider le solde d'un compte spécifique
     */
    async validateAccountBalance(companyId, accountId, autoCorrect = false) {
        const account = await database_1.default.accounts.findUnique({
            where: { id: accountId },
        });
        if (!account || account.company_id !== companyId) {
            throw new CustomError_1.default('Account not found', 404, 'ACCOUNT_NOT_FOUND');
        }
        // Calculer le solde depuis les écritures
        const calculatedBalance = await this.calculateBalanceFromEntries(companyId, accountId);
        // Récupérer le solde stocké
        const storedBalance = Number(account.balance || 0);
        // Calculer la différence
        const difference = Math.abs(calculatedBalance - storedBalance);
        const isSynchronized = difference < 0.01; // Tolérance de 0.01
        // Si désynchronisation détectée et correction automatique demandée
        if (!isSynchronized && autoCorrect) {
            const adjustment = calculatedBalance - storedBalance;
            // Mettre à jour le solde
            await database_1.default.accounts.update({
                where: { id: accountId },
                data: {
                    balance: new client_1.Prisma.Decimal(calculatedBalance),
                },
            });
            logger_1.default.info(`Account balance corrected: ${account.code}`, {
                companyId,
                accountId,
                accountCode: account.code,
                oldBalance: storedBalance,
                newBalance: calculatedBalance,
                adjustment,
            });
        }
        return {
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            accountType: account.type,
            storedBalance,
            calculatedBalance,
            difference,
            isSynchronized,
            lastValidatedAt: new Date(),
        };
    }
    /**
     * Valider tous les soldes d'une entreprise
     */
    async validateAllBalances(companyId, autoCorrect = false) {
        // Récupérer tous les comptes actifs
        const accounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                is_active: true,
            },
            orderBy: {
                code: 'asc',
            },
        });
        // OPTIMISATION BATCH - Validation
        const balances = await this.calculateBalancesMany(companyId, accounts.map((a) => a.id));
        const results = [];
        const discrepancies = [];
        let totalDifference = 0;
        for (const account of accounts) {
            const calculatedBalance = balances.get(account.id) || 0;
            const storedBalance = Number(account.balance || 0);
            const difference = Math.abs(calculatedBalance - storedBalance);
            const isSynchronized = difference < 0.01;
            const result = {
                accountId: account.id,
                accountCode: account.code,
                accountName: account.name,
                accountType: account.type,
                storedBalance,
                calculatedBalance,
                difference,
                isSynchronized,
                lastValidatedAt: new Date(),
            };
            results.push(result);
            if (!isSynchronized) {
                if (autoCorrect) {
                    await database_1.default.accounts.update({
                        where: { id: account.id },
                        data: { balance: new client_1.Prisma.Decimal(calculatedBalance) },
                    });
                    logger_1.default.info(`Account balance auto-corrected: ${account.code}`, { companyId, old: storedBalance, new: calculatedBalance });
                }
                discrepancies.push({
                    accountId: account.id,
                    accountCode: account.code,
                    accountName: account.name,
                    storedBalance,
                    calculatedBalance,
                    difference,
                    detectedAt: new Date(),
                });
                totalDifference += difference;
            }
        }
        const synchronized = results.filter((r) => r.isSynchronized).length;
        const desynchronized = results.filter((r) => !r.isSynchronized).length;
        logger_1.default.info(`Balance validation completed for company ${companyId}`, {
            companyId,
            totalAccounts: accounts.length,
            synchronized,
            desynchronized,
            totalDifference,
        });
        return {
            companyId,
            validatedAt: new Date(),
            totalAccounts: accounts.length,
            synchronized,
            desynchronized,
            totalDifference,
            discrepancies,
            results,
        };
    }
    /**
     * Recalculer le solde d'un compte spécifique
     */
    async recalculateAccountBalance(companyId, accountId) {
        const account = await database_1.default.accounts.findUnique({
            where: { id: accountId },
        });
        if (!account || account.company_id !== companyId) {
            throw new CustomError_1.default('Account not found', 404, 'ACCOUNT_NOT_FOUND');
        }
        const oldBalance = Number(account.balance || 0);
        const newBalance = await this.calculateBalanceFromEntries(companyId, accountId);
        const difference = newBalance - oldBalance;
        // Mettre à jour le solde
        await database_1.default.accounts.update({
            where: { id: accountId },
            data: {
                balance: new client_1.Prisma.Decimal(newBalance),
            },
        });
        logger_1.default.info(`Account balance recalculated: ${account.code}`, {
            companyId,
            accountId,
            accountCode: account.code,
            oldBalance,
            newBalance,
            difference,
        });
        return {
            success: true,
            oldBalance,
            newBalance,
            difference,
        };
    }
    /**
     * Recalculer tous les soldes d'une entreprise
     */
    async recalculateAllBalances(companyId) {
        const accounts = await database_1.default.accounts.findMany({
            where: {
                company_id: companyId,
                is_active: true,
            },
        });
        // OPTIMISATION BATCH - Recalculation
        const balances = await this.calculateBalancesMany(companyId, accounts.map((a) => a.id));
        let recalculated = 0;
        let totalAdjustment = 0;
        for (const account of accounts) {
            const oldBalance = Number(account.balance || 0);
            const newBalance = balances.get(account.id) || 0;
            const difference = Math.abs(newBalance - oldBalance);
            if (difference > 0.01) {
                await database_1.default.accounts.update({
                    where: { id: account.id },
                    data: { balance: new client_1.Prisma.Decimal(newBalance) },
                });
                totalAdjustment += difference;
            }
            recalculated++;
        }
        logger_1.default.info(`All balances recalculated for company ${companyId}`, {
            companyId,
            totalAccounts: accounts.length,
            recalculated,
            totalAdjustment,
        });
        return {
            success: true,
            totalAccounts: accounts.length,
            recalculated,
            totalAdjustment,
        };
    }
}
exports.BalanceValidationService = BalanceValidationService;
exports.default = new BalanceValidationService();
//# sourceMappingURL=balanceValidation.service.js.map