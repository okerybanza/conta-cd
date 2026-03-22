"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const invoice_service_1 = __importDefault(require("../services/invoice.service"));
const template_service_1 = __importDefault(require("../services/template.service"));
const pdf_service_1 = __importDefault(require("../services/pdf.service"));
const rdc_service_1 = __importDefault(require("../services/rdc.service"));
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
const invoiceLineSchema = zod_1.z.object({
    productId: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
    taxRate: zod_1.z.number().min(0).max(100).optional(),
});
const baseInvoiceSchema = zod_1.z.object({
    invoiceDate: zod_1.z.coerce.date().optional(),
    dueDate: zod_1.z.coerce.date().optional(),
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
    reason: zod_1.z.string().max(500).optional(), // ACCT-001: Why the invoice was created/modified (max 500 chars)
}).passthrough();
const createInvoiceSchema = zod_1.z.preprocess(preprocessData, baseInvoiceSchema.extend({
    customerId: zod_1.z.string().uuid(), // Requis pour la création
    lines: zod_1.z.array(invoiceLineSchema).min(1), // Requis pour la création
}));
const updateInvoiceSchema = zod_1.z.preprocess(preprocessData, baseInvoiceSchema.extend({
    customerId: zod_1.z.string().uuid().optional(),
    lines: zod_1.z.array(invoiceLineSchema).min(1).optional(),
}));
const listInvoicesSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
});
class InvoiceController {
    // Créer une facture
    async create(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const data = createInvoiceSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const invoice = await invoice_service_1.default.create(companyId, req.user.id, data);
            res.status(201).json({
                success: true,
                data: invoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Obtenir une facture
    async getById(req, res, next) {
        const startTime = Date.now();
        const timeout = 30000; // 30 secondes timeout
        // Créer une promesse avec timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Request timeout: Invoice retrieval took too long'));
            }, timeout);
        });
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            // Express décode automatiquement les paramètres d'URL, mais on peut aussi le faire explicitement
            const decodedId = decodeURIComponent(id);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            // Exécuter avec timeout
            const invoice = await Promise.race([
                invoice_service_1.default.getById(companyId, decodedId),
                timeoutPromise
            ]);
            const duration = Date.now() - startTime;
            if (duration > 5000) {
                logger_1.default.warn('Slow invoice retrieval', {
                    invoiceId: decodedId,
                    companyId,
                    duration: `${duration}ms`
                });
            }
            res.json({
                success: true,
                data: invoice,
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error('Error retrieving invoice', {
                invoiceId: req.params.id,
                error: error.message,
                duration: `${duration}ms`
            });
            if (error.message.includes('timeout')) {
                res.status(504).json({
                    success: false,
                    message: 'Request timeout: The invoice retrieval took too long. Please try again.',
                });
            }
            else {
                next(error);
            }
        }
    }
    // Lister les factures
    async list(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const filters = listInvoicesSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const result = await invoice_service_1.default.list(companyId, filters);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Mettre à jour une facture
    async update(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const data = updateInvoiceSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const invoice = await invoice_service_1.default.update(companyId, id, data, req.user.id);
            res.json({
                success: true,
                data: invoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Supprimer une facture
    async delete(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            // Extract justification from body if present (DOC-08)
            const { justification } = req.body || {};
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await invoice_service_1.default.delete(companyId, id, req.user.id, justification);
            res.json({
                success: true,
                message: 'Invoice deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Dupliquer une facture
    async duplicate(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const invoice = await invoice_service_1.default.duplicate(companyId, id, req.user.id);
            res.status(201).json({
                success: true,
                data: invoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Mettre à jour le statut
    async updateStatus(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const { status, justification } = zod_1.z.object({
                status: zod_1.z.string(),
                justification: zod_1.z.string().optional()
            }).parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const invoice = await invoice_service_1.default.updateStatus(companyId, id, status, req.user.id, justification);
            res.json({
                success: true,
                data: invoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Générer PDF
    async generatePDF(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            // Express décode automatiquement les paramètres d'URL
            const decodedId = decodeURIComponent(id);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const invoice = await invoice_service_1.default.getById(companyId, decodedId);
            // Récupérer l'entreprise et le client
            const [company, customer] = await Promise.all([
                database_1.default.companies.findUnique({
                    where: { id: companyId },
                }),
                database_1.default.customers.findUnique({
                    where: { id: invoice.customer_id },
                }),
            ]);
            if (!company || !customer) {
                throw new Error('Company or customer not found');
            }
            // Générer QR code si facture RDC normalisée
            let qrCodeBase64;
            if (company.rdc_normalized_enabled && company.nif) {
                try {
                    qrCodeBase64 = await rdc_service_1.default.generateQRCodeBase64({
                        nif: company.nif,
                        def: company.def || undefined,
                        invoiceNumber: invoice.invoice_number,
                        invoiceDate: invoice.invoice_date.toISOString().split('T')[0],
                        totalTTC: Number(invoice.total_amount),
                        currency: invoice.currency || 'CDF',
                    });
                }
                catch (error) {
                    logger_1.default.warn('Error generating QR code', { error });
                }
            }
            // Préparer les données du template
            let templateData;
            try {
                templateData = await template_service_1.default.prepareInvoiceData(invoice, company, customer, qrCodeBase64);
                logger_1.default.debug('Template data prepared', {
                    invoiceId: invoice.id,
                    hasCompanyLogo: !!templateData.companyLogo,
                    hasPlatformLogo: !!templateData.platformPdfLogo
                });
            }
            catch (templateError) {
                logger_1.default.error('Error preparing template data', {
                    error: templateError.message,
                    stack: templateError.stack,
                    invoiceId: invoice.id
                });
                throw templateError;
            }
            // Générer le PDF
            const template_id = invoice.template_id || company.invoice_template_id || 'template-standard';
            logger_1.default.info('Generating PDF', {
                invoiceId: invoice.id,
                invoice_number: invoice.invoice_number,
                template_id,
                companyId: companyId
            });
            try {
                const pdfBuffer = await pdf_service_1.default.generateInvoicePDF(template_id, templateData);
                logger_1.default.info('PDF generated successfully', {
                    invoiceId: invoice.id,
                    pdfSize: pdfBuffer.length
                });
                // Envoyer le PDF
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoice_number}.pdf"`);
                res.send(pdfBuffer);
            }
            catch (pdfError) {
                logger_1.default.error('Error in PDF generation', {
                    error: pdfError.message,
                    stack: pdfError.stack,
                    invoiceId: invoice.id,
                    template_id
                });
                throw pdfError;
            }
        }
        catch (error) {
            logger_1.default.error('Error in generatePDF controller', {
                error: error.message,
                stack: error.stack,
                invoiceId: req.params.id,
                userId: req.user?.id,
                companyId: req.user?.companyId
            });
            next(error);
        }
    }
    // Prévisualiser HTML
    async previewHTML(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { id } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const invoice = await invoice_service_1.default.getById(companyId, id);
            // Récupérer l'entreprise et le client
            const [company, customer] = await Promise.all([
                database_1.default.companies.findUnique({
                    where: { id: companyId },
                }),
                database_1.default.customers.findUnique({
                    where: { id: invoice.customer_id },
                }),
            ]);
            if (!company || !customer) {
                throw new Error('Company or customer not found');
            }
            // Générer QR code si facture RDC normalisée
            let qrCodeBase64;
            if (company.rdc_normalized_enabled && company.nif) {
                try {
                    qrCodeBase64 = await rdc_service_1.default.generateQRCodeBase64({
                        nif: company.nif,
                        def: company.def || undefined,
                        invoiceNumber: invoice.invoice_number,
                        invoiceDate: invoice.invoice_date.toISOString().split('T')[0],
                        totalTTC: Number(invoice.total_amount),
                        currency: invoice.currency || 'CDF',
                    });
                }
                catch (error) {
                    logger_1.default.warn('Error generating QR code', { error });
                }
            }
            // Préparer les données du template
            let templateData;
            try {
                templateData = await template_service_1.default.prepareInvoiceData(invoice, company, customer, qrCodeBase64);
            }
            catch (templateError) {
                logger_1.default.error('Error preparing template data for preview', {
                    error: templateError.message,
                    stack: templateError.stack,
                    invoiceId: invoice.id
                });
                throw templateError;
            }
            // Compiler le template
            const template_id = invoice.template_id || company.invoice_template_id || 'template-standard';
            const html = template_service_1.default.compileTemplate(template_id, templateData);
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.InvoiceController = InvoiceController;
exports.default = new InvoiceController();
//# sourceMappingURL=invoice.controller.js.map