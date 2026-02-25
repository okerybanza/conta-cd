/**
 * DomainEvent - Événement métier immuable
 *
 * Principe : Un événement = une vérité
 * - Immuable (créé une fois, jamais modifié)
 * - A un auteur
 * - A un horodatage
 * - Peut être audité
 */
export interface DomainEventMetadata {
    userId?: string;
    companyId: string;
    timestamp: Date;
    correlationId?: string;
    causationId?: string;
}
export declare abstract class DomainEvent {
    readonly id: string;
    readonly metadata: DomainEventMetadata;
    readonly occurredAt: Date;
    constructor(metadata: DomainEventMetadata);
    abstract getEventType(): string;
    /**
     * Type d'entité concernée (pour l'audit log)
     */
    getEntityType(): string;
    /**
     * ID de l'entité concernée (pour l'audit log)
     */
    getEntityId(): string;
    /**
     * Données de l'événement (pour l'audit log)
     */
    getData(): Record<string, any>;
}
export declare class StockMovementCreated extends DomainEvent {
    readonly movementId: string;
    readonly movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    readonly reference?: string | undefined;
    readonly referenceId?: string | undefined;
    readonly reason?: string | undefined;
    constructor(metadata: DomainEventMetadata, movementId: string, movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER', reference?: string | undefined, referenceId?: string | undefined, reason?: string | undefined);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class StockMovementValidated extends DomainEvent {
    readonly movementId: string;
    readonly movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    readonly items: Array<{
        productId: string;
        warehouseId?: string;
        warehouseToId?: string;
        quantity: number;
        batchId?: string;
        serialNumber?: string;
    }>;
    readonly reference?: string | undefined;
    readonly referenceId?: string | undefined;
    constructor(metadata: DomainEventMetadata, movementId: string, movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER', items: Array<{
        productId: string;
        warehouseId?: string;
        warehouseToId?: string;
        quantity: number;
        batchId?: string;
        serialNumber?: string;
    }>, reference?: string | undefined, referenceId?: string | undefined);
    getEventType(): string;
}
export declare class StockMovementReversed extends DomainEvent {
    readonly originalMovementId: string;
    readonly reversalMovementId: string;
    readonly reason: string;
    constructor(metadata: DomainEventMetadata, originalMovementId: string, reversalMovementId: string, reason: string);
    getEventType(): string;
}
export declare class StockAdjusted extends DomainEvent {
    readonly productId: string;
    readonly previousQuantity: number;
    readonly newQuantity: number;
    readonly reason: string;
    readonly warehouseId?: string | undefined;
    constructor(metadata: DomainEventMetadata, productId: string, previousQuantity: number, newQuantity: number, reason: string, warehouseId?: string | undefined);
    getEventType(): string;
}
export declare class InvoiceValidated extends DomainEvent {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly customerId: string;
    readonly totalAmount: number;
    readonly lines: Array<{
        productId?: string;
        quantity: number;
        unitPrice: number;
    }>;
    constructor(metadata: DomainEventMetadata, invoiceId: string, invoiceNumber: string, customerId: string, totalAmount: number, lines: Array<{
        productId?: string;
        quantity: number;
        unitPrice: number;
    }>);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class InvoiceCancelled extends DomainEvent {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly reason?: string | undefined;
    readonly originalInvoiceId?: string | undefined;
    constructor(metadata: DomainEventMetadata, invoiceId: string, invoiceNumber: string, reason?: string | undefined, originalInvoiceId?: string | undefined);
    getEventType(): string;
}
export declare class InvoiceUpdated extends DomainEvent {
    readonly invoiceId: string;
    readonly changes: any;
    readonly lines?: any[] | undefined;
    constructor(metadata: DomainEventMetadata, invoiceId: string, changes: any, lines?: any[] | undefined);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class InvoiceDeleted extends DomainEvent {
    readonly invoiceId: string;
    readonly reason?: string | undefined;
    constructor(metadata: DomainEventMetadata, invoiceId: string, reason?: string | undefined);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class InvoiceStatusChangedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly previousStatus: string;
    readonly newStatus: string;
    readonly reason: string;
    constructor(metadata: DomainEventMetadata, invoiceId: string, invoiceNumber: string, previousStatus: string, newStatus: string, reason: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class JournalEntryPosted extends DomainEvent {
    readonly entryId: string;
    readonly entryNumber: string;
    readonly entryDate: Date;
    readonly lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
    }>;
    constructor(metadata: DomainEventMetadata, entryId: string, entryNumber: string, entryDate: Date, lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
    }>);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class JournalEntryReversed extends DomainEvent {
    readonly originalEntryId: string;
    readonly reversalEntryId: string;
    readonly reason: string;
    constructor(metadata: DomainEventMetadata, originalEntryId: string, reversalEntryId: string, reason: string);
    getEventType(): string;
}
export declare class EmployeeCreated extends DomainEvent {
    readonly employeeId: string;
    readonly employeeNumber: string;
    readonly companyId: string;
    constructor(metadata: DomainEventMetadata, employeeId: string, employeeNumber: string, companyId: string);
    getEventType(): string;
}
export declare class EmployeeUpdated extends DomainEvent {
    readonly employeeId: string;
    readonly changes: Record<string, any>;
    constructor(metadata: DomainEventMetadata, employeeId: string, changes: Record<string, any>);
    getEventType(): string;
}
export declare class EmployeeTerminated extends DomainEvent {
    readonly employeeId: string;
    readonly terminationDate: Date;
    readonly reason?: string | undefined;
    constructor(metadata: DomainEventMetadata, employeeId: string, terminationDate: Date, reason?: string | undefined);
    getEventType(): string;
}
export declare class EmployeeContractCreated extends DomainEvent {
    readonly contractId: string;
    readonly employeeId: string;
    readonly contractType: string;
    readonly startDate: Date;
    readonly baseSalary: number;
    readonly currency: string;
    constructor(metadata: DomainEventMetadata, contractId: string, employeeId: string, contractType: string, startDate: Date, baseSalary: number, currency: string);
    getEventType(): string;
}
export declare class EmployeeContractTerminated extends DomainEvent {
    readonly contractId: string;
    readonly employeeId: string;
    readonly terminationDate: Date;
    readonly reason?: string | undefined;
    constructor(metadata: DomainEventMetadata, contractId: string, employeeId: string, terminationDate: Date, reason?: string | undefined);
    getEventType(): string;
}
export declare class AttendanceRecorded extends DomainEvent {
    readonly attendanceId: string;
    readonly employeeId: string;
    readonly date: Date;
    readonly hoursWorked: number;
    constructor(metadata: DomainEventMetadata, attendanceId: string, employeeId: string, date: Date, hoursWorked: number);
    getEventType(): string;
}
export declare class LeaveRequestApproved extends DomainEvent {
    readonly leaveRequestId: string;
    readonly employeeId: string;
    readonly leaveType: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly days: number;
    constructor(metadata: DomainEventMetadata, leaveRequestId: string, employeeId: string, leaveType: string, startDate: Date, endDate: Date, days: number);
    getEventType(): string;
}
export declare class PayrollCreated extends DomainEvent {
    readonly payrollId: string;
    readonly employeeId: string;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly grossSalary: number;
    readonly netSalary: number;
    constructor(metadata: DomainEventMetadata, payrollId: string, employeeId: string, periodStart: Date, periodEnd: Date, grossSalary: number, netSalary: number);
    getEventType(): string;
}
export declare class PayrollValidated extends DomainEvent {
    readonly payrollId: string;
    readonly employeeId: string;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly grossAmount: number;
    readonly netAmount: number;
    constructor(metadata: DomainEventMetadata, payrollId: string, employeeId: string, periodStart: Date, periodEnd: Date, grossAmount: number, netAmount: number);
    getEventType(): string;
}
export declare class PayrollCancelled extends DomainEvent {
    readonly payrollId: string;
    readonly employeeId: string;
    readonly reason?: string | undefined;
    constructor(metadata: DomainEventMetadata, payrollId: string, employeeId: string, reason?: string | undefined);
    getEventType(): string;
}
export declare class AccountCreated extends DomainEvent {
    readonly accountId: string;
    readonly code: string;
    constructor(metadata: DomainEventMetadata, accountId: string, code: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class AccountUpdated extends DomainEvent {
    readonly accountId: string;
    readonly changes: any;
    constructor(metadata: DomainEventMetadata, accountId: string, changes: any);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class AccountDeleted extends DomainEvent {
    readonly accountId: string;
    constructor(metadata: DomainEventMetadata, accountId: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class ProductCreated extends DomainEvent {
    readonly productId: string;
    constructor(metadata: DomainEventMetadata, productId: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class ProductUpdated extends DomainEvent {
    readonly productId: string;
    constructor(metadata: DomainEventMetadata, productId: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class ProductDeleted extends DomainEvent {
    readonly productId: string;
    constructor(metadata: DomainEventMetadata, productId: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class CustomerCreated extends DomainEvent {
    readonly customerId: string;
    constructor(metadata: DomainEventMetadata, customerId: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class CustomerUpdated extends DomainEvent {
    readonly customerId: string;
    constructor(metadata: DomainEventMetadata, customerId: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class CustomerDeleted extends DomainEvent {
    readonly customerId: string;
    constructor(metadata: DomainEventMetadata, customerId: string);
    getEventType(): string;
    getEntityType(): string;
    getEntityId(): string;
}
export declare class GenericEvent extends DomainEvent {
    private readonly eventType;
    readonly data: any;
    constructor(metadata: DomainEventMetadata, eventType: string, data: any);
    getEventType(): string;
}
//# sourceMappingURL=domain-event.d.ts.map