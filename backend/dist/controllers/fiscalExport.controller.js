"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFiscalControl = exports.exportVATDeclaration = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const fiscalExport_service_1 = __importDefault(require("../services/fiscalExport.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const exportVATSchema = zod_1.z.object({
    period: zod_1.z.string().regex(/^\d{4}-\d{2}$/), // Format: "2025-01"
    format: zod_1.z.enum(['pdf', 'excel', 'xml']),
});
const exportFiscalControlSchema = zod_1.z.object({
    startDate: zod_1.z.string().transform((str) => new Date(str)),
    endDate: zod_1.z.string().transform((str) => new Date(str)),
    format: zod_1.z.enum(['excel', 'csv']),
});
/**
 * Exporter la déclaration TVA
 */
const exportVATDeclaration = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider les paramètres
        const params = exportVATSchema.parse(req.query);
        const result = await fiscalExport_service_1.default.exportVATDeclaration(companyId, params.period, params.format);
        // Déterminer le type MIME et l'extension
        let contentType;
        let extension;
        let filename;
        if (params.format === 'pdf') {
            contentType = 'application/pdf';
            extension = 'pdf';
            filename = `declaration-tva-${params.period}.pdf`;
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(result);
        }
        else if (params.format === 'excel') {
            contentType = 'text/csv';
            extension = 'csv';
            filename = `declaration-tva-${params.period}.csv`;
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(result);
        }
        else if (params.format === 'xml') {
            contentType = 'application/xml';
            extension = 'xml';
            filename = `declaration-tva-${params.period}.xml`;
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(result);
        }
        logger_1.default.info(`VAT declaration exported`, {
            companyId,
            period: params.period,
            format: params.format,
        });
    }
    catch (error) {
        logger_1.default.error('Error exporting VAT declaration', {
            error: error.message,
            stack: error.stack,
        });
        if (error instanceof zod_1.z.ZodError) {
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
exports.exportVATDeclaration = exportVATDeclaration;
/**
 * Exporter pour contrôle fiscal
 */
const exportFiscalControl = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider les paramètres
        const params = exportFiscalControlSchema.parse(req.query);
        const result = await fiscalExport_service_1.default.exportFiscalControl(companyId, {
            startDate: params.startDate,
            endDate: params.endDate,
        }, params.format);
        const filename = `export-controle-fiscal-${params.startDate.toISOString().split('T')[0]}-${params.endDate.toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(result);
        logger_1.default.info(`Fiscal control export generated`, {
            companyId,
            startDate: params.startDate,
            endDate: params.endDate,
            format: params.format,
        });
    }
    catch (error) {
        logger_1.default.error('Error exporting fiscal control', {
            error: error.message,
            stack: error.stack,
        });
        if (error instanceof zod_1.z.ZodError) {
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
exports.exportFiscalControl = exportFiscalControl;
//# sourceMappingURL=fiscalExport.controller.js.map