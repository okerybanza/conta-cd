import prisma from '../../config/database';
import { CustomError } from '../../middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';

export interface InvoiceLineData {
    productId?: string;
    name?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxRate?: number;
}

export interface CreateInvoiceData {
    customerId?: string;
    invoiceDate?: Date;
    dueDate?: Date;
    reference?: string;
    poNumber?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingCountry?: string;
    transportFees?: number;
    platformFees?: number;
    currency?: string;
    templateId?: string;
    reason?: string;
    notes?: string;
    paymentTerms?: string;
    footerText?: string;
    lines?: InvoiceLineData[];
    recurringInvoiceId?: string;
}

export interface UpdateInvoiceData {
    reason?: string;
    lines?: InvoiceLineData[];
}

export interface InvoiceFilters {
    customerId?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export class InvoiceHelperService {
    /**
     * Générer le numéro de facture
     */
    async generateInvoiceNumber(companyId: string): Promise<string> {
        const company = await prisma.companies.findUnique({
            where: { id: companyId },
            select: { invoice_prefix: true, next_invoice_number: true },
        });

        if (!company) {
            throw new CustomError('Company not found', 404, 'COMPANY_NOT_FOUND');
        }

        const prefix = company.invoice_prefix || 'FAC';
        const nextNumber = company.next_invoice_number || 1;
        const invoiceNumber = `${prefix}-${String(nextNumber).padStart(6, '0')}`;

        // Incrémenter le numéro suivant
        await prisma.companies.update({
            where: { id: companyId },
            data: { next_invoice_number: nextNumber + 1 },
        });

        return invoiceNumber;
    }

    /**
     * Calculer les totaux d'une facture
     */
    calculateTotals(lines: InvoiceLineData[], transportFees = 0, platformFees = 0) {
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
            subtotal: new Decimal(subtotalHt),
            taxAmount: new Decimal(totalTax),
            totalAmount: new Decimal(totalTtc),
        };
    }
}

export default new InvoiceHelperService();
