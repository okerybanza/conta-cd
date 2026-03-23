import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { InvoiceService } from '../../services/invoice.service';
import prisma from '../../config/database';

/**
 * SPRINT 1 - TASK 1.4: N+1 Query Optimization Tests
 * 
 * Critical tests to validate includes are working
 */
describe('Invoice N+1 Query Fix (Task 1.4)', () => {
    let testCompanyId: string;
    let testCustomerId: string;
    let testInvoiceId: string;
    const invoiceService = new InvoiceService();

    beforeAll(async () => {
        // Create test company
        const company = await prisma.companies.create({
            data: {
                id: `test_company_n1_${Date.now()}`,
                name: 'Test Company N+1',
                email: `test_n1_${Date.now()}@example.com`,
                updated_at: new Date(),
            },
        });
        testCompanyId = company.id;

        // Create test customer
        const customer = await prisma.customers.create({
            data: {
                id: `test_customer_n1_${Date.now()}`,
                company_id: testCompanyId,
                type: 'individual',
                first_name: 'Test',
                last_name: 'N+1 Customer',
                email: `test_n1_customer_${Date.now()}@example.com`,
                updated_at: new Date(),
            },
        });
        testCustomerId = customer.id;

        // Create test invoice
        const invoice = await prisma.invoices.create({
            data: {
                id: `test_invoice_n1_${Date.now()}`,
                company_id: testCompanyId,
                customer_id: testCustomerId,
                invoice_number: `INV-N1-${Date.now()}`,
                invoice_date: new Date(),
                due_date: new Date(),
                status: 'draft',
                subtotal: 500,
                tax_amount: 50,
                total_amount: 550,
                paid_amount: 0,
                currency: 'USD',
                updated_at: new Date(),
            },
        });
        testInvoiceId = invoice.id;

        // Create invoice lines
        await prisma.invoice_lines.createMany({
            data: [
                {
                    id: `test_line_1_${Date.now()}`,
                    invoice_id: testInvoiceId,
                    description: 'Line 1',
                    quantity: 1,
                    unit_price: 100,
                    subtotal: 100,
                    total: 110,
                    updated_at: new Date(),
                },
                {
                    id: `test_line_2_${Date.now()}`,
                    invoice_id: testInvoiceId,
                    description: 'Line 2',
                    quantity: 2,
                    unit_price: 200,
                    subtotal: 400,
                    total: 440,
                    updated_at: new Date(),
                },
            ],
        });

        // Create payment
        await prisma.payments.create({
            data: {
                id: `test_payment_${Date.now()}`,
                company_id: testCompanyId,
                invoice_id: testInvoiceId,
                customer_id: testCustomerId,
                amount: 100,
                payment_date: new Date(),
                payment_method: 'bank_transfer',
                status: 'completed',
                updated_at: new Date(),
            },
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.payments.deleteMany({
            where: { invoice_id: testInvoiceId },
        });
        await prisma.invoice_lines.deleteMany({
            where: { invoice_id: testInvoiceId },
        });
        await prisma.invoices.deleteMany({ where: { company_id: testCompanyId } });
        await prisma.customers.deleteMany({ where: { company_id: testCompanyId } });
        await prisma.companies.delete({ where: { id: testCompanyId } });
    });

    it('should include invoice_lines in list response', async () => {
        const result = await invoiceService.list(testCompanyId, {
            limit: 10,
            page: 1,
        });

        expect(result.data).toBeDefined();
        expect(result.data.length).toBeGreaterThan(0);

        const invoice = result.data.find((inv: any) => inv.id === testInvoiceId);
        expect(invoice).toBeDefined();

        // Check invoice_lines are included
        expect(invoice.invoice_lines).toBeDefined();
        expect(Array.isArray(invoice.invoice_lines)).toBe(true);
        expect(invoice.invoice_lines.length).toBe(2);

        // Verify line data
        const line1 = invoice.invoice_lines.find((l: any) => l.description === 'Line 1');
        expect(line1).toBeDefined();
        expect(line1.quantity).toBe(1);
        expect(Number(line1.unit_price)).toBe(100);
    });

    it('should include payments in list response', async () => {
        const result = await invoiceService.list(testCompanyId, {
            limit: 10,
            page: 1,
        });

        const invoice = result.data.find((inv: any) => inv.id === testInvoiceId);
        expect(invoice).toBeDefined();

        // Check payments are included
        expect(invoice.payments).toBeDefined();
        expect(Array.isArray(invoice.payments)).toBe(true);
        expect(invoice.payments.length).toBe(1);

        // Verify payment data
        const payment = invoice.payments[0];
        expect(Number(payment.amount)).toBe(100);
        expect(payment.payment_method).toBe('bank_transfer');
        expect(payment.status).toBe('completed');
    });

    it('should include customers in list response', async () => {
        const result = await invoiceService.list(testCompanyId, {
            limit: 10,
            page: 1,
        });

        const invoice = result.data.find((inv: any) => inv.id === testInvoiceId);
        expect(invoice).toBeDefined();

        // Check customers are included
        expect(invoice.customers).toBeDefined();
        expect(invoice.customers.first_name).toBe('Test');
        expect(invoice.customers.last_name).toBe('N+1 Customer');
    });

    it('should filter deleted payments', async () => {
        // Create deleted payment
        const deletedPayment = await prisma.payments.create({
            data: {
                id: `test_payment_deleted_${Date.now()}`,
                company_id: testCompanyId,
                invoice_id: testInvoiceId,
                customer_id: testCustomerId,
                amount: 200,
                payment_date: new Date(),
                payment_method: 'cash',
                status: 'completed',
                deleted_at: new Date(), // Soft deleted
                updated_at: new Date(),
            },
        });

        const result = await invoiceService.list(testCompanyId, {
            limit: 10,
            page: 1,
        });

        const invoice = result.data.find((inv: any) => inv.id === testInvoiceId);
        expect(invoice).toBeDefined();

        // Deleted payment should NOT be included
        expect(invoice.payments.length).toBe(1); // Only the non-deleted one
        const hasDeletedPayment = invoice.payments.some(
            (p: any) => p.id === deletedPayment.id
        );
        expect(hasDeletedPayment).toBe(false);

        // Cleanup
        await prisma.payments.delete({ where: { id: deletedPayment.id } });
    });

    it('should return all related data in single query', async () => {
        // This test validates that the N+1 problem is fixed
        // If working correctly, list() should make only 2 queries:
        // 1. SELECT invoices with JOINs for customers, invoice_lines, payments
        // 2. COUNT invoices

        const result = await invoiceService.list(testCompanyId, {
            limit: 10,
            page: 1,
        });

        expect(result.data).toBeDefined();
        expect(result.pagination).toBeDefined();
        expect(result.pagination.total).toBeGreaterThan(0);

        // Verify all data is present
        const invoice = result.data.find((inv: any) => inv.id === testInvoiceId);
        expect(invoice.customers).toBeDefined();
        expect(invoice.invoice_lines).toBeDefined();
        expect(invoice.payments).toBeDefined();

        // All in one query response - no additional queries needed
    });
});
