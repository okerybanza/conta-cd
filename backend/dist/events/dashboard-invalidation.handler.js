"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDashboardInvalidation = void 0;
const event_bus_1 = require("./event-bus");
const cache_service_1 = __importDefault(require("../services/cache.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Handler pour invalider le cache du tableau de bord lors de changements de données
 * SPRINT 5 - Final Mile Optimization
 */
const initializeDashboardInvalidation = () => {
    // Liste des événements déclenchant une invalidation
    const triggers = [
        'invoice.created',
        'invoice.updated',
        'invoice.deleted',
        'payment.created',
        'payment.updated',
        'payment.deleted',
        'expense.created',
        'expense.updated',
        'expense.deleted',
        'customer.created',
        'customer.updated',
        'customer.deleted'
    ];
    triggers.forEach(event => {
        event_bus_1.eventBus.on(event, async (data) => {
            if (data.companyId) {
                const cacheKey = `dashboard:stats:${data.companyId}`;
                await cache_service_1.default.delete(cacheKey);
                logger_1.default.debug(`Dashboard cache invalidated for company ${data.companyId} due to ${event}`);
                // Émettre un événement pour signaler au frontend de rafraîchir via Socket.io si nécessaire
                // (Déjà géré en partie par realtimeService dans certains services)
            }
        });
    });
    logger_1.default.info('Dashboard invalidation handlers initialized');
};
exports.initializeDashboardInvalidation = initializeDashboardInvalidation;
//# sourceMappingURL=dashboard-invalidation.handler.js.map