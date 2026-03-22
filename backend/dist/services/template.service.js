"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
const branding_1 = require("../utils/branding");
// Simple template engine (remplace Handlebars temporairement)
class SimpleTemplateEngine {
    compile(template, data) {
        let result = template;
        // Gérer les boucles {{#each items}}...{{/each}} en premier
        result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_match, key, content) => {
            const items = data[key] || [];
            return items.map((item, index) => {
                let itemContent = content;
                // Remplacer les variables dans l'item
                itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, (_m, k) => {
                    if (k === '@index')
                        return String(index + 1);
                    if (k === '@first')
                        return index === 0 ? 'true' : '';
                    if (k === '@last')
                        return index === items.length - 1 ? 'true' : '';
                    return item[k] !== undefined ? String(item[k]) : '';
                });
                // Variables parent avec ../
                itemContent = itemContent.replace(/\{\{\.\.\/(\w+)\}\}/g, (_m, k) => {
                    return data[k] !== undefined ? String(data[k]) : '';
                });
                return itemContent;
            }).join('');
        });
        // Gérer les conditionnelles {{#if variable}}...{{/if}}
        result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, key, content) => {
            return data[key] ? content : '';
        });
        // Remplacer les variables simples {{variable}}
        result = result.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
            return data[key] !== undefined ? String(data[key]) : '';
        });
        return result;
    }
}
const templateEngine = new SimpleTemplateEngine();
// Fonctions utilitaires pour formatage
const formatCurrency = (amount, currency = 'CDF') => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};
const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
class TemplateService {
    templatesPath;
    constructor() {
        // En production, utiliser le chemin source car les templates ne sont pas copiés dans dist
        // En développement, __dirname pointe vers dist, mais on veut toujours utiliser src
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            // En production, utiliser le chemin absolu vers src
            this.templatesPath = path_1.default.join(process.cwd(), 'src/templates/invoices');
        }
        else {
            // En développement, essayer dist d'abord, puis src
            const distPath = path_1.default.join(__dirname, '../templates/invoices');
            const srcPath = path_1.default.join(process.cwd(), 'src/templates/invoices');
            if (fs_1.default.existsSync(distPath)) {
                this.templatesPath = distPath;
            }
            else {
                this.templatesPath = srcPath;
            }
        }
        // Vérifier que le répertoire existe
        if (!fs_1.default.existsSync(this.templatesPath)) {
            logger_1.default.error('Templates directory not found', {
                templatesPath: this.templatesPath,
                cwd: process.cwd(),
                __dirname
            });
            throw new Error(`Templates directory not found: ${this.templatesPath}`);
        }
        logger_1.default.info('Template service initialized', { templatesPath: this.templatesPath });
    }
    // Obtenir la liste des templates disponibles
    getAvailableTemplates() {
        try {
            const files = fs_1.default.readdirSync(this.templatesPath);
            return files
                .filter((file) => file.endsWith('.html') && file.startsWith('template-'))
                .map((file) => file.replace('.html', ''))
                .sort();
        }
        catch (error) {
            logger_1.default.error('Error reading templates directory', { error });
            return [];
        }
    }
    // Charger un template
    loadTemplate(templateId) {
        const templateFile = path_1.default.join(this.templatesPath, `${templateId}.html`);
        if (!fs_1.default.existsSync(templateFile)) {
            // Fallback sur template-standard si template non trouvé
            logger_1.default.warn(`Template ${templateId} not found, using template-standard`, {
                templateId,
            });
            const fallbackFile = path_1.default.join(this.templatesPath, 'template-standard.html');
            if (fs_1.default.existsSync(fallbackFile)) {
                return fs_1.default.readFileSync(fallbackFile, 'utf8');
            }
            throw new Error(`Template ${templateId} not found and fallback unavailable`);
        }
        return fs_1.default.readFileSync(templateFile, 'utf8');
    }
    // Compiler un template avec des données
    compileTemplate(templateId, data) {
        try {
            const templateSource = this.loadTemplate(templateId);
            // Préparer les données avec formatage
            const formattedData = {
                ...data,
                // Formater les montants
                subtotalHTFormatted: formatCurrency(data.subtotalHT, data.currency),
                transportFeesFormatted: data.transportFees ? formatCurrency(data.transportFees, data.currency) : '',
                platformFeesFormatted: data.platformFees ? formatCurrency(data.platformFees, data.currency) : '',
                totalTVAFormatted: formatCurrency(data.totalTVA, data.currency),
                totalTTCFormatted: formatCurrency(data.totalTTC, data.currency),
                paidAmountFormatted: data.paidAmount ? formatCurrency(data.paidAmount, data.currency) : '',
                remainingBalanceFormatted: data.remainingBalance ? formatCurrency(data.remainingBalance, data.currency) : '',
                invoiceDateFormatted: formatDate(data.invoiceDate),
                dueDateFormatted: data.dueDate ? formatDate(data.dueDate) : '',
                // Formater les items
                items: data.items.map(item => ({
                    ...item,
                    unitPriceFormatted: formatCurrency(item.unitPrice, data.currency),
                    totalFormatted: formatCurrency(item.total, data.currency),
                })),
            };
            return templateEngine.compile(templateSource, formattedData);
        }
        catch (error) {
            logger_1.default.error('Error compiling template', { templateId, error });
            throw error;
        }
    }
    // Préparer les données pour le template depuis une facture Prisma
    async prepareInvoiceData(invoice, company, customer, qrCode) {
        try {
            const invoiceLines = invoice.lines || invoice.invoice_lines || invoice.invoiceLines;
            // Vérifier que invoice.lines existe
            if (!invoiceLines || !Array.isArray(invoiceLines)) {
                logger_1.default.error('Invoice lines missing or invalid', {
                    invoiceId: invoice.id,
                    hasLines: !!invoiceLines,
                    linesType: typeof invoiceLines
                });
                throw new Error('Invoice lines are missing or invalid');
            }
            const items = invoiceLines.map((line) => ({
                name: line.description || line.name || 'Article sans nom',
                description: line.description || undefined,
                quantity: Number(line.quantity || 0),
                unitPrice: Number(line.unitPrice ?? line.unit_price ?? 0),
                taxRate: line.taxRate ? Number(line.taxRate) : Number(line.tax_rate ?? 0),
                total: Number(line.total ?? line.total_amount ?? 0),
            }));
            // Déterminer le statut de paiement
            let paymentStatus = 'unpaid';
            // Calculer le solde restant si non disponible
            const totalAmount = Number(invoice.totalAmount ?? invoice.total_amount ?? 0);
            const paidAmount = Number(invoice.paidAmount ?? invoice.paid_amount ?? 0);
            const remainingBalance = totalAmount - paidAmount;
            if (remainingBalance <= 0) {
                paymentStatus = 'paid';
            }
            else if (remainingBalance < totalAmount) {
                paymentStatus = 'partial';
            }
            logger_1.default.debug('Payment status calculated', {
                totalAmount,
                paidAmount,
                remainingBalance,
                paymentStatus
            });
            // Nom du client
            const clientName = customer.type === 'particulier'
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : customer.businessName || '';
            // Obtenir le logo du branding si l'entreprise n'a pas de logo
            let companyLogo = company.logoUrl;
            if (!companyLogo) {
                try {
                    companyLogo = await (0, branding_1.getPdfLogoUrl)() || undefined;
                }
                catch (error) {
                    logger_1.default.warn('Error getting PDF logo URL', { error });
                    // Continuer sans logo si erreur
                    companyLogo = undefined;
                }
            }
            // Obtenir le logo PDF de la plateforme
            let platformPdfLogo;
            try {
                platformPdfLogo = await (0, branding_1.getPdfLogoUrl)() || undefined;
            }
            catch (error) {
                logger_1.default.warn('Error getting platform PDF logo URL', { error });
                platformPdfLogo = undefined;
            }
            const invoiceNumber = invoice.invoiceNumber ?? invoice.invoice_number;
            const invoiceDate = invoice.invoiceDate ?? invoice.invoice_date;
            const dueDate = invoice.dueDate ?? invoice.due_date;
            const reference = invoice.reference ?? invoice.reference_number ?? undefined;
            const currency = invoice.currency || 'CDF';
            if (!invoiceNumber || !invoiceDate) {
                logger_1.default.error('Invoice number or date missing for PDF', {
                    invoiceId: invoice.id,
                    invoiceNumber,
                    invoiceDate,
                });
                throw new Error('Invoice number or date missing');
            }
            const templateData = {
                // Entreprise
                companyName: company.name,
                companyLogo: companyLogo,
                platformPdfLogo: platformPdfLogo,
                companyAddress: company.address || undefined,
                companyCity: company.city || undefined,
                companyCountry: company.country || undefined,
                companyPhone: company.phone || undefined,
                companyEmail: company.email || undefined,
                companyNIF: company.nif || undefined,
                companyRCCM: company.rccm || undefined,
                companyDEF: company.def || undefined,
                // Facture
                invoiceNumber: invoiceNumber,
                invoiceDate: invoiceDate?.toISOString().split('T')[0],
                dueDate: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
                reference: reference,
                currency: currency,
                paymentStatus,
                isRDCNormalized: invoice.isRdcNormalized ?? invoice.is_rdc_normalized ?? false,
                // Client
                clientName,
                clientType: customer.type,
                clientBusinessName: customer.type === 'entreprise' ? customer.businessName : undefined,
                clientAddress: customer.address || undefined,
                clientCity: customer.city || undefined,
                clientCountry: customer.country || undefined,
                clientPhone: customer.phone || customer.mobile || undefined,
                clientEmail: customer.email || undefined,
                clientNIF: customer.nif || undefined,
                clientRCCM: customer.rccm || undefined,
                shippingAddress: invoice.shippingAddress || invoice.shipping_address || undefined,
                // Articles
                items,
                // Totaux
                subtotalHT: Number(invoice.subtotal ?? invoice.subtotal_ht ?? invoice.subtotalHt ?? 0),
                hasTransportFees: (invoice.transportFees ?? invoice.transport_fees) && Number(invoice.transportFees ?? invoice.transport_fees) > 0,
                transportFees: (invoice.transportFees ?? invoice.transport_fees) ? Number(invoice.transportFees ?? invoice.transport_fees) : undefined,
                hasPlatformFees: (invoice.platformFees ?? invoice.platform_fees) && Number(invoice.platformFees ?? invoice.platform_fees) > 0,
                platformFees: (invoice.platformFees ?? invoice.platform_fees) ? Number(invoice.platformFees ?? invoice.platform_fees) : undefined,
                totalTVA: Number(invoice.taxAmount ?? invoice.tax_amount ?? invoice.totalTax ?? 0),
                totalTTC: Number(invoice.totalAmount ?? invoice.total_amount ?? 0),
                paidAmount: (invoice.paidAmount ?? invoice.paid_amount) ? Number(invoice.paidAmount ?? invoice.paid_amount) : undefined,
                remainingBalance: remainingBalance > 0 ? remainingBalance : undefined,
                // RDC
                qrCode: qrCode || invoice.qrCodeUrl || invoice.qr_code_url || undefined,
                qrCodeData: invoice.qrCodeData || invoice.qr_code_data || undefined,
                // Autres
                notes: invoice.notes || undefined,
                paymentTerms: invoice.paymentTerms || invoice.payment_terms || undefined,
            };
            logger_1.default.debug('Template data prepared successfully', {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                itemsCount: items.length,
                hasCompanyLogo: !!companyLogo,
                hasPlatformLogo: !!platformPdfLogo
            });
            return templateData;
        }
        catch (error) {
            logger_1.default.error('Error in prepareInvoiceData', {
                error: error.message,
                stack: error.stack,
                invoiceId: invoice?.id,
                hasInvoice: !!invoice,
                hasCompany: !!company,
                hasCustomer: !!customer
            });
            throw error;
        }
    }
    // Préparer les données pour le template depuis un devis Prisma
    async prepareQuotationData(quotation, company, customer) {
        try {
            const quotationLines = quotation.quotation_lines || quotation.lines || quotation.quotationLines;
            if (!quotationLines || !Array.isArray(quotationLines)) {
                logger_1.default.error('Quotation lines missing or invalid', {
                    quotationId: quotation.id,
                    hasLines: !!quotationLines,
                    linesType: typeof quotationLines,
                });
                throw new Error('Quotation lines are missing or invalid');
            }
            const items = quotationLines.map((line) => ({
                name: line.description || line.name || 'Article sans nom',
                description: line.description || undefined,
                quantity: Number(line.quantity || 0),
                unitPrice: Number(line.unit_price ?? line.unitPrice ?? 0),
                taxRate: Number(line.tax_rate ?? line.taxRate ?? 0),
                total: Number(line.total ?? line.total_amount ?? 0),
            }));
            const clientName = customer.type === 'particulier'
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : customer.businessName || '';
            let companyLogo = company.logoUrl;
            if (!companyLogo) {
                try {
                    companyLogo = await (0, branding_1.getPdfLogoUrl)() || undefined;
                }
                catch (error) {
                    logger_1.default.warn('Error getting PDF logo URL', { error });
                    companyLogo = undefined;
                }
            }
            let platformPdfLogo;
            try {
                platformPdfLogo = await (0, branding_1.getPdfLogoUrl)() || undefined;
            }
            catch (error) {
                logger_1.default.warn('Error getting platform PDF logo URL', { error });
                platformPdfLogo = undefined;
            }
            const quotationNumber = quotation.quotationNumber ?? quotation.quotation_number;
            const quotationDate = quotation.quotationDate ?? quotation.quotation_date;
            if (!quotationNumber || !quotationDate) {
                logger_1.default.error('Quotation number or date missing for PDF', {
                    quotationId: quotation.id,
                    quotationNumber,
                    quotationDate,
                });
                throw new Error('Quotation number or date missing');
            }
            const templateData = {
                // Entreprise
                companyName: company.name,
                companyLogo,
                platformPdfLogo,
                companyAddress: company.address || undefined,
                companyCity: company.city || undefined,
                companyCountry: company.country || undefined,
                companyPhone: company.phone || undefined,
                companyEmail: company.email || undefined,
                companyNIF: company.nif || undefined,
                companyRCCM: company.rccm || undefined,
                companyDEF: company.def || undefined,
                // Devis (mappé sur champs facture)
                invoiceNumber: quotationNumber,
                invoiceDate: quotationDate?.toISOString().split('T')[0],
                dueDate: quotation.expiration_date
                    ? quotation.expiration_date.toISOString().split('T')[0]
                    : undefined,
                reference: quotation.reference || undefined,
                currency: quotation.currency || 'CDF',
                paymentStatus: 'unpaid',
                isRDCNormalized: false,
                // Client
                clientName,
                clientType: customer.type,
                clientBusinessName: customer.type === 'entreprise' ? customer.businessName : undefined,
                clientAddress: customer.address || undefined,
                clientCity: customer.city || undefined,
                clientCountry: customer.country || undefined,
                clientPhone: customer.phone || customer.mobile || undefined,
                clientEmail: customer.email || undefined,
                clientNIF: customer.nif || undefined,
                clientRCCM: customer.rccm || undefined,
                shippingAddress: quotation.shipping_address || undefined,
                // Articles
                items,
                // Totaux
                subtotalHT: Number(quotation.subtotal || 0),
                hasTransportFees: quotation.transport_fees && Number(quotation.transport_fees) > 0,
                transportFees: quotation.transport_fees ? Number(quotation.transport_fees) : undefined,
                hasPlatformFees: quotation.platform_fees && Number(quotation.platform_fees) > 0,
                platformFees: quotation.platform_fees ? Number(quotation.platform_fees) : undefined,
                totalTVA: Number(quotation.tax_amount || 0),
                totalTTC: Number(quotation.total_amount || 0),
                paidAmount: undefined,
                remainingBalance: undefined,
                // RDC
                qrCode: undefined,
                qrCodeData: undefined,
                // Autres
                notes: quotation.notes || undefined,
                paymentTerms: quotation.payment_terms || undefined,
            };
            logger_1.default.debug('Quotation template data prepared successfully', {
                quotationId: quotation.id,
                quotationNumber,
                itemsCount: items.length,
                hasCompanyLogo: !!companyLogo,
                hasPlatformLogo: !!platformPdfLogo,
            });
            return templateData;
        }
        catch (error) {
            logger_1.default.error('Error in prepareQuotationData', {
                error: error.message,
                stack: error.stack,
                quotationId: quotation?.id,
                hasQuotation: !!quotation,
                hasCompany: !!company,
                hasCustomer: !!customer,
            });
            throw error;
        }
    }
    // Charger le template de fiche de paie
    loadPayslipTemplate() {
        const templatePath = path_1.default.join(process.cwd(), 'src', 'templates', 'payroll', 'payslip.html');
        try {
            return fs_1.default.readFileSync(templatePath, 'utf-8');
        }
        catch (error) {
            logger_1.default.error('Error loading payslip template', { templatePath, error });
            throw new Error('Payslip template not found');
        }
    }
    // Préparer les données pour le template de fiche de paie
    async preparePayslipData(payroll, company, employee) {
        try {
            // Récupérer le logo de l'entreprise
            let companyLogo;
            if (company.logoUrl) {
                const baseUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
                companyLogo = company.logoUrl.startsWith('http') ? company.logoUrl : `${baseUrl}${company.logoUrl.startsWith('/') ? company.logoUrl : '/' + company.logoUrl}`;
            }
            const platformPdfLogo = await (0, branding_1.getPdfLogoUrl)() || undefined;
            // Formater les dates
            const periodStartValue = payroll.periodStart ?? payroll.period_start;
            const periodEndValue = payroll.periodEnd ?? payroll.period_end;
            const payDateValue = payroll.payDate ?? payroll.pay_date;
            const periodStart = formatDate(periodStartValue);
            const periodEnd = formatDate(periodEndValue);
            const payDate = payDateValue ? formatDate(payDateValue) : '';
            const generatedAt = new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            // Préparer les items avec formatage
            const typeLabels = {
                base_salary: 'Salaire de base',
                overtime: 'Heures supplémentaires',
                bonus: 'Prime',
                allowance: 'Indemnité',
                tax: 'Impôt',
                social_security: 'Sécurité sociale',
                other: 'Autre',
            };
            const payrollItems = payroll.items || payroll.payroll_items || [];
            const items = payrollItems.map((item) => ({
                type: item.type,
                typeLabel: typeLabels[item.type] || item.type,
                description: item.description,
                amount: Number(item.amount),
                amountFormatted: formatCurrency(Number(item.amount), payroll.currency),
                isDeduction: item.isDeduction,
            }));
            // Formater les totaux
            const grossSalary = Number(payroll.grossSalary ?? payroll.gross_salary);
            const totalDeductions = Number(payroll.totalDeductions ?? payroll.total_deductions);
            const netSalary = Number(payroll.netSalary ?? payroll.net_salary);
            return {
                // Entreprise
                companyName: company.name,
                companyLogo,
                platformPdfLogo,
                companyAddress: company.address,
                companyCity: company.city,
                companyPostalCode: company.postalCode,
                companyCountry: company.country,
                companyPhone: company.phone,
                companyEmail: company.email,
                companyNIF: company.nif,
                companyRCCM: company.rccm,
                // Employé
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeNumber: employee.employeeNumber,
                employeePosition: employee.position,
                employeeDepartment: employee.department,
                // Période
                periodStart,
                periodEnd,
                payDate,
                status: payroll.status === 'paid' ? 'Payé' : payroll.status === 'approved' ? 'Approuvé' : 'Brouillon',
                // Items
                items,
                // Totaux
                grossSalary,
                grossSalaryFormatted: formatCurrency(grossSalary, payroll.currency),
                totalDeductions,
                totalDeductionsFormatted: formatCurrency(totalDeductions, payroll.currency),
                netSalary,
                netSalaryFormatted: formatCurrency(netSalary, payroll.currency),
                currency: payroll.currency || 'CDF',
                // Notes
                notes: payroll.notes,
                // Métadonnées
                generatedAt,
            };
        }
        catch (error) {
            logger_1.default.error('Error in preparePayslipData', {
                error: error.message,
                stack: error.stack,
                payrollId: payroll?.id,
                hasPayroll: !!payroll,
                hasCompany: !!company,
                hasEmployee: !!employee,
            });
            throw error;
        }
    }
    // Compiler le template de fiche de paie
    compilePayslipTemplate(data) {
        try {
            const templateSource = this.loadPayslipTemplate();
            return templateEngine.compile(templateSource, data);
        }
        catch (error) {
            logger_1.default.error('Error compiling payslip template', { error });
            throw error;
        }
    }
}
exports.TemplateService = TemplateService;
exports.default = new TemplateService();
//# sourceMappingURL=template.service.js.map