import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';
import leaveBalanceService from './leaveBalance.service';

export interface CreateLeaveRequestData {
  employeeId?: string;
  leaveType?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  reason?: string;
  notes?: string;
}

export interface UpdateLeaveRequestData {
  leaveType?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  reason?: string;
  notes?: string;
}

export interface LeaveRequestFilters {
  employeeId?: string;
  leaveType?: string;
  status?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}

export class LeaveRequestService {
  /**
   * Calculer le nombre de jours entre deux dates (jours ouvrés)
   */
  private calculateDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      return 0;
    }

    let days = 0;
    const current = new Date(start);
    
    while (current <= end) {
      // Compter tous les jours (incluant weekends)
      // Pour compter seulement les jours ouvrés, décommenter :
      // const dayOfWeek = current.getDay();
      // if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclure dimanche (0) et samedi (6)
      //   days++;
      // }
      days++;
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Vérifier les chevauchements de congés
   */
  private async checkOverlaps(
    companyId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string
  ): Promise<boolean> {
    const where: Prisma.leave_requestsWhereInput = {
      company_id: companyId,
      employee_id: employeeId,
      status: {
        in: ['pending', 'approved'],
      },
      OR: [
        {
          // Nouvelle demande commence pendant un congé existant
          start_date: { lte: endDate },
          end_date: { gte: startDate },
        },
      ],
    };

    if (excludeRequestId) {
      where.id = { not: excludeRequestId };
    }

    const overlapping = await prisma.leave_requests.findFirst({
      where,
    });

    return !!overlapping;
  }

  /**
   * Vérifier les jours disponibles
   */
  private async checkAvailableDays(
    companyId: string,
    employeeId: string,
    leaveType: string,
    daysRequested: number
  ): Promise<boolean> {
    const currentYear = new Date().getFullYear();
    const balance = await leaveBalanceService.getBalance(
      companyId,
      employeeId,
      leaveType,
      currentYear
    );

    const available = Number(balance.remainingDays) - Number(balance.pendingDays);
    return available >= daysRequested;
  }

  /**
   * Créer une demande de congé
   */
  async create(companyId: string, data: CreateLeaveRequestData) {
    // Vérifier que l'employé existe
    const employee = await prisma.employees.findFirst({
      where: {
        id: data.employeeId,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (!employee) {
      throw new CustomError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Validation des dates
    if (endDate < startDate) {
      throw new CustomError('End date must be after start date', 400, 'INVALID_DATES');
    }

    // Calculer le nombre de jours
    const daysRequested = this.calculateDays(startDate, endDate);

    if (daysRequested <= 0) {
      throw new CustomError('Invalid date range', 400, 'INVALID_DATE_RANGE');
    }

    // Vérifier les chevauchements
    const hasOverlap = await this.checkOverlaps(companyId, data.employeeId, startDate, endDate);
    if (hasOverlap) {
      throw new CustomError(
        'Leave request overlaps with an existing approved or pending leave',
        400,
        'LEAVE_OVERLAP'
      );
    }

    // Vérifier les jours disponibles
    const hasAvailableDays = await this.checkAvailableDays(
      companyId,
      data.employeeId,
      data.leaveType,
      daysRequested
    );

    if (!hasAvailableDays) {
      throw new CustomError(
        'Insufficient leave balance for this request',
        400,
        'INSUFFICIENT_LEAVE_BALANCE'
      );
    }

    // Créer la demande
    const leaveRequest = await prisma.leave_requests.create({
      data: {
        id: randomUUID(),
        company_id: companyId,
        employee_id: data.employeeId!,
        leave_type: data.leaveType!,
        start_date: startDate,
        end_date: endDate,
        days_requested: new Decimal(daysRequested),
        reason: data.reason,
        notes: data.notes,
        status: 'pending',
        updated_at: new Date(),
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_number: true,
            position: true,
            department: true,
          },
        },
      },
    });

    // Mettre à jour le solde (ajouter aux jours en attente)
    await leaveBalanceService.updatePendingDays(
      companyId,
      data.employeeId,
      data.leaveType,
      new Date().getFullYear(),
      daysRequested
    );

    logger.info(`Leave request created: ${leaveRequest.id}`, {
      company_id: companyId,
      leaveRequestId: leaveRequest.id,
      employeeId: data.employeeId,
      daysRequested,
    });

    return leaveRequest;
  }

  /**
   * Obtenir une demande par ID
   */
  async getById(companyId: string, leaveRequestId: string) {
    const leaveRequest = await prisma.leave_requests.findFirst({
      where: {
        id: leaveRequestId,
        company_id: companyId,
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_number: true,
            position: true,
            department: true,
            email: true,
          },
        },
        users_leave_requests_approved_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        users_leave_requests_rejected_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new CustomError('Leave request not found', 404, 'LEAVE_REQUEST_NOT_FOUND');
    }

    return leaveRequest;
  }

  /**
   * Lister les demandes de congés
   */
  async list(companyId: string, filters: LeaveRequestFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.leave_requestsWhereInput = {
      company_id: companyId,
      ...(filters.employeeId && { employee_id: filters.employeeId }),
      ...(filters.leaveType && { leave_type: filters.leaveType }),
      ...(filters.status && { status: filters.status }),
      ...(filters.startDate &&
        filters.endDate && {
          OR: [
            {
              start_date: {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
              },
            },
            {
              end_date: {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
              },
            },
            {
              AND: [
                { start_date: { lte: new Date(filters.startDate) } },
                { end_date: { gte: new Date(filters.endDate) } },
              ],
            },
          ],
        }),
    };

    const [leaveRequests, total] = await Promise.all([
      prisma.leave_requests.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          requested_at: 'desc',
        },
        include: {
          employees: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              employee_number: true,
              position: true,
              department: true,
            },
          },
        },
      }),
      prisma.leave_requests.count({ where }),
    ]);

    return {
      data: leaveRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approuver une demande de congé
   */
  async approve(companyId: string, leaveRequestId: string, userId: string) {
    const leaveRequest = await this.getById(companyId, leaveRequestId);

    if (leaveRequest.status !== 'pending') {
      throw new CustomError(
        `Cannot approve leave request with status: ${leaveRequest.status}`,
        400,
        'INVALID_STATUS'
      );
    }

    // Mettre à jour le statut
    const updated = await prisma.leave_requests.update({
      where: { id: leaveRequestId },
      data: {
        status: 'approved',
        approved_at: new Date(),
        approved_by: userId,
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
      },
    });

    // Mettre à jour le solde (déduire des jours en attente et ajouter aux jours utilisés)
    const currentYear = new Date(leaveRequest.start_date).getFullYear();
    const daysRequested = Number(leaveRequest.days_requested);

    await leaveBalanceService.updateUsedDays(
      companyId,
      leaveRequest.employee_id,
      leaveRequest.leave_type,
      currentYear,
      daysRequested
    );

    await leaveBalanceService.updatePendingDays(
      companyId,
      leaveRequest.employee_id,
      leaveRequest.leave_type,
      currentYear,
      -daysRequested
    );

    logger.info(`Leave request approved: ${leaveRequestId}`, {
      company_id: companyId,
      leaveRequestId,
      employeeId: leaveRequest.employee_id,
      approvedBy: userId,
    });

    return updated;
  }

  /**
   * Rejeter une demande de congé
   */
  async reject(
    companyId: string,
    leaveRequestId: string,
    userId: string,
    rejectionReason?: string
  ) {
    const leaveRequest = await this.getById(companyId, leaveRequestId);

    if (leaveRequest.status !== 'pending') {
      throw new CustomError(
        `Cannot reject leave request with status: ${leaveRequest.status}`,
        400,
        'INVALID_STATUS'
      );
    }

    // Mettre à jour le statut
    const updated = await prisma.leave_requests.update({
      where: { id: leaveRequestId },
      data: {
        status: 'rejected',
        rejected_at: new Date(),
        rejected_by: userId,
        rejection_reason: rejectionReason,
      },
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
      },
    });

    // Mettre à jour le solde (retirer des jours en attente)
    const currentYear = new Date(leaveRequest.start_date).getFullYear();
    const daysRequested = Number(leaveRequest.days_requested);

    await leaveBalanceService.updatePendingDays(
      companyId,
      leaveRequest.employee_id,
      leaveRequest.leave_type,
      currentYear,
      -daysRequested
    );

    logger.info(`Leave request rejected: ${leaveRequestId}`, {
      company_id: companyId,
      leaveRequestId,
      employeeId: leaveRequest.employee_id,
      rejectedBy: userId,
    });

    return updated;
  }

  /**
   * Annuler une demande de congé
   */
  async cancel(companyId: string, leaveRequestId: string, employeeId: string) {
    const leaveRequest = await this.getById(companyId, leaveRequestId);

    // Vérifier que c'est l'employé qui annule sa propre demande
    if (leaveRequest.employee_id !== employeeId) {
      throw new CustomError('You can only cancel your own leave requests', 403, 'FORBIDDEN');
    }

    if (leaveRequest.status !== 'pending') {
      throw new CustomError(
        `Cannot cancel leave request with status: ${leaveRequest.status}`,
        400,
        'INVALID_STATUS'
      );
    }

    // Mettre à jour le statut
    const updated = await prisma.leave_requests.update({
      where: { id: leaveRequestId },
      data: {
        status: 'cancelled',
      },
    });

    // Mettre à jour le solde (retirer des jours en attente)
    const currentYear = new Date(leaveRequest.start_date).getFullYear();
    const daysRequested = Number(leaveRequest.days_requested);

    await leaveBalanceService.updatePendingDays(
      companyId,
      leaveRequest.employee_id,
      leaveRequest.leave_type,
      currentYear,
      -daysRequested
    );

    logger.info(`Leave request cancelled: ${leaveRequestId}`, {
      company_id: companyId,
      leaveRequestId,
      employeeId,
    });

    return updated;
  }

  /**
   * Mettre à jour une demande de congé (seulement si pending)
   */
  async update(companyId: string, leaveRequestId: string, data: UpdateLeaveRequestData) {
    const leaveRequest = await this.getById(companyId, leaveRequestId);

    if (leaveRequest.status !== 'pending') {
      throw new CustomError(
        'Can only update pending leave requests',
        400,
        'CANNOT_UPDATE_LEAVE_REQUEST'
      );
    }

    const updateData: Prisma.leave_requestsUpdateInput = {};

    if (data.leaveType !== undefined) updateData.leave_type = data.leaveType;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Si les dates changent, recalculer les jours
    if (data.startDate || data.endDate) {
      const startDate = data.startDate ? new Date(data.startDate) : leaveRequest.start_date;
      const endDate = data.endDate ? new Date(data.endDate) : leaveRequest.end_date;

      if (endDate < startDate) {
        throw new CustomError('End date must be after start date', 400, 'INVALID_DATES');
      }

      updateData.start_date = startDate;
      updateData.end_date = endDate;

      const daysRequested = this.calculateDays(startDate, endDate);
      updateData.days_requested = new Decimal(daysRequested);

      // Vérifier les chevauchements (exclure cette demande)
      const hasOverlap = await this.checkOverlaps(
        companyId,
        leaveRequest.employee_id,
        startDate,
        endDate,
        leaveRequestId
      );

      if (hasOverlap) {
        throw new CustomError(
          'Updated dates overlap with an existing approved or pending leave',
          400,
          'LEAVE_OVERLAP'
        );
      }

      // Vérifier les jours disponibles (ajuster si nécessaire)
      const oldDays = Number(leaveRequest.days_requested);
      const newDays = daysRequested;
      const difference = newDays - oldDays;

      if (difference > 0) {
        const hasAvailableDays = await this.checkAvailableDays(
          companyId,
          leaveRequest.employee_id,
          data.leaveType || leaveRequest.leave_type,
          difference
        );

        if (!hasAvailableDays) {
          throw new CustomError(
            'Insufficient leave balance for updated request',
            400,
            'INSUFFICIENT_LEAVE_BALANCE'
          );
        }
      }

      // Mettre à jour le solde
      if (difference !== 0) {
        const currentYear = new Date(startDate).getFullYear();
        await leaveBalanceService.updatePendingDays(
          companyId,
          leaveRequest.employee_id,
          data.leaveType || leaveRequest.leave_type,
          currentYear,
          difference
        );
      }
    }

    const updated = await prisma.leave_requests.update({
      where: { id: leaveRequestId },
      data: updateData,
      include: {
        employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_number: true,
          },
        },
      },
    });

    logger.info(`Leave request updated: ${leaveRequestId}`, {
      company_id: companyId,
      leaveRequestId,
    });

    return updated;
  }
}

export default new LeaveRequestService();

