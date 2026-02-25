"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRegistry = void 0;
exports.reconstructEvent = reconstructEvent;
const Events = __importStar(require("./domain-event"));
exports.EventRegistry = {
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
    // ARCH-001: Product & Customer (journal centralisé)
    'ProductCreated': Events.ProductCreated,
    'ProductUpdated': Events.ProductUpdated,
    'ProductDeleted': Events.ProductDeleted,
    'CustomerCreated': Events.CustomerCreated,
    'CustomerUpdated': Events.CustomerUpdated,
    'CustomerDeleted': Events.CustomerDeleted,
};
/**
 * Re-instantiate an event from stored data
 */
function reconstructEvent(type, metadata, data) {
    const Constructor = exports.EventRegistry[type];
    if (!Constructor)
        return null;
    // Most events have (metadata, ...publicFields)
    // We need to pass the data fields in the correct order or as an object depending on the constructor.
    // Given our DomainEvent classes use the pattern: constructor(metadata, field1, field2, ...)
    // We'll use a hack or standardized pattern if we can't easily map.
    // NOTE: In a more robust system, each event would have a fromJSON static method.
    // For now, we'll try to match the most common pattern or handle specific cases.
    try {
        switch (type) {
            case 'InvoiceStatusChanged':
                return new Constructor(metadata, data.invoiceId, data.invoiceNumber, data.previousStatus, data.newStatus, data.reason);
            case 'JournalEntryPosted':
                return new Constructor(metadata, data.entryId, data.entryNumber, data.entryDate, data.lines);
            case 'StockMovementCreated':
                return new Constructor(metadata, data.movementId, data.movementType, data.reference, data.referenceId, data.reason);
            case 'ProductCreated':
            case 'ProductUpdated':
            case 'ProductDeleted':
                return new Constructor(metadata, data.productId);
            case 'CustomerCreated':
            case 'CustomerUpdated':
            case 'CustomerDeleted':
                return new Constructor(metadata, data.customerId);
            default:
                return null;
        }
    }
    catch (e) {
        console.error(`Failed to reconstruct event of type ${type}`, e);
        return null;
    }
}
//# sourceMappingURL=event-registry.js.map