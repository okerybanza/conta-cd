"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const quotation_service_1 = __importDefault(require("../services/quotation.service"));
const template_service_1 = __importDefault(require("../services/template.service"));
const pdf_service_1 = __importDefault(require("../services/pdf.service"));
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
// Fonction helper pour nettoyer les valeurs (convertir chaînes vides en undefined)
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
// Fonction helper pour préprocesser les données
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
// Schémas de validation
const quotationLineSchema = zod_1.z.object({
    productId: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
    taxRate: zod_1.z.number().min(0).max(100).optional(),
});
const baseQuotationSchema = zod_1.z.object({
    quotationDate: zod_1.z.string().optional(),
    expirationDate: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    poNumber: zod_1.z.string().optional(),
    shippingAddress: zod_1.z.string().optional(),
    shippingCity: zod_1.z.string().optional(),
    shippingCountry: zod_1.z.string().optional(),
    transportFees: zod_1.z.number().nonnegative().optional(),
    platformFees: zod_1.z.number().nonnegative().optional(),
    currency: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    paymentTerms: zod_1.z.string().optional(),
    footerText: zod_1.z.string().optional(),
}).passthrough();
const createQuotationSchema = zod_1.z.preprocess(preprocessData, baseQuotationSchema.extend({
    customerId: zod_1.z.string().min(1), // Requis pour la création
    lines: zod_1.z.array(quotationLineSchema).min(1), // Requis pour la création
}));
const updateQuotationSchema = zod_1.z.preprocess(preprocessData, baseQuotationSchema.extend({
    customerId: zod_1.z.string().min(1).optional(),
    lines: zod_1.z.array(quotationLineSchema).min(1).optional(),
    status: zod_1.z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
}));
const listQuotationsSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).optional(),
});
class QuotationController {
    // Créer un devis
    async create(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const data = createQuotationSchema.parse(req.body);
            const quotation = await quotation_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), req.user.id, {
                ...data,
                quotationDate: data.quotationDate ? new Date(data.quotationDate) : undefined,
                expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
            });
            res.status(201).json({
                success: true,
                data: quotation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir un devis
    async getById(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const quotation = await quotation_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                data: quotation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Lister les devis
    async list(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = listQuotationsSchema.parse(req.query);
            const result = await quotation_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Mettre à jour un devis
    async update(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const data = updateQuotationSchema.parse(req.body);
            const quotation = await quotation_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, req.user.id, {
                ...data,
                quotationDate: data.quotationDate ? new Date(data.quotationDate) : undefined,
                expirationDate: data.expirationDate !== undefined && data.expirationDate !== null
                    ? new Date(data.expirationDate)
                    : undefined,
            });
            res.json({
                success: true,
                data: quotation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Supprimer un devis
    async delete(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            await quotation_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), id);
            res.json({
                success: true,
                message: 'Quotation deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Convertir un devis en facture
    async convertToInvoice(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const result = await quotation_service_1.default.convertToInvoice((0, auth_middleware_1.getCompanyId)(req), id, req.user.id);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Générer le PDF du devis
    async generatePDF(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const quotation = await quotation_service_1.default.getById(companyId, id);
            const [company, customer] = await Promise.all([
                database_1.default.companies.findUnique({ where: { id: companyId } }),
                database_1.default.customers.findUnique({ where: { id: quotation.customer_id } }),
            ]);
            if (!company || !customer) {
                throw new Error('Company or customer not found');
            }
            let templateData;
            try {
                templateData = await template_service_1.default.prepareQuotationData(quotation, company, customer);
                logger_1.default.debug('Quotation template data prepared', {
                    quotationId: quotation.id,
                    hasCompanyLogo: !!templateData.companyLogo,
                    hasPlatformLogo: !!templateData.platformPdfLogo,
                });
            }
            catch (templateError) {
                logger_1.default.error('Error preparing quotation template data', {
                    error: templateError.message,
                    stack: templateError.stack,
                    quotationId: quotation.id,
                });
                throw templateError;
            }
            const templateId = quotation.template_id || company.invoice_template_id || 'template-standard';
            logger_1.default.info('Generating quotation PDF', {
                quotationId: quotation.id,
                quotation_number: quotation.quotation_number,
                templateId,
                companyId,
            });
            try {
                const html = template_service_1.default.compileTemplate(templateId, templateData);
                const pdfBuffer = await pdf_service_1.default.generatePDFFromHTML(html);
                logger_1.default.info('Quotation PDF generated successfully', {
                    quotationId: quotation.id,
                    pdfSize: pdfBuffer.length,
                });
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="devis-${quotation.quotation_number}.pdf"`);
                res.send(pdfBuffer);
            }
            catch (pdfError) {
                logger_1.default.error('Error in quotation PDF generation', {
                    error: pdfError.message,
                    stack: pdfError.stack,
                    quotationId: quotation.id,
                    templateId,
                });
                throw pdfError;
            }
        }
        catch (error) {
            logger_1.default.error('Error in generatePDF quotation controller', {
                error: error.message,
                stack: error.stack,
                quotationId: req.params.id,
                userId: req.user?.id,
                companyId: req.user?.companyId,
            });
            next(error);
        }
    }
}
exports.QuotationController = QuotationController;
exports.default = new QuotationController();
//# sourceMappingURL=quotation.controller.js.map