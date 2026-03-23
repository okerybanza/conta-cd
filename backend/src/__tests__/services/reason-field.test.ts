/**
 * Integration tests for ACCT-001 reason field compliance
 * Validates reason field is properly stored and retrieved across models
 */

import prisma from '../../config/database';
import { randomUUID } from 'crypto';

describe('ACCT-001: Reason Field Compliance', () => {
  describe('Database reason field support', () => {
    it('should support reason field in journal_entries', async () => {
      const testId = randomUUID();
      const testReason = 'Test reason for journal entry';

      // Create entry with reason
      const entry = await prisma.journal_entries.create({
        data: {
          id: testId,
          entry_date: new Date(),
          entry_number: `JE-${Date.now()}`,
          description: 'Test entry',
          source_type: 'manual',
          status: 'draft',
          reason: testReason,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(entry.reason).toBe(testReason);

      // Verify retrieval
      const retrieved = await prisma.journal_entries.findUnique({
        where: { id: testId },
      });
      expect(retrieved?.reason).toBe(testReason);

      // Clean up
      await prisma.journal_entries.delete({ where: { id: testId } });
    });

    it('should support reason field in invoices', async () => {
      const testId = randomUUID();
      const testReason = 'Invoice created for client - Q3 billing';

      const invoice = await prisma.invoices.create({
        data: {
          id: testId,
          company_id: randomUUID(),
          customer_id: randomUUID(),
          invoice_number: `INV-${Date.now()}`,
          invoice_date: new Date(),
          due_date: new Date(),
          status: 'draft',
          currency: 'CDF',
          subtotal: 1000,
          tax_amount: 160,
          total_amount: 1160,
          paid_amount: 0,
          reason: testReason,
          created_by: randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(invoice.reason).toBe(testReason);

      // Clean up
      await prisma.invoices.delete({ where: { id: testId } });
    });

    it('should support reason field in payments', async () => {
      const testId = randomUUID();
      const testReason = 'Payment confirmed via mobile money';

      const payment = await prisma.payments.create({
        data: {
          id: testId,
          company_id: randomUUID(),
          invoice_id: randomUUID(),
          amount: 5800,
          currency: 'CDF',
          payment_method: 'mobile_money',
          status: 'confirmed',
          reason: testReason,
          created_by: randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(payment.reason).toBe(testReason);

      // Clean up
      await prisma.payments.delete({ where: { id: testId } });
    });

    it('should support reason field in expenses', async () => {
      const testId = randomUUID();
      const testReason = 'Office supplies - monthly operational expense';

      const expense = await prisma.expenses.create({
        data: {
          id: testId,
          company_id: randomUUID(),
          expense_number: `EXP-${Date.now()}`,
          expense_date: new Date(),
          description: 'Supplies',
          amount_ht: 500,
          amount_ttc: 580,
          payment_method: 'cash',
          status: 'draft',
          reason: testReason,
          created_by: randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(expense.reason).toBe(testReason);

      // Clean up
      await prisma.expenses.delete({ where: { id: testId } });
    });

    it('should support reason field in audit_logs', async () => {
      const testId = randomUUID();
      const testReason = 'Manual correction - ACCT-001 compliance';

      const auditLog = await prisma.audit_logs.create({
        data: {
          id: testId,
          action: 'UPDATE',
          entity: 'invoice',
          reason: testReason,
          created_at: new Date(),
        },
      });

      expect(auditLog.reason).toBe(testReason);

      // Clean up
      await prisma.audit_logs.delete({ where: { id: testId } });
    });

    it('should handle null reason for backward compatibility', async () => {
      const testId = randomUUID();

      const entry = await prisma.journal_entries.create({
        data: {
          id: testId,
          entry_date: new Date(),
          entry_number: `JE-${Date.now()}`,
          description: 'Entry without reason',
          source_type: 'manual',
          status: 'draft',
          // reason not provided, should default to null
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(entry.reason).toBeNull();

      // Clean up
      await prisma.journal_entries.delete({ where: { id: testId } });
    });

    it('should handle special characters in reason field', async () => {
      const testId = randomUUID();
      const specialReason = "Invoice: 'quotes' \"double\" @#$% unicode: é ñ 中文";

      const payment = await prisma.payments.create({
        data: {
          id: testId,
          company_id: randomUUID(),
          invoice_id: randomUUID(),
          amount: 1000,
          currency: 'CDF',
          payment_method: 'cash',
          status: 'confirmed',
          reason: specialReason,
          created_by: randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(payment.reason).toBe(specialReason);

      // Clean up
      await prisma.payments.delete({ where: { id: testId } });
    });

    it('should handle 500 character maximum length', async () => {
      const testId = randomUUID();
      const maxLengthReason = 'a'.repeat(500);

      const expense = await prisma.expenses.create({
        data: {
          id: testId,
          company_id: randomUUID(),
          expense_number: `EXP-${Date.now()}`,
          expense_date: new Date(),
          description: 'Test',
          amount_ht: 100,
          amount_ttc: 116,
          payment_method: 'cash',
          status: 'draft',
          reason: maxLengthReason,
          created_by: randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      expect(expense.reason?.length).toBe(500);

      // Clean up
      await prisma.expenses.delete({ where: { id: testId } });
    });

    it('should preserve whitespace in reason field', async () => {
      const testId = randomUUID();
      const reasonWithSpaces = '  Reason  with   multiple  spaces  ';

      const auditLog = await prisma.audit_logs.create({
        data: {
          id: testId,
          action: 'UPDATE',
          entity: 'expense',
          reason: reasonWithSpaces,
          created_at: new Date(),
        },
      });

      expect(auditLog.reason).toBe(reasonWithSpaces);

      // Clean up
      await prisma.audit_logs.delete({ where: { id: testId } });
    });
  });

  describe('Reason field data integrity', () => {
    it('should maintain reason data across create and read cycles', async () => {
      const testId = randomUUID();
      const originalReason = 'Data integrity test - verify persistence';

      // Create
      await prisma.journal_entries.create({
        data: {
          id: testId,
          entry_date: new Date(),
          entry_number: `JE-${Date.now()}`,
          description: 'Integrity test',
          source_type: 'manual',
          status: 'draft',
          reason: originalReason,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Read multiple times
      for (let i = 0; i < 3; i++) {
        const entry = await prisma.journal_entries.findUnique({
          where: { id: testId },
        });
        expect(entry?.reason).toBe(originalReason);
      }

      // Clean up
      await prisma.journal_entries.delete({ where: { id: testId } });
    });

    it('should support reason field updates', async () => {
      const testId = randomUUID();
      const initialReason = 'Initial reason';
      const updatedReason = 'Updated reason';

      // Create with initial reason
      await prisma.invoices.create({
        data: {
          id: testId,
          company_id: randomUUID(),
          customer_id: randomUUID(),
          invoice_number: `INV-${Date.now()}`,
          invoice_date: new Date(),
          due_date: new Date(),
          status: 'draft',
          currency: 'CDF',
          subtotal: 1000,
          tax_amount: 0,
          total_amount: 1000,
          paid_amount: 0,
          reason: initialReason,
          created_by: randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Update reason
      const updated = await prisma.invoices.update({
        where: { id: testId },
        data: { reason: updatedReason },
      });

      expect(updated.reason).toBe(updatedReason);

      // Clean up
      await prisma.invoices.delete({ where: { id: testId } });
    });
  });
});
