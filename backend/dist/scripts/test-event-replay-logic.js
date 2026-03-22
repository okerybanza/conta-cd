"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const event_bus_1 = require("../events/event-bus");
const eventReplay_service_1 = __importDefault(require("../services/eventReplay.service"));
async function testReplay() {
    console.log('--- Testing Event Replay Service ---');
    // Get a valid companyId
    const company = await database_1.default.companies.findFirst();
    if (!company) {
        console.error('No company found in database. Cannot run test.');
        return;
    }
    const companyId = company.id;
    const invoiceId = 'inv-replay-' + Date.now();
    // 1. Create a "fake" event in the database
    const eventId = 'InvoiceStatusChanged_test_' + Date.now();
    await database_1.default.domain_events.create({
        data: {
            id: eventId,
            type: 'InvoiceStatusChanged',
            entity_type: 'invoice',
            entity_id: invoiceId,
            company_id: companyId,
            occurred_at: new Date(),
            data: {
                invoiceId: invoiceId,
                invoiceNumber: 'REPLAY-001',
                previousStatus: 'draft',
                newStatus: 'sent',
                reason: 'Test Replay'
            },
            metadata: {
                companyId: companyId,
                userId: 'test-admin',
                timestamp: new Date()
            }
        }
    });
    console.log('Faked event created in database for company:', companyId);
    // 2. Setup a temporary spy handler
    let handlerCalled = false;
    event_bus_1.eventBus.subscribe('InvoiceStatusChanged', async (event) => {
        if (event.invoiceId === invoiceId) {
            console.log('✅ Handler triggered for replayed event:', event.invoiceId);
            handlerCalled = true;
        }
    });
    // 3. Trigger replay
    console.log('Triggering replay...');
    const replayedCount = await eventReplay_service_1.default.replayEvents({
        companyId,
        type: 'InvoiceStatusChanged',
        entityId: invoiceId // Narrow down to our specific test invoice
    });
    if (replayedCount > 0 && handlerCalled) {
        console.log('✅ PASS: Event replayed and handler executed');
    }
    else {
        console.log('❌ FAIL: Event not replayed or handler not called', { replayedCount, handlerCalled });
    }
    // 4. Cleanup
    console.log('Cleaning up...');
    await database_1.default.domain_events.delete({ where: { id: eventId } });
    console.log('--- Test Complete ---');
}
testReplay().catch(console.error).finally(() => database_1.default.$disconnect());
//# sourceMappingURL=test-event-replay-logic.js.map