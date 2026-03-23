import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import employeeService from '../services/employee.service';
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

const baseEmployeeSchema = z.object({
  employeeNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  hireDate: z.string().min(1),
  terminationDate: z.string().optional(),
  employmentType: z.string().optional(),
  status: z.string().optional(),
  baseSalary: z.number().nonnegative(),
  currency: z.string().optional(),
  salaryFrequency: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  nif: z.string().optional(),
  socialSecurityNumber: z.string().optional(),
  notes: z.string().optional(),
});

const createEmployeeSchema = z.preprocess(
  preprocessData,
  baseEmployeeSchema
);

const updateEmployeeSchema = z.preprocess(
  preprocessData,
  baseEmployeeSchema.partial()
);

const listEmployeesSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  position: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

export class EmployeeController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = createEmployeeSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const employee = await employeeService.create(companyId, data);
      res.status(201).json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const companyId = getCompanyId(req);
      const employee = await employeeService.getById(companyId, req.params.id);
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = listEmployeesSchema.parse(req.query);
      const companyId = getCompanyId(req);
      const result = await employeeService.list(companyId, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = updateEmployeeSchema.parse(req.body);
      const companyId = getCompanyId(req);
      const employee = await employeeService.update(companyId, req.params.id, data);
      res.json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const companyId = getCompanyId(req);
      await employeeService.delete(companyId, req.params.id);
      res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeController();

