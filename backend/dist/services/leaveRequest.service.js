"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestService = void 0;
const database_1 = __importDefault(require("../config/database"));
const library_1 = require("@prisma/client/runtime/library");
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("../middleware/error.middleware");
const leaveBalance_service_1 = __importDefault(require("./leaveBalance.service"));
class LeaveRequestService {
    /**
     * Calculer le nombre de jours entre deux dates (jours ouvrés)
     */
    calculateDays(startDate, endDate) {
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
    async checkOverlaps(companyId, employeeId, startDate, endDate, excludeRequestId) {
        const where = {
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
        const overlapping = await database_1.default.leave_requests.findFirst({
            where,
        });
        return !!overlapping;
    }
    /**
     * Vérifier les jours disponibles
     */
    async checkAvailableDays(companyId, employeeId, leaveType, daysRequested) {
        const currentYear = new Date().getFullYear();
        const balance = await leaveBalance_service_1.default.getBalance(companyId, employeeId, leaveType, currentYear);
        const available = Number(balance.remainingDays) - Number(balance.pendingDays);
        return available >= daysRequested;
    }
    /**
     * Créer une demande de congé
     */
    async create(companyId, data) {
        // Vérifier que l'employé existe
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
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        // Validation des dates
        if (endDate < startDate) {
            throw new error_middleware_1.CustomError('End date must be after start date', 400, 'INVALID_DATES');
        }
        // Calculer le nombre de jours
        const daysRequested = this.calculateDays(startDate, endDate);
        if (daysRequested <= 0) {
            throw new error_middleware_1.CustomError('Invalid date range', 400, 'INVALID_DATE_RANGE');
        }
        // Vérifier les chevauchements
        const hasOverlap = await this.checkOverlaps(companyId, data.employeeId, startDate, endDate);
        if (hasOverlap) {
            throw new error_middleware_1.CustomError('Leave request overlaps with an existing approved or pending leave', 400, 'LEAVE_OVERLAP');
        }
        // Vérifier les jours disponibles
        const hasAvailableDays = await this.checkAvailableDays(companyId, data.employeeId, data.leaveType, daysRequested);
        if (!hasAvailableDays) {
            throw new error_middleware_1.CustomError('Insufficient leave balance for this request', 400, 'INSUFFICIENT_LEAVE_BALANCE');
        }
        // Créer la demande
        const leaveRequest = await database_1.default.leave_requests.create({
            data: {
                company_id: companyId,
                employee_id: data.employeeId,
                leave_type: data.leaveType,
                startDate,
                endDate,
                days_requested: new library_1.Decimal(daysRequested),
                reason: data.reason,
                notes: data.notes,
                status: 'pending',
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
        await leaveBalance_service_1.default.updatePendingDays(companyId, data.employeeId, data.leaveType, new Date().getFullYear(), daysRequested);
        logger_1.default.info(`Leave request created: ${leaveRequest.id}`, {
            company_id: companyId,
            leaveRequestId: leaveRequest.id,
            employee_id: data.employeeId,
            daysRequested,
        });
        return leaveRequest;
    }
    /**
     * Obtenir une demande par ID
     */
    async getById(companyId, leaveRequestId) {
        const leaveRequest = await database_1.default.leave_requests.findFirst({
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
                approver: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                rejector: {
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
            throw new error_middleware_1.CustomError('Leave request not found', 404, 'LEAVE_REQUEST_NOT_FOUND');
        }
        return leaveRequest;
    }
    /**
     * Lister les demandes de congés
     */
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            ...(filters.employeeId && { employeeId: filters.employeeId }),
            ...(filters.leaveType && { leaveType: filters.leaveType }),
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
                            { startDate: { lte: new Date(filters.startDate) } },
                            { endDate: { gte: new Date(filters.endDate) } },
                        ],
                    },
                ],
            }),
        };
        const [leaveRequests, total] = await Promise.all([
            database_1.default.leave_requests.findMany({
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
            database_1.default.leave_requests.count({ where }),
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
    async approve(companyId, leaveRequestId, userId) {
        const leaveRequest = await this.getById(companyId, leaveRequestId);
        if (leaveRequest.status !== 'pending') {
            throw new error_middleware_1.CustomError(`Cannot approve leave request with status: ${leaveRequest.status}`, 400, 'INVALID_STATUS');
        }
        // Mettre à jour le statut
        const updated = await database_1.default.leave_requests.update({
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
        const currentYear = new Date(leaveRequest.startDate).getFullYear();
        const daysRequested = Number(leaveRequest.daysRequested);
        await leaveBalance_service_1.default.updateUsedDays(companyId, leaveRequest.employeeId, leaveRequest.leaveType, currentYear, daysRequested);
        await leaveBalance_service_1.default.updatePendingDays(companyId, leaveRequest.employeeId, leaveRequest.leaveType, currentYear, -daysRequested);
        logger_1.default.info(`Leave request approved: ${leaveRequestId}`, {
            company_id: companyId,
            leaveRequestId,
            employee_id: leaveRequest.employeeId,
            approved_by: userId,
        });
        return updated;
    }
    /**
     * Rejeter une demande de congé
     */
    async reject(companyId, leaveRequestId, userId, rejectionReason) {
        const leaveRequest = await this.getById(companyId, leaveRequestId);
        if (leaveRequest.status !== 'pending') {
            throw new error_middleware_1.CustomError(`Cannot reject leave request with status: ${leaveRequest.status}`, 400, 'INVALID_STATUS');
        }
        // Mettre à jour le statut
        const updated = await database_1.default.leave_requests.update({
            where: { id: leaveRequestId },
            data: {
                status: 'rejected',
                rejected_at: new Date(),
                rejected_by: userId,
                rejectionReason,
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
        const currentYear = new Date(leaveRequest.startDate).getFullYear();
        const daysRequested = Number(leaveRequest.daysRequested);
        await leaveBalance_service_1.default.updatePendingDays(companyId, leaveRequest.employeeId, leaveRequest.leaveType, currentYear, -daysRequested);
        logger_1.default.info(`Leave request rejected: ${leaveRequestId}`, {
            company_id: companyId,
            leaveRequestId,
            employee_id: leaveRequest.employeeId,
            rejected_by: userId,
        });
        return updated;
    }
    /**
     * Annuler une demande de congé
     */
    async cancel(companyId, leaveRequestId, employeeId) {
        const leaveRequest = await this.getById(companyId, leaveRequestId);
        // Vérifier que c'est l'employé qui annule sa propre demande
        if (leaveRequest.employeeId !== employeeId) {
            throw new error_middleware_1.CustomError('You can only cancel your own leave requests', 403, 'FORBIDDEN');
        }
        if (leaveRequest.status !== 'pending') {
            throw new error_middleware_1.CustomError(`Cannot cancel leave request with status: ${leaveRequest.status}`, 400, 'INVALID_STATUS');
        }
        // Mettre à jour le statut
        const updated = await database_1.default.leave_requests.update({
            where: { id: leaveRequestId },
            data: {
                status: 'cancelled',
            },
        });
        // Mettre à jour le solde (retirer des jours en attente)
        const currentYear = new Date(leaveRequest.startDate).getFullYear();
        const daysRequested = Number(leaveRequest.daysRequested);
        await leaveBalance_service_1.default.updatePendingDays(companyId, leaveRequest.employeeId, leaveRequest.leaveType, currentYear, -daysRequested);
        logger_1.default.info(`Leave request cancelled: ${leaveRequestId}`, {
            company_id: companyId,
            leaveRequestId,
            employee_id: employeeId,
        });
        return updated;
    }
    /**
     * Mettre à jour une demande de congé (seulement si pending)
     */
    async update(companyId, leaveRequestId, data) {
        const leaveRequest = await this.getById(companyId, leaveRequestId);
        if (leaveRequest.status !== 'pending') {
            throw new error_middleware_1.CustomError('Can only update pending leave requests', 400, 'CANNOT_UPDATE_LEAVE_REQUEST');
        }
        const updateData = {};
        if (data.leaveType !== undefined)
            updateData.leaveType = data.leaveType;
        if (data.reason !== undefined)
            updateData.reason = data.reason;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        // Si les dates changent, recalculer les jours
        if (data.startDate || data.endDate) {
            const startDate = data.startDate ? new Date(data.startDate) : leaveRequest.startDate;
            const endDate = data.endDate ? new Date(data.endDate) : leaveRequest.endDate;
            if (endDate < startDate) {
                throw new error_middleware_1.CustomError('End date must be after start date', 400, 'INVALID_DATES');
            }
            updateData.startDate = startDate;
            updateData.endDate = endDate;
            const daysRequested = this.calculateDays(startDate, endDate);
            updateData.daysRequested = new library_1.Decimal(daysRequested);
            // Vérifier les chevauchements (exclure cette demande)
            const hasOverlap = await this.checkOverlaps(companyId, leaveRequest.employeeId, startDate, endDate, leaveRequestId);
            if (hasOverlap) {
                throw new error_middleware_1.CustomError('Updated dates overlap with an existing approved or pending leave', 400, 'LEAVE_OVERLAP');
            }
            // Vérifier les jours disponibles (ajuster si nécessaire)
            const oldDays = Number(leaveRequest.daysRequested);
            const newDays = daysRequested;
            const difference = newDays - oldDays;
            if (difference > 0) {
                const hasAvailableDays = await this.checkAvailableDays(companyId, leaveRequest.employeeId, data.leaveType || leaveRequest.leaveType, difference);
                if (!hasAvailableDays) {
                    throw new error_middleware_1.CustomError('Insufficient leave balance for updated request', 400, 'INSUFFICIENT_LEAVE_BALANCE');
                }
            }
            // Mettre à jour le solde
            if (difference !== 0) {
                const currentYear = new Date(startDate).getFullYear();
                await leaveBalance_service_1.default.updatePendingDays(companyId, leaveRequest.employeeId, data.leaveType || leaveRequest.leaveType, currentYear, difference);
            }
        }
        const updated = await database_1.default.leave_requests.update({
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
        logger_1.default.info(`Leave request updated: ${leaveRequestId}`, {
            company_id: companyId,
            leaveRequestId,
        });
        return updated;
    }
}
exports.LeaveRequestService = LeaveRequestService;
exports.default = new LeaveRequestService();
//# sourceMappingURL=leaveRequest.service.js.map