import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import accountService from './account.service';
import journalEntryService from './journalEntry.service';
import { Decimal } from '@prisma/client/runtime/library';

export type DepreciationMethod = 'linear' | 'declining';

export interface CreateDepreciationData {
  assetAccountId?: string;
  depreciationAccountId?: string;
  assetName?: string;
  acquisitionDate?: string | Date;
  acquisitionCost?: number;
  depreciationMethod?: DepreciationMethod;
  depreciationRate?: number; // Pourcentage annuel (optionnel pour linéaire)
  usefulLife?: number; // années
  notes?: string;
}

export interface UpdateDepreciationData {
  assetName?: string;
  depreciationMethod?: DepreciationMethod;
  depreciationRate?: number;
  usefulLife?: number;
  isActive?: boolean;
  notes?: string;
}

export interface DepreciationTableEntry {
  period: string; // "2025-01"
  date: Date;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number; // acquisitionCost - accumulatedDepreciation
}

export class DepreciationService {
  /**
   * Calculer l'amortissement accumulé à partir des écritures comptables
   */
  private async calculateAccumulatedDepreciation(
    companyId: string,
    depreciationId: string
  ): Promise<number> {
    // Récupérer toutes les écritures comptables liées à cette dépréciation
    const entries = await prisma.journal_entries.findMany({
      where: {
        companyId,
        sourceType: 'depreciation',
        sourceId: depreciationId,
        status: 'posted',
      },
      include: {
        lines: {
          where: {
            account: {
              // Compte d'amortissement
            },
          },
        },
      },
    });

    // Calculer le total des crédits sur le compte d'amortissement
    let accumulated = 0;
    for (const entry of entries) {
      for (const line of entry.lines) {
        // Pour un compte d'amortissement (passif), les crédits augmentent l'amortissement accumulé
        accumulated += Number(line.credit);
      }
    }

    return accumulated;
  }

  /**
   * Calculer l'amortissement mensuel (linéaire)
   */
  private calculateLinearMonthlyDepreciation(
    acquisitionCost: number,
    usefulLife: number
  ): number {
    if (usefulLife <= 0) {
      throw new CustomError('Useful life must be greater than 0', 400, 'INVALID_USEFUL_LIFE');
    }
    
    const annualDepreciation = acquisitionCost / usefulLife;
    return annualDepreciation / 12;
  }

  /**
   * Calculer l'amortissement mensuel (dégressif)
   */
  private calculateDecliningMonthlyDepreciation(
    acquisitionCost: number,
    depreciationRate: number,
    accumulatedDepreciation: number
  ): number {
    if (depreciationRate <= 0 || depreciationRate > 100) {
      throw new CustomError('Depreciation rate must be between 0 and 100', 400, 'INVALID_DEPRECIATION_RATE');
    }

    const netBookValue = acquisitionCost - accumulatedDepreciation;
    const annualDepreciation = (netBookValue * depreciationRate) / 100;
    return annualDepreciation / 12;
  }

  /**
   * Créer un plan d'amortissement
   */
  async create(companyId: string, data: CreateDepreciationData, userId?: string) {
    // Vérifier que les comptes existent et appartiennent à la compagnie
    const assetAccount = await accountService.getById(companyId, data.assetAccountId);
    const depreciationAccount = await accountService.getById(companyId, data.depreciationAccountId);

    // Vérifier que les comptes sont du bon type
    if (assetAccount.type !== 'asset') {
      throw new CustomError(
        'Asset account must be of type "asset"',
        400,
        'INVALID_ACCOUNT_TYPE'
      );
    }

    // Calculer l'amortissement mensuel initial
    let monthlyDepreciation: number;
    if (data.depreciationMethod === 'linear') {
      monthlyDepreciation = this.calculateLinearMonthlyDepreciation(
        data.acquisitionCost,
        data.usefulLife
      );
    } else if (data.depreciationMethod === 'declining') {
      if (!data.depreciationRate) {
        throw new CustomError(
          'Depreciation rate is required for declining method',
          400,
          'MISSING_DEPRECIATION_RATE'
        );
      }
      monthlyDepreciation = this.calculateDecliningMonthlyDepreciation(
        data.acquisitionCost,
        data.depreciationRate,
        0 // Pas encore d'amortissement accumulé
      );
    } else {
      throw new CustomError(
        'Invalid depreciation method. Must be "linear" or "declining"',
        400,
        'INVALID_DEPRECIATION_METHOD'
      );
    }

    const purchaseDate = typeof data.acquisitionDate === 'string' 
      ? new Date(data.acquisitionDate) 
      : data.acquisitionDate;

    const depreciation = await prisma.depreciation.create({
      data: {
        companyId,
        assetAccountId: data.assetAccountId,
        depreciationAccountId: data.depreciationAccountId,
        description: data.assetName || '',
        purchaseDate,
        purchaseAmount: new Decimal(data.acquisitionCost),
        depreciationMethod: data.depreciationMethod,
        depreciationRate: data.depreciationRate 
          ? new Decimal(data.depreciationRate) 
          : new Decimal((100 / data.usefulLife)), // Calculer le taux si non fourni
        startDate: purchaseDate,
        isActive: true,
      },
      include: {
        assetAccount: true,
        depreciationAccount: true,
      },
    });

    logger.info(`Depreciation plan created: ${depreciation.id}`, {
      companyId,
      assetName: data.assetName,
    });

    return depreciation;
  }

