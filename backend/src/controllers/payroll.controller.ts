import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import payrollService from '../services/payroll.service';
import templateService from '../services/template.service';
import pdfService from '../services/pdf.service';
import prisma from '../config/database';
import logger from '../utils/logger';
import { z } from 'zod';

const preprocessEmptyString = (val: any) => {
  if (val === '' || val === null) return undefined;
  return val;
};

const preprocessData = (data: any) => {
  if (typeof data !== 'object' || data === null) return data;
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'items' && Array.isArray(value)) {
      // Traiter les items de paie séparément
      cleaned[key] = value.map((item: any) => {
        const cleanedItem: any = {};
        for (const [itemKey, itemValue] of Object.entries(item)) {
          cleanedItem[itemKey] = preprocessEmptyString(itemValue);
        }
        return cleanedItem;
      });
    } else {
      cleaned[key] = preprocessEmptyString(value);
    }
  }
  return cleaned;
};

const payrollItemSchema = z.object({
  type: z.string(),
  description: z.string(),
  amount: z.number(),
  isDeduction: z.boolean(),
});

const createPayrollSchema = z.preprocess(
  preprocessData,
  z.object({
    employeeId: z.string().uuid(),
    periodStart: z.string().min(1),
    periodEnd: z.string().min(1),
    payDate: z.string().min(1),
    items: z.array(payrollItemSchema),
    notes: z.string().optional(),
  }).passthrough()
);

const updatePayrollSchema = z.preprocess(
  preprocessData,
  z.object({
    status: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentReference: z.string().optional(),
    paidAt: z.string().optional(),
    paidBy: z.string().optional(),
    notes: z.string().optional(),
  }).passthrough()
);

const listPayrollSchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

export class PayrollController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const data = createPayrollSchema.parse(req.body);
      const payroll = await payrollService.create(getCompanyId(req), data, req.user.id);
      res.status(201).json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const payroll = await payrollService.getById(getCompanyId(req), req.params.id);
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = listPayrollSchema.parse(req.query);
      const result = await payrollService.list(getCompanyId(req), filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const data = updatePayrollSchema.parse(req.body);
      const payroll = await payrollService.update(
        getCompanyId(req),
        id,
        data,
        req.user.id
      );
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const payroll = await payrollService.approve(
        getCompanyId(req),
        id,
        req.user.id
      );
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  async markAsPaid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const { id } = req.params;
      const markAsPaidSchema = z.object({
        paymentMethod: z.string().optional(),
        paymentReference: z.string().optional(),
        paidAt: z.string().optional(),
      });
      const data = markAsPaidSchema.parse(req.body);
      const payroll = await payrollService.markAsPaid(
        getCompanyId(req),
        id,
        data,
        req.user.id
      );
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      await payrollService.delete(getCompanyId(req), req.params.id, req.user.id);
      res.json({ success: true, message: 'Payroll deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async generatePDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      
      const { id } = req.params;
      const payroll = await payrollService.getById(getCompanyId(req), id);

      // Récupérer l'entreprise et l'employé
      const [company, employee] = await Promise.all([
        prisma.companies.findUnique({
          where: { id: getCompanyId(req) },
        }),
        prisma.employees.findUnique({
          where: { id: payroll.employee_id },
        }),
      ]);

      if (!company || !employee) {
        throw new Error('Company or employee not found');
      }

      // Préparer les données du template
      let templateData;
      try {
        templateData = await templateService.preparePayslipData(payroll, company, employee);
        logger.debug('Payslip template data prepared', { 
          payrollId: payroll.id,
          hasCompanyLogo: !!templateData.companyLogo,
        });
      } catch (templateError: any) {
        logger.error('Error preparing payslip template data', {
          error: templateError.message,
          stack: templateError.stack,
          payrollId: payroll.id
        });
        throw templateError;
      }

      // Générer le HTML
      logger.info('Generating payslip PDF', { 
        payrollId: payroll.id, 
        companyId: getCompanyId(req)
      });
      
      try {
        const html = templateService.compilePayslipTemplate(templateData);
        const pdfBuffer = await pdfService.generatePDFFromHTML(html);
        
        logger.info('Payslip PDF generated successfully', { 
          payrollId: payroll.id,
          pdfSize: pdfBuffer.length 
        });

        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="fiche-paie-${employee.employee_number}-${payroll.period_start.toISOString().split('T')[0]}.pdf"`);
        res.send(pdfBuffer);
      } catch (pdfError: any) {
        logger.error('Error in payslip PDF generation', { 
          error: pdfError.message, 
          stack: pdfError.stack,
          payrollId: payroll.id,
        });
        throw pdfError;
      }
    } catch (error: any) {
      logger.error('Error in generatePDF controller', { 
        error: error.message, 
        stack: error.stack,
        payrollId: req.params.id,
        userId: req.user?.id,
        companyId: req.user?.companyId
      });
      next(error);
    }
  }
}

export default new PayrollController();

