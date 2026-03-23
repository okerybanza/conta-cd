import { eventBus } from './event-bus';
import cacheService from '../services/cache.service';
import logger from '../utils/logger';

/**
 * SPRINT 3 - TASK 3.2 (UX-015): Event-Based Cache Invalidation
 * 
 * This handler listens to domain events and automatically invalidates
 * related caches to ensure data freshness without manual intervention.
 */

// ============================================================================
// INVOICE EVENTS
// ============================================================================

eventBus.on('InvoiceCreated', async (event: any) => {
    const { companyId, customerId } = event;

    // Invalidate dashboard stats (revenue, invoices count, etc.)
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    // Invalidate customer list (invoice counts changed)
    await cacheService.deletePattern(`customers:list:${companyId}:*`);

    // Invalidate specific customer detail
    if (customerId) {
        await cacheService.delete(`customers:detail:${customerId}`);
    }

    logger.debug('Cache invalidated for invoice.created', { companyId, customerId });
});

eventBus.on('InvoiceUpdated', async (event: any) => {
    const { companyId, customerId, invoiceId } = event;

    // Invalidate dashboard stats
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    // Invalidate customer caches
    await cacheService.deletePattern(`customers:list:${companyId}:*`);
    if (customerId) {
        await cacheService.delete(`customers:detail:${customerId}`);
    }

    logger.debug('Cache invalidated for invoice.updated', { companyId, invoiceId });
});

eventBus.on('InvoiceDeleted', async (event: any) => {
    const { companyId, customerId } = event;

    // Invalidate dashboard stats
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    // Invalidate customer caches
    await cacheService.deletePattern(`customers:list:${companyId}:*`);
    if (customerId) {
        await cacheService.delete(`customers:detail:${customerId}`);
    }

    logger.debug('Cache invalidated for invoice.deleted', { companyId });
});

eventBus.on('InvoiceStatusChanged', async (event: any) => {
    const { companyId, customerId, newStatus } = event;

    // Invalidate dashboard (status affects metrics)
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    // Invalidate customer caches (outstanding amounts changed)
    await cacheService.deletePattern(`customers:list:${companyId}:*`);
    if (customerId) {
        await cacheService.delete(`customers:detail:${customerId}`);
    }

    logger.debug('Cache invalidated for invoice.status.changed', { companyId, newStatus });
});

// ============================================================================
// PAYMENT EVENTS
// ============================================================================

eventBus.on('PaymentReceived', async (event: any) => {
    const { companyId, customerId, invoiceId } = event;

    // Invalidate dashboard (revenue, payments count)
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    // Invalidate customer caches (paid amounts changed)
    await cacheService.deletePattern(`customers:list:${companyId}:*`);
    if (customerId) {
        await cacheService.delete(`customers:detail:${customerId}`);
    }

    logger.debug('Cache invalidated for payment.received', { companyId, invoiceId });
});

eventBus.on('PaymentCreated', async (event: any) => {
    const { companyId } = event;

    // Invalidate dashboard
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    logger.debug('Cache invalidated for payment.created', { companyId });
});

// ============================================================================
// CUSTOMER EVENTS
// ============================================================================

eventBus.on('CustomerCreated', async (event: any) => {
    const { companyId } = event;

    // Invalidate customer list
    await cacheService.deletePattern(`customers:list:${companyId}:*`);

    // Invalidate dashboard (customer count)
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    logger.debug('Cache invalidated for customer.created', { companyId });
});

eventBus.on('CustomerUpdated', async (event: any) => {
    const { companyId, customerId } = event;

    // Invalidate customer caches
    await cacheService.deletePattern(`customers:list:${companyId}:*`);
    await cacheService.delete(`customers:detail:${customerId}`);

    logger.debug('Cache invalidated for customer.updated', { companyId, customerId });
});

eventBus.on('CustomerDeleted', async (event: any) => {
    const { companyId, customerId } = event;

    // Invalidate customer caches
    await cacheService.deletePattern(`customers:list:${companyId}:*`);
    await cacheService.delete(`customers:detail:${customerId}`);

    // Invalidate dashboard
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    logger.debug('Cache invalidated for customer.deleted', { companyId, customerId });
});

// ============================================================================
// EXPENSE EVENTS
// ============================================================================

eventBus.on('ExpenseCreated', async (event: any) => {
    const { companyId } = event;

    // Invalidate dashboard (expenses, profit)
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    logger.debug('Cache invalidated for expense.created', { companyId });
});

eventBus.on('ExpenseUpdated', async (event: any) => {
    const { companyId } = event;

    // Invalidate dashboard
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    logger.debug('Cache invalidated for expense.updated', { companyId });
});

