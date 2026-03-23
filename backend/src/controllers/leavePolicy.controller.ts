import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import leavePolicyService from '../services/leavePolicy.service';
import { z } from 'zod';

const createLeavePolicySchema = z.object({
  name: z.string().min(1),
  leaveType: z.string().min(1),
  daysPerYear: z.number().nonnegative(),
  daysPerMonth: z.number().nonnegative().optional(),
  maxAccumulation: z.number().nonnegative().optional(),
  carryForward: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  minNoticeDays: z.number().int().nonnegative().optional(),
  description: z.string().optional(),
});

const updateLeavePolicySchema = createLeavePolicySchema.partial().extend({
  isActive: z.boolean().optional(),
});

const listLeavePoliciesSchema = z.object({
  leaveType: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export class LeavePolicyController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = createLeavePolicySchema.parse(req.body);
      const policy = await leavePolicyService.create(getCompanyId(req), data);
      res.status(201).json(policy);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const policy = await leavePolicyService.getById(getCompanyId(req), id);
      res.json(policy);
    } catch (error) {
      next(error);
    }
  }

  async getByType(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { type } = req.params;
      const policy = await leavePolicyService.getByType(getCompanyId(req), type);
      if (!policy) {
        return res.status(404).json({ message: 'Leave policy not found' });
      }
      res.json(policy);
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = listLeavePoliciesSchema.parse(req.query);
      const result = await leavePolicyService.list(getCompanyId(req), filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const data = updateLeavePolicySchema.parse(req.body);
      const policy = await leavePolicyService.update(getCompanyId(req), id, data);
      res.json(policy);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      await leavePolicyService.delete(getCompanyId(req), id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async createDefaults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const policies = await leavePolicyService.createDefaultPolicies(getCompanyId(req));
      res.status(201).json(policies);
    } catch (error) {
      next(error);
    }
  }
}

export default new LeavePolicyController();

