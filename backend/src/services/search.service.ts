import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';

export interface SearchResult {
  type: 'customer' | 'invoice' | 'product' | 'payment';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export class SearchService {
  /**
   * Recherche globale dans tous les modules
   */
  async globalSearch(companyId: string, query: string, limit: number = 10): Promise<SearchResponse> {
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }

    const searchTerm = query.trim();
    const results: SearchResult[] = [];

    try {
      // Recherche dans les clients
      const customers = await prisma.customers.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          OR: [
            { first_name: { contains: searchTerm, mode: 'insensitive' } },
            { last_name: { contains: searchTerm, mode: 'insensitive' } },
            { business_name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { mobile: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: Math.ceil(limit * 0.4), // 40% pour les clients
        orderBy: { created_at: 'desc' },
      });

      customers.forEach((customer) => {
        const title =
          customer.type === 'particulier'
            ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
            : customer.business_name || '';
        const subtitle = customer.email || customer.phone || customer.mobile || '';
        results.push({
          type: 'customer',
          id: customer.id,
          title,
          subtitle,
          description: customer.type === 'particulier' ? 'Client particulier' : 'Client entreprise',
          url: `/customers/${customer.id}`,
          metadata: {
            type: customer.type,
            email: customer.email,
            phone: customer.phone,
          },
        });
      });

      // Recherche dans les factures
      const invoices = await prisma.invoices.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          OR: [
            { invoice_number: { contains: searchTerm, mode: 'insensitive' } },
            { reference: { contains: searchTerm, mode: 'insensitive' } },
            { customers: { business_name: { contains: searchTerm, mode: 'insensitive' } } },
            { customers: { first_name: { contains: searchTerm, mode: 'insensitive' } } },
            { customers: { last_name: { contains: searchTerm, mode: 'insensitive' } } },
          ],
        },
        include: {
          customers: {
            select: {
              id: true,
              type: true,
              first_name: true,
              last_name: true,
              business_name: true,
            },
          },
        },
        take: Math.ceil(limit * 0.3), // 30% pour les factures
        orderBy: { created_at: 'desc' },
      });

      invoices.forEach((invoice) => {
        const customerName =
          invoice.customers.type === 'particulier'
            ? `${invoice.customers.first_name || ''} ${invoice.customers.last_name || ''}`.trim()
            : invoice.customers.business_name || '';
        results.push({
          type: 'invoice',
          id: invoice.id,
          title: invoice.invoice_number,
          subtitle: customerName,
          description: `Facture ${invoice.status} - ${new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: invoice.currency || 'CDF',
          }).format(Number(invoice.total_amount))}`,
          url: `/invoices/${invoice.id}`,
          metadata: {
            status: invoice.status,
            total: Number(invoice.total_amount),
            currency: invoice.currency,
            date: invoice.invoice_date,
          },
        });
      });

      // Recherche dans les articles
      const products = await prisma.products.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
            { category: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: Math.ceil(limit * 0.2), // 20% pour les articles
        orderBy: { created_at: 'desc' },
      });

      products.forEach((product) => {
        results.push({
          type: 'product',
          id: product.id,
          title: product.name,
          subtitle: product.category || product.type === 'service' ? 'Service' : 'Produit',
          description: product.sku
            ? `SKU: ${product.sku} - ${new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: product.currency || 'CDF',
              }).format(Number(product.price))}`
            : `${new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: product.currency || 'CDF',
              }).format(Number(product.price))}`,
          url: `/products/${product.id}/edit`,
          metadata: {
            type: product.type,
            sku: product.sku,
            price: Number(product.price),
          },
        });
      });

      // Recherche dans les paiements
      const payments = await prisma.payments.findMany({
        where: {
          company_id: companyId,
          deleted_at: null,
          OR: [
            { transaction_reference: { contains: searchTerm, mode: 'insensitive' } },
            { reference: { contains: searchTerm, mode: 'insensitive' } },
            { invoices: { invoice_number: { contains: searchTerm, mode: 'insensitive' } } },
            { invoices: { customers: { business_name: { contains: searchTerm, mode: 'insensitive' } } } },
            { invoices: { customers: { first_name: { contains: searchTerm, mode: 'insensitive' } } } },
            { invoices: { customers: { last_name: { contains: searchTerm, mode: 'insensitive' } } } },
          ],
        },
        include: {
          invoices: {
            include: {
              customers: {
                select: {
                  type: true,
                  first_name: true,
                  last_name: true,
                  business_name: true,
                },
              },
            },
          },
        },
        take: Math.ceil(limit * 0.1), // 10% pour les paiements
        orderBy: { created_at: 'desc' },
      });

      payments.forEach((payment) => {
        const customerName = payment.invoices?.customers
          ? payment.invoices.customers.type === 'particulier'
            ? `${payment.invoices.customers.first_name || ''} ${payment.invoices.customers.last_name || ''}`.trim()
            : payment.invoices.customers.business_name || ''
          : '';
        results.push({
          type: 'payment',
          id: payment.id,
          title: payment.transaction_reference || payment.reference || `Paiement #${payment.id.slice(0, 8)}`,
          subtitle: payment.invoices?.invoice_number || customerName,
          description: `${new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: payment.currency || 'CDF',
          }).format(Number(payment.amount))} - ${payment.payment_method}`,
          url: `/payments/${payment.id}/edit`,
          metadata: {
            amount: Number(payment.amount),
            currency: payment.currency,
            method: payment.payment_method,
            date: payment.payment_date,
          },
        });
      });

      // Trier par pertinence (les plus récents en premier)
      results.sort((a, b) => {
        // Prioriser les correspondances exactes dans le titre
        const aExact = a.title.toLowerCase() === searchTerm.toLowerCase();
        const bExact = b.title.toLowerCase() === searchTerm.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Ensuite par type (clients et factures en priorité)
        const typePriority: Record<string, number> = {
          customer: 1,
          invoice: 2,
          product: 3,
          payment: 4,
        };
        return typePriority[a.type] - typePriority[b.type];
      });

      return {
        results: results.slice(0, limit),
        total: results.length,
      };
    } catch (error) {
      logger.error('Error in global search', { error, companyId, query });
      throw new CustomError('Error performing search', 500, 'SEARCH_ERROR');
    }
  }
}

export default new SearchService();

