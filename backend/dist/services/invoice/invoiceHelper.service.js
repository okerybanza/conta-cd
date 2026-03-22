"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceHelperService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
class InvoiceHelperService {
    /**
     * Générer le numéro de facture
     */
    async generateInvoiceNumber(companyId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: { invoice_prefix: true, next_invoice_number: true },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }
        const prefix = company.invoice_prefix || 'FAC';
        const nextNumber = company.next_invoice_number || 1;
        const invoiceNumber = `${prefix}-${String(nextNumber).padStart(6, '0')}`;
        // Incrémenter le numéro suivant
        await database_1.default.companies.update({
            where: { id: companyId },
            data: { next_invoice_number: nextNumber + 1 },
        });
        return invoiceNumber;
    }
    /**
     * Calculer les totaux d'une facture
     *
     * Retourne des nombres natifs pour simplifier l'utilisation côté services
     * et éviter les soucis de typage avec Decimal dans les tests.
     */
    calculateTotals(lines, transportFees = 0, platformFees = 0) {
        let subtotalHt = 0;
        let totalTax = 0;
        for (const line of lines) {
            const lineSubtotal = line.quantity * line.unitPrice;
            const lineTax = lineSubtotal * ((line.taxRate || 0) / 100);
            subtotalHt += lineSubtotal;
            totalTax += lineTax;
        }
        const totalTtc = subtotalHt + totalTax + transportFees + platformFees;
        return {
            subtotal: subtotalHt,
            taxAmount: totalTax,
            totalAmount: totalTtc,
        };
    }
}
exports.InvoiceHelperService = InvoiceHelperService;
exports.default = new InvoiceHelperService();
//# sourceMappingURL=invoiceHelper.service.js.map