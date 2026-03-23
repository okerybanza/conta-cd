/**
 * Event Bus interne léger
 * 
 * Gère la publication et la souscription aux événements métier
 * avec support de transactions partagées
 */

import { DomainEvent } from './domain-event';
import logger from '../utils/logger';
import prisma from '../config/database';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventQueue: DomainEvent[] = [];
  private isProcessing: boolean = false;

  /**
   * S'abonner à un type d'événement
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);

    logger.debug(`Event handler subscribed: ${eventType}`, {
      handlerCount: this.handlers.get(eventType)!.length,
    });
  }

  /**
   * Alias de subscribe (compatible avec EventEmitter)
   */
  on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    this.subscribe(eventType, handler);
  }

  /**
   * Publier un événement
   * Les handlers sont exécutés de manière synchrone dans la même transaction
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventType = event.getEventType();
    const handlers = this.handlers.get(eventType) || [];

    console.log(`[EventBus] Publishing ${eventType} to ${handlers.length} handlers`);

    if (handlers.length === 0) {
      logger.debug(`No handlers for event: ${eventType}`, {
        eventId: event.id,
      });
      return;
    }

    logger.info(`Publishing event: ${eventType}`, {
      eventId: event.id,
      companyId: event.metadata.companyId,
      handlerCount: handlers.length,
    });

    // SPRINT 2 - TASK 2.3 (ARCH-001): Persist event to decentralized domain event log
    try {
      await prisma.domain_events.create({
        data: {
          id: event.id,
          type: eventType,
          entity_type: event.getEntityType(),
          entity_id: event.getEntityId(),
          data: event.getData() as any,
          metadata: event.metadata as any,
          occurred_at: event.occurredAt,
          company_id: event.metadata.companyId,
          user_id: event.metadata.userId,
          correlation_id: event.metadata.correlationId,
          causation_id: event.metadata.causationId,
        },
      });
      logger.debug(`Event persisted to domain_events log`, { eventId: event.id });
    } catch (persistError: any) {
      logger.error(`Failed to persist domain event: ${eventType}`, {
        eventId: event.id,
        error: persistError.message,
      });
    }

    await this.internalPublish(event);
  }

  /**
   * Compatibilité ancienne API type EventEmitter
   * Permet d'émettre un événement simple sans DomainEvent dédié.
   * Ces événements ne sont pas persistés dans le log domain_events.
   */
  async emit(eventType: string, payload: any): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];

    if (handlers.length === 0) {
      logger.debug(`No handlers for emitted event: ${eventType}`);
      return;
    }

    logger.info(`Emitting legacy event: ${eventType}`, {
      handlerCount: handlers.length,
    });

    for (const handler of handlers) {
      try {
        await handler(payload as any);
      } catch (error: any) {
        logger.error(`Legacy event handler failed: ${eventType}`, {
          error: error.message,
        });
      }
    }
  }

  /**
   * Re-publier un événement existant (Replay)
   * Saute la persistance car l'événement existe déjà dans le log
   */
  async republish(event: DomainEvent): Promise<void> {
    logger.info(`Replaying event: ${event.getEventType()}`, {
      eventId: event.id,
      companyId: event.metadata.companyId,
    });

    await this.internalPublish(event);
  }

  /**
   * Logique interne d'exécution des handlers
   */
  private async internalPublish(event: DomainEvent): Promise<void> {
    const eventType = event.getEventType();
    const handlers = this.handlers.get(eventType) || [];

    if (handlers.length === 0) return;

    for (const handler of handlers) {
      try {
        await handler(event);
        logger.debug(`Event handler executed successfully`, {
          eventId: event.id,
          eventType,
        });
      } catch (error: any) {
        logger.error(`Event handler failed: ${eventType}`, {
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
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Obtenir le nombre de handlers pour un type d'événement
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * Vider tous les handlers (utile pour les tests)
   */
  clear(): void {
    this.handlers.clear();
    this.eventQueue = [];
  }
}

// Instance singleton robuste aux chargements multiples
const globalSymbols = Symbol.for('internal.eventBus');
const globalObject = global as any;

if (!globalObject[globalSymbols]) {
  globalObject[globalSymbols] = new EventBus();
}

export const eventBus: EventBus = globalObject[globalSymbols];
export default eventBus;

