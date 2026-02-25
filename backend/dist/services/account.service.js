"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const cache_service_1 = __importDefault(require("./cache.service"));
const audit_service_1 = __importDefault(require("./audit.service"));
class AccountService {
    /**
     * Créer un compte comptable
     */
    async create(companyId, data) {
        // Validation
        if (!data.code || data.code.trim().length === 0) {
            throw new error_middleware_1.CustomError('Account code is required', 400, 'VALIDATION_ERROR');
        }
        if (!data.name || data.name.trim().length === 0) {
            throw new error_middleware_1.CustomError('Account name is required', 400, 'VALIDATION_ERROR');
        }
        // Vérifier code unique
        const existing = await database_1.default.accounts.findFirst({
            where: {
                company_id: companyId,
                code: data.code.trim(),
            },
        });
        if (existing) {
            throw new error_middleware_1.CustomError('Account code already exists', 409, 'ACCOUNT_CODE_EXISTS');
        }
        // Vérifier parent si fourni
        if (data.parentId) {
            const parent = await database_1.default.accounts.findFirst({
                where: {
                    id: data.parentId,
                    company_id: companyId,
                },
            });
            if (!parent) {
                throw new error_middleware_1.CustomError('Parent account not found', 404, 'PARENT_ACCOUNT_NOT_FOUND');
            }
        }
        const account = await database_1.default.accounts.create({
            data: {
                id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                company_id: companyId,
                code: data.code.trim(),
                name: data.name.trim(),
                type: data.type,
                category: data.category,
                parent_id: data.parentId,
                description: data.description,
                is_active: true,
                balance: 0,
                updated_at: new Date(),
            },
            include: {
                accounts: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                other_accounts: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });
        // SPRINT 3 - TASK 3.2: Emit event for cache invalidation
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { AccountCreated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new AccountCreated({
            companyId,
            timestamp: new Date()
        }, account.id, account.code));
        // ACCT-004: Audit trail
        await audit_service_1.default.logCreate(companyId, undefined, undefined, undefined, 'account', account.id, { code: account.code, name: account.name, type: account.type, category: account.category }, 'comptabilite');
        logger_1.default.info(`Account created: ${account.id}`, {
            companyId,
            accountId: account.id,
            code: account.code,
        });
        return account;
    }
    /**
     * Obtenir un compte par ID
     */
    async getById(companyId, accountId) {
        const account = await database_1.default.accounts.findFirst({
            where: {
                id: accountId,
                company_id: companyId,
            },
            include: {
                accounts: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        type: true,
                    },
                },
                other_accounts: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        type: true,
                        is_active: true,
                    },
                },
                _count: {
                    select: {
                        expenses: true,
                        expense_categories: true,
                    },
                },
            },
        });
        if (!account) {
            throw new error_middleware_1.CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
        }
        // Mappage pour compatibilité si besoin (les relations Prisma utilisent les noms générés)
        // Ici on retourne l'objet tel quel, le front gérera les noms de relations Prisma
        return account;
    }
    /**
     * Obtenir un compte par code
     */
    async getByCode(companyId, code) {
        const account = await database_1.default.accounts.findFirst({
            where: {
                company_id: companyId,
                code,
            },
        });
        if (!account) {
            throw new error_middleware_1.CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
        }
        return account;
    }
    /**
     * Obtenir ou créer un compte par code
     * Utilisé pour les écritures automatiques (paie, etc.)
     */
    async getOrCreateByCode(companyId, code, defaultName) {
        let account = await database_1.default.accounts.findFirst({
            where: { company_id: companyId, code },
        });
        if (!account) {
            // Déterminer le type et la catégorie selon le code OHADA
            const firstDigit = code.charAt(0);
            let type;
            let category;
            switch (firstDigit) {
                case '1':
                    type = 'asset';
                    category = 'capital';
                    break;
                case '2':
                    type = 'asset';
                    category = 'immobilisation';
                    break;
                case '3':
                    type = 'asset';
                    category = 'stock';
                    break;
                case '4':
                    type = 'liability';
                    category = 'tiers';
                    break;
                case '5':
                    type = 'asset';
                    category = 'tresorerie';
                    break;
                case '6':
                    type = 'expense';
                    category = 'charge';
                    break;
                case '7':
                    type = 'revenue';
                    category = 'produit';
                    break;
                default:
                    type = 'asset';
                    category = 'other';
                    break;
            }
            account = await database_1.default.accounts.create({
                data: {
                    id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    company_id: companyId,
                    code,
                    name: defaultName,
                    type,
                    category,
                    is_active: true,
                    balance: 0,
                    updated_at: new Date(),
                },
            });
        }
        return account;
    }
    /**
     * Lister les comptes (avec hiérarchie)
     */
    async list(companyId, filters = {}) {
        // SPRINT 3 - TASK 3.2 (UX-015): Advanced Caching Phase 3
        const cacheKey = `accounts:list:${companyId}:${JSON.stringify(filters)}`;
        // Try cache first
        const cached = await cache_service_1.default.get(cacheKey);
        if (cached) {
            logger_1.default.debug(`Cache hit for account list: ${companyId}`);
            return cached;
        }
        const where = {
            company_id: companyId,
        };
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.parentId !== undefined) {
            if (filters.parentId === null) {
                where.parent_id = null;
            }
            else {
                where.parent_id = filters.parentId;
            }
        }
        if (filters.isActive !== undefined) {
            where.is_active = filters.isActive;
        }
        if (filters.search) {
            where.OR = [
                { code: { contains: filters.search, mode: 'insensitive' } },
                { name: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const accounts = await database_1.default.accounts.findMany({
            where,
            include: {
                accounts: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                other_accounts: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        type: true,
                    },
                },
                _count: {
                    select: {
                        expenses: true,
                        expense_categories: true,
                        other_accounts: true,
                    },
                },
            },
            orderBy: [
                { category: 'asc' },
                { code: 'asc' },
            ],
        });
        // Cache for 1 hour (3600 seconds)
        await cache_service_1.default.set(cacheKey, accounts, 3600);
        logger_1.default.debug(`Cached account list for company: ${companyId}`);
        return accounts;
    }
    /**
     * Obtenir l'arborescence complète des comptes
     */
    async getTree(companyId, filters = {}) {
        const allAccounts = await this.list(companyId, filters);
        // Construire l'arborescence
        const accountMap = new Map();
        const rootAccounts = [];
        // Créer un map de tous les comptes
        for (const account of allAccounts) {
            accountMap.set(account.id, {
                ...account,
                children: [],
            });
        }
        // Construire l'arborescence
        for (const account of allAccounts) {
            const accountNode = accountMap.get(account.id);
            if (account.parent_id) {
                const parent = accountMap.get(account.parent_id);
                if (parent) {
                    parent.children.push(accountNode);
                }
                else {
                    // Parent non trouvé, traiter comme racine
                    rootAccounts.push(accountNode);
                }
            }
            else {
                rootAccounts.push(accountNode);
            }
        }
        return rootAccounts;
    }
    /**
     * Mettre à jour un compte
     */
    async update(companyId, accountId, data) {
        const existing = await this.getById(companyId, accountId);
        // Vérifier code unique si modifié
        if (data.code) {
            const existing = await database_1.default.accounts.findFirst({
                where: {
                    company_id: companyId,
                    code: data.code.trim(),
                    id: { not: accountId },
                },
            });
            if (existing) {
                throw new error_middleware_1.CustomError('Account code already exists', 409, 'ACCOUNT_CODE_EXISTS');
            }
        }
        // Vérifier parent si modifié
        if (data.parentId !== undefined) {
            if (data.parentId) {
                const parent = await database_1.default.accounts.findFirst({
                    where: {
                        id: data.parentId,
                        company_id: companyId,
                    },
                });
                if (!parent) {
                    throw new error_middleware_1.CustomError('Parent account not found', 404, 'PARENT_ACCOUNT_NOT_FOUND');
                }
                // Vérifier qu'on ne crée pas de boucle (le parent ne doit pas être un enfant)
                if (data.parentId === accountId) {
                    throw new error_middleware_1.CustomError('Account cannot be its own parent', 400, 'INVALID_PARENT');
                }
                // Vérifier récursivement qu'on ne crée pas de boucle
                const isDescendant = await this.isDescendant(companyId, data.parentId, accountId);
                if (isDescendant) {
                    throw new error_middleware_1.CustomError('Cannot set parent: would create circular reference', 400, 'CIRCULAR_REFERENCE');
                }
            }
        }
        const updated = await database_1.default.accounts.update({
            where: { id: accountId },
            data: {
                ...(data.code && { code: data.code.trim() }),
                ...(data.name && { name: data.name.trim() }),
                ...(data.type && { type: data.type }),
                ...(data.category !== undefined && { category: data.category }),
                ...(data.parentId !== undefined && { parent_id: data.parentId }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.isActive !== undefined && { is_active: data.isActive }),
                updated_at: new Date(),
            },
            include: {
                accounts: true,
                other_accounts: true,
            },
        });
        // SPRINT 3 - TASK 3.2: Emit event for cache invalidation
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { AccountUpdated } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new AccountUpdated({
            companyId,
            timestamp: new Date()
        }, accountId, data));
        // ACCT-004: Audit trail
        await audit_service_1.default.logUpdate(companyId, undefined, undefined, undefined, 'account', accountId, { code: existing.code, name: existing.name, type: existing.type }, data, 'comptabilite');
        logger_1.default.info(`Account updated: ${accountId}`, { companyId, accountId });
        return updated;
    }
    /**
     * Vérifier si un compte est un descendant d'un autre
     */
    async isDescendant(companyId, ancestorId, descendantId) {
        const account = await database_1.default.accounts.findFirst({
            where: {
                id: descendantId,
                company_id: companyId,
            },
            select: {
                parent_id: true,
            },
        });
        if (!account || !account.parent_id) {
            return false;
        }
        if (account.parent_id === ancestorId) {
            return true;
        }
        return this.isDescendant(companyId, ancestorId, account.parent_id);
    }
    /**
     * Supprimer un compte
     */
    async delete(companyId, accountId) {
        const account = await this.getById(companyId, accountId);
        // Vérifier qu'il n'y a pas d'enfants
        const childrenCount = await database_1.default.accounts.count({
            where: {
                parent_id: accountId,
                company_id: companyId,
            },
        });
        if (childrenCount > 0) {
            throw new error_middleware_1.CustomError('Cannot delete account with child accounts. Delete children first.', 400, 'ACCOUNT_HAS_CHILDREN');
        }
        // Vérifier qu'il n'y a pas de dépenses liées
        const expensesCount = await database_1.default.expenses.count({
            where: {
                account_id: accountId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (expensesCount > 0) {
            throw new error_middleware_1.CustomError('Cannot delete account with linked expenses', 400, 'ACCOUNT_HAS_EXPENSES');
        }
        // Vérifier qu'il n'y a pas de catégories liées
        const categoriesCount = await database_1.default.expense_categories.count({
            where: {
                account_id: accountId,
                company_id: companyId,
            },
        });
        if (categoriesCount > 0) {
            throw new error_middleware_1.CustomError('Cannot delete account with linked expense categories', 400, 'ACCOUNT_HAS_CATEGORIES');
        }
        await database_1.default.accounts.delete({
            where: { id: accountId },
        });
        // ACCT-004: Audit trail
        await audit_service_1.default.logDelete(companyId, undefined, undefined, undefined, 'account', accountId, { code: account.code, name: account.name, type: account.type }, 'comptabilite');
        // SPRINT 3 - TASK 3.2: Emit event for cache invalidation
        const { eventBus } = await Promise.resolve().then(() => __importStar(require('../events/event-bus')));
        const { AccountDeleted } = await Promise.resolve().then(() => __importStar(require('../events/domain-event')));
        await eventBus.publish(new AccountDeleted({
            companyId,
            timestamp: new Date()
        }, accountId));
        logger_1.default.info(`Account deleted: ${accountId}`, { companyId, accountId });
        return { success: true };
    }
    /**
     * Mettre à jour le solde d'un compte
     *
     * SPRINT 1 - TASK 1.2 (ARCH-008): DEPRECATED
     * This method directly updates the cached balance field, which can lead to data drift.
     * Balance should always be calculated from journal_entry_lines (source of truth).
     *
     * @deprecated Use BalanceValidationService.calculateBalanceFromEntries() instead
     * @throws Error - Direct balance updates are not allowed
     */
    async updateBalance(accountId, amount) {
        logger_1.default.error('DEPRECATED: updateBalance() called - this method is deprecated', {
            accountId,
            amount,
            stack: new Error().stack,
        });
        throw new error_middleware_1.CustomError('Direct balance updates are not allowed. Balance must be calculated from journal entries.', 400, 'BALANCE_UPDATE_NOT_ALLOWED', {
            hint: 'Use BalanceValidationService.calculateBalanceFromEntries() or recalculateAccountBalance()',
            accountId,
            attemptedAmount: amount,
        });
    }
    /**
     * SPRINT 1 - TASK 1.2 (ARCH-008): Get Account Balance
     *
     * Calculates account balance from journal entries (source of truth).
     * Uses BalanceValidationService.calculateBalanceFromEntries() which:
     * - Filters only posted journal entries
     * - Applies correct debit/credit rules by account type
     * - Returns real-time calculated balance
     *
     * @param companyId - Company ID
     * @param accountId - Account ID
     * @param asOfDate - Optional date to calculate balance as of specific date
     * @returns Calculated balance from journal entries
     */
    async getBalance(companyId, accountId, asOfDate) {
        // Point unique d'accès au solde (ARCH-008)
        if (!asOfDate) {
            try {
                // SPRINT 1 - TASK 1.2: Use optimized DB view for current balance when available
                const balanceView = await database_1.default.account_balances_view.findUnique({
                    where: { accountId },
                });
                if (balanceView) {
                    return Number(balanceView.balance);
                }
            }
            catch (error) {
                // Vue absente ou non accessible (ex: environnement de test ou migration manquante)
                logger_1.default.warn('account_balances_view not available, falling back to calculated balance.', {
                    accountId,
                    companyId,
                    error: error?.message || String(error),
                });
            }
            // Fallback: calculer le solde directement depuis les écritures
            const { default: balanceValidationService } = await Promise.resolve().then(() => __importStar(require('./balanceValidation.service')));
            return balanceValidationService.calculateBalanceFromEntries(companyId, accountId);
        }
        // Import balanceValidationService dynamiquement pour éviter les dépendances circulaires
        const { default: balanceValidationService } = await Promise.resolve().then(() => __importStar(require('./balanceValidation.service')));
        return balanceValidationService.calculateBalanceFromEntries(companyId, accountId, asOfDate);
    }
    /**
     * Obtenir le solde total d'un compte et de ses enfants (récursif)
     *
     * SPRINT 1 - TASK 1.2 (ARCH-008): Updated to use calculated balances
     */
    async getTotalBalance(companyId, accountId) {
        const account = await this.getById(companyId, accountId);
        // SPRINT 1 - Use calculated balance instead of cached
        let total = await this.getBalance(companyId, accountId);
        // Ajouter les soldes des enfants récursivement
        // Note: other_accounts contains child accounts (Prisma relation)
        const children = account.other_accounts || [];
        for (const child of children) {
            const childTotal = await this.getTotalBalance(companyId, child.id);
            total += childTotal;
        }
        return total;
    }
    /**
     * Rechercher des comptes par type et catégorie
     */
    async findByTypeAndCategory(companyId, type, category) {
        // Typage assoupli pour éviter les soucis de compatibilité avec la version du client Prisma
        const where = {
            company_id: companyId,
            type,
            is_active: true,
        };
        if (category) {
            where.category = category;
        }
        return database_1.default.accounts.findMany({
            where,
            orderBy: {
                code: 'asc',
            },
        });
    }
}
exports.AccountService = AccountService;
exports.default = new AccountService();
//# sourceMappingURL=account.service.js.map