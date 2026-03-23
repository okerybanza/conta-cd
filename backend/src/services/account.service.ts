import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import cacheService from './cache.service';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountCategory = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export interface CreateAccountData {
  code?: string;
  name?: string;
  type?: AccountType;
  category?: AccountCategory;
  parentId?: string;
  description?: string;
}

export interface UpdateAccountData extends Partial<CreateAccountData> {
  isActive?: boolean;
}

export interface AccountFilters {
  type?: AccountType;
  category?: AccountCategory;
  parentId?: string | null; // null pour les comptes racines
  isActive?: boolean;
  search?: string;
}

export class AccountService {
  /**
   * Créer un compte comptable
   */
  async create(companyId: string, data: CreateAccountData) {
    // Validation
    if (!data.code || data.code.trim().length === 0) {
      throw new CustomError('Account code is required', 400, 'VALIDATION_ERROR');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new CustomError('Account name is required', 400, 'VALIDATION_ERROR');
    }

    // Vérifier code unique
    const existing = await prisma.accounts.findFirst({
      where: {
        company_id: companyId,
        code: data.code.trim(),
      },
    });

    if (existing) {
      throw new CustomError('Account code already exists', 409, 'ACCOUNT_CODE_EXISTS');
    }

    // Vérifier parent si fourni
    if (data.parentId) {
      const parent = await prisma.accounts.findFirst({
        where: {
          id: data.parentId,
          company_id: companyId,
        },
      });

      if (!parent) {
        throw new CustomError('Parent account not found', 404, 'PARENT_ACCOUNT_NOT_FOUND');
      }
    }

    const account = await prisma.accounts.create({
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
    const { eventBus } = await import('../events/event-bus');
    const { AccountCreated } = await import('../events/domain-event');
    await eventBus.publish(new AccountCreated({
      companyId,
      timestamp: new Date()
    }, account.id, account.code));

    logger.info(`Account created: ${account.id}`, {
      companyId,
      accountId: account.id,
      code: account.code,
    });

    return account;
  }

  /**
   * Obtenir un compte par ID
   */
  async getById(companyId: string, accountId: string) {
    const account = await prisma.accounts.findFirst({
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
      throw new CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    // Mappage pour compatibilité si besoin (les relations Prisma utilisent les noms générés)
    // Ici on retourne l'objet tel quel, le front gérera les noms de relations Prisma
    return account;
  }

  /**
   * Obtenir un compte par code
   */
  async getByCode(companyId: string, code: string) {
    const account = await prisma.accounts.findFirst({
      where: {
        company_id: companyId,
        code,
      },
    });

    if (!account) {
      throw new CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    return account;
  }

  /**
   * Obtenir ou créer un compte par code
   * Utilisé pour les écritures automatiques (paie, etc.)
   */
  async getOrCreateByCode(companyId: string, code: string, defaultName: string) {
    let account = await prisma.accounts.findFirst({
      where: { company_id: companyId, code },
    });

    if (!account) {
      // Déterminer le type et la catégorie selon le code OHADA
      const firstDigit = code.charAt(0);
      let type: string;
      let category: string;

      switch (firstDigit) {
        case '1': type = 'asset'; category = 'capital'; break;
        case '2': type = 'asset'; category = 'immobilisation'; break;
        case '3': type = 'asset'; category = 'stock'; break;
        case '4': type = 'liability'; category = 'tiers'; break;
        case '5': type = 'asset'; category = 'tresorerie'; break;
        case '6': type = 'expense'; category = 'charge'; break;
        case '7': type = 'revenue'; category = 'produit'; break;
        default: type = 'asset'; category = 'other'; break;
      }

      account = await prisma.accounts.create({
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
  async list(companyId: string, filters: AccountFilters = {}) {
    // SPRINT 3 - TASK 3.2 (UX-015): Advanced Caching Phase 3
    const cacheKey = `accounts:list:${companyId}:${JSON.stringify(filters)}`;

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for account list: ${companyId}`);
      return cached;
    }

    const where: any = {
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
      } else {
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

    const accounts = await prisma.accounts.findMany({
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
    await cacheService.set(cacheKey, accounts, 3600);
    logger.debug(`Cached account list for company: ${companyId}`);

    return accounts;
  }

  /**
   * Obtenir l'arborescence complète des comptes
   */
  async getTree(companyId: string, filters: AccountFilters = {}) {
    const allAccounts = await this.list(companyId, filters);

    // Construire l'arborescence
    const accountMap = new Map<string, any>();
    const rootAccounts: any[] = [];

    // Créer un map de tous les comptes
    for (const account of allAccounts) {
      accountMap.set(account.id, {
        ...account,
        children: [],
      });
    }

    // Construire l'arborescence
    for (const account of allAccounts) {
      const accountNode = accountMap.get(account.id)!;

      if (account.parent_id) {
        const parent = accountMap.get(account.parent_id);
        if (parent) {
          parent.children.push(accountNode);
        } else {
          // Parent non trouvé, traiter comme racine
          rootAccounts.push(accountNode);
        }
      } else {
        rootAccounts.push(accountNode);
      }
    }

    return rootAccounts;
  }

  /**
   * Mettre à jour un compte
   */
  async update(companyId: string, accountId: string, data: UpdateAccountData) {
    await this.getById(companyId, accountId);

    // Vérifier code unique si modifié
    if (data.code) {
      const existing = await prisma.accounts.findFirst({
        where: {
          company_id: companyId,
          code: data.code.trim(),
          id: { not: accountId },
        },
      });

      if (existing) {
        throw new CustomError('Account code already exists', 409, 'ACCOUNT_CODE_EXISTS');
      }
    }

    // Vérifier parent si modifié
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await prisma.accounts.findFirst({
          where: {
            id: data.parentId,
            company_id: companyId,
          },
        });

        if (!parent) {
          throw new CustomError('Parent account not found', 404, 'PARENT_ACCOUNT_NOT_FOUND');
        }

        // Vérifier qu'on ne crée pas de boucle (le parent ne doit pas être un enfant)
        if (data.parentId === accountId) {
          throw new CustomError('Account cannot be its own parent', 400, 'INVALID_PARENT');
        }

        // Vérifier récursivement qu'on ne crée pas de boucle
        const isDescendant = await this.isDescendant(companyId, data.parentId, accountId);
        if (isDescendant) {
          throw new CustomError('Cannot set parent: would create circular reference', 400, 'CIRCULAR_REFERENCE');
        }
      }
    }

    const updated = await prisma.accounts.update({
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
    const { eventBus } = await import('../events/event-bus');
    const { AccountUpdated } = await import('../events/domain-event');
    await eventBus.publish(new AccountUpdated({
      companyId,
      timestamp: new Date()
    }, accountId, data));

    logger.info(`Account updated: ${accountId}`, { companyId, accountId });

    return updated;
  }

  /**
   * Vérifier si un compte est un descendant d'un autre
   */
  private async isDescendant(companyId: string, ancestorId: string, descendantId: string): Promise<boolean> {
    const account = await prisma.accounts.findFirst({
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
  async delete(companyId: string, accountId: string) {
    const account = await this.getById(companyId, accountId);

    // Vérifier qu'il n'y a pas d'enfants
    const childrenCount = await prisma.accounts.count({
      where: {
        parent_id: accountId,
        company_id: companyId,
      },
    });

    if (childrenCount > 0) {
      throw new CustomError(
        'Cannot delete account with child accounts. Delete children first.',
        400,
        'ACCOUNT_HAS_CHILDREN'
      );
    }

    // Vérifier qu'il n'y a pas de dépenses liées
    const expensesCount = await prisma.expenses.count({
      where: {
        account_id: accountId,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (expensesCount > 0) {
      throw new CustomError(
        'Cannot delete account with linked expenses',
        400,
        'ACCOUNT_HAS_EXPENSES'
      );
    }

    // Vérifier qu'il n'y a pas de catégories liées
    const categoriesCount = await prisma.expense_categories.count({
      where: {
        account_id: accountId,
        company_id: companyId,
      },
    });

    if (categoriesCount > 0) {
      throw new CustomError(
        'Cannot delete account with linked expense categories',
        400,
        'ACCOUNT_HAS_CATEGORIES'
      );
    }

    await prisma.accounts.delete({
      where: { id: accountId },
    });

    // SPRINT 3 - TASK 3.2: Emit event for cache invalidation
    const { eventBus } = await import('../events/event-bus');
    const { AccountDeleted } = await import('../events/domain-event');
    await eventBus.publish(new AccountDeleted({
      companyId,
      timestamp: new Date()
    }, accountId));

    logger.info(`Account deleted: ${accountId}`, { companyId, accountId });

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
  async updateBalance(accountId: string, amount: number) {
    logger.error('DEPRECATED: updateBalance() called - this method is deprecated', {
      accountId,
      amount,
      stack: new Error().stack,
    });

    throw new CustomError(
      'Direct balance updates are not allowed. Balance must be calculated from journal entries.',
      400,
      'BALANCE_UPDATE_NOT_ALLOWED',
      {
        hint: 'Use BalanceValidationService.calculateBalanceFromEntries() or recalculateAccountBalance()',
        accountId,
        attemptedAmount: amount,
      }
    );
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
  async getBalance(companyId: string, accountId: string, asOfDate?: Date): Promise<number> {
    // Point unique d'accès au solde (ARCH-008)
    if (!asOfDate) {
      // SPRINT 1 - TASK 1.2: Use optimized DB view for current balance
      const balanceView = await (prisma as any).account_balances_view.findUnique({
        where: { accountId },
      });
      return balanceView ? Number(balanceView.balance) : 0;
    }

    // Import balanceValidationService dynamically to avoid circular dependency
    const { default: balanceValidationService } = await import('./balanceValidation.service');

    return balanceValidationService.calculateBalanceFromEntries(
      companyId,
      accountId,
      asOfDate
    );
  }

  /**
   * Obtenir le solde total d'un compte et de ses enfants (récursif)
   * 
   * SPRINT 1 - TASK 1.2 (ARCH-008): Updated to use calculated balances
   */
  async getTotalBalance(companyId: string, accountId: string): Promise<number> {
    const account = await this.getById(companyId, accountId);

    // SPRINT 1 - Use calculated balance instead of cached
    let total = await this.getBalance(companyId, accountId);

    // Ajouter les soldes des enfants récursivement
    // Note: other_accounts contains child accounts (Prisma relation)
    const children = (account as any).other_accounts || [];
    for (const child of children) {
      const childTotal = await this.getTotalBalance(companyId, child.id);
      total += childTotal;
    }

    return total;
  }

  /**
   * Rechercher des comptes par type et catégorie
   */
  async findByTypeAndCategory(
    companyId: string,
    type: AccountType,
    category?: AccountCategory
  ) {
    // Typage assoupli pour éviter les soucis de compatibilité avec la version du client Prisma
    const where: any = {
      company_id: companyId,
      type,
      is_active: true,
    };

    if (category) {
      where.category = category;
    }

    return prisma.accounts.findMany({
      where,
      orderBy: {
        code: 'asc',
      },
    });
  }
}

export default new AccountService();
