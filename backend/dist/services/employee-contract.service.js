"use strict";
/**
 * Service de gestion des contrats RH (DOC-04)
 *
 * Principe : Un employé peut avoir plusieurs contrats successifs, jamais simultanés actifs
 * Architecture événementielle : chaque action génère un événement
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeContractService = void 0;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("../middleware/error.middleware");
const event_bus_1 = require("../events/event-bus");
const domain_event_1 = require("../events/domain-event");
class EmployeeContractService {
    /**
     * Créer un contrat RH (DOC-04)
     * Invariant : un employé actif doit avoir un contrat actif
     * Invariant : jamais de contrats simultanés actifs
     */
    async create(companyId, data, userId) {
        // Vérifier que l'employé existe et est actif
        const employee = await database_1.default.employees.findFirst({
            where: {
                id: data.employeeId,
                company_id: companyId,
                status: 'active',
                deleted_at: null,
            },
        });
        if (!employee) {
            throw new error_middleware_1.CustomError('Employee not found or not active', 404, 'EMPLOYEE_NOT_FOUND');
        }
        const startDate = new Date(data.startDate);
        const endDate = data.endDate ? new Date(data.endDate) : null;
        // Vérifier l'invariant : pas de contrats simultanés actifs
        const overlappingContracts = await database_1.default.employee_contracts.findMany({
            where: {
                employee_id: data.employeeId,
                company_id: companyId,
                status: 'active',
                deleted_at: null,
                OR: [
                    {
                        // Contrat existant qui chevauche
                        AND: [
                            { start_date: { lte: endDate || new Date('2099-12-31') } },
                            {
                                OR: [
                                    { end_date: null },
                                    { end_date: { gte: startDate } },
                                ],
                            },
                        ],
                    },
                ],
            },
        });
        if (overlappingContracts.length > 0) {
            throw new error_middleware_1.CustomError('Un contrat actif existe déjà pour cette période', 409, 'OVERLAPPING_CONTRACT');
        }
        // Terminer les contrats précédents si nécessaire
        if (overlappingContracts.length === 0) {
            // Vérifier s'il y a des contrats précédents non terminés
            const previousContracts = await database_1.default.employee_contracts.findMany({
                where: {
                    employee_id: data.employeeId,
                    company_id: companyId,
                    status: 'active',
                    deleted_at: null,
                    start_date: { lt: startDate },
                    OR: [
                        { end_date: null },
                        { end_date: { gte: startDate } },
                    ],
                },
            });
            // Terminer automatiquement les contrats précédents
            for (const prevContract of previousContracts) {
                await database_1.default.employee_contracts.update({
                    where: { id: prevContract.id },
                    data: {
                        status: 'expired',
                        end_date: new Date(startDate.getTime() - 1), // Un jour avant le nouveau contrat
                    },
                });
            }
        }
        const contract = await database_1.default.employee_contracts.create({
            data: {
                id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                company_id: companyId,
                employee_id: data.employeeId,
                contract_type: data.contractType,
                start_date: startDate,
                end_date: endDate,
                base_salary: new client_1.Prisma.Decimal(data.baseSalary),
                currency: data.currency || 'CDF',
                work_type: data.workType || 'full_time',
                hours_per_week: data.hoursPerWeek ? new client_1.Prisma.Decimal(data.hoursPerWeek) : null,
                status: 'active',
                notes: data.notes,
            },
            include: {
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
        // Publier l'événement (DOC-04)
        const event = new domain_event_1.EmployeeContractCreated({ userId, companyId, timestamp: new Date() }, contract.id, data.employeeId, data.contractType, startDate, data.baseSalary, data.currency || 'CDF');
        event_bus_1.eventBus.publish(event);
        logger_1.default.info(`Employee contract created: ${contract.id}`, {
            companyId,
            employeeId: data.employeeId,
            contractId: contract.id,
        });
        return contract;
    }
    /**
     * Obtenir un contrat par ID
     */
    async getById(companyId, contractId) {
        const contract = await database_1.default.employee_contracts.findFirst({
            where: {
                id: contractId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                employees: {
                    select: {
                        id: true,
                        employee_number: true,
                        first_name: true,
                        last_name: true,
                        status: true,
                    },
                },
            },
        });
        if (!contract) {
            throw new error_middleware_1.CustomError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
        }
        return contract;
    }
    /**
     * Obtenir le contrat actif d'un employé
     */
    async getActiveContract(companyId, employeeId) {
        const contract = await database_1.default.employee_contracts.findFirst({
            where: {
                employee_id: employeeId,
                company_id: companyId,
                status: 'active',
                deleted_at: null,
                OR: [
                    { end_date: null },
                    { end_date: { gte: new Date() } },
                ],
            },
            orderBy: {
                start_date: 'desc',
            },
        });
        return contract;
    }
    /**
     * Lister les contrats d'un employé
     */
    async listByEmployee(companyId, employeeId) {
        const contracts = await database_1.default.employee_contracts.findMany({
            where: {
                employee_id: employeeId,
                company_id: companyId,
                deleted_at: null,
            },
            orderBy: {
                start_date: 'desc',
            },
        });
        return contracts;
    }
    /**
     * Mettre à jour un contrat
     */
    async update(companyId, contractId, data, userId) {
        const contract = await this.getById(companyId, contractId);
        // Ne pas permettre la modification d'un contrat terminé
        if (contract.status !== 'active') {
            throw new error_middleware_1.CustomError('Cannot update a terminated or expired contract', 400, 'CONTRACT_NOT_ACTIVE');
        }
        const updateData = {};
        if (data.endDate !== undefined) {
            updateData.end_date = data.endDate ? new Date(data.endDate) : null;
            // Si date de fin définie et passée, marquer comme expiré
            if (data.endDate && new Date(data.endDate) < new Date()) {
                updateData.status = 'expired';
            }
        }
        if (data.baseSalary !== undefined) {
            updateData.base_salary = new client_1.Prisma.Decimal(data.baseSalary);
        }
        if (data.workType !== undefined) {
            updateData.work_type = data.workType;
        }
        if (data.hoursPerWeek !== undefined) {
            updateData.hours_per_week = data.hoursPerWeek ? new client_1.Prisma.Decimal(data.hoursPerWeek) : null;
        }
        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }
        const updated = await database_1.default.employee_contracts.update({
            where: { id: contractId },
            data: updateData,
        });
        logger_1.default.info(`Employee contract updated: ${contractId}`, { companyId, contractId });
        return updated;
    }
    /**
     * Terminer un contrat (DOC-04 : immutabilité)
     */
    async terminate(companyId, contractId, reason, userId) {
        const contract = await this.getById(companyId, contractId);
        if (contract.status !== 'active') {
            throw new error_middleware_1.CustomError('Contract is already terminated or expired', 400, 'CONTRACT_NOT_ACTIVE');
        }
        const terminated = await database_1.default.employee_contracts.update({
            where: { id: contractId },
            data: {
                status: 'terminated',
                terminated_at: new Date(),
                terminated_by: userId || null,
                termination_reason: reason,
                end_date: new Date(), // Si pas de date de fin, utiliser aujourd'hui
            },
        });
        // Publier l'événement (DOC-04)
        const event = new domain_event_1.EmployeeContractTerminated({ userId, companyId, timestamp: new Date() }, contractId, contract.employee_id, new Date(), reason);
        event_bus_1.eventBus.publish(event);
        logger_1.default.info(`Employee contract terminated: ${contractId}`, {
            companyId,
            contractId,
            employeeId: contract.employee_id,
        });
        return terminated;
    }
}
exports.EmployeeContractService = EmployeeContractService;
exports.default = new EmployeeContractService();
//# sourceMappingURL=employee-contract.service.js.map