import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import leaveBalanceService from '../services/leaveBalance.service';
import { z } from 'zod';

const getBalanceSchema = z.object({
  leaveType: z.string().min(1),
  year: z.coerce.number().int().positive().optional(),
});

const getEmployeeBalancesSchema = z.object({
  year: z.coerce.number().int().positive().optional(),
});

export class LeaveBalanceController {
  async getBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { employeeId } = req.params;
      const { leaveType, year } = getBalanceSchema.parse(req.query);
      const balanceYear = year || new Date().getFullYear();
      const balance = await leaveBalanceService.getBalance(
        getCompanyId(req),
        employeeId,
        leaveType,
        balanceYear
      );
      res.json(balance);
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeBalances(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { employeeId } = req.params;
      const { year } = getEmployeeBalancesSchema.parse(req.query);
      const balanceYear = year || new Date().getFullYear();
      const balances = await leaveBalanceService.getEmployeeBalances(
        getCompanyId(req),
        employeeId,
        balanceYear
      );
      res.json(balances);
    } catch (error) {
      next(error);
    }
  }
}

export default new LeaveBalanceController();

