import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export interface CreateFiscalPeriodData {
  name?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  notes?: string;
}

export interface UpdateFiscalPeriodData {
  name?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  notes?: string;
}

export interface FiscalPeriodFilters {
  isClosed?: boolean;
  isLocked?: boolean;
  year?: number;
}

/**
 * Mapper les données Prisma vers le format attendu par le frontend
 */
const mapFiscalPeriod = (period: any) => {
  return {
    ...period,
    id: period.id,
    companyId: period.company_id,
    name: period.name,
    startDate: period.start_date,
    endDate: period.end_date,
    status: period.status,
    isClosed: period.status === 'closed',
    isLocked: period.status === 'locked',
  };
};

export class FiscalPeriodService {
  /**
   * Créer un exercice comptable
   */
  async create(companyId: string, data: CreateFiscalPeriodData, userId?: string) {
    const startDate = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
    const endDate = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;

    // Valider les dates
    if (startDate >= endDate) {
      throw new CustomError('La date de début doit être antérieure à la date de fin', 400, 'INVALID_DATES');
    }

    // Vérifier qu'il n'y a pas de chevauchement avec un autre exercice
    const overlappingPeriod = await prisma.fiscal_periods.findFirst({
      where: {
        company_id: companyId,
        OR: [
          {
            start_date: {
              lte: endDate,
            },
            end_date: {
              gte: startDate,
            },
          },
        ],
      },
    });

    if (overlappingPeriod) {
      throw new CustomError(
        `Un exercice existe déjà pour cette période (${overlappingPeriod.name})`,
        400,
        'OVERLAPPING_PERIOD'
      );
    }

    const period = await prisma.fiscal_periods.create({
      data: {
        id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
        company_id: companyId,
        name: data.name,
        start_date: startDate,
        end_date: endDate,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    logger.info(`Fiscal period created: ${period.id}`, { companyId, periodId: period.id });

    return mapFiscalPeriod(period);
  }

  /**
   * Obtenir un exercice par ID
   */
  async getById(companyId: string, periodId: string) {
    const period = await prisma.fiscal_periods.findFirst({
      where: {
        id: periodId,
        company_id: companyId,
      },
    });

    if (!period) {
      throw new CustomError('Fiscal period not found', 404, 'PERIOD_NOT_FOUND');
    }

    return mapFiscalPeriod(period);
  }

  /**
   * Lister les exercices
   */
  async list(companyId: string, filters: FiscalPeriodFilters = {}) {
    const where: any = {
      company_id: companyId,
    };

    if (filters.isClosed !== undefined) {
      where.status = filters.isClosed ? 'closed' : 'open';
    }

    if (filters.isLocked !== undefined) {
      if (filters.isLocked) {
        where.status = 'locked';
      } else {
        // si non verrouillé: on exclut seulement locked
        where.status = { not: 'locked' };
      }
    }

    if (filters.year) {
      where.start_date = {
        gte: new Date(`${filters.year}-01-01`),
        lt: new Date(`${filters.year + 1}-01-01`),
      };
    }

    const periods = await prisma.fiscal_periods.findMany({
      where,
      orderBy: {
        start_date: 'desc',
      },
    });

    return periods.map(mapFiscalPeriod);
  }

  /**
   * Obtenir l'exercice en cours (non clos)
   */
  async getCurrent(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentPeriod = await prisma.fiscal_periods.findFirst({
      where: {
        company_id: companyId,
        start_date: {
          lte: today,
        },
        end_date: {
          gte: today,
        },
        status: {
          in: ['open', 'locked'],
        },
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    return currentPeriod ? mapFiscalPeriod(currentPeriod) : null;
  }

  /**
   * Vérifier qu'une date est dans une période ouverte
   */
  async validatePeriod(companyId: string, date: Date): Promise<{ isValid: boolean; period?: any; message?: string }> {
    const period = await prisma.fiscal_periods.findFirst({
      where: {
        company_id: companyId,
        start_date: {
          lte: date,
        },
        end_date: {
          gte: date,
        },
      },
    });

    if (!period) {
      return {
        isValid: false,
        message: `Aucun exercice comptable trouvé pour la date ${date.toISOString().split('T')[0]}. Toutes les transactions financières doivent être dans une période valide.`,
      };
    }

    if (period.status === 'closed') {
      return {
        isValid: false,
        period,
        message: `L'exercice "${period.name}" est clos. Aucune modification n'est autorisée.`,
      };
    }

    if (period.status === 'locked') {
      return {
        isValid: false,
        period,
        message: `L'exercice "${period.name}" est verrouillé. Aucune modification n'est autorisée.`,
      };
    }

    return {
      isValid: true,
      period,
    };
  }

  /**
   * Helper pour vérifier si une période est verrouillée/close (P0001/P0002 compliance)
   */
  async checkLock(companyId: string, date: Date): Promise<void> {
    const result = await this.validatePeriod(companyId, date);
    if (!result.isValid) {
      const code = result.message?.includes('clos') ? 'PERIOD_CLOSED' :
        result.message?.includes('verrouillé') ? 'PERIOD_LOCKED' : 'PERIOD_NOT_FOUND';

      throw new CustomError(result.message || 'Période invalide', 400, code, {
        date,
        periodName: result.period?.name
      });
    }
  }

  /**
   * Clôturer un exercice (DOC-09)
   */
  async close(companyId: string, periodId: string, userId: string, userRole?: string) {
    const period = await this.getById(companyId, periodId);

    if (period.status === 'closed') {
      throw new CustomError('Cet exercice est déjà clos', 400, 'ALREADY_CLOSED');
    }

    if (period.status === 'locked') {
      throw new CustomError('Cet exercice est verrouillé. Déverrouillez-le avant de le clôturer.', 400, 'PERIOD_LOCKED');
    }

    const updated = await prisma.fiscal_periods.update({
      where: { id: periodId },
      data: {
        status: 'closed',
        closed_at: new Date(),
        closed_by: userId,
        updated_at: new Date(),
      },
    });

    logger.info(`Fiscal period closed: ${periodId}`, { companyId, periodId, userId });

    // DOC-09 + DOC-08: Audit trail
    const auditService = (await import('./audit.service')).default;
    await auditService.createLog({
      companyId,
      userId,
      userRole,
      action: 'CLOSE_PERIOD',
      entityType: 'fiscal_period',
      entityId: periodId,
      module: 'comptabilite',
      beforeState: { status: period.status },
      afterState: { status: 'closed', closed_at: new Date(), closed_by: userId },
      metadata: { periodName: period.name },
    });

    return mapFiscalPeriod(updated);
  }

  /**
   * Rouvrir un exercice (DOC-09: exige justification + audit)
   */
  async reopen(companyId: string, periodId: string, userId: string, userRole?: string, justification?: string) {
    const period = await this.getById(companyId, periodId);

    if (period.status !== 'closed') {
      throw new CustomError('Cet exercice n\'est pas clos', 400, 'NOT_CLOSED');
    }

    // DOC-09: Justification obligatoire pour réouverture
    if (!justification || justification.trim().length === 0) {
      throw new CustomError(
        'La réouverture d\'une période clôturée exige une justification écrite (DOC-09 compliance)',
        400,
        'JUSTIFICATION_REQUIRED'
      );
    }

    const updated = await prisma.fiscal_periods.update({
      where: { id: periodId },
      data: {
        status: 'open',
        closed_at: null,
        closed_by: null,
        updated_at: new Date(),
      },
    });

    logger.warn(`Fiscal period reopened: ${periodId}`, { companyId, periodId, userId, justification });

    // DOC-09 + DOC-08: Audit trail avec justification
    const auditService = (await import('./audit.service')).default;
    await auditService.createLog({
      companyId,
      userId,
      userRole,
      action: 'REOPEN_PERIOD',
      entityType: 'fiscal_period',
      entityId: periodId,
      module: 'comptabilite',
      beforeState: { status: 'closed' },
      afterState: { status: 'open' },
      justification,  // DOC-09: Mandatory justification
      metadata: { periodName: period.name },
    });

    return mapFiscalPeriod(updated);
  }

  /**
   * Verrouiller une période (DOC-09)
   */
  async lock(companyId: string, periodId: string, userId: string, userRole?: string) {
    const period = await this.getById(companyId, periodId);

    if (period.status === 'locked') {
      throw new CustomError('Cette période est déjà verrouillée', 400, 'ALREADY_LOCKED');
    }

    const updated = await prisma.fiscal_periods.update({
      where: { id: periodId },
      data: {
        status: 'locked',
        updated_at: new Date(),
      },
    });

    logger.info(`Fiscal period locked: ${periodId}`, { companyId, periodId, userId });

    // DOC-09 + DOC-08: Audit trail
    const auditService = (await import('./audit.service')).default;
    await auditService.createLog({
      companyId,
      userId,
      userRole,
      action: 'LOCK_PERIOD',
      entityType: 'fiscal_period',
      entityId: periodId,
      module: 'comptabilite',
      beforeState: { status: period.status },
      afterState: { status: 'locked' },
      metadata: { periodName: period.name },
    });

    return mapFiscalPeriod(updated);
  }

  /**
   * Déverrouiller une période (DOC-09)
   */
  async unlock(companyId: string, periodId: string, userId: string, userRole?: string) {
    const period = await this.getById(companyId, periodId);

    if (period.status !== 'locked') {
      throw new CustomError('Cette période n\'est pas verrouillée', 400, 'NOT_LOCKED');
    }

    const updated = await prisma.fiscal_periods.update({
      where: { id: periodId },
      data: {
        status: 'open',
        updated_at: new Date(),
      },
    });

    logger.info(`Fiscal period unlocked: ${periodId}`, { companyId, periodId, userId });

    // DOC-09 + DOC-08: Audit trail
    const auditService = (await import('./audit.service')).default;
    await auditService.createLog({
      companyId,
      userId,
      userRole,
      action: 'UNLOCK_PERIOD',
      entityType: 'fiscal_period',
      entityId: periodId,
      module: 'comptabilite',
      beforeState: { status: 'locked' },
      afterState: { status: 'open' },
      metadata: { periodName: period.name },
    });

    return mapFiscalPeriod(updated);
  }

  /**
   * Mettre à jour un exercice
   */
  async update(companyId: string, periodId: string, data: UpdateFiscalPeriodData) {
    const period = await this.getById(companyId, periodId);

    if (period.status === 'closed') {
      throw new CustomError('Impossible de modifier un exercice clos', 400, 'PERIOD_CLOSED');
    }

    if (period.status === 'locked') {
      throw new CustomError('Impossible de modifier une période verrouillée', 400, 'PERIOD_LOCKED');
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.startDate !== undefined) {
      updateData.start_date = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
    }

    if (data.endDate !== undefined) {
      updateData.end_date = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    // Valider les dates si les deux sont présentes
    if (updateData.start_date && updateData.end_date) {
      const startDate = updateData.start_date as Date;
      const endDate = updateData.end_date as Date;
      if (startDate >= endDate) {
        throw new CustomError('La date de début doit être antérieure à la date de fin', 400, 'INVALID_DATES');
      }
    }

    const updated = await prisma.fiscal_periods.update({
      where: { id: periodId },
      data: updateData,
    });

    logger.info(`Fiscal period updated: ${periodId}`, { companyId, periodId });

    return mapFiscalPeriod(updated);
  }

  /**
   * Supprimer un exercice
   */
  async delete(companyId: string, periodId: string) {
    const period = await this.getById(companyId, periodId);

    if (period.status === 'closed') {
      throw new CustomError('Impossible de supprimer un exercice clos', 400, 'PERIOD_CLOSED');
    }

    if (period.status === 'locked') {
      throw new CustomError('Impossible de supprimer une période verrouillée', 400, 'PERIOD_LOCKED');
    }

    // Vérifier qu'il n'y a pas d'écritures dans cette période
    const entriesCount = await prisma.journal_entries.count({
      where: {
        company_id: companyId,
        entry_date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
    });

    if (entriesCount > 0) {
      throw new CustomError(
        `Impossible de supprimer cet exercice car il contient ${entriesCount} écriture(s) comptable(s)`,
        400,
        'PERIOD_HAS_ENTRIES'
      );
    }

    await prisma.fiscal_periods.delete({
      where: { id: periodId },
    });

    logger.info(`Fiscal period deleted: ${periodId}`, { companyId, periodId });

    return { success: true, message: 'Exercice supprimé avec succès' };
  }
}

export default new FiscalPeriodService();
