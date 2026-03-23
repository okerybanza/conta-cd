import { randomUUID } from 'crypto';
import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import quotaService from './quota.service';
import usageService from './usage.service';
import supplierService from './supplier.service';
import journalEntryService from './journalEntry.service';
import realtimeService from './realtime.service';
import dashboardService from './dashboard.service';
import { QuotaService } from './quota.service';
import expenseApprovalRuleService from './expenseApprovalRule.service';
import expenseAttachmentService from './expenseAttachment.service';

export interface CreateExpenseData {
  expenseDate?: string | Date;
  supplierId?: string;
  supplierName?: string;
  categoryId?: string;
  accountId?: string;
  amountHt?: number;
  taxRate?: number;
  amountTtc?: number;
  paymentMethod?: string;
  paymentDate?: string | Date;
  status?: string;
  reference?: string;
  description?: string;
  notes?: string;
  currency?: string;
  reason?: string; // ACCT-001: Why the expense was recorded (max 500 chars)
  // Détails paiement
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
  transactionReference?: string;
  bankName?: string;
  checkNumber?: string;
  cardLastFour?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  reason?: string; // ACCT-001: Why the expense was modified (max 500 chars)
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  categoryId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ExpenseService {
  /**
   * Générer le numéro de dépense
   */
  private async generateExpenseNumber(companyId: string): Promise<string> {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { invoice_prefix: true, next_invoice_number: true },
    });

    if (!company) {
      throw new CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    // Utiliser le préfixe des factures ou "DEP" par défaut
    const prefix = 'DEP'; // Préfixe spécifique pour dépenses
    const nextNumber = company.next_invoice_number || 1;
    const expenseNumber = `${prefix}-${String(nextNumber).padStart(6, '0')}`;

    // Incrémenter le numéro suivant (partagé avec factures)
    await prisma.companies.update({
      where: { id: companyId },
      data: { next_invoice_number: nextNumber + 1 },
    });

    return expenseNumber;
  }

  /**
   * Calculer les totaux d'une dépense
   */
  private calculateTotals(amountHt: number, taxRate: number = 0) {
    const taxAmount = amountHt * (taxRate / 100);
    const amountTtc = amountHt + taxAmount;

    return {
      amountHt,
      taxAmount,
      amountTtc,
    };
  }

