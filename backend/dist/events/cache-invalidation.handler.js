"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const event_bus_1 = require("./event-bus");
const cache_service_1 = __importDefault(require("../services/cache.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * SPRINT 3 - TASK 3.2 (UX-015): Event-Based Cache Invalidation
 *
 * This handler listens to domain events and automatically invalidates
 * related caches to ensure data freshness without manual intervention.
 */
// ============================================================================
// INVOICE EVENTS
// ============================================================================
event_bus_1.eventBus.on('InvoiceCreated', async (event) => {
    const { companyId, customerId } = event;
    // Invalidate dashboard stats (revenue, invoices count, etc.)
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    // Invalidate customer list (invoice counts changed)
    await cache_service_1.default.deletePattern(`customers:list:${companyId}:*`);
    // Invalidate specific customer detail
    if (customerId) {
        await cache_service_1.default.delete(`customers:detail:${customerId}`);
    }
    logger_1.default.debug('Cache invalidated for invoice.created', { companyId, customerId });
});
event_bus_1.eventBus.on('InvoiceUpdated', async (event) => {
    const { companyId, customerId, invoiceId } = event;
    // Invalidate dashboard stats
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    // Invalidate customer caches
    await cache_service_1.default.deletePattern(`customers:list:${companyId}:*`);
    if (customerId) {
        await cache_service_1.default.delete(`customers:detail:${customerId}`);
    }
    logger_1.default.debug('Cache invalidated for invoice.updated', { companyId, invoiceId });
});
event_bus_1.eventBus.on('InvoiceDeleted', async (event) => {
    const { companyId, customerId } = event;
    // Invalidate dashboard stats
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    // Invalidate customer caches
    await cache_service_1.default.deletePattern(`customers:list:${companyId}:*`);
    if (customerId) {
        await cache_service_1.default.delete(`customers:detail:${customerId}`);
    }
    logger_1.default.debug('Cache invalidated for invoice.deleted', { companyId });
});
event_bus_1.eventBus.on('InvoiceStatusChanged', async (event) => {
    const { companyId, customerId, newStatus } = event;
    // Invalidate dashboard (status affects metrics)
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    // Invalidate customer caches (outstanding amounts changed)
    await cache_service_1.default.deletePattern(`customers:list:${companyId}:*`);
    if (customerId) {
        await cache_service_1.default.delete(`customers:detail:${customerId}`);
    }
    logger_1.default.debug('Cache invalidated for invoice.status.changed', { companyId, newStatus });
});
// ============================================================================
// PAYMENT EVENTS
// ============================================================================
event_bus_1.eventBus.on('PaymentReceived', async (event) => {
    const { companyId, customerId, invoiceId } = event;
    // Invalidate dashboard (revenue, payments count)
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    // Invalidate customer caches (paid amounts changed)
    await cache_service_1.default.deletePattern(`customers:list:${companyId}:*`);
    if (customerId) {
        await cache_service_1.default.delete(`customers:detail:${customerId}`);
    }
    logger_1.default.debug('Cache invalidated for payment.received', { companyId, invoiceId });
});
event_bus_1.eventBus.on('PaymentCreated', async (event) => {
    const { companyId } = event;
    // Invalidate dashboard
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    logger_1.default.debug('Cache invalidated for payment.created', { companyId });
});
// ============================================================================
// CUSTOMER EVENTS
// ============================================================================
event_bus_1.eventBus.on('CustomerCreated', async (event) => {
    const companyId = event.metadata?.companyId ?? event.companyId;
    if (companyId) {
        await cache_service_1.default.deletePattern(`customers:list:${companyId}:*`);
        await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
        logger_1.default.debug('Cache invalidated for customer.created', { companyId });
    }
});
event_bus_1.eventBus.on('CustomerUpdated', async (event) => {
    const companyId = event.metadata?.companyId ?? event.companyId;
    const customerId = event.customerId;
    if (companyId) {
        await cache_service_1.default.deletePattern(`customers:list:${companyId}:*`);
        if (customerId)
            await cache_service_1.default.delete(`customers:detail:${customerId}`);
        logger_1.default.debug('Cache invalidated for customer.updated', { companyId, customerId });
    }
});
event_bus_1.eventBus.on('CustomerDeleted', async (event) => {
    const companyId = event.metadata?.companyId ?? event.companyId;
    const customerId = event.customerId;
    if (companyId) {
        await cache_service_1.default.deletePattern(`customers:list:${companyId}:*`);
        if (customerId)
            await cache_service_1.default.delete(`customers:detail:${customerId}`);
        await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
        logger_1.default.debug('Cache invalidated for customer.deleted', { companyId, customerId });
    }
});
// ============================================================================
// EXPENSE EVENTS
// ============================================================================
event_bus_1.eventBus.on('ExpenseCreated', async (event) => {
    const { companyId } = event;
    // Invalidate dashboard (expenses, profit)
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    logger_1.default.debug('Cache invalidated for expense.created', { companyId });
});
event_bus_1.eventBus.on('ExpenseUpdated', async (event) => {
    const { companyId } = event;
    // Invalidate dashboard
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    logger_1.default.debug('Cache invalidated for expense.updated', { companyId });
});
event_bus_1.eventBus.on('ExpenseDeleted', async (event) => {
    const { companyId } = event;
    // Invalidate dashboard
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    logger_1.default.debug('Cache invalidated for expense.deleted', { companyId });
});
// ============================================================================
// PRODUCT EVENTS
// ============================================================================
event_bus_1.eventBus.on('ProductCreated', async (event) => {
    const companyId = event.metadata?.companyId ?? event.companyId;
    if (companyId) {
        await cache_service_1.default.deletePattern(`products:list:${companyId}:*`);
        logger_1.default.debug('Cache invalidated for product.created', { companyId });
    }
});
event_bus_1.eventBus.on('ProductUpdated', async (event) => {
    const companyId = event.metadata?.companyId ?? event.companyId;
    const productId = event.productId;
    if (companyId) {
        await cache_service_1.default.deletePattern(`products:list:${companyId}:*`);
        if (productId)
            await cache_service_1.default.delete(`products:detail:${productId}`);
        logger_1.default.debug('Cache invalidated for product.updated', { companyId, productId });
    }
});
event_bus_1.eventBus.on('ProductDeleted', async (event) => {
    const companyId = event.metadata?.companyId ?? event.companyId;
    const productId = event.productId;
    if (companyId) {
        await cache_service_1.default.deletePattern(`products:list:${companyId}:*`);
        if (productId)
            await cache_service_1.default.delete(`products:detail:${productId}`);
        logger_1.default.debug('Cache invalidated for product.deleted', { companyId, productId });
    }
});
// ============================================================================
// STOCK EVENTS
// ============================================================================
event_bus_1.eventBus.on('StockMovementValidated', async (event) => {
    const { companyId } = event;
    // Invalidate dashboard (stock value might affect assets/stats if integrated later)
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    // Invalidate product list (stock quantities changed)
    await cache_service_1.default.deletePattern(`products:list:${companyId}:*`);
    logger_1.default.debug('Cache invalidated for stock.movement.validated', { companyId });
});
event_bus_1.eventBus.on('StockMovementReversed', async (event) => {
    const { companyId } = event;
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    await cache_service_1.default.deletePattern(`products:list:${companyId}:*`);
    logger_1.default.debug('Cache invalidated for stock.movement.reversed', { companyId });
});
event_bus_1.eventBus.on('AccountCreated', async (event) => {
    const { companyId } = event;
    // Invalidate account list cache
    await cache_service_1.default.deletePattern(`accounts:list:${companyId}:*`);
    logger_1.default.debug('Cache invalidated for account.created', { companyId });
});
event_bus_1.eventBus.on('AccountUpdated', async (event) => {
    const { companyId, accountId } = event;
    // Invalidate account caches
    await cache_service_1.default.deletePattern(`accounts:list:${companyId}:*`);
    await cache_service_1.default.delete(`accounts:detail:${accountId}`);
    logger_1.default.debug('Cache invalidated for account.updated', { companyId, accountId });
});
event_bus_1.eventBus.on('AccountDeleted', async (event) => {
    const { companyId, accountId } = event;
    // Invalidate account caches
    await cache_service_1.default.deletePattern(`accounts:list:${companyId}:*`);
    await cache_service_1.default.delete(`accounts:detail:${accountId}`);
    logger_1.default.debug('Cache invalidated for account.deleted', { companyId, accountId });
});
// ============================================================================
// EXCHANGE RATE EVENTS
// ============================================================================
event_bus_1.eventBus.on('ExchangeRateUpdated', async (event) => {
    const { fromCurrency, toCurrency, date } = event;
    // Invalidate specific exchange rate cache
    const dateStr = date ? new Date(date).toISOString().split('T')[0] : '*';
    await cache_service_1.default.deletePattern(`exchange_rate:${fromCurrency}:${toCurrency}:${dateStr}`);
    // Also invalidate inverse rate
    await cache_service_1.default.deletePattern(`exchange_rate:${toCurrency}:${fromCurrency}:${dateStr}`);
    logger_1.default.debug('Cache invalidated for exchange_rate.updated', { fromCurrency, toCurrency });
});
// ============================================================================
// COMPANY SETTINGS EVENTS
// ============================================================================
event_bus_1.eventBus.on('CompanySettingsUpdated', async (event) => {
    const { companyId } = event;
    // Invalidate company settings cache (when implemented)
    await cache_service_1.default.delete(`company:settings:${companyId}`);
    // Invalidate dashboard (settings might affect calculations)
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    logger_1.default.debug('Cache invalidated for company.settings.updated', { companyId });
});
// ============================================================================
// JOURNAL ENTRY EVENTS
// ============================================================================
event_bus_1.eventBus.on('JournalEntryCreated', async (event) => {
    const { companyId } = event;
    // Invalidate dashboard (might affect accounting metrics)
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    logger_1.default.debug('Cache invalidated for journal_entry.created', { companyId });
});
event_bus_1.eventBus.on('JournalEntryPosted', async (event) => {
    const { companyId } = event;
    // Invalidate dashboard
    await cache_service_1.default.deletePattern(`dashboard:stats:${companyId}*`);
    // Invalidate account balances cache (when implemented)
    await cache_service_1.default.deletePattern(`accounts:balances:${companyId}:*`);
    logger_1.default.debug('Cache invalidated for journal_entry.posted', { companyId });
});
logger_1.default.info('✅ Event-based cache invalidation handlers registered');
exports.default = event_bus_1.eventBus;
//# sourceMappingURL=cache-invalidation.handler.js.map