import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import ohadaExportService from '../services/ohadaExport.service';
import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';

const getCompanyId = (req: AuthRequest) => req.user?.companyId as string;

export class OhadaExportController {
  async exportBilan(req: AuthRequest, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { endDate, startDate } = req.query as any;
      const company = await (prisma as any).companies.findUnique({ where: { id: companyId } });
      if (!company) throw new CustomError('Company not found', 404, 'NOT_FOUND');
      const pdfBuffer = await ohadaExportService.generateBilanPDF(companyId, company.name, { startDate, endDate });
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bilan-ohada-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error: any) {
      logger.error('OHADA Bilan export failed', error);
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async exportCompteResultat(req: AuthRequest, res: Response) {
    try {
      const companyId = getCompanyId(req);
      const { startDate, endDate } = req.query as any;
      const company = await (prisma as any).companies.findUnique({ where: { id: companyId } });
      if (!company) throw new CustomError('Company not found', 404, 'NOT_FOUND');
      const pdfBuffer = await ohadaExportService.generateCompteResultatPDF(companyId, company.name, { startDate, endDate });
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compte-resultat-ohada-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error: any) {
      logger.error('OHADA CR export failed', error);
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}

export default new OhadaExportController();
