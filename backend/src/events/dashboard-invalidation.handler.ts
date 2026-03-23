import { eventBus } from './event-bus';
import cacheService from '../services/cache.service';
import logger from '../utils/logger';

/**
 * Handler pour invalider le cache du tableau de bord lors de changements de données
 * SPRINT 5 - Final Mile Optimization
 */
export const initializeDashboardInvalidation = () => {
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
        eventBus.on(event, async (data: any) => {
            if (data.companyId) {
                const cacheKey = `dashboard:stats:${data.companyId}`;
                await cacheService.delete(cacheKey);
                logger.debug(`Dashboard cache invalidated for company ${data.companyId} due to ${event}`);

                // Émettre un événement pour signaler au frontend de rafraîchir via Socket.io si nécessaire
                // (Déjà géré en partie par realtimeService dans certains services)
            }
        });
    });

    logger.info('Dashboard invalidation handlers initialized');
};
