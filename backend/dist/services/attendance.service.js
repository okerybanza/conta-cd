"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("../middleware/error.middleware");
class AttendanceService {
    // Créer un pointage
    async create(companyId, data) {
        // Vérifier que l'employé existe et appartient à la company
        const employee = await database_1.default.employees.findFirst({
            where: {
                id: data.employeeId,
                company_id: companyId,
                deleted_at: null,
            },
        });
        if (!employee) {
            throw new error_middleware_1.CustomError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }
        // Vérifier qu'il n'y a pas déjà un pointage pour cette date
        const existing = await database_1.default.attendances.findUnique({
            where: {
                company_id_employee_id_date: {
                    company_id: companyId,
                    employee_id: data.employeeId,
                    date: new Date(data.date),
                },
            },
        });
        if (existing) {
            throw new error_middleware_1.CustomError('Un pointage existe déjà pour cette date', 400, 'ATTENDANCE_EXISTS');
        }
        // Calculer les heures travaillées si checkIn et checkOut sont fournis
        let hoursWorked = data.hoursWorked || 0;
        if (data.checkIn && data.checkOut) {
            const checkInTime = new Date(data.checkIn);
            const checkOutTime = new Date(data.checkOut);
            hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        }
        const attendance = await database_1.default.attendances.create({
            data: {
                company_id: companyId,
                employee_id: data.employeeId,
                date: new Date(data.date),
                check_in: data.checkIn ? new Date(data.checkIn) : null,
                check_out: data.checkOut ? new Date(data.checkOut) : null,
                hours_worked: new client_1.Prisma.Decimal(hoursWorked),
                status: data.status || 'present',
                leave_type: data.leaveType,
                notes: data.notes,
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
        logger_1.default.info(`Attendance created: ${attendance.id}`, { companyId, attendanceId: attendance.id });
        return attendance;
    }
    // Obtenir un pointage par ID
    async getById(companyId, attendanceId) {
        const attendance = await database_1.default.attendances.findFirst({
            where: {
                id: attendanceId,
                company_id: companyId,
            },
            include: {
                employees: true,
            },
        });
        if (!attendance) {
            throw new error_middleware_1.CustomError('Attendance not found', 404, 'ATTENDANCE_NOT_FOUND');
        }
        return attendance;
    }
    // Lister les pointages
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            ...(filters.employeeId && { employee_id: filters.employeeId }),
            ...(filters.status && { status: filters.status }),
            ...(filters.startDate && filters.endDate && {
                date: {
                    gte: new Date(filters.startDate),
                    lte: new Date(filters.endDate),
                },
            }),
        };
        const [attendances, total] = await Promise.all([
            database_1.default.attendances.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    date: 'desc',
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
            database_1.default.attendances.count({ where }),
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
    async update(companyId, attendanceId, data) {
        const attendance = await this.getById(companyId, attendanceId);
        const updateData = {};
        if (data.date !== undefined)
            updateData.date = new Date(data.date);
        if (data.checkIn !== undefined)
            updateData.checkIn = data.checkIn ? new Date(data.checkIn) : null;
        if (data.checkOut !== undefined)
            updateData.checkOut = data.checkOut ? new Date(data.checkOut) : null;
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.leaveType !== undefined)
            updateData.leaveType = data.leaveType;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        // Recalculer les heures travaillées si checkIn ou checkOut est modifié
        if (data.checkIn !== undefined || data.checkOut !== undefined) {
            const checkIn = data.checkIn ? new Date(data.checkIn) : attendance.checkIn;
            const checkOut = data.checkOut ? new Date(data.checkOut) : attendance.checkOut;
            if (checkIn && checkOut) {
                const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
                updateData.hoursWorked = new client_1.Prisma.Decimal(hours);
            }
            else if (data.hoursWorked !== undefined) {
                updateData.hoursWorked = new client_1.Prisma.Decimal(data.hoursWorked);
            }
        }
        else if (data.hoursWorked !== undefined) {
            updateData.hoursWorked = new client_1.Prisma.Decimal(data.hoursWorked);
        }
        const updated = await database_1.default.attendances.update({
            where: { id: attendanceId },
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
        logger_1.default.info(`Attendance updated: ${attendanceId}`, { companyId, attendanceId });
        return updated;
    }
    // Supprimer un pointage
    async delete(companyId, attendanceId) {
        await this.getById(companyId, attendanceId);
        await database_1.default.attendances.delete({
            where: { id: attendanceId },
        });
        logger_1.default.info(`Attendance deleted: ${attendanceId}`, { companyId, attendanceId });
        return { success: true };
    }
    // Obtenir les statistiques de présence pour un employé
    async getEmployeeStats(companyId, employeeId, startDate, endDate) {
        const attendances = await database_1.default.attendances.findMany({
            where: {
                company_id: companyId,
                employee_id: employeeId,
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
exports.AttendanceService = AttendanceService;
exports.default = new AttendanceService();
//# sourceMappingURL=attendance.service.js.map