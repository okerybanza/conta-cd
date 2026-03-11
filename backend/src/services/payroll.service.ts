/**
 * Service de gestion de la paie (DOC-04)
 * 
 * Principe clé : La paie est un résultat, pas une saisie directe
 * Elle est construite à partir :
 * - du contrat actif
 * - du temps validé
 * - des événements RH (absence, prime, sanction, bonus)
 * 
 * Architecture événementielle : chaque validation génère un événement comptable
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';
import { eventBus } from '../events/event-bus';
import { PayrollCreated, PayrollValidated, PayrollCancelled } from '../events/domain-event';
import employeeContractService from './employee-contract.service';
import auditService from './audit.service';
import fiscalPeriodService from './fiscalPeriod.service';

export interface CreatePayrollData {
  employeeId: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  payDate: Date | string;
  notes?: string;
}

export interface PayrollItemData {
  type: string; // 'salary', 'bonus', 'allowance', 'deduction', 'tax', etc.
  description: string;
  amount: number;
  isDeduction: boolean;
}

export interface RDCDeductions {
  inssEmployee: number;
  ipr: number;
  onem: number;
  total: number;
}

export interface CalculatePayrollResult {
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  items: PayrollItemData[];
  rdc_deductions?: RDCDeductions | null;
}

export class PayrollService {
  /**
   * Calcul des retenues légales RDC (INSS, IPR, ONEM)
   * Les seuils sont exprimés en USD (DOC-04, note RDC).
   */
  private calculateRDCDeductions(grossSalary: number, currency: string): RDCDeductions {
    if (!grossSalary || grossSalary <= 0) {
      return { inssEmployee: 0, ipr: 0, onem: 0, total: 0 };
    }

    // INSS employé : 5% du salaire brut, plafonné à 900 USD/mois
    const inssBaseCap = 900;
    const inssBase = grossSalary > inssBaseCap ? inssBaseCap : grossSalary;
    const inssEmployee = inssBase * 0.05;

    // IPR : barème progressif
    // 0% jusqu'à 524
    // 15% de 524 à 1269
    // 20% de 1269 à 2114
    // 30% au-delà
    let remaining = grossSalary;
    let ipr = 0;

    const tier1Limit = 524;
    const tier2Limit = 1269;
    const tier3Limit = 2114;

    // Tranche 0% [0, 524]
    if (remaining <= tier1Limit) {
      ipr = 0;
    } else {
      remaining -= tier1Limit;

      // Tranche 15% (524 → 1269)
      const tier2Width = tier2Limit - tier1Limit; // 745
      const tier2Amount = Math.min(remaining, tier2Width);
      ipr += tier2Amount * 0.15;
      remaining -= tier2Amount;

      if (remaining > 0) {
        // Tranche 20% (1269 → 2114)
        const tier3Width = tier3Limit - tier2Limit; // 845
        const tier3Amount = Math.min(remaining, tier3Width);
        ipr += tier3Amount * 0.20;
        remaining -= tier3Amount;

        // Tranche 30% au‑delà
        if (remaining > 0) {
          ipr += remaining * 0.30;
        }
      }
    }

    // ONEM : 0,2% du salaire brut
    const onem = grossSalary * 0.002;

    const total = inssEmployee + ipr + onem;

    return {
      inssEmployee,
      ipr,
      onem,
      total,
    };
  }

  /**
   * Calculer la paie à partir du contrat + temps + événements (DOC-04)
   */
  async calculatePayroll(
    companyId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CalculatePayrollResult> {
    // 1. Récupérer le contrat actif
    const contract = await employeeContractService.getActiveContract(companyId, employeeId);

    if (!contract) {
      throw new CustomError(
        'No active contract found for employee',
        404,
        'NO_ACTIVE_CONTRACT'
      );
    }

    // Vérifier que le contrat couvre la période
    const contractStart = new Date(contract.start_date);
    const contractEnd = contract.end_date ? new Date(contract.end_date) : new Date('2099-12-31');

    if (contractStart > periodStart || contractEnd < periodEnd) {
      throw new CustomError(
        'Contract does not cover the requested period',
        400,
        'CONTRACT_PERIOD_MISMATCH'
      );
    }

    const items: PayrollItemData[] = [];
    let grossSalary = 0;
    let totalDeductions = 0;

    // 2. Calculer le salaire de base selon le type de contrat
    const baseSalary = Number(contract.base_salary);
    const workType = contract.work_type || 'full_time';
    const hoursPerWeek = contract.hours_per_week ? Number(contract.hours_per_week) : 40;

    // Calculer les jours travaillés dans la période
    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const workingDays = this.calculateWorkingDays(periodStart, periodEnd, workType);

    // 3. Récupérer les absences validées dans la période
    const leaveRequests = await prisma.leave_requests.findMany({
      where: {
        employee_id: employeeId,
        company_id: companyId,
        status: 'approved',
        OR: [
          {
            AND: [
              { start_date: { lte: periodEnd } },
              { end_date: { gte: periodStart } },
            ],
          },
        ],
      },
    });

    // Calculer les jours d'absence
    let totalLeaveDays = 0;
    for (const leave of leaveRequests) {
      const leaveStart = new Date(Math.max(periodStart.getTime(), new Date(leave.start_date).getTime()));
      const leaveEnd = new Date(Math.min(periodEnd.getTime(), new Date(leave.end_date).getTime()));
      const leaveDays = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalLeaveDays += leaveDays;
    }

    // 4. Récupérer les heures travaillées (attendances)
    const attendances = await prisma.attendances.findMany({
      where: {
        employee_id: employeeId,
        company_id: companyId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: 'present',
      },
    });

    const totalHoursWorked = attendances.reduce((sum, att) => {
      return sum + (att.hours_worked ? Number(att.hours_worked) : 0);
    }, 0);

    // 5. Calculer le salaire selon le type de contrat
    if (contract.contract_type === 'CDI' || contract.contract_type === 'CDD') {
      // Salaire mensuel : proportionnel aux jours travaillés
      const daysWorked = workingDays - totalLeaveDays;
      const monthlySalary = baseSalary;
      const dailySalary = monthlySalary / 30; // Approximation standard
      grossSalary = dailySalary * daysWorked;

      items.push({
        type: 'salary',
        description: `Salaire de base (${daysWorked} jours travaillés)`,
        amount: grossSalary,
        isDeduction: false,
      });

      // Déduire les jours d'absence non payés
      if (totalLeaveDays > 0) {
        const leaveDeduction = dailySalary * totalLeaveDays;
        items.push({
          type: 'deduction',
          description: `Absences (${totalLeaveDays} jours)`,
          amount: leaveDeduction,
          isDeduction: true,
        });
        totalDeductions += leaveDeduction;
      }
    } else if (contract.contract_type === 'journalier') {
      // Salaire journalier : basé sur les jours travaillés
      const daysWorked = workingDays - totalLeaveDays;
      grossSalary = baseSalary * daysWorked;

      items.push({
        type: 'salary',
        description: `Salaire journalier (${daysWorked} jours)`,
        amount: grossSalary,
        isDeduction: false,
      });
    } else if (contract.contract_type === 'consultant') {
      // Consultant : basé sur les heures travaillées
      const hourlyRate = baseSalary; // Dans ce cas, baseSalary = taux horaire
      grossSalary = hourlyRate * totalHoursWorked;

      items.push({
        type: 'salary',
        description: `Honoraires consultant (${totalHoursWorked} heures)`,
        amount: grossSalary,
        isDeduction: false,
      });
    }

    // 6. Ajouter les primes et bonus (à partir d'événements RH futurs)
    // TODO: Implémenter quand les événements de prime seront créés

    // 7. Calculer les retenues légales (INSS, IPR, ONEM) pour la RDC
    const rdcDeductions = this.calculateRDCDeductions(grossSalary, contract.currency || 'CDF');

    if (rdcDeductions.inssEmployee > 0) {
      items.push({
        type: 'deduction',
        description: 'INSS employé (5% plafonné à 900 USD)',
        amount: rdcDeductions.inssEmployee,
        isDeduction: true,
      });
    }

    if (rdcDeductions.ipr > 0) {
      items.push({
        type: 'tax',
        description: 'IPR (barème progressif RDC)',
        amount: rdcDeductions.ipr,
        isDeduction: true,
      });
    }

    if (rdcDeductions.onem > 0) {
      items.push({
        type: 'deduction',
        description: 'ONEM (0.2% salaire brut)',
        amount: rdcDeductions.onem,
        isDeduction: true,
      });
    }

    totalDeductions += rdcDeductions.total;

    const netSalary = grossSalary - totalDeductions;

    return {
      grossSalary,
      totalDeductions,
      netSalary,
      items,
      rdc_deductions: rdcDeductions,
    };
  }

  /**
   * Calculer les jours ouvrables dans une période
   */
  private calculateWorkingDays(start: Date, end: Date, workType: string): number {
    let days = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Lundi = 1, Vendredi = 5
      if (workType === 'full_time') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          days++;
        }
      } else {
        // Part-time : tous les jours comptent
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Créer une paie (DOC-04 : résultat calculé)
   */
  async create(companyId: string, data: CreatePayrollData, userId?: string) {
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);
    const payDate = new Date(data.payDate);

    // DOC-09: Valider la période comptable
    const periodValidation = await fiscalPeriodService.validatePeriod(companyId, periodStart);
    if (!periodValidation.isValid) {
      throw new CustomError(periodValidation.message || 'Période RH verrouillée ou close', 400, 'INVALID_PERIOD');
    }

    // Calculer la paie
    const calculation = await this.calculatePayroll(companyId, data.employeeId, periodStart, periodEnd);

    // Vérifier qu'il n'existe pas déjà une paie pour cette période
    const existing = await prisma.payrolls.findFirst({
      where: {
        company_id: companyId,
        employee_id: data.employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        status: { not: 'cancelled' },
      },
    });

    if (existing) {
      throw new CustomError(
        'A payroll already exists for this period',
        409,
        'PAYROLL_EXISTS'
      );
    }

    // Créer la paie
    const payroll = await prisma.payrolls.create({
      data: {
        id: `payroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyId,
        employee_id: data.employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        pay_date: payDate,
        status: 'draft',
        gross_salary: new Prisma.Decimal(calculation.grossSalary),
        total_deductions: new Prisma.Decimal(calculation.totalDeductions),
        net_salary: new Prisma.Decimal(calculation.netSalary),
        currency: 'CDF', // TODO: Récupérer depuis le contrat
        notes: data.notes,
      },
    });

    // Créer les lignes de paie
    for (const item of calculation.items) {
      await prisma.payroll_items.create({
        data: {
          id: `payroll_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payroll_id: payroll.id,
          type: item.type,
          description: item.description,
          amount: new Prisma.Decimal(item.amount),
          is_deduction: item.isDeduction,
        },
      });
    }

    // Publier l'événement (DOC-04)
    const event = new PayrollCreated(
      {
        userId,
        companyId,
        timestamp: new Date(),
      },
      payroll.id,
      data.employeeId,
      periodStart,
      periodEnd,
      calculation.grossSalary,
      calculation.netSalary
    );
    eventBus.publish(event);

    logger.info(`Payroll created: ${payroll.id}`, {
      companyId,
      employeeId: data.employeeId,
      payrollId: payroll.id,
    });

    // DOC-08: Log de création
    await auditService.logCreate(
      companyId,
      userId,
      undefined,
      undefined,
      'payroll',
      payroll.id,
      payroll,
      'rh'
    );

    return payroll;
  }

  /**
   * Valider une paie (DOC-04 : immutable après validation)
   */
  async validate(companyId: string, payrollId: string, userId: string) {
    const payroll = await prisma.payrolls.findFirst({
      where: {
        id: payrollId,
        company_id: companyId,
      },
      include: {
        payroll_items: true,
      },
    });

    if (!payroll) {
      throw new CustomError('Payroll not found', 404, 'PAYROLL_NOT_FOUND');
    }

    if (payroll.status === 'validated') {
      throw new CustomError(
        'Payroll is already validated',
        400,
        'PAYROLL_ALREADY_VALIDATED'
      );
    }

    if (payroll.status === 'cancelled') {
      throw new CustomError(
        'Cannot validate a cancelled payroll',
        400,
        'PAYROLL_CANCELLED'
      );
    }

    // DOC-09: Valider la période
    const periodValidation = await fiscalPeriodService.validatePeriod(companyId, payroll.period_start);
    if (!periodValidation.isValid) {
      throw new CustomError('Impossible de valider une paie sur une période close ou verrouillée', 400, 'INVALID_PERIOD');
    }

    // CHECKLIST ÉTAPE 2 : Flux atomique - Paie validée = écriture comptable obligatoire dans la même transaction logique
    // Créer l'écriture comptable de manière atomique avec la validation
    try {
      // Récupérer les détails de l'employé pour l'écriture comptable
      const employee = await prisma.employees.findFirst({
        where: {
          id: payroll.employee_id,
          company_id: companyId,
        },
        select: {
          employee_number: true,
          first_name: true,
          last_name: true,
        },
      });

      if (!employee) {
        throw new CustomError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }

      // Récupérer les ID des comptes par leur code
      const accountService = (await import('./account.service')).default;
      const journalEntryService = (await import('./journalEntry.service')).default;
      
      const account641 = await accountService.getOrCreateByCode(companyId, '641', 'Charges de personnel');
      const account421 = await accountService.getOrCreateByCode(companyId, '421', 'Salaires à payer');

      // Créer l'écriture comptable (obligatoire)
      await journalEntryService.create(companyId, {
        entryDate: payroll.period_end,
        sourceType: 'manual', // Écriture d'engagement (charges à payer)
        sourceId: payrollId,
        reference: `PAYROLL-${employee.employee_number}-${payroll.period_start.toISOString().split('T')[0]}`,
        description: `Paie ${employee.first_name} ${employee.last_name} - ${payroll.period_start.toISOString().split('T')[0]} à ${payroll.period_end.toISOString().split('T')[0]}`,
        lines: [
          {
            accountId: account641.id,
            debit: Number(payroll.gross_salary),
            credit: 0,
            description: `Salaire brut - ${employee.first_name} ${employee.last_name}`,
          },
          {
            accountId: account421.id,
            debit: 0,
            credit: Number(payroll.net_salary),
            description: `Salaire net à payer`,
          },
        ],
        createdBy: userId,
      });

      // Valider la paie seulement si l'écriture comptable a été créée avec succès
      const validated = await prisma.payrolls.update({
        where: { id: payrollId },
        data: {
          status: 'validated',
          // Note: validated_at et validated_by peuvent être ajoutés au modèle si nécessaire
        },
      });

      logger.info(`Payroll validated with accounting entry created atomically: ${payrollId}`, {
        companyId,
        payrollId,
        employeeId: payroll.employee_id,
      });
    } catch (error: any) {
      // CHECKLIST ÉTAPE 2 : Erreur bloquante - Si l'écriture comptable échoue, la paie ne doit pas être validée
      logger.error(`Failed to create accounting entry for payroll ${payrollId}`, {
        error: error.message,
        stack: error.stack,
        companyId,
        payrollId,
      });
      throw new CustomError(
        `Impossible de valider la paie : ${error.message}`,
        500,
        'PAYROLL_VALIDATION_FAILED',
        { originalError: error.message }
      );
    }

    logger.info(`Payroll validated: ${payrollId}`, {
      companyId,
      payrollId,
      employeeId: payroll.employee_id,
    });

    // DOC-08: Log de validation
    await auditService.createLog({
      companyId,
      userId,
      action: 'VALIDATE_PAYROLL',
      entityType: 'payroll',
      entityId: payrollId,
      module: 'rh',
      beforeState: { status: payroll.status },
      afterState: { status: 'validated' }
    });

    return;
  }

  /**
   * Annuler une paie (DOC-04 : inversion via événement)
   */
  async cancel(companyId: string, payrollId: string, reason: string, userId: string) {
    const payroll = await prisma.payrolls.findFirst({
      where: {
        id: payrollId,
        company_id: companyId,
      },
    });

    if (!payroll) {
      throw new CustomError('Payroll not found', 404, 'PAYROLL_NOT_FOUND');
    }

    if (payroll.status === 'validated') {
      // Une paie validée ne peut pas être supprimée, seulement annulée avec inversion
      // DOC-09: La période doit être ouverte
      const periodValidation = await fiscalPeriodService.validatePeriod(companyId, payroll.period_start);
      if (!periodValidation.isValid) {
        throw new CustomError('Impossible d\'annuler une paie sur une période close ou verrouillée', 400, 'INVALID_PERIOD');
      }
    }

    const cancelled = await prisma.payrolls.update({
      where: { id: payrollId },
      data: {
        status: 'cancelled',
        notes: payroll.notes ? `${payroll.notes}\n\nAnnulé: ${reason}` : `Annulé: ${reason}`,
      },
    });

    // Publier l'événement (DOC-04)
    const event = new PayrollCancelled(
      {
        userId,
        companyId,
        timestamp: new Date(),
      },
      payrollId,
      payroll.employee_id,
      reason
    );
    eventBus.publish(event);

    logger.info(`Payroll cancelled: ${payrollId}`, {
      companyId,
      payrollId,
      reason,
    });

    // DOC-08: Log d'annulation (JUSTIFICATION OBLIGATOIRE par AuditService)
    await auditService.createLog({
      companyId,
      userId,
      action: 'REVERSE_PAYROLL',
      entityType: 'payroll',
      entityId: payrollId,
      module: 'rh',
      beforeState: { status: payroll.status },
      afterState: { status: 'cancelled' },
      justification: reason,
      metadata: { reason }
    });

    return cancelled;
  }

  /**
   * Supprimer une paie
   */
  async delete(companyId: string, payrollId: string, userId: string) {
    const payroll = await this.getById(companyId, payrollId);

    if (payroll.status !== 'draft') {
      throw new CustomError(
        'Can only delete draft payrolls',
        400,
        'CANNOT_DELETE_VALIDATED_PAYROLL'
      );
    }

    // DOC-09: Période ouverte
    const periodValidation = await fiscalPeriodService.validatePeriod(companyId, payroll.period_start);
    if (!periodValidation.isValid) {
      throw new CustomError('Impossible de supprimer sur une période close', 400, 'INVALID_PERIOD');
    }

    await prisma.payrolls.delete({
      where: { id: payrollId },
    });

    // DOC-08: Log de suppression
    await auditService.logDelete(
      companyId,
      userId,
      undefined,
      undefined,
      'payroll',
      payrollId,
      payroll,
      'rh'
    );

    return { success: true };
  }

  /**
   * Obtenir une paie par ID
   */
  async getById(companyId: string, payrollId: string) {
    const payroll = await prisma.payrolls.findFirst({
      where: {
        id: payrollId,
        company_id: companyId,
      },
      include: {
        payroll_items: true,
        employees: {
          select: {
            id: true,
            employee_number: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!payroll) {
      throw new CustomError('Payroll not found', 404, 'PAYROLL_NOT_FOUND');
    }

    return payroll;
  }

  /**
   * Lister les paies avec pagination et filtres
   */
  async list(
    companyId: string,
    filters: {
      employeeId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      company_id: companyId,
    };

    if (filters.employeeId) {
      where.employee_id = filters.employeeId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.period_start = {};
      if (filters.startDate) {
        where.period_start.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.period_start.lte = new Date(filters.endDate);
      }
    }

    const [payrolls, total] = await Promise.all([
      prisma.payrolls.findMany({
        where,
        include: {
          payroll_items: true,
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          period_start: 'desc',
        },
      }),
      prisma.payrolls.count({ where }),
    ]);

    return {
      data: payrolls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lister les paies d'un employé
   */
  async listByEmployee(companyId: string, employeeId: string) {
    const payrolls = await prisma.payrolls.findMany({
      where: {
        company_id: companyId,
        employee_id: employeeId,
      },
      include: {
        payroll_items: true,
      },
      orderBy: {
        period_start: 'desc',
      },
    });

    return payrolls;
  }

  /**
   * Mettre à jour une paie (uniquement si draft)
   */
  async update(
    companyId: string,
    payrollId: string,
    data: {
      status?: string;
      paymentMethod?: string;
      paymentReference?: string;
      paidAt?: string;
      paidBy?: string;
      notes?: string;
    },
    userId?: string
  ) {
    const payroll = await this.getById(companyId, payrollId);

    // DOC-04: Vérifier que la paie est en draft (une paie validée est immutable)
    if (payroll.status !== 'draft') {
      throw new CustomError(
        'Can only update draft payrolls. Validated payrolls are immutable.',
        400,
        'PAYROLL_NOT_DRAFT'
      );
    }

    // DOC-04: Empêcher le changement direct vers validated (seule la méthode validate() peut le faire)
    if (data.status === 'validated' || data.status === 'approved') {
      throw new CustomError(
        'Cannot directly change status to validated or approved. Use approve() or validate() methods.',
        400,
        'INVALID_STATUS_CHANGE'
      );
    }

    // Mettre à jour
    const updated = await prisma.payrolls.update({
      where: { id: payrollId },
      data: {
        ...(data.status && data.status !== 'validated' && data.status !== 'approved' && { status: data.status }),
        ...(data.paymentMethod !== undefined && { payment_method: data.paymentMethod || null }),
        ...(data.paymentReference !== undefined && { payment_reference: data.paymentReference || null }),
        ...(data.paidAt && { paid_at: new Date(data.paidAt) }),
        ...(data.paidBy && { paid_by: data.paidBy }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        updated_at: new Date(),
      },
    });

    logger.info(`Payroll updated: ${payrollId}`, {
      companyId,
      payrollId,
      userId,
    });

    // DOC-08: Log de modification
    if (userId) {
      await auditService.logUpdate(
        companyId,
        userId,
        undefined,
        undefined,
        'payroll',
        payrollId,
        payroll,
        updated,
        'rh'
      );
    }

    return updated;
  }

  /**
   * Approuver une paie (changer de draft à approved)
   */
  async approve(companyId: string, payrollId: string, userId: string) {
    const payroll = await this.getById(companyId, payrollId);

    // Vérifier que la paie est en draft
    if (payroll.status !== 'draft') {
      throw new CustomError(
        'Can only approve draft payrolls',
        400,
        'PAYROLL_NOT_DRAFT'
      );
    }

    // DOC-09: Valider la période
    const periodValidation = await fiscalPeriodService.validatePeriod(companyId, payroll.period_start);
    if (!periodValidation.isValid) {
      throw new CustomError(
        'Cannot approve payroll for a closed or locked period',
        400,
        'INVALID_PERIOD'
      );
    }

    // Approuver
    const approved = await prisma.payrolls.update({
      where: { id: payrollId },
      data: {
        status: 'approved',
        updated_at: new Date(),
      },
    });

    logger.info(`Payroll approved: ${payrollId}`, {
      companyId,
      payrollId,
      userId,
    });

    // DOC-08: Log d'approbation
    await auditService.logUpdate(
      companyId,
      userId,
      undefined,
      undefined,
      'payroll',
      payrollId,
      payroll,
      approved,
      'rh'
    );

    return approved;
  }

  /**
   * Marquer une paie comme payée
   */
  async markAsPaid(
    companyId: string,
    payrollId: string,
    data: {
      paymentMethod?: string;
      paymentReference?: string;
      paidAt?: string;
    },
    userId: string
  ) {
    const payroll = await this.getById(companyId, payrollId);

    // DOC-04: Vérifier que la paie est approuvée ou validée
    if (payroll.status !== 'approved' && payroll.status !== 'validated') {
      throw new CustomError(
        'Can only mark approved or validated payrolls as paid',
        400,
        'PAYROLL_NOT_APPROVED'
      );
    }

    // DOC-09: Valider la période (même pour marquer comme payée)
    const periodValidation = await fiscalPeriodService.validatePeriod(companyId, payroll.period_start);
    if (!periodValidation.isValid) {
      throw new CustomError(
        'Cannot mark payroll as paid for a closed or locked period',
        400,
        'INVALID_PERIOD'
      );
    }

    // Créer l'écriture comptable de paiement (obligatoire)
    try {
      const accountService = (await import('./account.service')).default;
      const journalEntryService = (await import('./journalEntry.service')).default;

      const existingPaymentEntry = await prisma.journal_entries.findFirst({
        where: {
          company_id: companyId,
          source_type: 'payroll',
          source_id: payrollId,
          status: {
            not: 'reversed',
          },
        },
      });

      if (!existingPaymentEntry) {
        const employee = payroll.employees || (await prisma.employees.findFirst({
          where: {
            id: payroll.employee_id,
            company_id: companyId,
          },
          select: {
            employee_number: true,
            first_name: true,
            last_name: true,
          },
        }));

        if (!employee) {
          throw new CustomError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }

        let treasuryAccountCode = '531';
        if (data.paymentMethod === 'bank_transfer' || data.paymentMethod === 'check') {
          treasuryAccountCode = '512';
        } else if (data.paymentMethod?.includes('mobile_money')) {
          treasuryAccountCode = '512';
        }

        const account421 = await accountService.getOrCreateByCode(companyId, '421', 'Salaires à payer');
        const treasuryAccount = await accountService.getOrCreateByCode(
          companyId,
          treasuryAccountCode,
          treasuryAccountCode === '512' ? 'Banques' : 'Caisse'
        );

        await journalEntryService.create(companyId, {
          entryDate: data.paidAt ? new Date(data.paidAt) : new Date(),
          sourceType: 'payroll',
          sourceId: payrollId,
          reference: `PAYROLL-PAY-${employee.employee_number}-${payroll.period_start.toISOString().split('T')[0]}`,
          description: `Paiement paie ${employee.first_name} ${employee.last_name} - ${payroll.period_start.toISOString().split('T')[0]} à ${payroll.period_end.toISOString().split('T')[0]}`,
          lines: [
            {
              accountId: account421.id,
              debit: Number(payroll.net_salary),
              credit: 0,
              description: `Règlement salaire net`,
            },
            {
              accountId: treasuryAccount.id,
              debit: 0,
              credit: Number(payroll.net_salary),
              description: `Paiement salaire net (${data.paymentMethod || 'caisse'})`,
            },
          ],
          createdBy: userId,
        });
      }
    } catch (error: any) {
      logger.error(`Failed to create payroll payment accounting entry for ${payrollId}`, {
        error: error.message,
        stack: error.stack,
        companyId,
        payrollId,
      });
      throw new CustomError(
        `Impossible de marquer la paie comme payée : ${error.message}`,
        500,
        'PAYROLL_PAYMENT_ENTRY_FAILED',
        { originalError: error.message }
      );
    }

    // Marquer comme payée
    const paid = await prisma.payrolls.update({
      where: { id: payrollId },
      data: {
        status: 'paid',
        ...(data.paymentMethod && { payment_method: data.paymentMethod }),
        ...(data.paymentReference && { payment_reference: data.paymentReference }),
        paid_at: data.paidAt ? new Date(data.paidAt) : new Date(),
        paid_by: userId,
        updated_at: new Date(),
      },
    });

    logger.info(`Payroll marked as paid: ${payrollId}`, {
      companyId,
      payrollId,
      userId,
    });

    // DOC-08: Log de paiement
    await auditService.logUpdate(
      companyId,
      userId,
      undefined,
      undefined,
      'payroll',
      payrollId,
      payroll,
      paid,
      'rh'
    );

    return paid;
  }
}

export default new PayrollService();

