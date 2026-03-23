import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

export type HrComplianceSeverity = 'info' | 'warning' | 'error';

export interface HrComplianceIssue {
  code: string;
  message: string;
  severity: HrComplianceSeverity;
  employeeId?: string;
  payrollId?: string;
  attendanceId?: string;
  leaveRequestId?: string;
  details?: Record<string, any>;
}

export interface HrComplianceSummary {
  periodStart: Date;
  periodEnd: Date;
  issues: HrComplianceIssue[];
}

export class HrComplianceService {
  /**
   * Valider les paies par rapport aux règles minimales RDC
   * - Salaire brut cohérent avec le salaire de base
   * - Salaire net non négatif
   * - Paies approuvées/payées dans un délai raisonnable
   */
  private async checkPayrollCompliance(
    companyId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<HrComplianceIssue[]> {
    const issues: HrComplianceIssue[] = [];

    const payrolls = await prisma.payrolls.findMany({
      where: {
        companyId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
      include: {
        employee: true,
      },
    });

    for (const payroll of payrolls) {
      const employee = payroll.employee;
      if (!employee) continue;

      const baseSalary = Number(employee.baseSalary || 0);
      const grossSalary = Number(payroll.grossSalary || 0);
      const netSalary = Number(payroll.netSalary || 0);

      // 1) Salaire brut trop éloigné du salaire de base (hors primes)
      if (baseSalary > 0) {
        const ratio = grossSalary / baseSalary;
        if (ratio < 0.8 || ratio > 2.5) {
          issues.push({
            code: 'PAYROLL_GROSS_VS_BASE_SALARY',
            message:
              "Salaire brut très différent du salaire de base pour une paie (vérifier primes, heures sup, erreurs de saisie).",
            severity: 'warning',
            employeeId: employee.id,
            payrollId: payroll.id,
            details: {
              baseSalary,
              grossSalary,
              ratio: Number(ratio.toFixed(2)),
            },
          });
        }
      }

      // 2) Salaire net négatif
      if (netSalary < 0) {
        issues.push({
          code: 'PAYROLL_NEGATIVE_NET',
          message: 'Salaire net négatif détecté (déductions supérieures au brut).',
          severity: 'error',
          employeeId: employee.id,
          payrollId: payroll.id,
          details: {
            grossSalary,
            netSalary,
          },
        });
      }

      // 3) Paie approuvée très en retard par rapport à la période
      if (payroll.status === 'approved' || payroll.status === 'paid') {
        const periodEndDate = payroll.periodEnd;
        const payDate = payroll.payDate;
        if (payDate && periodEndDate) {
          const diffDays =
            (payDate.getTime() - periodEndDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 45) {
            issues.push({
              code: 'PAYROLL_LATE_PAYMENT',
              message:
                'Paie approuvée/payée avec un retard important par rapport à la fin de période.',
              severity: 'warning',
              employeeId: employee.id,
              payrollId: payroll.id,
              details: {
                periodEnd: periodEndDate,
                payDate,
                delayDays: Math.round(diffDays),
              },
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Valider le temps de travail (présence) vs normes RDC
   * - Maximum 48 heures par semaine (8h x 6 jours) à titre indicatif
   * - Pointages avec heures négatives ou incohérentes
   */
  private async checkAttendanceCompliance(
    companyId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<HrComplianceIssue[]> {
    const issues: HrComplianceIssue[] = [];

    const attendances = await prisma.attendances.findMany({
      where: {
        companyId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        employee: true,
      },
    });

    // Regrouper par employé + semaine
    const weeklyHours: Record<string, number> = {};

    for (const attendance of attendances) {
      const employee = attendance.employee;
      if (!employee) continue;

      const hoursWorked = Number(attendance.hoursWorked || 0);

      // Heures négatives ou très élevées dans une journée
      if (hoursWorked < 0 || hoursWorked > 16) {
        issues.push({
          code: 'ATTENDANCE_INVALID_HOURS',
          message:
            "Heures travaillées incohérentes pour une journée (négatives ou supérieures à 16h).",
          severity: 'warning',
          employeeId: employee.id,
          attendanceId: attendance.id,
          details: {
            date: attendance.date,
            hoursWorked,
          },
        });
      }

      // Calcul des heures hebdomadaires (clé: employeeId + année + semaine)
      const date = attendance.date;
      const year = date.getFullYear();
      const week = this.getWeekNumber(date);
      const key = `${employee.id}-${year}-W${week}`;

      weeklyHours[key] = (weeklyHours[key] || 0) + hoursWorked;
    }

    // Vérifier dépassement des 48h par semaine
    for (const [key, totalHours] of Object.entries(weeklyHours)) {
      if (totalHours > 55) {
        const [employeeId, yearWeek] = key.split('-W');
        issues.push({
          code: 'ATTENDANCE_WEEKLY_HOURS_EXCEEDED',
          message:
            "Temps de travail hebdomadaire très élevé (> 55h). Vérifier le respect des durées maximales et du repos.",
          severity: 'warning',
          employeeId,
          details: {
            yearWeek,
            totalHours: Number(totalHours.toFixed(2)),
          },
        });
      }
    }

    return issues;
  }

  /**
   * Vérifier la cohérence des congés par rapport aux politiques (RDC)
   * - Nombre de jours demandés vs solde disponible
   * (la logique principale est déjà dans leaveRequest/leaveBalance,
   * ici on fait surtout des rapports synthétiques).
   */
  private async checkLeaveCompliance(
    companyId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<HrComplianceIssue[]> {
    const issues: HrComplianceIssue[] = [];

    const leaveRequests = await prisma.leave_requests.findMany({
      where: {
        companyId,
        startDate: { gte: periodStart },
        endDate: { lte: periodEnd },
      },
      include: {
        employee: true,
      },
    });

    for (const request of leaveRequests) {
      const employee = request.employee;
      if (!employee) continue;

      const daysRequested = Number(request.daysRequested || 0);

      if (daysRequested <= 0) {
        issues.push({
          code: 'LEAVE_ZERO_DAYS',
          message:
            'Demande de congé avec un nombre de jours nul ou négatif (vérifier les dates).',
          severity: 'warning',
          employeeId: employee.id,
          leaveRequestId: request.id,
          details: {
            startDate: request.startDate,
            endDate: request.endDate,
            daysRequested,
          },
        });
      }

      // Journées de congés très longues (ex: > 60 jours) hors maternité
      if (daysRequested > 60 && request.leaveType !== 'maternity') {
        issues.push({
          code: 'LEAVE_LONG_PERIOD',
          message:
            'Demande de congé très longue (> 60 jours) hors congé maternité. Vérifier conformité contractuelle et légale.',
          severity: 'warning',
          employeeId: employee.id,
          leaveRequestId: request.id,
          details: {
            leaveType: request.leaveType,
            daysRequested,
          },
        });
      }
    }

    return issues;
  }

  /**
   * Calculer le numéro de semaine (ISO approximatif, suffisant pour contrôle RH)
   */
  private getWeekNumber(date: Date): number {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Générer un rapport de conformité RH global pour une période
   */
  async generateComplianceReport(
    companyId: string,
    periodStart: Date | string,
    periodEnd: Date | string
  ): Promise<HrComplianceSummary> {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const [payrollIssues, attendanceIssues, leaveIssues] = await Promise.all([
      this.checkPayrollCompliance(companyId, start, end),
      this.checkAttendanceCompliance(companyId, start, end),
      this.checkLeaveCompliance(companyId, start, end),
    ]);

    const issues = [...payrollIssues, ...attendanceIssues, ...leaveIssues];

    logger.info('HR compliance report generated', {
      companyId,
      periodStart: start,
      periodEnd: end,
      issuesCount: issues.length,
    });

    return {
      periodStart: start,
      periodEnd: end,
      issues,
    };
  }
}

export default new HrComplianceService();


