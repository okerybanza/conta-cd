"use strict";
/**
 * Event Bus interne léger
 *
 * Gère la publication et la souscription aux événements métier
 * avec support de transactions partagées
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const database_1 = __importDefault(require("../config/database"));
/** Clé d'agrégat pour ARCH-003 : ordre de traitement garanti par (company, entity_type, entity_id) */
function aggregateKey(event) {
    const companyId = event.metadata?.companyId ?? 'global';
    const entityType = event.getEntityType?.() ?? 'unknown';
    const entityId = event.getEntityId?.() ?? 'unknown';
    return `${companyId}:${entityType}:${entityId}`;
}
class EventBus {
    handlers = new Map();
    /** ARCH-003: file par agrégat — un seul événement traité à la fois par (company, entity_type, entity_id) */
    aggregatePromises = new Map();
    /**
     * S'abonner à un type d'événement
     */
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);
        logger_1.default.debug(`Event handler subscribed: ${eventType}`, {
            handlerCount: this.handlers.get(eventType).length,
        });
    }
    /**
     * Alias de subscribe (compatible avec EventEmitter)
     */
    on(eventType, handler) {
        this.subscribe(eventType, handler);
    }
    /**
     * Publier un événement
     * ARCH-001: Toujours persister dans le journal domain_events d'abord, puis exécuter les handlers.
     */
    async publish(event) {
        const eventType = event.getEventType();
        const handlers = this.handlers.get(eventType) || [];
        logger_1.default.info(`Publishing event: ${eventType}`, {
            eventId: event.id,
            companyId: event.metadata.companyId,
            handlerCount: handlers.length,
        });
        // ARCH-001: Persister avant tout — journal centralisé même sans handlers
        try {
            await database_1.default.domain_events.create({
                data: {
                    id: event.id,
                    type: eventType,
                    entity_type: event.getEntityType(),
                    entity_id: event.getEntityId(),
                    data: event.getData(),
                    metadata: event.metadata,
                    occurred_at: event.occurredAt,
                    company_id: event.metadata.companyId,
                    user_id: event.metadata.userId,
                    correlation_id: event.metadata.correlationId,
                    causation_id: event.metadata.causationId,
                },
            });
            logger_1.default.debug(`Event persisted to domain_events log`, { eventId: event.id });
        }
        catch (persistError) {
            logger_1.default.error(`Failed to persist domain event: ${eventType}`, {
                eventId: event.id,
                error: persistError.message,
            });
        }
        if (handlers.length > 0) {
            await this.enqueueByAggregate(event);
        }
        else {
            logger_1.default.debug(`No handlers for event: ${eventType}`, { eventId: event.id });
        }
    }
    /**
     * Re-publier un événement existant (Replay)
     * Saute la persistance car l'événement existe déjà dans le log
     */
    async republish(event) {
        logger_1.default.info(`Replaying event: ${event.getEventType()}`, {
            eventId: event.id,
            companyId: event.metadata.companyId,
        });
        const handlers = this.handlers.get(event.getEventType()) || [];
        if (handlers.length > 0) {
            await this.enqueueByAggregate(event);
        }
    }
    /**
     * ARCH-003: Enfile par agrégat puis exécute les handlers (ordre garanti par agrégat)
     */
    enqueueByAggregate(event) {
        const key = aggregateKey(event);
        const prev = this.aggregatePromises.get(key) ?? Promise.resolve();
        const next = prev
            .catch(() => { })
            .then(() => this.internalPublish(event));
        this.aggregatePromises.set(key, next);
        return next;
    }
    /**
     * Logique interne d'exécution des handlers
     */
    async internalPublish(event) {
        const eventType = event.getEventType();
        const handlers = this.handlers.get(eventType) || [];
        if (handlers.length === 0)
            return;
        for (const handler of handlers) {
            try {
                await handler(event);
                logger_1.default.debug(`Event handler executed successfully`, {
                    eventId: event.id,
                    eventType,
                });
            }
            catch (error) {
                logger_1.default.error(`Event handler failed: ${eventType}`, {
                    eventId: event.id,
                    error: error.message,
                });
                throw error;
            }
        }
    }
    /**
     * Publier plusieurs événements dans une transaction
     */
    async publishAll(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
    /**
     * Obtenir le nombre de handlers pour un type d'événement
     */
    getHandlerCount(eventType) {
        return this.handlers.get(eventType)?.length || 0;
    }
    /**
     * Vider tous les handlers (utile pour les tests)
     */
    clear() {
        this.handlers.clear();
        this.aggregatePromises.clear();
    }
}
// Instance singleton robuste aux chargements multiples
const globalSymbols = Symbol.for('internal.eventBus');
const globalObject = global;
if (!globalObject[globalSymbols]) {
    globalObject[globalSymbols] = new EventBus();
}
exports.eventBus = globalObject[globalSymbols];
exports.default = exports.eventBus;
//# sourceMappingURL=event-bus.js.map