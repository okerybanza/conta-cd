import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';

export interface CreateAttendanceData {
  employeeId?: string;
  date?: Date | string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  hoursWorked?: number;
  status?: string;
  leaveType?: string;
  notes?: string;
}

export interface UpdateAttendanceData extends Partial<CreateAttendanceData> {}

export interface AttendanceFilters {
  employeeId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: string;
  page?: number;
  limit?: number;
}

export class AttendanceService {
  // Créer un pointage
  async create(companyId: string, data: CreateAttendanceData) {
    // Vérifier que l'employé existe et appartient à la company
    const employee = await prisma.employees.findFirst({
      where: {
        id: data.employeeId,
        company_id: companyId,
        deletedAt: null,
      },
    });

    if (!employee) {
      throw new CustomError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    // Vérifier qu'il n'y a pas déjà un pointage pour cette date
    const existing = await prisma.attendances.findUnique({
      where: {
        companyId_employeeId_date: {
          company_id: companyId,
          employeeId: data.employeeId,
          date: new Date(data.date),
        },
      },
    });

    if (existing) {
      throw new CustomError(
        'Un pointage existe déjà pour cette date',
        400,
        'ATTENDANCE_EXISTS'
      );
    }

    // Calculer les heures travaillées si checkIn et checkOut sont fournis
    let hoursWorked = data.hoursWorked || 0;
    if (data.checkIn && data.checkOut) {
      const checkInTime = new Date(data.checkIn);
      const checkOutTime = new Date(data.checkOut);
      hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    }

    const attendance = await prisma.attendances.create({
      data: {
        company_id: companyId,
        employeeId: data.employeeId,
        date: new Date(data.date),
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
        hoursWorked: new Prisma.Decimal(hoursWorked),
        status: data.status || 'present',
        leaveType: data.leaveType,
        notes: data.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    });

    logger.info(`Attendance created: ${attendance.id}`, { companyId, attendanceId: attendance.id });
    return attendance;
  }

  // Obtenir un pointage par ID
  async getById(companyId: string, attendanceId: string) {
    const attendance = await prisma.attendances.findFirst({
      where: {
        id: attendanceId,
        company_id: companyId,
      },
      include: {
        employee: true,
      },
    });

    if (!attendance) {
      throw new CustomError('Attendance not found', 404, 'ATTENDANCE_NOT_FOUND');
    }

    return attendance;
  }

  // Lister les pointages
  async list(companyId: string, filters: AttendanceFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.attendancesWhereInput = {
      company_id: companyId,
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.startDate && filters.endDate && {
        date: {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        },
      }),
    };

    const [attendances, total] = await Promise.all([
      prisma.attendancess.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          date: 'desc',
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              position: true,
              department: true,
            },
          },
        },
      }),
      prisma.attendances.count({ where }),
    ]);

    return {
      data: attendances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Mettre à jour un pointage
  async update(companyId: string, attendanceId: string, data: UpdateAttendanceData) {
    const attendance = await this.getById(companyId, attendanceId);

    const updateData: Prisma.attendancesUpdateInput = {};

    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.checkIn !== undefined) updateData.check_in = data.checkIn ? new Date(data.checkIn) : null;
    if (data.checkOut !== undefined) updateData.check_out = data.checkOut ? new Date(data.checkOut) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.leaveType !== undefined) updateData.leave_type = data.leaveType;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Recalculer les heures travaillées si checkIn ou checkOut est modifié
    if (data.checkIn !== undefined || data.checkOut !== undefined) {
      const checkIn = data.checkIn ? new Date(data.checkIn) : attendance.checkIn;
      const checkOut = data.checkOut ? new Date(data.checkOut) : attendance.checkOut;
      
      if (checkIn && checkOut) {
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        updateData.hours_worked = new Prisma.Decimal(hours);
      } else if (data.hoursWorked !== undefined) {
        updateData.hours_worked = new Prisma.Decimal(data.hoursWorked);
      }
    } else if (data.hoursWorked !== undefined) {
      updateData.hours_worked = new Prisma.Decimal(data.hoursWorked);
    }

    const updated = await prisma.attendances.update({
      where: { id: attendanceId },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    });

    logger.info(`Attendance updated: ${attendanceId}`, { companyId, attendanceId });
    return updated;
  }

  // Supprimer un pointage
  async delete(companyId: string, attendanceId: string) {
    await this.getById(companyId, attendanceId);

    await prisma.attendances.delete({
      where: { id: attendanceId },
    });

    logger.info(`Attendance deleted: ${attendanceId}`, { companyId, attendanceId });
    return { success: true };
  }

  // Obtenir les statistiques de présence pour un employé
  async getEmployeeStats(companyId: string, employeeId: string, startDate: Date, endDate: Date) {
    const attendances = await prisma.attendances.findMany({
      where: {
        company_id: companyId,
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'present').length;
    const absentDays = attendances.filter(a => a.status === 'absent').length;
    const leaveDays = attendances.filter(a => a.status === 'leave').length;
    const totalHours = attendances.reduce((sum, a) => sum + Number(a.hoursWorked || 0), 0);

    return {
      totalDays,
      presentDays,
      absentDays,
      leaveDays,
      totalHours: Math.round(totalHours * 100) / 100,
    };
  }
}

export default new AttendanceService();

