/**
 * Point d'entrée pour le système d'événements
 *
 * Enregistre tous les handlers au démarrage de l'application
 */
import './cache-invalidation.handler';
/**
 * Initialiser le système d'événements
 * Doit être appelé au démarrage de l'application
 */
export declare function initializeEventHandlers(): void;
export * from './domain-event';
export { eventBus } from './event-bus';
//# sourceMappingURL=index.d.ts.map