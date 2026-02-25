import { DomainEvent, DomainEventMetadata } from './domain-event';
export type EventConstructor = new (metadata: DomainEventMetadata, ...args: any[]) => DomainEvent;
export declare const EventRegistry: Record<string, EventConstructor>;
/**
 * Re-instantiate an event from stored data
 */
export declare function reconstructEvent(type: string, metadata: any, data: any): DomainEvent | null;
//# sourceMappingURL=event-registry.d.ts.map