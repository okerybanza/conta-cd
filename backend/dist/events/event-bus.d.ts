/**
 * Event Bus interne léger
 *
 * Gère la publication et la souscription aux événements métier
 * avec support de transactions partagées
 */
import { DomainEvent } from './domain-event';
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;
declare class EventBus {
    private handlers;
    /** ARCH-003: file par agrégat — un seul événement traité à la fois par (company, entity_type, entity_id) */
    private aggregatePromises;
    /**
     * S'abonner à un type d'événement
     */
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
    /**
     * Alias de subscribe (compatible avec EventEmitter)
     */
    on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
    /**
     * Publier un événement
     * ARCH-001: Toujours persister dans le journal domain_events d'abord, puis exécuter les handlers.
     */
    publish(event: DomainEvent): Promise<void>;
    /**
     * Re-publier un événement existant (Replay)
     * Saute la persistance car l'événement existe déjà dans le log
     */
    republish(event: DomainEvent): Promise<void>;
    /**
     * ARCH-003: Enfile par agrégat puis exécute les handlers (ordre garanti par agrégat)
     */
    private enqueueByAggregate;
    /**
     * Logique interne d'exécution des handlers
     */
    private internalPublish;
    /**
     * Publier plusieurs événements dans une transaction
     */
    publishAll(events: DomainEvent[]): Promise<void>;
    /**
     * Obtenir le nombre de handlers pour un type d'événement
     */
    getHandlerCount(eventType: string): number;
    /**
     * Vider tous les handlers (utile pour les tests)
     */
    clear(): void;
}
export declare const eventBus: EventBus;
export default eventBus;
//# sourceMappingURL=event-bus.d.ts.map