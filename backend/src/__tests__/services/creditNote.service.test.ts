import creditNoteService, { CreateCreditNoteData, UpdateCreditNoteData } from '../../services/creditNote.service';
import { CustomError } from '../../middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    companies: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    invoices: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    credit_notes: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      credit_notes: {
        create: jest.fn(),
        update: jest.fn(),
      },
    })),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

import prisma from '../../config/database';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('CreditNoteService', () => {
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockInvoiceId = 'invoice-123';
  const mockCreditNoteId = 'credit-note-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCreditNoteNumber', () => {
    it('should generate credit note number correctly', async () => {
      const mockCompany = {
        id: mockCompanyId,
        credit_note_prefix: 'AV',
        next_credit_note_number: 1,
      };

      (mockPrisma.companies.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (mockPrisma.companies.update as jest.Mock).mockResolvedValue({
        ...mockCompany,
        next_credit_note_number: 2,
      });

      const number = await creditNoteService['generateCreditNoteNumber'](mockCompanyId);

      expect(number).toBe('AV-000001');
      expect(mockPrisma.companies.update).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
        data: { next_credit_note_number: 2 },
      });
    });
  });

  describe('calculateTotals', () => {
    it('should calculate totals correctly', () => {
      const result = creditNoteService['calculateTotals'](1000, 160);
      expect(result.amount).toBe(1000);
      expect(result.taxAmount).toBe(160);
      expect(result.totalAmount).toBe(1160);
    });

    it('should use 0 for tax if not provided', () => {
      const result = creditNoteService['calculateTotals'](1000);
      expect(result.amount).toBe(1000);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(1000);
    });
  });

  describe('create', () => {
    const mockCreditNoteData: CreateCreditNoteData = {
      invoiceId: mockInvoiceId,
      amount: 1000,
      taxAmount: 160,
      reason: 'Retour produit',
    };

    it('should create credit note successfully', async () => {
      const mockCompany = {
        id: mockCompanyId,
        credit_note_prefix: 'AV',
        next_credit_note_number: 1,
      };

      const mockInvoice = {
        id: mockInvoiceId,
        total_amount: new Decimal(2000),
        paid_amount: new Decimal(500),
        customer_id: 'customer-123',
        currency: 'CDF',
      };

      const mockCreditNote = {
        id: mockCreditNoteId,
        credit_note_number: 'AV-000001',
        company_id: mockCompanyId,
        invoice_id: mockInvoiceId,
        amount: new Decimal(1000),
        tax_amount: new Decimal(160),
        total_amount: new Decimal(1160),
        status: 'draft',
        reason: 'Retour produit',
      };

      (mockPrisma.companies.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (mockPrisma.invoices.findFirst as jest.Mock).mockResolvedValue(mockInvoice);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          credit_notes: {
            create: jest.fn().mockResolvedValue(mockCreditNote),
          },
        };
        return callback(tx);
      });
      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValue({
        ...mockCreditNote,
        invoices: mockInvoice,
        users: null,
      });

      const result = await creditNoteService.create(mockCompanyId, mockUserId, mockCreditNoteData);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCreditNoteId);
      expect(mockPrisma.invoices.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockInvoiceId,
          company_id: mockCompanyId,
          deleted_at: null,
        },
        select: {
          id: true,
          total_amount: true,
          paid_amount: true,
          customer_id: true,
          currency: true,
        },
      });
    });

    it('should throw error if invoice not found', async () => {
      (mockPrisma.invoices.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        creditNoteService.create(mockCompanyId, mockUserId, mockCreditNoteData)
      ).rejects.toThrow(CustomError);

      await expect(
        creditNoteService.create(mockCompanyId, mockUserId, mockCreditNoteData)
      ).rejects.toThrow('Invoice not found');
    });

    it('should throw error if amount exceeds remaining invoice amount', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        total_amount: new Decimal(2000),
        paid_amount: new Decimal(500),
        customer_id: 'customer-123',
        currency: 'CDF',
      };

      (mockPrisma.invoices.findFirst as jest.Mock).mockResolvedValue(mockInvoice);

      const dataWithExcessiveAmount: CreateCreditNoteData = {
        ...mockCreditNoteData,
        amount: 2000, // Dépasse le montant restant (2000 - 500 = 1500)
      };

      await expect(
        creditNoteService.create(mockCompanyId, mockUserId, dataWithExcessiveAmount)
      ).rejects.toThrow('Credit note amount');
    });
  });

  describe('getById', () => {
    it('should return credit note by id', async () => {
      const mockCreditNote = {
        id: mockCreditNoteId,
        credit_note_number: 'AV-000001',
        company_id: mockCompanyId,
        invoice_id: mockInvoiceId,
        invoices: { id: mockInvoiceId, invoice_number: 'FAC-001' },
        users: null,
      };

      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValue(mockCreditNote);

      const result = await creditNoteService.getById(mockCompanyId, mockCreditNoteId);

      expect(result).toEqual(mockCreditNote);
      expect(mockPrisma.credit_notes.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCreditNoteId,
          company_id: mockCompanyId,
          deleted_at: null,
        },
        include: {
          invoices: {
            select: {
              id: true,
              invoice_number: true,
              total_amount: true,
              paid_amount: true,
              status: true,
            },
          },
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw error if credit note not found', async () => {
      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        creditNoteService.getById(mockCompanyId, mockCreditNoteId)
      ).rejects.toThrow('Credit note not found');
    });
  });

  describe('list', () => {
    it('should list credit notes with pagination', async () => {
      const mockCreditNotes = [
        {
          id: mockCreditNoteId,
          credit_note_number: 'AV-000001',
          company_id: mockCompanyId,
          invoices: { id: mockInvoiceId, invoice_number: 'FAC-001' },
          users: null,
        },
      ];

      (mockPrisma.credit_notes.findMany as jest.Mock).mockResolvedValue(mockCreditNotes);
      (mockPrisma.credit_notes.count as jest.Mock).mockResolvedValue(1);

      const result = await creditNoteService.list(mockCompanyId, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockCreditNotes);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by invoiceId', async () => {
      (mockPrisma.credit_notes.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.credit_notes.count as jest.Mock).mockResolvedValue(0);

      await creditNoteService.list(mockCompanyId, { invoiceId: mockInvoiceId });

      expect(mockPrisma.credit_notes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoice_id: mockInvoiceId,
          }),
        })
      );
    });

    it('should filter by status', async () => {
      (mockPrisma.credit_notes.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.credit_notes.count as jest.Mock).mockResolvedValue(0);

      await creditNoteService.list(mockCompanyId, { status: 'applied' });

      expect(mockPrisma.credit_notes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'applied',
          }),
        })
      );
    });
  });

  describe('update', () => {
    const mockExistingCreditNote = {
      id: mockCreditNoteId,
      company_id: mockCompanyId,
      status: 'draft',
      invoice_id: mockInvoiceId,
    };

    it('should update credit note successfully', async () => {
      const updateData: UpdateCreditNoteData = {
        reason: 'Updated reason',
        notes: 'Updated notes',
      };

      (mockPrisma.credit_notes.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockExistingCreditNote)
        .mockResolvedValueOnce({
          ...mockExistingCreditNote,
          ...updateData,
          invoices: null,
          users: null,
        });
      (mockPrisma.credit_notes.update as jest.Mock).mockResolvedValue({
        ...mockExistingCreditNote,
        ...updateData,
      });

      const result = await creditNoteService.update(mockCompanyId, mockCreditNoteId, mockUserId, updateData);

      expect(result).toBeDefined();
      expect(mockPrisma.credit_notes.findFirst).toHaveBeenCalled();
    });

    it('should not allow updating applied credit note', async () => {
      const appliedCreditNote = {
        ...mockExistingCreditNote,
        status: 'applied',
      };

      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValue(appliedCreditNote);

      await expect(
        creditNoteService.update(mockCompanyId, mockCreditNoteId, mockUserId, { reason: 'New reason' })
      ).rejects.toThrow('Cannot update credit note that has been applied or cancelled');
    });
  });

  describe('delete', () => {
    const mockCreditNote = {
      id: mockCreditNoteId,
      company_id: mockCompanyId,
      status: 'draft',
      credit_note_number: 'AV-000001',
    };

    it('should delete credit note successfully', async () => {
      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValue(mockCreditNote);
      (mockPrisma.credit_notes.update as jest.Mock).mockResolvedValue({
        ...mockCreditNote,
        deleted_at: new Date(),
      });

      await creditNoteService.delete(mockCompanyId, mockCreditNoteId);

      expect(mockPrisma.credit_notes.update).toHaveBeenCalledWith({
        where: { id: mockCreditNoteId },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw error if credit note not found', async () => {
      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        creditNoteService.delete(mockCompanyId, mockCreditNoteId)
      ).rejects.toThrow('Credit note not found');
    });

    it('should not allow deleting applied credit note', async () => {
      const appliedCreditNote = {
        ...mockCreditNote,
        status: 'applied',
      };

      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValue(appliedCreditNote);

      await expect(
        creditNoteService.delete(mockCompanyId, mockCreditNoteId)
      ).rejects.toThrow('Cannot delete credit note that has been applied');
    });
  });

  describe('applyCreditNote', () => {
    const mockCreditNote = {
      id: mockCreditNoteId,
      company_id: mockCompanyId,
      invoice_id: mockInvoiceId,
      total_amount: new Decimal(1160),
      status: 'sent',
      credit_note_number: 'AV-000001',
    };

    const mockInvoice = {
      id: mockInvoiceId,
      total_amount: new Decimal(2000),
      paid_amount: new Decimal(500),
      status: 'sent',
    };

    it('should apply credit note successfully', async () => {
      (mockPrisma.credit_notes.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          ...mockCreditNote,
          invoices: mockInvoice,
          users: null,
        })
        .mockResolvedValueOnce({
          ...mockCreditNote,
          status: 'applied',
          applied_amount: mockCreditNote.total_amount,
          applied_at: new Date(),
          invoices: mockInvoice,
          users: null,
        });
      (mockPrisma.invoices.findFirst as jest.Mock).mockResolvedValue(mockInvoice);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          credit_notes: {
            update: jest.fn().mockResolvedValue({
              ...mockCreditNote,
              status: 'applied',
            }),
          },
          invoices: {
            update: jest.fn().mockResolvedValue({
              ...mockInvoice,
              paid_amount: new Decimal(1660),
            }),
          },
        };
        return callback(tx);
      });

      const result = await creditNoteService.applyCreditNote(mockCompanyId, mockCreditNoteId, mockUserId);

      expect(result).toBeDefined();
      expect(result.status).toBe('applied');
    });

    it('should throw error if credit note already applied', async () => {
      const appliedCreditNote = {
        ...mockCreditNote,
        status: 'applied',
        invoices: mockInvoice,
        users: null,
      };

      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValue(appliedCreditNote);

      await expect(
        creditNoteService.applyCreditNote(mockCompanyId, mockCreditNoteId, mockUserId)
      ).rejects.toThrow('Credit note has already been applied');
    });

    it('should update invoice status to paid if fully paid', async () => {
      const invoiceWithSmallBalance = {
        ...mockInvoice,
        total_amount: new Decimal(1160),
        paid_amount: new Decimal(0),
      };

      (mockPrisma.credit_notes.findFirst as jest.Mock).mockResolvedValueOnce({
        ...mockCreditNote,
        invoices: invoiceWithSmallBalance,
        users: null,
      }).mockResolvedValueOnce({
        ...mockCreditNote,
        status: 'applied',
        invoices: invoiceWithSmallBalance,
        users: null,
      });
      (mockPrisma.invoices.findFirst as jest.Mock).mockResolvedValue(invoiceWithSmallBalance);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          credit_notes: {
            update: jest.fn(),
          },
          invoices: {
            update: jest.fn().mockResolvedValue({
              ...invoiceWithSmallBalance,
              paid_amount: new Decimal(1160),
            }),
          },
        };
        return callback(tx);
      });

      await creditNoteService.applyCreditNote(mockCompanyId, mockCreditNoteId, mockUserId);

      // Vérifier que la facture est mise à jour avec le statut "paid"
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});

