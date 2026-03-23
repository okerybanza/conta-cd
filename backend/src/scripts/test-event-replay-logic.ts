import prisma from '../config/database';
import { eventBus } from '../events/event-bus';
import eventReplayService from '../services/eventReplay.service';
import { InvoiceStatusChangedEvent } from '../events/domain-event';
import { randomUUID } from 'crypto';

async function testReplay() {
    console.log('--- Testing Event Replay Service ---');

    // Get a valid companyId
    const company = await prisma.companies.findFirst();
    if (!company) {
        console.error('No company found in database. Cannot run test.');
        return;
    }
    const companyId = company.id;
    const invoiceId = 'inv-replay-' + Date.now();

    // 1. Create a "fake" event in the database
    const eventId = 'InvoiceStatusChanged_test_' + Date.now();
    
    await prisma.domain_events.create({
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
    eventBus.subscribe('InvoiceStatusChanged', async (event: any) => {
        if (event.invoiceId === invoiceId) {
            console.log('✅ Handler triggered for replayed event:', event.invoiceId);
            handlerCalled = true;
        }
    });

    // 3. Trigger replay
    console.log('Triggering replay...');
    const replayedCount = await eventReplayService.replayEvents({
        companyId,
        type: 'InvoiceStatusChanged',
        entityId: invoiceId // Narrow down to our specific test invoice
    });

    if (replayedCount > 0 && handlerCalled) {
        console.log('✅ PASS: Event replayed and handler executed');
    } else {
        console.log('❌ FAIL: Event not replayed or handler not called', { replayedCount, handlerCalled });
    }

    // 4. Cleanup
    console.log('Cleaning up...');
    await prisma.domain_events.delete({ where: { id: eventId } });
    
    console.log('--- Test Complete ---');
}

testReplay().catch(console.error).finally(() => prisma.$disconnect());
