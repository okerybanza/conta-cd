"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveBalanceService = void 0;
const database_1 = __importDefault(require("../config/database"));
const library_1 = require("@prisma/client/runtime/library");
const logger_1 = __importDefault(require("../utils/logger"));
const leavePolicy_service_1 = __importDefault(require("./leavePolicy.service"));
class LeaveBalanceService {
    /**
     * Obtenir ou créer le solde pour un employé, type et année
     */
    async getOrCreateBalance(companyId, employeeId, leaveType, year) {
        let balance = await database_1.default.leaveBalance.findUnique({
            where: {
                companyId_employeeId_leaveType_year: {
                    companyId,
                    employeeId,
                    leaveType,
                    year,
                },
            },
        });
        if (!balance) {
            // Obtenir la politique pour ce type de congé
            const policy = await leavePolicy_service_1.default.getByType(companyId, leaveType);
            const totalDays = policy ? Number(policy.daysPerYear) : 0;
            // Vérifier s'il y a un solde de l'année précédente à reporter
            const previousYearBalance = await database_1.default.leaveBalance.findUnique({
                where: {
                    companyId_employeeId_leaveType_year: {
                        companyId,
                        employeeId,
                        leaveType,
                        year: year - 1,
                    },
                },
            });
            const carriedForward = previousYearBalance && policy?.carryForward
                ? Number(previousYearBalance.remainingDays)
                : 0;
            balance = await database_1.default.leaveBalance.create({
                data: {
                    companyId,
                    employeeId,
                    leaveType,
                    year,
                    totalDays: new library_1.Decimal(totalDays + carriedForward),
                    usedDays: new library_1.Decimal(0),
                    pendingDays: new library_1.Decimal(0),
                    remainingDays: new library_1.Decimal(totalDays + carriedForward),
                    carriedForward: new library_1.Decimal(carriedForward),
                },
            });
        }
        return balance;
    }
    /**
     * Obtenir le solde pour un employé, type et année
     */
    async getBalance(companyId, employeeId, leaveType, year) {
        return this.getOrCreateBalance(companyId, employeeId, leaveType, year);
    }
    /**
     * Mettre à jour les jours utilisés
     */
    async updateUsedDays(companyId, employeeId, leaveType, year, days) {
        const balance = await this.getOrCreateBalance(companyId, employeeId, leaveType, year);
        const newUsedDays = Number(balance.usedDays) + days;
        const newRemainingDays = Number(balance.totalDays) - newUsedDays - Number(balance.pendingDays);
        const updated = await database_1.default.leaveBalance.update({
            where: { id: balance.id },
            data: {
                usedDays: new library_1.Decimal(newUsedDays),
                remainingDays: new library_1.Decimal(Math.max(0, newRemainingDays)),
            },
        });
        logger_1.default.info(`Leave balance updated (used): ${balance.id}`, {
            companyId,
            employeeId,
            leaveType,
            year,
            days,
        });
        return updated;
    }
    /**
     * Mettre à jour les jours en attente
     */
    async updatePendingDays(companyId, employeeId, leaveType, year, days) {
        const balance = await this.getOrCreateBalance(companyId, employeeId, leaveType, year);
        const newPendingDays = Number(balance.pendingDays) + days;
        const newRemainingDays = Number(balance.totalDays) - Number(balance.usedDays) - newPendingDays;
        const updated = await database_1.default.leaveBalance.update({
            where: { id: balance.id },
            data: {
                pendingDays: new library_1.Decimal(Math.max(0, newPendingDays)),
                remainingDays: new library_1.Decimal(Math.max(0, newRemainingDays)),
            },
        });
        logger_1.default.info(`Leave balance updated (pending): ${balance.id}`, {
            companyId,
            employeeId,
            leaveType,
            year,
            days,
        });
        return updated;
    }
    /**
     * Obtenir tous les soldes d'un employé pour une année
     */
    async getEmployeeBalances(companyId, employeeId, year) {
        const balances = await database_1.default.leaveBalance.findMany({
            where: {
                companyId,
                employeeId,
                year,
            },
            orderBy: {
                leaveType: 'asc',
            },
        });
        // S'assurer qu'il y a un solde pour chaque type de congé actif
        const policies = await leavePolicy_service_1.default.list(companyId, { isActive: true });
        const balanceMap = new Map(balances.map((b) => [b.leaveType, b]));
        for (const policy of policies.data) {
            if (!balanceMap.has(policy.leaveType)) {
                const balance = await this.getOrCreateBalance(companyId, employeeId, policy.leaveType, year);
                balances.push(balance);
            }
        }
        return balances.sort((a, b) => a.leaveType.localeCompare(b.leaveType));
    }
    /**
     * Initialiser les soldes pour un nouvel employé
     */
    async initializeForEmployee(companyId, employeeId, hireDate) {
        const year = hireDate.getFullYear();
        const policies = await leavePolicy_service_1.default.list(companyId, { isActive: true });
        for (const policy of policies.data) {
            // Calculer les jours proportionnels si l'employé a été embauché en cours d'année
            const monthsWorked = 12 - hireDate.getMonth();
            const daysPerYear = Number(policy.daysPerYear);
            const daysPerMonth = policy.daysPerMonth
                ? Number(policy.daysPerMonth)
                : daysPerYear / 12;
            // Si accumulation mensuelle, calculer depuis la date d'embauche
            const totalDays = policy.daysPerMonth
                ? daysPerMonth * monthsWorked
                : (daysPerYear * monthsWorked) / 12;
            await database_1.default.leaveBalance.create({
                data: {
                    companyId,
                    employeeId,
                    leaveType: policy.leaveType,
                    year,
                    totalDays: new library_1.Decimal(Math.floor(totalDays)),
                    usedDays: new library_1.Decimal(0),
                    pendingDays: new library_1.Decimal(0),
                    remainingDays: new library_1.Decimal(Math.floor(totalDays)),
                    carriedForward: new library_1.Decimal(0),
                },
            });
        }
        logger_1.default.info(`Leave balances initialized for employee: ${employeeId}`, {
            companyId,
            employeeId,
            year,
        });
    }
    /**
     * Reporter les soldes à l'année suivante
     */
    async carryForwardToNextYear(companyId, employeeId, fromYear) {
        const toYear = fromYear + 1;
        const balances = await database_1.default.leaveBalance.findMany({
            where: {
                companyId,
                employeeId,
                year: fromYear,
            },
        });
        for (const balance of balances) {
            const policy = await leavePolicy_service_1.default.getByType(companyId, balance.leaveType);
            if (policy?.carryForward) {
                const carriedForward = Number(balance.remainingDays);
                const newTotalDays = Number(policy.daysPerYear) + carriedForward;
                await this.getOrCreateBalance(companyId, employeeId, balance.leaveType, toYear);
                await database_1.default.leaveBalance.update({
                    where: {
                        companyId_employeeId_leaveType_year: {
                            companyId,
                            employeeId,
                            leaveType: balance.leaveType,
                            year: toYear,
                        },
                    },
                    data: {
                        totalDays: new library_1.Decimal(newTotalDays),
                        remainingDays: new library_1.Decimal(newTotalDays - Number(balance.usedDays)),
                        carriedForward: new library_1.Decimal(carriedForward),
                    },
                });
            }
            else {
                // Créer un nouveau solde sans report
                await this.getOrCreateBalance(companyId, employeeId, balance.leaveType, toYear);
            }
        }
        logger_1.default.info(`Leave balances carried forward for employee: ${employeeId}`, {
            companyId,
            employeeId,
            fromYear,
            toYear,
        });
    }
}
exports.LeaveBalanceService = LeaveBalanceService;
exports.default = new LeaveBalanceService();
//# sourceMappingURL=leaveBalance.service.js.map