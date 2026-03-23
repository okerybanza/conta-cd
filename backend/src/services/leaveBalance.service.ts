import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';
import leavePolicyService from './leavePolicy.service';

export interface LeaveBalanceData {
  totalDays?: number;
  usedDays?: number;
  pendingDays?: number;
  remainingDays?: number;
  carriedForward?: number;
}

export class LeaveBalanceService {
  /**
   * Obtenir ou créer le solde pour un employé, type et année
   */
  async getOrCreateBalance(
    companyId: string,
    employeeId: string,
    leaveType: string,
    year: number
  ) {
    let balance = await prisma.leaveBalance.findUnique({
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
      const policy = await leavePolicyService.getByType(companyId, leaveType);
      const totalDays = policy ? Number(policy.daysPerYear) : 0;

      // Vérifier s'il y a un solde de l'année précédente à reporter
      const previousYearBalance = await prisma.leaveBalance.findUnique({
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

      balance = await prisma.leaveBalance.create({
        data: {
          companyId,
          employeeId,
          leaveType,
          year,
          totalDays: new Decimal(totalDays + carriedForward),
          usedDays: new Decimal(0),
          pendingDays: new Decimal(0),
          remainingDays: new Decimal(totalDays + carriedForward),
          carriedForward: new Decimal(carriedForward),
        },
      });
    }

    return balance;
  }

  /**
   * Obtenir le solde pour un employé, type et année
   */
  async getBalance(companyId: string, employeeId: string, leaveType: string, year: number) {
    return this.getOrCreateBalance(companyId, employeeId, leaveType, year);
  }

  /**
   * Mettre à jour les jours utilisés
   */
  async updateUsedDays(
    companyId: string,
    employeeId: string,
    leaveType: string,
    year: number,
    days: number
  ) {
    const balance = await this.getOrCreateBalance(companyId, employeeId, leaveType, year);

    const newUsedDays = Number(balance.usedDays) + days;
    const newRemainingDays = Number(balance.totalDays) - newUsedDays - Number(balance.pendingDays);

    const updated = await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        usedDays: new Decimal(newUsedDays),
        remainingDays: new Decimal(Math.max(0, newRemainingDays)),
      },
    });

    logger.info(`Leave balance updated (used): ${balance.id}`, {
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
  async updatePendingDays(
    companyId: string,
    employeeId: string,
    leaveType: string,
    year: number,
    days: number
  ) {
    const balance = await this.getOrCreateBalance(companyId, employeeId, leaveType, year);

    const newPendingDays = Number(balance.pendingDays) + days;
    const newRemainingDays = Number(balance.totalDays) - Number(balance.usedDays) - newPendingDays;

    const updated = await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        pendingDays: new Decimal(Math.max(0, newPendingDays)),
        remainingDays: new Decimal(Math.max(0, newRemainingDays)),
      },
    });

    logger.info(`Leave balance updated (pending): ${balance.id}`, {
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
  async getEmployeeBalances(companyId: string, employeeId: string, year: number) {
    const balances = await prisma.leaveBalance.findMany({
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
    const policies = await leavePolicyService.list(companyId, { isActive: true });
    const balanceMap = new Map(balances.map((b) => [b.leaveType, b]));

    for (const policy of policies.data) {
      if (!balanceMap.has(policy.leaveType)) {
        const balance = await this.getOrCreateBalance(
          companyId,
          employeeId,
          policy.leaveType,
          year
        );
        balances.push(balance);
      }
    }

    return balances.sort((a, b) => a.leaveType.localeCompare(b.leaveType));
  }

  /**
   * Initialiser les soldes pour un nouvel employé
   */
  async initializeForEmployee(companyId: string, employeeId: string, hireDate: Date) {
    const year = hireDate.getFullYear();
    const policies = await leavePolicyService.list(companyId, { isActive: true });

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

      await prisma.leaveBalance.create({
        data: {
          companyId,
          employeeId,
          leaveType: policy.leaveType,
          year,
          totalDays: new Decimal(Math.floor(totalDays)),
          usedDays: new Decimal(0),
          pendingDays: new Decimal(0),
          remainingDays: new Decimal(Math.floor(totalDays)),
          carriedForward: new Decimal(0),
        },
      });
    }

    logger.info(`Leave balances initialized for employee: ${employeeId}`, {
      companyId,
      employeeId,
      year,
    });
  }

  /**
   * Reporter les soldes à l'année suivante
   */
  async carryForwardToNextYear(companyId: string, employeeId: string, fromYear: number) {
    const toYear = fromYear + 1;
    const balances = await prisma.leaveBalance.findMany({
      where: {
        companyId,
        employeeId,
        year: fromYear,
      },
    });

    for (const balance of balances) {
      const policy = await leavePolicyService.getByType(companyId, balance.leaveType);

      if (policy?.carryForward) {
        const carriedForward = Number(balance.remainingDays);
        const newTotalDays = Number(policy.daysPerYear) + carriedForward;

        await this.getOrCreateBalance(companyId, employeeId, balance.leaveType, toYear);

        await prisma.leaveBalance.update({
          where: {
            companyId_employeeId_leaveType_year: {
              companyId,
              employeeId,
              leaveType: balance.leaveType,
              year: toYear,
            },
          },
          data: {
            totalDays: new Decimal(newTotalDays),
            remainingDays: new Decimal(newTotalDays - Number(balance.usedDays)),
            carriedForward: new Decimal(carriedForward),
          },
        });
      } else {
        // Créer un nouveau solde sans report
        await this.getOrCreateBalance(companyId, employeeId, balance.leaveType, toYear);
      }
    }

    logger.info(`Leave balances carried forward for employee: ${employeeId}`, {
      companyId,
      employeeId,
      fromYear,
      toYear,
    });
  }
}

export default new LeaveBalanceService();