  /**
   * Obtenir un plan d'amortissement par ID
   */
  async getById(companyId: string, depreciationId: string) {
    const depreciation = await prisma.depreciation.findFirst({
      where: {
        id: depreciationId,
        companyId,
      },
      include: {
        assetAccount: true,
        depreciationAccount: true,
      },
    });

    if (!depreciation) {
      throw new CustomError('Depreciation not found', 404, 'DEPRECIATION_NOT_FOUND');
    }

    return depreciation;
  }

  /**
   * Lister les plans d'amortissement
   */
  async list(companyId: string, filters: { isActive?: boolean } = {}) {
    const where: any = {
      companyId,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const depreciations = await prisma.depreciation.findMany({
      where,
      include: {
        assetAccount: true,
        depreciationAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return depreciations;
  }

  /**
   * Mettre à jour un plan d'amortissement
   */
  async update(
    companyId: string,
    depreciationId: string,
    data: UpdateDepreciationData
  ) {
    const depreciation = await this.getById(companyId, depreciationId);

    // Si l'amortissement est désactivé, on ne peut pas le modifier
    if (!depreciation.isActive && data.isActive !== true) {
      throw new CustomError(
        'Cannot update inactive depreciation',
        400,
        'CANNOT_UPDATE_INACTIVE'
      );
    }

    // Calculer l'amortissement mensuel à partir des données du modèle
    const purchaseAmount = Number(depreciation.purchaseAmount);
    const depreciationRate = Number(depreciation.depreciationRate);
    // Calculer usefulLife à partir de depreciationRate (usefulLife = 100 / rate)
    const usefulLife = depreciationRate > 0 ? 100 / depreciationRate : 0;
    
    // Calculer accumulatedDepreciation à partir des écritures comptables
    const accumulated = await this.calculateAccumulatedDepreciation(companyId, depreciationId);
    
    let monthlyDepreciation = 0;
    if (data.depreciationMethod || data.usefulLife || data.depreciationRate) {
      const method = data.depreciationMethod || depreciation.depreciationMethod;
      const calculatedUsefulLife = data.usefulLife || usefulLife;

      if (method === 'linear') {
        monthlyDepreciation = this.calculateLinearMonthlyDepreciation(
          purchaseAmount,
          calculatedUsefulLife
        );
      } else if (method === 'declining') {
        const rate = data.depreciationRate 
          ? data.depreciationRate
          : depreciationRate;
        monthlyDepreciation = this.calculateDecliningMonthlyDepreciation(
          purchaseAmount,
          rate,
          accumulated
        );
      }
    }

    const updated = await prisma.depreciation.update({
      where: { id: depreciationId },
      data: {
        ...(data.assetName && { description: data.assetName }),
        ...(data.depreciationMethod && { depreciationMethod: data.depreciationMethod }),
        ...(data.depreciationRate !== undefined && { depreciationRate: new Decimal(data.depreciationRate) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        assetAccount: true,
        depreciationAccount: true,
      },
    });

    logger.info(`Depreciation updated: ${depreciationId}`, { companyId });

    return updated;
  }

  /**
   * Calculer l'amortissement mensuel actuel
   */
  async calculateMonthlyDepreciation(
    companyId: string,
    depreciationId: string
  ): Promise<number> {
    const depreciation = await this.getById(companyId, depreciationId);

    const purchaseAmount = Number(depreciation.purchaseAmount);
    const depreciationRate = Number(depreciation.depreciationRate);
    const usefulLife = depreciationRate > 0 ? 100 / depreciationRate : 0;
    const accumulated = await this.calculateAccumulatedDepreciation(companyId, depreciationId);

    // Vérifier si l'actif est complètement amorti
    if (accumulated >= purchaseAmount) {
      return 0;
    }

    if (depreciation.depreciationMethod === 'linear') {
      return this.calculateLinearMonthlyDepreciation(
        purchaseAmount,
        usefulLife
      );
    } else {
      const purchaseAmount = Number(depreciation.purchaseAmount);
      const rate = Number(depreciation.depreciationRate || 0);
      return this.calculateDecliningMonthlyDepreciation(
        purchaseAmount,
        rate,
        accumulated
      );
    }
  }

  /**
   * Générer une écriture d'amortissement pour un mois donné
   */
  async generateDepreciationEntry(
    companyId: string,
    depreciationId: string,
    period: string, // Format: "2025-01"
    userId?: string
  ) {
    const depreciation = await this.getById(companyId, depreciationId);

    if (!depreciation.isActive) {
      throw new CustomError(
        'Cannot generate entry for inactive depreciation',
        400,
        'INACTIVE_DEPRECIATION'
      );
    }

    // Parser la période
    const [year, month] = period.split('-').map(Number);
    const entryDate = new Date(year, month - 1, 1);

    // Calculer l'amortissement mensuel
    const monthlyDepreciation = await this.calculateMonthlyDepreciation(
      companyId,
      depreciationId
    );

    if (monthlyDepreciation <= 0) {
      throw new CustomError(
        'Asset is fully depreciated',
        400,
        'FULLY_DEPRECIATED'
      );
    }

    // Vérifier si une écriture existe déjà pour cette période
    const existingEntry = await prisma.journal_entries.findFirst({
      where: {
        companyId,
        sourceType: 'manual',
        // reference n'existe pas dans JournalEntry, utiliser description pour identifier
      },
    });

    if (existingEntry) {
      throw new CustomError(
        `Depreciation entry already exists for period ${period}`,
        400,
        'ENTRY_ALREADY_EXISTS'
      );
    }

    // Créer l'écriture comptable
    const entry = await journalEntryService.create(companyId, {
      entryDate,
      description: `Amortissement - ${depreciation.description} (${period})`,
      // reference n'existe pas dans JournalEntry
      sourceType: 'manual',
      lines: [
        {
          accountId: depreciation.depreciationAccountId,
          description: `Amortissement - ${depreciation.description}`,
          debit: monthlyDepreciation,
          credit: 0,
        },
        {
          accountId: depreciation.assetAccountId,
          description: `Amortissement - ${depreciation.description}`,
          debit: 0,
          credit: monthlyDepreciation,
        },
      ],
      createdBy: userId,
    });

    // L'amortissement accumulé est calculé à partir des écritures comptables, pas stocké dans le modèle
    // Pas besoin de mettre à jour accumulatedDepreciation car il n'existe pas dans le modèle

    logger.info(`Depreciation entry generated: ${entry.id}`, {
      companyId,
      depreciationId,
      period,
    });

    return entry;
  }

  /**
   * Générer le tableau d'amortissement complet
   */
  async generateDepreciationTable(
    companyId: string,
    depreciationId: string
  ): Promise<DepreciationTableEntry[]> {
    const depreciation = await this.getById(companyId, depreciationId);

    const purchaseDate = depreciation.purchaseDate;
    const purchaseAmount = Number(depreciation.purchaseAmount);
    const depreciationRate = Number(depreciation.depreciationRate);
    // Calculer usefulLife à partir de depreciationRate (usefulLife = 100 / rate)
    const usefulLife = depreciationRate > 0 ? 100 / depreciationRate : 0;
    const method = depreciation.depreciationMethod;
    const rate = depreciationRate;

    const table: DepreciationTableEntry[] = [];
    let accumulated = await this.calculateAccumulatedDepreciation(companyId, depreciationId);
    let currentDate = new Date(purchaseDate);
    const endDate = new Date(purchaseDate);
    endDate.setFullYear(endDate.getFullYear() + usefulLife);

    while (currentDate < endDate && accumulated < purchaseAmount) {
      let monthlyDepreciation: number;

      if (method === 'linear') {
        monthlyDepreciation = this.calculateLinearMonthlyDepreciation(
          purchaseAmount,
          usefulLife
        );
      } else {
        monthlyDepreciation = this.calculateDecliningMonthlyDepreciation(
          purchaseAmount,
          rate || 0,
          accumulated
        );
      }

      // S'assurer qu'on ne dépasse pas le coût d'acquisition
      if (accumulated + monthlyDepreciation > purchaseAmount) {
        monthlyDepreciation = purchaseAmount - accumulated;
      }

      accumulated += monthlyDepreciation;
      const netBookValue = purchaseAmount - accumulated;

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const period = `${year}-${month}`;

      table.push({
        period,
        date: new Date(currentDate),
        monthlyDepreciation,
        accumulatedDepreciation: accumulated,
        netBookValue,
      });

      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return table;
  }

  /**
   * Supprimer un plan d'amortissement
   */
  async delete(companyId: string, depreciationId: string) {
    const depreciation = await this.getById(companyId, depreciationId);

    // Vérifier qu'il n'y a pas d'écritures liées
    const entries = await prisma.journal_entries.findMany({
      where: {
        companyId,
        sourceType: 'manual',
        description: {
          startsWith: `DEP-${depreciationId}-`,
        },
      },
    });

    if (entries.length > 0) {
      throw new CustomError(
        'Cannot delete depreciation with existing entries',
        400,
        'HAS_ENTRIES'
      );
    }

    await prisma.depreciation.delete({
      where: { id: depreciationId },
    });

    logger.info(`Depreciation deleted: ${depreciationId}`, { companyId });
  }

  /**
   * Traiter tous les amortissements actifs pour générer les écritures du mois précédent
   * Cette méthode est appelée par le scheduler mensuel
   */
  async processMonthlyDepreciations(): Promise<Array<{ depreciationId: string; companyId: string; entryId?: string; success: boolean; skipped?: boolean; error?: string; reason?: string }>> {
    const now = new Date();
    // Calculer le mois précédent
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

    logger.info('Processing monthly depreciations', { period });

    // Récupérer tous les plans d'amortissement actifs
    const depreciations = await prisma.depreciation.findMany({
      where: {
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    logger.info(`Found ${depreciations.length} active depreciation plans`);

    const results = [];

    for (const depreciation of depreciations) {
      try {
        // Vérifier si l'actif est complètement amorti
        const purchaseAmount = Number(depreciation.purchaseAmount);
        const accumulated = await this.calculateAccumulatedDepreciation(depreciation.companyId, depreciation.id);

        if (accumulated >= purchaseAmount) {
          logger.info(`Depreciation ${depreciation.id} is fully depreciated, skipping`);
          results.push({
            depreciationId: depreciation.id,
            companyId: depreciation.companyId,
            success: true,
            skipped: true,
            reason: 'Fully depreciated',
          });
          continue;
        }

        // Vérifier si une écriture existe déjà pour cette période
        const existingEntry = await prisma.journal_entries.findFirst({
          where: {
            companyId: depreciation.companyId,
            sourceType: 'manual',
            description: {
              startsWith: `DEP-${depreciation.id}-${period}`,
            },
          },
        });

        if (existingEntry) {
          logger.info(`Entry already exists for depreciation ${depreciation.id} period ${period}`);
          results.push({
            depreciationId: depreciation.id,
            companyId: depreciation.companyId,
            success: true,
            skipped: true,
            reason: 'Entry already exists',
          });
          continue;
        }

        // Vérifier que la date d'acquisition est antérieure ou égale au mois précédent
        const purchaseDate = depreciation.purchaseDate;
        if (purchaseDate > previousMonth) {
          logger.info(`Depreciation ${depreciation.id} acquisition date is after ${period}, skipping`);
          results.push({
            depreciationId: depreciation.id,
            companyId: depreciation.companyId,
            success: true,
            skipped: true,
            reason: 'Acquisition date after period',
          });
          continue;
        }

        // Générer l'écriture d'amortissement
        const entry = await this.generateDepreciationEntry(
          depreciation.companyId,
          depreciation.id,
          period
        );

        logger.info(`Depreciation entry generated: ${entry.id}`, {
          depreciationId: depreciation.id,
          companyId: depreciation.companyId,
          period,
        });

        results.push({
          depreciationId: depreciation.id,
          companyId: depreciation.companyId,
          entryId: entry.id,
          success: true,
        });
      } catch (error: any) {
        logger.error('Failed to process depreciation', {
          depreciationId: depreciation.id,
          companyId: depreciation.companyId,
          error: error.message,
          stack: error.stack,
        });

        results.push({
          depreciationId: depreciation.id,
          companyId: depreciation.companyId,
          success: false,
          error: error.message,
        });
      }
    }

    logger.info('Monthly depreciations processing completed', {
      total: depreciations.length,
      successful: results.filter((r) => r.success && !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length,
      failed: results.filter((r) => !r.success).length,
    });

    return results;
  }
}

export default new DepreciationService();

