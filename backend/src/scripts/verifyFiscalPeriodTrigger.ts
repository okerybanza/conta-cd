import prisma from '../config/database';

async function testTrigger() {
    console.log('🚀 Testing Fiscal Period Lock Trigger...');

    try {
        const company = await prisma.companies.findFirst();
        if (!company) {
            console.error('❌ No company found for testing');
            return;
        }

        console.log(`Using company: ${company.id}`);

        // 1. Create a period and LOCK it
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        console.log('Creating and locking a test period...');
        const period = await prisma.fiscal_periods.upsert({
            where: { id: 'test-locked-period' },
            create: {
                id: 'test-locked-period',
                company_id: company.id,
                name: 'Test Locked Period',
                start_date: start,
                end_date: end,
                status: 'locked',
                updated_at: new Date()
            },
            update: {
                status: 'locked'
            }
        });

        // 2. Attempt to create a journal entry in this period
        console.log('Attempting to insert a journal entry into the locked period...');
        await prisma.journal_entries.create({
            data: {
                id: 'test-entry-fp-lock',
                company_id: company.id,
                entry_number: 'TEST-LOCK-001',
                entry_date: today,
                description: 'This should fail',
                status: 'draft',
                updated_at: new Date()
            }
        });

        console.log('❌ Error: The trigger did not block the insertion!');
    } catch (error: any) {
        console.log('✅ Success: The trigger blocked the operation.');
        console.log('Error Name:', error.name);
        console.log('Error Code:', error.code);
        console.log('Error Message:', error.message);

        if (error.meta) {
            console.log('Error Meta:', JSON.stringify(error.meta, null, 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}

testTrigger();