eventBus.on('ExpenseDeleted', async (event: any) => {
    const { companyId } = event;

    // Invalidate dashboard
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    logger.debug('Cache invalidated for expense.deleted', { companyId });
});

// ============================================================================
// PRODUCT EVENTS
// ============================================================================

eventBus.on('ProductCreated', async (event: any) => {
    const { companyId } = event;

    // Invalidate product list cache (when implemented)
    await cacheService.deletePattern(`products:list:${companyId}:*`);

    logger.debug('Cache invalidated for product.created', { companyId });
});

eventBus.on('ProductUpdated', async (event: any) => {
    const { companyId, productId } = event;

    // Invalidate product caches
    await cacheService.deletePattern(`products:list:${companyId}:*`);
    await cacheService.delete(`products:detail:${productId}`);

    logger.debug('Cache invalidated for product.updated', { companyId, productId });
});

eventBus.on('ProductDeleted', async (event: any) => {
    const { companyId, productId } = event;

    // Invalidate product caches
    await cacheService.deletePattern(`products:list:${companyId}:*`);
    await cacheService.delete(`products:detail:${productId}`);

    logger.debug('Cache invalidated for product.deleted', { companyId, productId });
});

// ============================================================================
// STOCK EVENTS
// ============================================================================

eventBus.on('StockMovementValidated', async (event: any) => {
    const { companyId } = event;

    // Invalidate dashboard (stock value might affect assets/stats if integrated later)
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    // Invalidate product list (stock quantities changed)
    await cacheService.deletePattern(`products:list:${companyId}:*`);

    logger.debug('Cache invalidated for stock.movement.validated', { companyId });
});

eventBus.on('StockMovementReversed', async (event: any) => {
    const { companyId } = event;
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);
    await cacheService.deletePattern(`products:list:${companyId}:*`);
    logger.debug('Cache invalidated for stock.movement.reversed', { companyId });
});

eventBus.on('AccountCreated', async (event: any) => {
    const { companyId } = event;

    // Invalidate account list cache
    await cacheService.deletePattern(`accounts:list:${companyId}:*`);

    logger.debug('Cache invalidated for account.created', { companyId });
});

eventBus.on('AccountUpdated', async (event: any) => {
    const { companyId, accountId } = event;

    // Invalidate account caches
    await cacheService.deletePattern(`accounts:list:${companyId}:*`);
    await cacheService.delete(`accounts:detail:${accountId}`);

    logger.debug('Cache invalidated for account.updated', { companyId, accountId });
});

eventBus.on('AccountDeleted', async (event: any) => {
    const { companyId, accountId } = event;

    // Invalidate account caches
    await cacheService.deletePattern(`accounts:list:${companyId}:*`);
    await cacheService.delete(`accounts:detail:${accountId}`);

    logger.debug('Cache invalidated for account.deleted', { companyId, accountId });
});

// ============================================================================
// EXCHANGE RATE EVENTS
// ============================================================================

eventBus.on('ExchangeRateUpdated', async (event: any) => {
    const { fromCurrency, toCurrency, date } = event;

    // Invalidate specific exchange rate cache
    const dateStr = date ? new Date(date).toISOString().split('T')[0] : '*';
    await cacheService.deletePattern(`exchange_rate:${fromCurrency}:${toCurrency}:${dateStr}`);

    // Also invalidate inverse rate
    await cacheService.deletePattern(`exchange_rate:${toCurrency}:${fromCurrency}:${dateStr}`);

    logger.debug('Cache invalidated for exchange_rate.updated', { fromCurrency, toCurrency });
});

// ============================================================================
// COMPANY SETTINGS EVENTS
// ============================================================================

eventBus.on('CompanySettingsUpdated', async (event: any) => {
    const { companyId } = event;

    // Invalidate company settings cache (when implemented)
    await cacheService.delete(`company:settings:${companyId}`);

    // Invalidate dashboard (settings might affect calculations)
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    logger.debug('Cache invalidated for company.settings.updated', { companyId });
});

// ============================================================================
// JOURNAL ENTRY EVENTS
// ============================================================================

eventBus.on('JournalEntryCreated', async (event: any) => {
    const { companyId } = event;

    // Invalidate dashboard (might affect accounting metrics)
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    logger.debug('Cache invalidated for journal_entry.created', { companyId });
});

eventBus.on('JournalEntryPosted', async (event: any) => {
    const { companyId } = event;

    // Invalidate dashboard
    await cacheService.deletePattern(`dashboard:stats:${companyId}*`);

    // Invalidate account balances cache (when implemented)
    await cacheService.deletePattern(`accounts:balances:${companyId}:*`);

    logger.debug('Cache invalidated for journal_entry.posted', { companyId });
});

logger.info('✅ Event-based cache invalidation handlers registered');

export default eventBus;
