import { reconstructEvent } from '../events/event-registry';
import { InvoiceStatusChangedEvent } from '../events/domain-event';

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

    const event = reconstructEvent('InvoiceStatusChanged', metadata, data);

    if (event instanceof InvoiceStatusChangedEvent) {
        console.log('✅ PASS: Event reconstructed correctly');
        console.log('Event Type:', event.getEventType());
        console.log('Invoice ID:', event.invoiceId);
    } else {
        console.log('❌ FAIL: Event reconstruction failed or wrong type');
    }
}

testReconstruct().catch(console.error);
