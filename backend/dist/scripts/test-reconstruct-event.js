"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_registry_1 = require("../events/event-registry");
const domain_event_1 = require("../events/domain-event");
async function testReconstruct() {
    console.log('--- Testing reconstructEvent ---');
    const metadata = {
        companyId: 'test-company',
        userId: 'test-user',
        timestamp: new Date()
    };
    const data = {
        invoiceId: 'inv-123',
        invoiceNumber: 'INV-001',
        previousStatus: 'draft',
        newStatus: 'sent',
        reason: 'Client requested send'
    };
    const event = (0, event_registry_1.reconstructEvent)('InvoiceStatusChanged', metadata, data);
    if (event instanceof domain_event_1.InvoiceStatusChangedEvent) {
        console.log('✅ PASS: Event reconstructed correctly');
        console.log('Event Type:', event.getEventType());
        console.log('Invoice ID:', event.invoiceId);
    }
    else {
        console.log('❌ FAIL: Event reconstruction failed or wrong type');
    }
}
testReconstruct().catch(console.error);
//# sourceMappingURL=test-reconstruct-event.js.map