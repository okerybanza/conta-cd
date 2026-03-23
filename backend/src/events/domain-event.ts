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
  causationId?: string; // ID de l'événement qui a causé celui-ci
}

export abstract class DomainEvent {
  public readonly id: string;
  public readonly metadata: DomainEventMetadata;
  public readonly occurredAt: Date;

  constructor(metadata: DomainEventMetadata) {
    this.id = `${this.constructor.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metadata = {
      ...metadata,
      timestamp: metadata.timestamp || new Date(),
    };
    this.occurredAt = this.metadata.timestamp;
  }

  abstract getEventType(): string;

  /**
   * Type d'entité concernée (pour l'audit log)
   */
  public getEntityType(): string {
    return 'unknown';
  }

  /**
   * ID de l'entité concernée (pour l'audit log)
   */
  public getEntityId(): string {
    return 'unknown';
  }

  /**
   * Données de l'événement (pour l'audit log)
   */
  public getData(): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, metadata, occurredAt, ...data } = this as any;
    return data;
  }
}

// Événements Stock
export class StockMovementCreated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly movementId: string,
    public readonly movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER',
    public readonly reference?: string,
    public readonly referenceId?: string,
    public readonly reason?: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'StockMovementCreated';
  }

  getEntityType(): string { return 'stock_movement'; }
  getEntityId(): string { return this.movementId; }
}

export class StockMovementValidated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly movementId: string,
    public readonly movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER',
    public readonly items: Array<{
      productId: string;
      warehouseId?: string;
      warehouseToId?: string;
      quantity: number;
      batchId?: string;
      serialNumber?: string;
    }>,
    public readonly reference?: string,
    public readonly referenceId?: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'StockMovementValidated';
  }
}

export class StockMovementReversed extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly originalMovementId: string,
    public readonly reversalMovementId: string,
    public readonly reason: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'StockMovementReversed';
  }
}

export class StockAdjusted extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly productId: string,
    public readonly previousQuantity: number,
    public readonly newQuantity: number,
    public readonly reason: string,
    public readonly warehouseId?: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'StockAdjusted';
  }
}

// Événements Facturation
export class InvoiceValidated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly lines: Array<{
      productId?: string;
      quantity: number;
      unitPrice: number;
    }>
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'InvoiceValidated';
  }

  getEntityType(): string { return 'invoice'; }
  getEntityId(): string { return this.invoiceId; }
}

export class InvoiceCancelled extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly reason?: string,
    public readonly originalInvoiceId?: string // Pour inversion
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'InvoiceCancelled';
  }
}

export class InvoiceUpdated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly invoiceId: string,
    public readonly changes: any,
    public readonly lines?: any[]
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'InvoiceUpdated';
  }

  getEntityType(): string { return 'invoice'; }
  getEntityId(): string { return this.invoiceId; }
}

export class InvoiceDeleted extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly invoiceId: string,
    public readonly reason?: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'InvoiceDeleted';
  }

  getEntityType(): string { return 'invoice'; }
  getEntityId(): string { return this.invoiceId; }
}

// SPRINT 1 - ARCH-007: Event for invoice status transitions
export class InvoiceStatusChangedEvent extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly reason: string // ACCT-001: Mandatory reason for audit
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'InvoiceStatusChanged';
  }

  getEntityType(): string { return 'invoice'; }
  getEntityId(): string { return this.invoiceId; }
}

// Événements Comptabilité
export class JournalEntryPosted extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly entryId: string,
    public readonly entryNumber: string,
    public readonly entryDate: Date,
    public readonly lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
    }>
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'JournalEntryPosted';
  }

  getEntityType(): string { return 'journal_entry'; }
  getEntityId(): string { return this.entryId; }
}

export class JournalEntryReversed extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly originalEntryId: string,
    public readonly reversalEntryId: string,
    public readonly reason: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'JournalEntryReversed';
  }
}

// Événements RH (DOC-04)
export class EmployeeCreated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly employeeId: string,
    public readonly employeeNumber: string,
    public readonly companyId: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'EmployeeCreated';
  }
}

export class EmployeeUpdated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly employeeId: string,
    public readonly changes: Record<string, any>
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'EmployeeUpdated';
  }
}

export class EmployeeTerminated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly employeeId: string,
    public readonly terminationDate: Date,
    public readonly reason?: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'EmployeeTerminated';
  }
}

export class EmployeeContractCreated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly contractId: string,
    public readonly employeeId: string,
    public readonly contractType: string,
    public readonly startDate: Date,
    public readonly baseSalary: number,
    public readonly currency: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'EmployeeContractCreated';
  }
}

export class EmployeeContractTerminated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly contractId: string,
    public readonly employeeId: string,
    public readonly terminationDate: Date,
    public readonly reason?: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'EmployeeContractTerminated';
  }
}

export class AttendanceRecorded extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly attendanceId: string,
    public readonly employeeId: string,
    public readonly date: Date,
    public readonly hoursWorked: number
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'AttendanceRecorded';
  }
}

export class LeaveRequestApproved extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly leaveRequestId: string,
    public readonly employeeId: string,
    public readonly leaveType: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly days: number
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'LeaveRequestApproved';
  }
}

export class PayrollCreated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly payrollId: string,
    public readonly employeeId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly grossSalary: number,
    public readonly netSalary: number
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'PayrollCreated';
  }
}

export class PayrollValidated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly payrollId: string,
    public readonly employeeId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly grossAmount: number,
    public readonly netAmount: number
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'PayrollValidated';
  }
}

export class PayrollCancelled extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly payrollId: string,
    public readonly employeeId: string,
    public readonly reason?: string
  ) {
    super(metadata);
  }

  getEventType(): string {
    return 'PayrollCancelled';
  }
}

// Événements Comptes
export class AccountCreated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly accountId: string,
    public readonly code: string
  ) {
    super(metadata);
  }
  getEventType(): string { return 'AccountCreated'; }
  getEntityType(): string { return 'account'; }
  getEntityId(): string { return this.accountId; }
}

export class AccountUpdated extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly accountId: string,
    public readonly changes: any
  ) {
    super(metadata);
  }
  getEventType(): string { return 'AccountUpdated'; }
  getEntityType(): string { return 'account'; }
  getEntityId(): string { return this.accountId; }
}

export class AccountDeleted extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    public readonly accountId: string
  ) {
    super(metadata);
  }
  getEventType(): string { return 'AccountDeleted'; }
  getEntityType(): string { return 'account'; }
  getEntityId(): string { return this.accountId; }
}

// Événement Générique (pour transition)
export class GenericEvent extends DomainEvent {
  constructor(
    metadata: DomainEventMetadata,
    private readonly eventType: string,
    public readonly data: any
  ) {
    super(metadata);
  }
  getEventType(): string { return this.eventType; }
}
