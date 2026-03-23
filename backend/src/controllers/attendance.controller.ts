import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import attendanceService from '../services/attendance.service';
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

const baseAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().min(1),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  hoursWorked: z.number().nonnegative().optional(),
  status: z.string().optional(),
  leaveType: z.string().optional(),
  notes: z.string().optional(),
});

const createAttendanceSchema = z.preprocess(
  preprocessData,
  baseAttendanceSchema
);

const updateAttendanceSchema = z.preprocess(
  preprocessData,
  baseAttendanceSchema.partial()
);

const listAttendanceSchema = z.object({
  employeeId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

export class AttendanceController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = createAttendanceSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const attendance = await attendanceService.create(companyId, data);
      res.status(201).json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const companyId = getCompanyId(req);
      const attendance = await attendanceService.getById(companyId, req.params.id);
      res.json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = listAttendanceSchema.parse(req.query);
      const companyId = getCompanyId(req);
      const result = await attendanceService.list(companyId, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = updateAttendanceSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const attendance = await attendanceService.update(companyId, req.params.id, data);
      res.json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const companyId = getCompanyId(req);
      await attendanceService.delete(companyId, req.params.id);
      res.json({ success: true, message: 'Attendance deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'startDate and endDate are required' },
        });
      }

      const companyId = getCompanyId(req);
      const stats = await attendanceService.getEmployeeStats(
        companyId,
        employeeId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export default new AttendanceController();

