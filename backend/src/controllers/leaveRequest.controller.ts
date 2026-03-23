import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import leaveRequestService from '../services/leaveRequest.service';
import { z } from 'zod';

const preprocessEmptyString = (val: any) => {
  if (val === '' || val === null) return undefined;
  return val;
};

const preprocessData = (data: any) => {
  if (typeof data !== 'object' || data === null) return data;
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = preprocessEmptyString(value);
  }
  return cleaned;
};

const baseLeaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.string().min(1),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const createLeaveRequestSchema = z.preprocess(
  preprocessData,
  baseLeaveRequestSchema
);

const updateLeaveRequestSchema = z.preprocess(
  preprocessData,
  z.object({
    leaveType: z.string().min(1).optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
  }).passthrough()
);

const listLeaveRequestsSchema = z.object({
  employeeId: z.string().uuid().optional(),
  leaveType: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

const rejectLeaveRequestSchema = z.preprocess(
  preprocessData,
  z.object({
    rejectionReason: z.string().optional(),
  }).passthrough()
);

export class LeaveRequestController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = createLeaveRequestSchema.parse(req.body);
      const leaveRequest = await leaveRequestService.create(getCompanyId(req), data);
      res.status(201).json(leaveRequest);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const leaveRequest = await leaveRequestService.getById(getCompanyId(req), id);
      res.json(leaveRequest);
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = listLeaveRequestsSchema.parse(req.query);
      const result = await leaveRequestService.list(getCompanyId(req), filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const leaveRequest = await leaveRequestService.approve(getCompanyId(req), id, req.user.id);
      res.json(leaveRequest);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const data = rejectLeaveRequestSchema.parse(req.body);
      const leaveRequest = await leaveRequestService.reject(
        getCompanyId(req),
        id,
        req.user.id,
        data.rejectionReason
      );
      res.json(leaveRequest);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const leaveRequest = await leaveRequestService.cancel(
        getCompanyId(req),
        id,
        req.user.id
      );
      res.json(leaveRequest);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const data = updateLeaveRequestSchema.parse(req.body);
      const leaveRequest = await leaveRequestService.update(getCompanyId(req), id, data);
      res.json(leaveRequest);
    } catch (error) {
      next(error);
    }
  }
}

export default new LeaveRequestController();

