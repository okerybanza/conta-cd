import prisma from '../../config/database';
import { CustomError } from '../../middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';
import { QuotaService } from '../quota.service';
import invoiceHelperService, { CreateInvoiceData, InvoiceFilters, UpdateInvoiceData } from './invoiceHelper.service';

// NOTE: Interfaces might need to move to a shared types file if they expand
export { CreateInvoiceData, InvoiceFilters, UpdateInvoiceData };

export class InvoiceCoreService {
    /**
     * Obtenir l'ID réel à partir d'un identifiant (UUID ou numéro de facture)
     */
    async getInvoiceId(companyId: string, identifier: string): Promise<string> {
        // Si c'est déjà un UUID, on le retourne
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(identifier)) {
            return identifier;
        }

        // Sinon, on cherche par numéro de facture
        const invoice = await prisma.invoices.findFirst({
            where: {
                invoice_number: identifier,
                company_id: companyId,
                deleted_at: null,
            },
            select: { id: true },
        });

        if (!invoice) {
            throw new CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }

        return invoice.id;
    }

    /**
     * Obtenir une facture par ID
     */
    async getById(companyId: string, invoiceId: string) {
        const realId = await this.getInvoiceId(companyId, invoiceId);

        const invoice = await prisma.invoices.findFirst({
            where: {
                id: realId,
                company_id: companyId,
                deleted_at: null,
            },
            include: {
                customers: true,
                invoice_lines: {
                    include: {
                        products: true,
                    },
                },
                users: { // Changed from 'created_by_user' to 'users'
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });

        if (!invoice) {
            throw new CustomError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
        }

        return invoice;
    }

    /**
     * Lister les factures
     */
    async list(companyId: string, filters: InvoiceFilters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {
            company_id: companyId,
            deleted_at: null,
        };

        if (filters.customerId) {
            where.customer_id = filters.customerId;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.search) {
            where.OR = [
                { invoice_number: { contains: filters.search, mode: 'insensitive' } },
                { reference: { contains: filters.search, mode: 'insensitive' } },
                { customers: { first_name: { contains: filters.search, mode: 'insensitive' } } },
                { customers: { last_name: { contains: filters.search, mode: 'insensitive' } } },
                { customers: { business_name: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }

        if (filters.startDate || filters.endDate) {
            where.invoice_date = {};
            if (filters.startDate) {
                where.invoice_date.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.invoice_date.lte = new Date(filters.endDate);
            }
        }

        const [invoices, total] = await Promise.all([
            prisma.invoices.findMany({
                where,
                include: {
                    customers: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            business_name: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            payments: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            prisma.invoices.count({ where }),
        ]);

        return {
            data: invoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export default new InvoiceCoreService();
