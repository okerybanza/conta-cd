import { Response } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import fiscalExportService, { ExportFormat } from '../services/fiscalExport.service';
import logger from '../utils/logger';
import { z } from 'zod';

const exportVATSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/), // Format: "2025-01"
  format: z.enum(['pdf', 'excel', 'xml']),
});

const exportFiscalControlSchema = z.object({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  format: z.enum(['excel', 'csv']),
});

/**
 * Exporter la déclaration TVA
 */
export const exportVATDeclaration = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider les paramètres
    const params = exportVATSchema.parse(req.query);

    const result = await fiscalExportService.exportVATDeclaration(
      companyId,
      params.period,
      params.format
    );

    // Déterminer le type MIME et l'extension
    let contentType: string;
    let extension: string;
    let filename: string;

    if (params.format === 'pdf') {
      contentType = 'application/pdf';
      extension = 'pdf';
      filename = `declaration-tva-${params.period}.pdf`;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(result);
    } else if (params.format === 'excel') {
      contentType = 'text/csv';
      extension = 'csv';
      filename = `declaration-tva-${params.period}.csv`;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(result);
    } else if (params.format === 'xml') {
      contentType = 'application/xml';
      extension = 'xml';
      filename = `declaration-tva-${params.period}.xml`;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(result);
    }

    logger.info(`VAT declaration exported`, {
      companyId,
      period: params.period,
      format: params.format,
    });
  } catch (error: any) {
    logger.error('Error exporting VAT declaration', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error exporting VAT declaration',
    });
  }
};

/**
 * Exporter pour contrôle fiscal
 */
export const exportFiscalControl = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = getCompanyId(req);

    // Valider les paramètres
    const params = exportFiscalControlSchema.parse(req.query);

    const result = await fiscalExportService.exportFiscalControl(
      companyId,
      {
        startDate: params.startDate,
        endDate: params.endDate,
      },
      params.format
    );

    const filename = `export-controle-fiscal-${params.startDate.toISOString().split('T')[0]}-${params.endDate.toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result);

    logger.info(`Fiscal control export generated`, {
      companyId,
      startDate: params.startDate,
      endDate: params.endDate,
      format: params.format,
    });
  } catch (error: any) {
    logger.error('Error exporting fiscal control', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error exporting fiscal control',
    });
  }
};

