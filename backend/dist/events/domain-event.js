"use strict";
/**
 * DomainEvent - Événement métier immuable
 *
 * Principe : Un événement = une vérité
 * - Immuable (créé une fois, jamais modifié)
 * - A un auteur
 * - A un horodatage
 * - Peut être audité
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericEvent = exports.CustomerDeleted = exports.CustomerUpdated = exports.CustomerCreated = exports.ProductDeleted = exports.ProductUpdated = exports.ProductCreated = exports.AccountDeleted = exports.AccountUpdated = exports.AccountCreated = exports.PayrollCancelled = exports.PayrollValidated = exports.PayrollCreated = exports.LeaveRequestApproved = exports.AttendanceRecorded = exports.EmployeeContractTerminated = exports.EmployeeContractCreated = exports.EmployeeTerminated = exports.EmployeeUpdated = exports.EmployeeCreated = exports.JournalEntryReversed = exports.JournalEntryPosted = exports.InvoiceStatusChangedEvent = exports.InvoiceDeleted = exports.InvoiceUpdated = exports.InvoiceCancelled = exports.InvoiceValidated = exports.StockAdjusted = exports.StockMovementReversed = exports.StockMovementValidated = exports.StockMovementCreated = exports.DomainEvent = void 0;
class DomainEvent {
    id;
    metadata;
    occurredAt;
    constructor(metadata) {
        this.id = `${this.constructor.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.metadata = {
            ...metadata,
            timestamp: metadata.timestamp || new Date(),
        };
        this.occurredAt = this.metadata.timestamp;
    }
    /**
     * Type d'entité concernée (pour l'audit log)
     */
    getEntityType() {
        return 'unknown';
    }
    /**
     * ID de l'entité concernée (pour l'audit log)
     */
    getEntityId() {
        return 'unknown';
    }
    /**
     * Données de l'événement (pour l'audit log)
     */
    getData() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, metadata, occurredAt, ...data } = this;
        return data;
    }
}
exports.DomainEvent = DomainEvent;
// Événements Stock
class StockMovementCreated extends DomainEvent {
    movementId;
    movementType;
    reference;
    referenceId;
    reason;
    constructor(metadata, movementId, movementType, reference, referenceId, reason) {
        super(metadata);
        this.movementId = movementId;
        this.movementType = movementType;
        this.reference = reference;
        this.referenceId = referenceId;
        this.reason = reason;
    }
    getEventType() {
        return 'StockMovementCreated';
    }
    getEntityType() { return 'stock_movement'; }
    getEntityId() { return this.movementId; }
}
exports.StockMovementCreated = StockMovementCreated;
class StockMovementValidated extends DomainEvent {
    movementId;
    movementType;
    items;
    reference;
    referenceId;
    constructor(metadata, movementId, movementType, items, reference, referenceId) {
        super(metadata);
        this.movementId = movementId;
        this.movementType = movementType;
        this.items = items;
        this.reference = reference;
        this.referenceId = referenceId;
    }
    getEventType() {
        return 'StockMovementValidated';
    }
}
exports.StockMovementValidated = StockMovementValidated;
class StockMovementReversed extends DomainEvent {
    originalMovementId;
    reversalMovementId;
    reason;
    constructor(metadata, originalMovementId, reversalMovementId, reason) {
        super(metadata);
        this.originalMovementId = originalMovementId;
        this.reversalMovementId = reversalMovementId;
        this.reason = reason;
    }
    getEventType() {
        return 'StockMovementReversed';
    }
}
exports.StockMovementReversed = StockMovementReversed;
class StockAdjusted extends DomainEvent {
    productId;
    previousQuantity;
    newQuantity;
    reason;
    warehouseId;
    constructor(metadata, productId, previousQuantity, newQuantity, reason, warehouseId) {
        super(metadata);
        this.productId = productId;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.reason = reason;
        this.warehouseId = warehouseId;
    }
    getEventType() {
        return 'StockAdjusted';
    }
}
exports.StockAdjusted = StockAdjusted;
// Événements Facturation
class InvoiceValidated extends DomainEvent {
    invoiceId;
    invoiceNumber;
    customerId;
    totalAmount;
    lines;
    constructor(metadata, invoiceId, invoiceNumber, customerId, totalAmount, lines) {
        super(metadata);
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.customerId = customerId;
        this.totalAmount = totalAmount;
        this.lines = lines;
    }
    getEventType() {
        return 'InvoiceValidated';
    }
    getEntityType() { return 'invoice'; }
    getEntityId() { return this.invoiceId; }
}
exports.InvoiceValidated = InvoiceValidated;
class InvoiceCancelled extends DomainEvent {
    invoiceId;
    invoiceNumber;
    reason;
    originalInvoiceId;
    constructor(metadata, invoiceId, invoiceNumber, reason, originalInvoiceId // Pour inversion
    ) {
        super(metadata);
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.reason = reason;
        this.originalInvoiceId = originalInvoiceId;
    }
    getEventType() {
        return 'InvoiceCancelled';
    }
}
exports.InvoiceCancelled = InvoiceCancelled;
class InvoiceUpdated extends DomainEvent {
    invoiceId;
    changes;
    lines;
    constructor(metadata, invoiceId, changes, lines) {
        super(metadata);
        this.invoiceId = invoiceId;
        this.changes = changes;
        this.lines = lines;
    }
    getEventType() {
        return 'InvoiceUpdated';
    }
    getEntityType() { return 'invoice'; }
    getEntityId() { return this.invoiceId; }
}
exports.InvoiceUpdated = InvoiceUpdated;
class InvoiceDeleted extends DomainEvent {
    invoiceId;
    reason;
    constructor(metadata, invoiceId, reason) {
        super(metadata);
        this.invoiceId = invoiceId;
        this.reason = reason;
    }
    getEventType() {
        return 'InvoiceDeleted';
    }
    getEntityType() { return 'invoice'; }
    getEntityId() { return this.invoiceId; }
}
exports.InvoiceDeleted = InvoiceDeleted;
// SPRINT 1 - ARCH-007: Event for invoice status transitions
class InvoiceStatusChangedEvent extends DomainEvent {
    invoiceId;
    invoiceNumber;
    previousStatus;
    newStatus;
    reason;
    constructor(metadata, invoiceId, invoiceNumber, previousStatus, newStatus, reason // ACCT-001: Mandatory reason for audit
    ) {
        super(metadata);
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.reason = reason;
    }
    getEventType() {
        return 'InvoiceStatusChanged';
    }
    getEntityType() { return 'invoice'; }
    getEntityId() { return this.invoiceId; }
}
exports.InvoiceStatusChangedEvent = InvoiceStatusChangedEvent;
// Événements Comptabilité
class JournalEntryPosted extends DomainEvent {
    entryId;
    entryNumber;
    entryDate;
    lines;
    constructor(metadata, entryId, entryNumber, entryDate, lines) {
        super(metadata);
        this.entryId = entryId;
        this.entryNumber = entryNumber;
        this.entryDate = entryDate;
        this.lines = lines;
    }
    getEventType() {
        return 'JournalEntryPosted';
    }
    getEntityType() { return 'journal_entry'; }
    getEntityId() { return this.entryId; }
}
exports.JournalEntryPosted = JournalEntryPosted;
class JournalEntryReversed extends DomainEvent {
    originalEntryId;
    reversalEntryId;
    reason;
    constructor(metadata, originalEntryId, reversalEntryId, reason) {
        super(metadata);
        this.originalEntryId = originalEntryId;
        this.reversalEntryId = reversalEntryId;
        this.reason = reason;
    }
    getEventType() {
        return 'JournalEntryReversed';
    }
}
exports.JournalEntryReversed = JournalEntryReversed;
// Événements RH (DOC-04)
class EmployeeCreated extends DomainEvent {
    employeeId;
    employeeNumber;
    companyId;
    constructor(metadata, employeeId, employeeNumber, companyId) {
        super(metadata);
        this.employeeId = employeeId;
        this.employeeNumber = employeeNumber;
        this.companyId = companyId;
    }
    getEventType() {
        return 'EmployeeCreated';
    }
}
exports.EmployeeCreated = EmployeeCreated;
class EmployeeUpdated extends DomainEvent {
    employeeId;
    changes;
    constructor(metadata, employeeId, changes) {
        super(metadata);
        this.employeeId = employeeId;
        this.changes = changes;
    }
    getEventType() {
        return 'EmployeeUpdated';
    }
}
exports.EmployeeUpdated = EmployeeUpdated;
class EmployeeTerminated extends DomainEvent {
    employeeId;
    terminationDate;
    reason;
    constructor(metadata, employeeId, terminationDate, reason) {
        super(metadata);
        this.employeeId = employeeId;
        this.terminationDate = terminationDate;
        this.reason = reason;
    }
    getEventType() {
        return 'EmployeeTerminated';
    }
}
exports.EmployeeTerminated = EmployeeTerminated;
class EmployeeContractCreated extends DomainEvent {
    contractId;
    employeeId;
    contractType;
    startDate;
    baseSalary;
    currency;
    constructor(metadata, contractId, employeeId, contractType, startDate, baseSalary, currency) {
        super(metadata);
        this.contractId = contractId;
        this.employeeId = employeeId;
        this.contractType = contractType;
        this.startDate = startDate;
        this.baseSalary = baseSalary;
        this.currency = currency;
    }
    getEventType() {
        return 'EmployeeContractCreated';
    }
}
exports.EmployeeContractCreated = EmployeeContractCreated;
class EmployeeContractTerminated extends DomainEvent {
    contractId;
    employeeId;
    terminationDate;
    reason;
    constructor(metadata, contractId, employeeId, terminationDate, reason) {
        super(metadata);
        this.contractId = contractId;
        this.employeeId = employeeId;
        this.terminationDate = terminationDate;
        this.reason = reason;
    }
    getEventType() {
        return 'EmployeeContractTerminated';
    }
}
exports.EmployeeContractTerminated = EmployeeContractTerminated;
class AttendanceRecorded extends DomainEvent {
    attendanceId;
    employeeId;
    date;
    hoursWorked;
    constructor(metadata, attendanceId, employeeId, date, hoursWorked) {
        super(metadata);
        this.attendanceId = attendanceId;
        this.employeeId = employeeId;
        this.date = date;
        this.hoursWorked = hoursWorked;
    }
    getEventType() {
        return 'AttendanceRecorded';
    }
}
exports.AttendanceRecorded = AttendanceRecorded;
class LeaveRequestApproved extends DomainEvent {
    leaveRequestId;
    employeeId;
    leaveType;
    startDate;
    endDate;
    days;
    constructor(metadata, leaveRequestId, employeeId, leaveType, startDate, endDate, days) {
        super(metadata);
        this.leaveRequestId = leaveRequestId;
        this.employeeId = employeeId;
        this.leaveType = leaveType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.days = days;
    }
    getEventType() {
        return 'LeaveRequestApproved';
    }
}
exports.LeaveRequestApproved = LeaveRequestApproved;
class PayrollCreated extends DomainEvent {
    payrollId;
    employeeId;
    periodStart;
    periodEnd;
    grossSalary;
    netSalary;
    constructor(metadata, payrollId, employeeId, periodStart, periodEnd, grossSalary, netSalary) {
        super(metadata);
        this.payrollId = payrollId;
        this.employeeId = employeeId;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.grossSalary = grossSalary;
        this.netSalary = netSalary;
    }
    getEventType() {
        return 'PayrollCreated';
    }
}
exports.PayrollCreated = PayrollCreated;
class PayrollValidated extends DomainEvent {
    payrollId;
    employeeId;
    periodStart;
    periodEnd;
    grossAmount;
    netAmount;
    constructor(metadata, payrollId, employeeId, periodStart, periodEnd, grossAmount, netAmount) {
        super(metadata);
        this.payrollId = payrollId;
        this.employeeId = employeeId;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.grossAmount = grossAmount;
        this.netAmount = netAmount;
    }
    getEventType() {
        return 'PayrollValidated';
    }
}
exports.PayrollValidated = PayrollValidated;
class PayrollCancelled extends DomainEvent {
    payrollId;
    employeeId;
    reason;
    constructor(metadata, payrollId, employeeId, reason) {
        super(metadata);
        this.payrollId = payrollId;
        this.employeeId = employeeId;
        this.reason = reason;
    }
    getEventType() {
        return 'PayrollCancelled';
    }
}
exports.PayrollCancelled = PayrollCancelled;
// Événements Comptes
class AccountCreated extends DomainEvent {
    accountId;
    code;
    constructor(metadata, accountId, code) {
        super(metadata);
        this.accountId = accountId;
        this.code = code;
    }
    getEventType() { return 'AccountCreated'; }
    getEntityType() { return 'account'; }
    getEntityId() { return this.accountId; }
}
exports.AccountCreated = AccountCreated;
class AccountUpdated extends DomainEvent {
    accountId;
    changes;
    constructor(metadata, accountId, changes) {
        super(metadata);
        this.accountId = accountId;
        this.changes = changes;
    }
    getEventType() { return 'AccountUpdated'; }
    getEntityType() { return 'account'; }
    getEntityId() { return this.accountId; }
}
exports.AccountUpdated = AccountUpdated;
class AccountDeleted extends DomainEvent {
    accountId;
    constructor(metadata, accountId) {
        super(metadata);
        this.accountId = accountId;
    }
    getEventType() { return 'AccountDeleted'; }
    getEntityType() { return 'account'; }
    getEntityId() { return this.accountId; }
}
exports.AccountDeleted = AccountDeleted;
// Événements Produits (ARCH-001: journal centralisé)
class ProductCreated extends DomainEvent {
    productId;
    constructor(metadata, productId) {
        super(metadata);
        this.productId = productId;
    }
    getEventType() { return 'ProductCreated'; }
    getEntityType() { return 'product'; }
    getEntityId() { return this.productId; }
}
exports.ProductCreated = ProductCreated;
class ProductUpdated extends DomainEvent {
    productId;
    constructor(metadata, productId) {
        super(metadata);
        this.productId = productId;
    }
    getEventType() { return 'ProductUpdated'; }
    getEntityType() { return 'product'; }
    getEntityId() { return this.productId; }
}
exports.ProductUpdated = ProductUpdated;
class ProductDeleted extends DomainEvent {
    productId;
    constructor(metadata, productId) {
        super(metadata);
        this.productId = productId;
    }
    getEventType() { return 'ProductDeleted'; }
    getEntityType() { return 'product'; }
    getEntityId() { return this.productId; }
}
exports.ProductDeleted = ProductDeleted;
// Événements Clients (ARCH-001: journal centralisé)
class CustomerCreated extends DomainEvent {
    customerId;
    constructor(metadata, customerId) {
        super(metadata);
        this.customerId = customerId;
    }
    getEventType() { return 'CustomerCreated'; }
    getEntityType() { return 'customer'; }
    getEntityId() { return this.customerId; }
}
exports.CustomerCreated = CustomerCreated;
class CustomerUpdated extends DomainEvent {
    customerId;
    constructor(metadata, customerId) {
        super(metadata);
        this.customerId = customerId;
    }
    getEventType() { return 'CustomerUpdated'; }
    getEntityType() { return 'customer'; }
    getEntityId() { return this.customerId; }
}
exports.CustomerUpdated = CustomerUpdated;
class CustomerDeleted extends DomainEvent {
    customerId;
    constructor(metadata, customerId) {
        super(metadata);
        this.customerId = customerId;
    }
    getEventType() { return 'CustomerDeleted'; }
    getEntityType() { return 'customer'; }
    getEntityId() { return this.customerId; }
}
exports.CustomerDeleted = CustomerDeleted;
// Événement Générique (pour transition)
class GenericEvent extends DomainEvent {
    eventType;
    data;
    constructor(metadata, eventType, data) {
        super(metadata);
        this.eventType = eventType;
        this.data = data;
    }
    getEventType() { return this.eventType; }
}
exports.GenericEvent = GenericEvent;
//# sourceMappingURL=domain-event.js.map