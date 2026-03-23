import * as Events from './domain-event';
import { DomainEvent, DomainEventMetadata } from './domain-event';

export type EventConstructor = new (metadata: DomainEventMetadata, ...args: any[]) => DomainEvent;

export const EventRegistry: Record<string, EventConstructor> = {
    // Stock Events
    'StockMovementCreated': Events.StockMovementCreated,
    'StockMovementValidated': Events.StockMovementValidated,
    'StockMovementReversed': Events.StockMovementReversed,
    'StockAdjusted': Events.StockAdjusted,

    // Billing Events
    'InvoiceValidated': Events.InvoiceValidated,
    'InvoiceCancelled': Events.InvoiceCancelled,
    'InvoiceUpdated': Events.InvoiceUpdated,
    'InvoiceDeleted': Events.InvoiceDeleted,
    'InvoiceStatusChanged': Events.InvoiceStatusChangedEvent,

    // Accounting Events
    'JournalEntryPosted': Events.JournalEntryPosted,
    'JournalEntryReversed': Events.JournalEntryReversed,

    // HR Events
    'EmployeeCreated': Events.EmployeeCreated,
    'EmployeeUpdated': Events.EmployeeUpdated,
    'EmployeeTerminated': Events.EmployeeTerminated,
    'EmployeeContractCreated': Events.EmployeeContractCreated,
    'EmployeeContractTerminated': Events.EmployeeContractTerminated,
    'AttendanceRecorded': Events.AttendanceRecorded,
    'LeaveRequestApproved': Events.LeaveRequestApproved,
    'PayrollCreated': Events.PayrollCreated,
    'PayrollValidated': Events.PayrollValidated,
    'PayrollCancelled': Events.PayrollCancelled,
};

/**
 * Re-instantiate an event from stored data
 */
export function reconstructEvent(type: string, metadata: any, data: any): DomainEvent | null {
    const Constructor = EventRegistry[type];
    if (!Constructor) return null;

    // Most events have (metadata, ...publicFields)
    // We need to pass the data fields in the correct order or as an object depending on the constructor.
    // Given our DomainEvent classes use the pattern: constructor(metadata, field1, field2, ...)
    // We'll use a hack or standardized pattern if we can't easily map.

    // NOTE: In a more robust system, each event would have a fromJSON static method.
    // For now, we'll try to match the most common pattern or handle specific cases.

    try {
        switch (type) {
            case 'InvoiceStatusChanged':
                return new (Constructor as any)(
                    metadata,
                    data.invoiceId,
                    data.invoiceNumber,
                    data.previousStatus,
                    data.newStatus,
                    data.reason
                );

            case 'JournalEntryPosted':
                return new (Constructor as any)(
                    metadata,
                    data.entryId,
                    data.entryNumber,
                    data.entryDate,
                    data.lines
                );

            case 'StockMovementCreated':
                return new (Constructor as any)(
                    metadata,
                    data.movementId,
                    data.movementType,
                    data.reference,
                    data.referenceId,
                    data.reason
                );

            // Default fallback for events that follow the (metadata, ...data) pattern where data keys match constructor args order
            // This is risky if order changes, but works for simple events.
            default:
                // Attempting to match payload keys to primitive constructors if possible, 
                // but it's better to be explicit above.
                return null;
        }
    } catch (e) {
        console.error(`Failed to reconstruct event of type ${type}`, e);
        return null;
    }
}
