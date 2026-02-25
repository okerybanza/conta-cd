"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const payroll_service_1 = __importDefault(require("../services/payroll.service"));
const template_service_1 = __importDefault(require("../services/template.service"));
const pdf_service_1 = __importDefault(require("../services/pdf.service"));
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        if (key === 'items' && Array.isArray(value)) {
            // Traiter les items de paie séparément
            cleaned[key] = value.map((item) => {
                const cleanedItem = {};
                for (const [itemKey, itemValue] of Object.entries(item)) {
                    cleanedItem[itemKey] = preprocessEmptyString(itemValue);
                }
                return cleanedItem;
            });
        }
        else {
            cleaned[key] = preprocessEmptyString(value);
        }
    }
    return cleaned;
};
const payrollItemSchema = zod_1.z.object({
    type: zod_1.z.string(),
    description: zod_1.z.string(),
    amount: zod_1.z.number(),
    isDeduction: zod_1.z.boolean(),
});
const createPayrollSchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    periodStart: zod_1.z.string().min(1),
    periodEnd: zod_1.z.string().min(1),
    payDate: zod_1.z.string().min(1),
    items: zod_1.z.array(payrollItemSchema),
    notes: zod_1.z.string().optional(),
}).passthrough());
const updatePayrollSchema = zod_1.z.preprocess(preprocessData, zod_1.z.object({
    status: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.string().optional(),
    paymentReference: zod_1.z.string().optional(),
    paidAt: zod_1.z.string().optional(),
    paidBy: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
}).passthrough());
const listPayrollSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).optional(),
});
class PayrollController {
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createPayrollSchema.parse(req.body);
            const payroll = await payroll_service_1.default.create((0, auth_middleware_1.getCompanyId)(req), data, req.user.id);
            res.status(201).json({ success: true, data: payroll });
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const payroll = await payroll_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), req.params.id);
            res.json({ success: true, data: payroll });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = listPayrollSchema.parse(req.query);
            const result = await payroll_service_1.default.list((0, auth_middleware_1.getCompanyId)(req), filters);
            res.json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const data = updatePayrollSchema.parse(req.body);
            const payroll = await payroll_service_1.default.update((0, auth_middleware_1.getCompanyId)(req), id, data, req.user.id);
            res.json({ success: true, data: payroll });
        }
        catch (error) {
            next(error);
        }
    }
    async approve(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const payroll = await payroll_service_1.default.approve((0, auth_middleware_1.getCompanyId)(req), id, req.user.id);
            res.json({ success: true, data: payroll });
        }
        catch (error) {
            next(error);
        }
    }
    async markAsPaid(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const markAsPaidSchema = zod_1.z.object({
                paymentMethod: zod_1.z.string().optional(),
                paymentReference: zod_1.z.string().optional(),
                paidAt: zod_1.z.string().optional(),
            });
            const data = markAsPaidSchema.parse(req.body);
            const payroll = await payroll_service_1.default.markAsPaid((0, auth_middleware_1.getCompanyId)(req), id, data, req.user.id);
            res.json({ success: true, data: payroll });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            await payroll_service_1.default.delete((0, auth_middleware_1.getCompanyId)(req), req.params.id, req.user.id);
            res.json({ success: true, message: 'Payroll deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    async generatePDF(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { id } = req.params;
            const payroll = await payroll_service_1.default.getById((0, auth_middleware_1.getCompanyId)(req), id);
            // Récupérer l'entreprise et l'employé
            const [company, employee] = await Promise.all([
                database_1.default.companies.findUnique({
                    where: { id: (0, auth_middleware_1.getCompanyId)(req) },
                }),
                database_1.default.employees.findUnique({
                    where: { id: payroll.employee_id },
                }),
            ]);
            if (!company || !employee) {
                throw new Error('Company or employee not found');
            }
            // Préparer les données du template
            let templateData;
            try {
                templateData = await template_service_1.default.preparePayslipData(payroll, company, employee);
                logger_1.default.debug('Payslip template data prepared', {
                    payrollId: payroll.id,
                    hasCompanyLogo: !!templateData.companyLogo,
                });
            }
            catch (templateError) {
                logger_1.default.error('Error preparing payslip template data', {
                    error: templateError.message,
                    stack: templateError.stack,
                    payrollId: payroll.id
                });
                throw templateError;
            }
            // Générer le HTML
            logger_1.default.info('Generating payslip PDF', {
                payrollId: payroll.id,
                companyId: (0, auth_middleware_1.getCompanyId)(req)
            });
            try {
                const html = template_service_1.default.compilePayslipTemplate(templateData);
                const pdfBuffer = await pdf_service_1.default.generatePDFFromHTML(html);
                logger_1.default.info('Payslip PDF generated successfully', {
                    payrollId: payroll.id,
                    pdfSize: pdfBuffer.length
                });
                // Envoyer le PDF
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="fiche-paie-${employee.employee_number}-${payroll.period_start.toISOString().split('T')[0]}.pdf"`);
                res.send(pdfBuffer);
            }
            catch (pdfError) {
                logger_1.default.error('Error in payslip PDF generation', {
                    error: pdfError.message,
                    stack: pdfError.stack,
                    payrollId: payroll.id,
                });
                throw pdfError;
            }
        }
        catch (error) {
            logger_1.default.error('Error in generatePDF controller', {
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
exports.PayrollController = PayrollController;
exports.default = new PayrollController();
//# sourceMappingURL=payroll.controller.js.map