  /**
   * Créer une dépense
   */
  async create(companyId: string, userId: string, data: CreateExpenseData) {
    // Vérifier que la fonctionnalité dépenses est disponible
    await quotaService.requireFeature(companyId, 'expenses');

    // Vérifier la limite de dépenses si applicable
    await quotaService.checkLimit(companyId, 'expenses');

    // Validation
    if (data.amountHt < 0) {
      throw new CustomError('Amount must be positive', 400, 'VALIDATION_ERROR');
    }

    if (data.taxRate !== undefined && (data.taxRate < 0 || data.taxRate > 100)) {
      throw new CustomError('Tax rate must be between 0 and 100', 400, 'VALIDATION_ERROR');
    }

    // Règles sur le paiement
    if (data.status === 'paid') {
      if (!data.paymentMethod) {
        throw new CustomError('Payment method is required when expense is paid', 400, 'VALIDATION_ERROR');
      }

      // Pour les méthodes autres que cash, exiger au moins une référence
      if (data.paymentMethod !== 'cash') {
        const hasReference =
          data.transactionReference ||
          data.checkNumber ||
          data.cardLastFour ||
          data.mobileMoneyNumber ||
          data.bankName;

        if (!hasReference) {
          throw new CustomError(
            'A payment reference is required for non-cash paid expenses',
            400,
            'VALIDATION_ERROR'
          );
        }
      }
    }

    // Vérifier fournisseur si fourni
    if (data.supplierId) {
      await supplierService.getById(companyId, data.supplierId);
    }

    // Vérifier catégorie si fournie
    if (data.categoryId) {
      const category = await prisma.expense_categories.findFirst({
        where: {
          id: data.categoryId,
          company_id: companyId,
        },
      });

      if (!category) {
        throw new CustomError('Expense category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    // Vérifier compte comptable si fourni
    if (data.accountId) {
      const account = await prisma.accounts.findFirst({
        where: {
          id: data.accountId,
          company_id: companyId,
        },
      });

      if (!account) {
        throw new CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
      }

      // Vérifier que le compte est de type expense
      if (account.type !== 'expense') {
        throw new CustomError('Account must be of type expense', 400, 'INVALID_ACCOUNT_TYPE');
      }
    }

    // Générer numéro de dépense
    const expenseNumber = await this.generateExpenseNumber(companyId);

    // Calculer les totaux
    const totals = this.calculateTotals(data.amountHt, data.taxRate || 0);

    // Utiliser amountTtc fourni ou calculé
    const finalAmountTtc = data.amountTtc || Number(totals.amountTtc);

    // Créer la dépense
    const expense = await prisma.expenses.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        expense_number: expenseNumber,
        expense_date: new Date(data.expenseDate),
        supplier_id: data.supplierId,
        supplier_name: data.supplierName,
        category_id: data.categoryId,
        account_id: data.accountId,
        amount: new Decimal(totals.amountHt), // Montant HT (champ principal)
        amount_ht: new Decimal(totals.amountHt), // Alias pour compatibilité
        tax_amount: totals.taxAmount,
        total_amount: new Decimal(finalAmountTtc), // Montant TTC (champ principal)
        amount_ttc: new Decimal(finalAmountTtc), // Alias pour compatibilité
        payment_method: data.paymentMethod,
        payment_date: data.paymentDate ? new Date(data.paymentDate) : null,
        status: data.status || 'draft',
        reference: data.reference || null,
        description: data.description || '',
        notes: data.notes || null,
        currency: data.currency || 'CDF',
        mobile_money_provider: data.mobileMoneyProvider,
        mobile_money_number: data.mobileMoneyNumber,
        transaction_reference: data.transactionReference,
        bank_name: data.bankName,
        check_number: data.checkNumber,
        card_last_four: data.cardLastFour,
        created_by: userId,
        reason: data.reason, // ACCT-001: Audit trail explanation
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        suppliers: true,
        expense_categories: true,
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // Créer l'écriture comptable automatique pour toute dépense non brouillon / non annulée
    if (expense.status !== 'draft' && expense.status !== 'cancelled') {
      await this.createJournalEntryForExpense(companyId, expense, userId);
    }

    // Mettre à jour les statistiques du fournisseur si applicable
    if (data.supplierId) {
      await supplierService.updateStats(data.supplierId);
    }

    // Incrémenter le compteur d'usage
    await usageService.increment(companyId, 'expenses');

    logger.info(`Expense created: ${expense.id}`, {
      companyId,
      expenseId: expense.id,
      expenseNumber: expense.expense_number,
      amount: Number(expense.amountTtc || expense.amountTtc || 0),
    });

    // Créer l'écriture comptable automatique si la dépense est validée
    if (expense.status === 'validated' || expense.status === 'paid') {
      await this.createJournalEntryForExpense(companyId, expense, userId);
    }

    // Émettre événements temps réel
    realtimeService.emitExpenseCreated(companyId, expense);

    // Mettre à jour les stats du dashboard
    try {
      const stats = await dashboardService.getDashboardStats(companyId);
      realtimeService.emitDashboardStatsUpdate(companyId, stats);
    } catch (error: any) {
      logger.error('Error updating dashboard stats after expense creation', {
        companyId,
        error: error.message,
      });
    }

    return expense;
  }

  /**
   * Créer l'écriture comptable pour une dépense
   */
  private async createJournalEntryForExpense(companyId: string, expense: any, userId?: string) {
    try {
      const quotaService = new QuotaService();
      const hasAccounting = await quotaService.checkFeature(companyId, 'accounting');

      if (!hasAccounting) {
        return; // Fonctionnalité non disponible
      }

      await journalEntryService.ensureForExpense(companyId, expense.id, {
        expenseNumber: expense.expense_number,
        expenseDate: expense.expense_date,
        supplierId: expense.supplierId || undefined,
        supplierName: expense.supplierName || undefined,
        accountId: expense.account_id || undefined,
        amountHt: Number(expense.amountHt || expense.amountHt || 0),
        taxAmount: Number(expense.taxAmount || 0),
        amountTtc: Number(expense.amountTtc || expense.amountTtc || 0),
        currency: expense.currency || 'CDF',
        createdBy: userId,
      });

      logger.info(`Journal entry created for expense: ${expense.id}`, {
        companyId,
        expenseId: expense.id,
      });
    } catch (error: any) {
      // Ne pas bloquer le processus si l'écriture échoue
      logger.error('Error creating journal entry for expense', {
        expenseId: expense.id,
        error: error.message,
      });
    }
  }

  /**
   * Obtenir une dépense par ID
   */
  async getById(companyId: string, expenseId: string) {
    const expense = await prisma.expenses.findFirst({
      where: {
        id: expenseId,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        suppliers: true,
        expense_categories: true,
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      throw new CustomError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }

    // Mapper les données Prisma (snake_case) vers camelCase pour le frontend
    return {
      id: expense.id,
      companyId: expense.company_id,
      expenseNumber: expense.expense_number,
      expenseDate: expense.expense_date ? new Date(expense.expense_date).toISOString() : null,
      supplierId: expense.supplierId || undefined,
      supplierName: expense.supplierName || undefined,
      categoryId: expense.categoryId || undefined,
      accountId: expense.account_id || undefined,
      amountHt: Number(expense.amountHt || expense.amountHt || 0),
      taxRate: expense.tax_rate ? Number(expense.tax_rate) : undefined,
      taxAmount: expense.taxAmount ? Number(expense.taxAmount) : undefined,
      amountTtc: Number(expense.amountTtc || expense.amountTtc || 0),
      paymentMethod: expense.paymentMethod,
      paymentDate: expense.payment_date ? new Date(expense.payment_date).toISOString() : undefined,
      status: expense.status,
      reference: expense.reference || undefined,
      description: expense.description || undefined,
      notes: expense.notes || undefined,
      currency: expense.currency || 'CDF',
      mobileMoneyProvider: expense.mobile_money_provider || undefined,
      mobileMoneyNumber: expense.mobile_money_number || undefined,
      transactionReference: expense.transaction_reference || undefined,
      bankName: expense.bank_name || undefined,
      checkNumber: expense.check_number || undefined,
      cardLastFour: expense.card_last_four || undefined,
      supplier: expense.suppliers ? {
        id: expense.suppliers.id,
        name: expense.suppliers.name,
        businessName: (expense.suppliers as any).business_name || undefined,
      } : undefined,
      category: expense.expense_categories ? {
        id: expense.expense_categories.id,
        name: expense.expense_categories.name,
      } : undefined,
      account: expense.accounts ? {
        id: expense.accounts.id,
        code: expense.accounts.code,
        name: expense.accounts.name,
      } : undefined,
      creator: expense.users ? {
        id: expense.users.id,
        firstName: expense.users.first_name || undefined,
        lastName: expense.users.last_name || undefined,
        email: expense.users.email,
      } : undefined,
      createdAt: expense.created_at ? new Date(expense.created_at).toISOString() : undefined,
      updatedAt: expense.updated_at ? new Date(expense.updated_at).toISOString() : undefined,
    };
  }

  /**
   * Lister les dépenses
   */
  async list(companyId: string, filters: ExpenseFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filters.supplierId) {
      where.supplier_id = filters.supplierId;
    }

    if (filters.categoryId) {
      where.category_id = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { expense_number: { contains: filters.search, mode: 'insensitive' } },
        { supplier_name: { contains: filters.search, mode: 'insensitive' } },
        { reference: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.expense_date = {};
      if (filters.startDate) {
        where.expense_date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.expense_date.lte = new Date(filters.endDate);
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.expenses.findMany({
        where,
        include: {
          suppliers: {
            select: {
              id: true,
              name: true,
            },
          },
          expense_categories: {
            select: {
              id: true,
              name: true,
            },
          },
          accounts: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { expense_date: 'desc' },
      }),
      prisma.expenses.count({ where }),
    ]);

    // Mapper les données Prisma (snake_case) vers camelCase pour le frontend
    const mappedExpenses = expenses.map((expense: any) => ({
      id: expense.id,
      companyId: expense.company_id,
      expenseNumber: expense.expense_number,
      expenseDate: expense.expense_date ? new Date(expense.expense_date).toISOString() : null,
      supplierId: expense.supplierId || undefined,
      supplierName: expense.supplierName || undefined,
      categoryId: expense.categoryId || undefined,
      accountId: expense.account_id || undefined,
      amountHt: Number(expense.amountHt || expense.amountHt || 0),
      taxRate: expense.tax_rate ? Number(expense.tax_rate) : undefined,
      taxAmount: expense.taxAmount ? Number(expense.taxAmount) : undefined,
      amountTtc: Number(expense.amountTtc || expense.amountTtc || 0),
      paymentMethod: expense.paymentMethod,
      paymentDate: expense.payment_date ? new Date(expense.payment_date).toISOString() : undefined,
      status: expense.status,
      reference: expense.reference || undefined,
      description: expense.description || undefined,
      notes: expense.notes || undefined,
      currency: expense.currency || 'CDF',
      mobileMoneyProvider: expense.mobile_money_provider || undefined,
      mobileMoneyNumber: expense.mobile_money_number || undefined,
      transactionReference: expense.transaction_reference || undefined,
      bankName: expense.bank_name || undefined,
      checkNumber: expense.check_number || undefined,
      cardLastFour: expense.card_last_four || undefined,
      supplier: expense.suppliers ? {
        id: expense.suppliers.id,
        name: expense.suppliers.name,
        businessName: (expense.suppliers as any).business_name || undefined,
      } : undefined,
      category: expense.expense_categories ? {
        id: expense.expense_categories.id,
        name: expense.expense_categories.name,
      } : undefined,
      account: expense.accounts ? {
        id: expense.accounts.id,
        code: expense.accounts.code,
        name: expense.accounts.name,
      } : undefined,
      createdAt: expense.created_at ? new Date(expense.created_at).toISOString() : undefined,
      updatedAt: expense.updated_at ? new Date(expense.updated_at).toISOString() : undefined,
    }));

    return {
      data: mappedExpenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mettre à jour une dépense
   */
  async update(companyId: string, expenseId: string, userId: string, data: UpdateExpenseData) {
    const expense = await this.getById(companyId, expenseId);

    // Validation
    if (data.amountHt !== undefined && data.amountHt < 0) {
      throw new CustomError('Amount must be positive', 400, 'VALIDATION_ERROR');
    }

    // Vérifier fournisseur si modifié
    if (data.supplierId) {
      await supplierService.getById(companyId, data.supplierId);
    }

    // Vérifier catégorie si modifiée
    if (data.categoryId) {
      const category = await prisma.expense_categories.findFirst({
        where: {
          id: data.categoryId,
          company_id: companyId,
        },
      });

      if (!category) {
        throw new CustomError('Expense category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    // Vérifier compte comptable si modifié
    if (data.accountId !== undefined) {
      if (data.accountId) {
        const account = await prisma.accounts.findFirst({
          where: {
            id: data.accountId,
            company_id: companyId,
          },
        });

        if (!account) {
          throw new CustomError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
        }

        // Vérifier que le compte est de type expense
        if (account.type !== 'expense') {
          throw new CustomError('Account must be of type expense', 400, 'INVALID_ACCOUNT_TYPE');
        }
      }
    }

    // Recalculer les totaux si montant modifié
    const currentAmountHt = Number(expense.amountHt || expense.amountHt || 0);
    const currentAmountTtc = Number(expense.amountTtc || expense.amountTtc || 0);

    let totals = {
      amountHt: new Decimal(currentAmountHt),
      taxAmount: expense.taxAmount,
      amountTtc: new Decimal(currentAmountTtc),
    };

    if (data.amountHt !== undefined || data.taxRate !== undefined) {
      const amountHt = data.amountHt !== undefined ? data.amountHt : currentAmountHt;
      // Calculer le taux de TVA à partir de taxAmount et amountHt si disponible, sinon utiliser data.taxRate ou 0
      let taxRate = 0;
      if (data.taxRate !== undefined) {
        taxRate = data.taxRate;
      } else if (expense.taxAmount && expense.amountHt && Number(expense.amountHt) > 0) {
        taxRate = (Number((expense as any).taxAmount) / Number((expense as any).amountHt)) * 100;
      }
      const calculatedTotals = this.calculateTotals(amountHt, taxRate);
      totals = {
        amountHt: new Decimal(calculatedTotals.amountHt),
        taxAmount: Number(calculatedTotals.taxAmount),
        amountTtc: new Decimal(calculatedTotals.amountTtc),
      };
    }

    const updated = await prisma.expenses.update({
      where: { id: expenseId },
      data: {
        ...(data.expenseDate && { expense_date: new Date(data.expenseDate) }),
        ...(data.supplierId !== undefined && { supplier_id: data.supplierId }),
        ...(data.supplierName !== undefined && { supplier_name: data.supplierName }),
        ...(data.categoryId !== undefined && { category_id: data.categoryId }),
        ...(data.accountId !== undefined && { account_id: data.accountId }),
        ...(data.amountHt !== undefined && {
          amount: totals.amountHt, // Champ principal
          amount_ht: totals.amountHt, // Alias
        }),
        // taxRate n'existe pas dans le modèle Expense, on le calcule à partir de taxAmount
        ...(data.amountHt !== undefined || data.taxRate !== undefined
          ? {
            tax_amount: totals.taxAmount,
            total_amount: totals.amountTtc, // Champ principal
            amount_ttc: totals.amountTtc, // Alias
          }
          : {}),
        ...(data.paymentMethod && { payment_method: data.paymentMethod }),
        ...(data.paymentDate !== undefined && {
          payment_date: data.paymentDate ? new Date(data.paymentDate) : null,
        }),
        ...(data.status && { status: data.status }),
        ...(data.reference !== undefined && { reference: data.reference }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.currency && { currency: data.currency }),
        ...(data.mobileMoneyProvider !== undefined && {
          mobile_money_provider: data.mobileMoneyProvider,
        }),
        ...(data.mobileMoneyNumber !== undefined && {
          mobile_money_number: data.mobileMoneyNumber,
        }),
        ...(data.transactionReference !== undefined && {
          transaction_reference: data.transactionReference,
        }),
        ...(data.bankName !== undefined && { bank_name: data.bankName }),
        ...(data.checkNumber !== undefined && { check_number: data.checkNumber }),
        ...(data.cardLastFour !== undefined && { card_last_four: data.cardLastFour }),
      },
      include: {
        suppliers: true,
        expense_categories: true,
        accounts: true,
      },
    });

    // Mettre à jour les statistiques du fournisseur si applicable
    if (updated.supplier_id) {
      await supplierService.updateStats(updated.supplier_id);
    }

    logger.info(`Expense updated: ${expenseId}`, { companyId, expenseId });

    // Créer l'écriture comptable automatique pour toute dépense non brouillon / non annulée
    if (updated.status !== 'draft' && updated.status !== 'cancelled') {
      await this.createJournalEntryForExpense(companyId, updated, userId);
    }

    return updated;
  }

  /**
   * Supprimer une dépense
   */
  async delete(companyId: string, expenseId: string) {
    const expense = await this.getById(companyId, expenseId);

    // Soft delete
    await prisma.expenses.update({
      where: { id: expenseId },
      data: { deleted_at: new Date() },
    });

    // Mettre à jour les statistiques du fournisseur si applicable
    if (expense.supplierId) {
      await supplierService.updateStats(expense.supplierId);
    }

    // Décrémenter le compteur d'usage
    await usageService.decrement(companyId, 'expenses');

    logger.info(`Expense deleted: ${expenseId}`, { companyId, expenseId });

    return { success: true };
  }

  /**
   * Dupliquer une dépense
   */
  async duplicate(companyId: string, expenseId: string, userId: string) {
    const expense = await this.getById(companyId, expenseId);

    // Calculer le taux de TVA à partir de taxAmount et amountHt
    const amountHt = Number(expense.amountHt || expense.amountHt || 0);
    const taxAmount = Number(expense.taxAmount || 0);
    const taxRate = amountHt > 0 ? (taxAmount / amountHt) * 100 : 0;

    const newExpense = await this.create(companyId, userId, {
      expenseDate: new Date(),
      supplierId: expense.supplierId || undefined,
      supplierName: expense.supplierName || undefined,
      categoryId: expense.categoryId || undefined,
      amountHt,
      taxRate: taxRate > 0 ? taxRate : undefined,
      amountTtc: Number(expense.amountTtc || expense.amountTtc || 0),
      paymentMethod: expense.paymentMethod || 'cash',
      status: 'draft',
      description: expense.description || undefined,
      notes: expense.notes || undefined,
      currency: expense.currency || undefined,
    });

    logger.info(`Expense duplicated: ${expenseId} -> ${newExpense.id}`, {
      companyId,
      originalExpenseId: expenseId,
      newExpenseId: newExpense.id,
    });

    return newExpense;
  }
}

export default new ExpenseService();

