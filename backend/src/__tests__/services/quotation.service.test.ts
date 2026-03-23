import quotationService from '../../services/quotation.service';
import prisma from '../../config/database';

// Cast prisma as any to avoid TypeScript errors with mocked methods
const mockPrisma = prisma as any;
import { CustomError } from '../../middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';
import invoiceService from '../../services/invoice.service';

// Mock Prisma
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    companies: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    customers: {
      findFirst: jest.fn(),
    },
    quotations: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    quotation_lines: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      quotations: {
        create: jest.fn(),
        update: jest.fn(),
      },
      quotation_lines: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    })),
  },
}));

// Mock invoiceService
jest.mock('../../services/invoice.service', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
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

describe('QuotationService', () => {
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockCustomerId = 'customer-123';
  const mockQuotationId = 'quotation-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockQuotationData = {
      customerId: mockCustomerId,
      quotationDate: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lines: [
        {
          name: 'Service de conseil',
          quantity: 10,
          unitPrice: 100,
          taxRate: 16,
        },
      ],
    };

    it('should create a quotation successfully', async () => {
      const mockCompany = {
        id: mockCompanyId,
        quotation_prefix: 'DEV',
        next_quotation_number: 1,
      };

      const mockCustomer = {
        id: mockCustomerId,
        companyId: mockCompanyId,
        deletedAt: null,
      };

      const mockQuotation = {
        id: mockQuotationId,
        quotationNumber: 'DEV-000001',
        companyId: mockCompanyId,
        customerId: mockCustomerId,
        status: 'draft',
        subtotal: new Decimal(1000),
        taxAmount: new Decimal(160),
        totalAmount: new Decimal(1160),
      };

      (mockPrisma.companies.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (mockPrisma.customers.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          quotations: {
            create: jest.fn().mockResolvedValue(mockQuotation),
          },
          quotation_lines: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });
      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue({
        ...mockQuotation,
        customer: mockCustomer,
        lines: [],
        invoice: null,
        creator: null,
      });

      const result = await quotationService.create(mockCompanyId, mockUserId, mockQuotationData);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockQuotationId);
      expect(mockPrisma.customers.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCustomerId,
          company_id: mockCompanyId,
          deleted_at: null,
        },
      });
      expect(mockPrisma.companies.findUnique).toHaveBeenCalled();
    });

    it('should throw error if customer not found', async () => {
      (mockPrisma.customers.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        quotationService.create(mockCompanyId, mockUserId, mockQuotationData)
      ).rejects.toThrow(CustomError);

      await expect(
        quotationService.create(mockCompanyId, mockUserId, mockQuotationData)
      ).rejects.toThrow('Customer not found');
    });

    it('should throw error if no lines provided', async () => {
      const mockCustomer = {
        id: mockCustomerId,
        companyId: mockCompanyId,
        deletedAt: null,
      };

      (mockPrisma.customers.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      await expect(
        quotationService.create(mockCompanyId, mockUserId, {
          ...mockQuotationData,
          lines: [],
        })
      ).rejects.toThrow('Quotation must have at least one line');
    });

    it('should generate quotation number correctly', async () => {
      const mockCompany = {
        id: mockCompanyId,
        quotation_prefix: 'DEV',
        next_quotation_number: 5,
      };

      const mockCustomer = {
        id: mockCustomerId,
        companyId: mockCompanyId,
        deletedAt: null,
      };

      const mockQuotation = {
        id: mockQuotationId,
        quotationNumber: 'DEV-000005',
        companyId: mockCompanyId,
        customerId: mockCustomerId,
        status: 'draft',
      };

      (mockPrisma.companies.findUnique as jest.Mock).mockResolvedValue(mockCompany);
      (mockPrisma.customers.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          quotations: {
            create: jest.fn().mockResolvedValue(mockQuotation),
          },
          quotation_lines: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });
      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue({
        ...mockQuotation,
        customer: mockCustomer,
        lines: [],
        invoice: null,
        creator: null,
      });

      await quotationService.create(mockCompanyId, mockUserId, mockQuotationData);

      expect(mockPrisma.companies.update).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
        data: { next_quotation_number: 6 },
      });
    });
  });

  describe('getById', () => {
    it('should return quotation by id', async () => {
      const mockQuotation = {
        id: mockQuotationId,
        quotationNumber: 'DEV-000001',
        companyId: mockCompanyId,
        customerId: mockCustomerId,
        customer: { id: mockCustomerId },
        lines: [],
        invoice: null,
        creator: null,
      };

      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(mockQuotation);

      const result = await quotationService.getById(mockCompanyId, mockQuotationId);

      expect(result).toEqual(mockQuotation);
      expect(mockPrisma.quotations.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockQuotationId,
          company_id: mockCompanyId,
          deleted_at: null,
        },
        include: {
          customers: true,
          quotation_lines: true,
          invoices: {
            select: {
              id: true,
              invoice_number: true,
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

    it('should throw error if quotation not found', async () => {
      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        quotationService.getById(mockCompanyId, mockQuotationId)
      ).rejects.toThrow('Quotation not found');
    });
  });

  describe('list', () => {
    it('should list quotations with pagination', async () => {
      const mockQuotations = [
        {
          id: mockQuotationId,
          quotationNumber: 'DEV-000001',
          companyId: mockCompanyId,
          customer: { id: mockCustomerId },
        },
      ];

      (mockPrisma.quotations.findMany as jest.Mock).mockResolvedValue(mockQuotations);
      (mockPrisma.quotations.count as jest.Mock).mockResolvedValue(1);

      const result = await quotationService.list(mockCompanyId, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockQuotations);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by status', async () => {
      const mockQuotations = [
        {
          id: mockQuotationId,
          quotationNumber: 'DEV-000001',
          status: 'sent',
          companyId: mockCompanyId,
          customer: { id: mockCustomerId },
        },
      ];

      (mockPrisma.quotations.findMany as jest.Mock).mockResolvedValue(mockQuotations);
      (mockPrisma.quotations.count as jest.Mock).mockResolvedValue(1);

      const result = await quotationService.list(mockCompanyId, { status: 'sent' });

      expect(result.data).toEqual(mockQuotations);
      expect(mockPrisma.quotations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'sent',
          }),
        })
      );
    });

    it('should filter by customer', async () => {
      (mockPrisma.quotations.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.quotations.count as jest.Mock).mockResolvedValue(0);

      await quotationService.list(mockCompanyId, { customerId: mockCustomerId });

      expect(mockPrisma.quotations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customer_id: mockCustomerId,
          }),
        })
      );
    });

    it('should search by quotation number or reference', async () => {
      (mockPrisma.quotations.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.quotations.count as jest.Mock).mockResolvedValue(0);

      await quotationService.list(mockCompanyId, { search: 'DEV-001' });

      expect(mockPrisma.quotations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                quotation_number: expect.objectContaining({
                  contains: 'DEV-001',
                }),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('update', () => {
    const mockExistingQuotation = {
      id: mockQuotationId,
      companyId: mockCompanyId,
      customerId: mockCustomerId,
      status: 'draft',
      invoiceId: null,
      transportFees: new Decimal(0),
      platformFees: new Decimal(0),
    };

    it('should update quotation successfully', async () => {
      const updateData = {
        notes: 'Updated notes',
        status: 'sent' as const,
      };

      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(mockExistingQuotation);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          quotations: {
            update: jest.fn().mockResolvedValue({
              ...mockExistingQuotation,
              ...updateData,
            }),
          },
          quotation_lines: {
            deleteMany: jest.fn(),
            create: jest.fn(),
          },
        };
        return callback(tx);
      });
      (mockPrisma.quotations.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockExistingQuotation)
        .mockResolvedValueOnce({
          ...mockExistingQuotation,
          ...updateData,
          customer: { id: mockCustomerId },
          lines: [],
          invoice: null,
          creator: null,
        });

      const result = await quotationService.update(mockCompanyId, mockQuotationId, mockUserId, updateData);

      expect(result).toBeDefined();
      expect(mockPrisma.quotations.findFirst).toHaveBeenCalled();
    });

    it('should not allow updating accepted quotation', async () => {
      const acceptedQuotation = {
        ...mockExistingQuotation,
        status: 'accepted',
      };

      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(acceptedQuotation);

      await expect(
        quotationService.update(mockCompanyId, mockQuotationId, mockUserId, { notes: 'test' })
      ).rejects.toThrow('Cannot update quotation that has been accepted or converted to invoice');
    });

    it('should not allow updating converted quotation', async () => {
      const convertedQuotation = {
        ...mockExistingQuotation,
        invoice_id: 'invoice-123',
      };

      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(convertedQuotation);

      await expect(
        quotationService.update(mockCompanyId, mockQuotationId, mockUserId, { notes: 'test' })
      ).rejects.toThrow('Cannot update quotation that has been accepted or converted to invoice');
    });

    it('should update status timestamps correctly', async () => {
      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(mockExistingQuotation);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          quotations: {
            update: jest.fn().mockResolvedValue(mockExistingQuotation),
          },
          quotation_lines: {
            deleteMany: jest.fn(),
            create: jest.fn(),
          },
        };
        return callback(tx);
      });
      (mockPrisma.quotations.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockExistingQuotation)
        .mockResolvedValueOnce({
          ...mockExistingQuotation,
          status: 'sent',
          sentAt: new Date(),
          customer: { id: mockCustomerId },
          lines: [],
          invoice: null,
          creator: null,
        });

      await quotationService.update(mockCompanyId, mockQuotationId, mockUserId, {
        status: 'sent',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should recalculate totals when lines are updated', async () => {
      const updateData = {
        lines: [
          {
            name: 'New service',
            quantity: 5,
            unitPrice: 200,
            taxRate: 16,
          },
        ],
      };

      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(mockExistingQuotation);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          quotations: {
            update: jest.fn().mockResolvedValue(mockExistingQuotation),
          },
          quotation_lines: {
            deleteMany: jest.fn(),
            create: jest.fn(),
          },
        };
        return callback(tx);
      });
      (mockPrisma.quotations.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockExistingQuotation)
        .mockResolvedValueOnce({
          ...mockExistingQuotation,
          customer: { id: mockCustomerId },
          lines: [],
          invoice: null,
          creator: null,
        });

      await quotationService.update(mockCompanyId, mockQuotationId, mockUserId, updateData);

      // Vérifier que les lignes sont supprimées et recréées
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const mockQuotation = {
      id: mockQuotationId,
      companyId: mockCompanyId,
      invoiceId: null,
      deletedAt: null,
    };

    it('should delete quotation successfully', async () => {
      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(mockQuotation);
      (mockPrisma.quotations.update as jest.Mock).mockResolvedValue({
        ...mockQuotation,
        deletedAt: new Date(),
      });

      await quotationService.delete(mockCompanyId, mockQuotationId);

      expect(mockPrisma.quotations.update).toHaveBeenCalledWith({
        where: { id: mockQuotationId },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw error if quotation not found', async () => {
      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        quotationService.delete(mockCompanyId, mockQuotationId)
      ).rejects.toThrow('Quotation not found');
    });

    it('should not allow deleting converted quotation', async () => {
      const convertedQuotation = {
        ...mockQuotation,
        invoice_id: 'invoice-123',
      };

      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(convertedQuotation);

      await expect(
        quotationService.delete(mockCompanyId, mockQuotationId)
      ).rejects.toThrow('Cannot delete quotation that has been converted to invoice');
    });
  });

  describe('convertToInvoice', () => {
    const mockQuotation = {
      id: mockQuotationId,
      companyId: mockCompanyId,
      customerId: mockCustomerId,
      status: 'accepted',
      invoiceId: null,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      transportFees: new Decimal(0),
      platformFees: new Decimal(0),
      currency: 'CDF',
      templateId: 'template-1-modern',
      reference: 'REF-001',
      poNumber: 'PO-001',
      shippingAddress: null,
      shippingCity: null,
      shippingCountry: null,
      notes: null,
      paymentTerms: null,
      footerText: null,
      lines: [
        {
          id: 'line-1',
          productId: null,
          description: 'Service de conseil',
          quantity: new Decimal(10),
          unitPrice: new Decimal(100),
          taxRate: new Decimal(16),
        },
      ],
      customer: { id: mockCustomerId },
      creator: null,
    };

    const mockInvoice = {
      id: 'invoice-123',
      invoiceNumber: 'FAC-000001',
      status: 'draft',
    };

    it('should convert quotation to invoice successfully', async () => {
      const mockQuotationWithLines = {
        ...mockQuotation,
        quotation_lines: mockQuotation.lines.map((line: any) => ({
          id: line.id,
          product_id: line.productId,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          tax_rate: line.taxRate,
        })),
      };
      (mockPrisma.quotations.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockQuotationWithLines)
        .mockResolvedValueOnce({
          ...mockQuotationWithLines,
          invoice_id: mockInvoice.id,
        });
      (invoiceService.create as jest.Mock).mockResolvedValue(mockInvoice);
      (mockPrisma.quotations.update as jest.Mock).mockResolvedValue({
        ...mockQuotation,
        quotation_lines: mockQuotation.lines.map((line: any) => ({
          id: line.id,
          product_id: line.productId,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          tax_rate: line.taxRate,
        })),
        invoice_id: mockInvoice.id,
      });

      const result = await quotationService.convertToInvoice(mockCompanyId, mockQuotationId, mockUserId);

      expect(result).toBeDefined();
      expect(result.invoice).toEqual(mockInvoice);
      expect(invoiceService.create).toHaveBeenCalled();
      expect(mockPrisma.quotations.update).toHaveBeenCalledWith({
        where: { id: mockQuotationId },
        data: expect.objectContaining({
          invoice_id: mockInvoice.id,
          status: 'accepted',
        }),
      });
    });

    it('should throw error if quotation not accepted', async () => {
      const draftQuotationWithLines = {
        ...mockQuotation,
        status: 'draft',
        invoice_id: null,
        quotation_lines: mockQuotation.lines.map((line: any) => ({
          id: line.id,
          product_id: line.productId,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          tax_rate: line.taxRate,
        })),
      };

      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(draftQuotationWithLines);

      await expect(
        quotationService.convertToInvoice(mockCompanyId, mockQuotationId, mockUserId)
      ).rejects.toThrow('Only accepted quotations can be converted to invoices');
    });

    it('should throw error if quotation already converted', async () => {
      const convertedQuotation = {
        ...mockQuotation,
        invoice_id: 'invoice-123',
      };

      (mockPrisma.quotations.findFirst as jest.Mock).mockResolvedValue(convertedQuotation);

      await expect(
        quotationService.convertToInvoice(mockCompanyId, mockQuotationId, mockUserId)
      ).rejects.toThrow('Quotation has already been converted to invoice');
    });
  });

  describe('checkExpiredQuotations', () => {
    it('should mark expired quotations', async () => {
      const expiredQuotations = [
        { id: 'quotation-1' },
        { id: 'quotation-2' },
      ];

      (mockPrisma.quotations.findMany as jest.Mock).mockResolvedValue(expiredQuotations);
      (mockPrisma.quotations.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await quotationService.checkExpiredQuotations(mockCompanyId);

      expect(result).toBe(2);
      expect(mockPrisma.quotations.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['quotation-1', 'quotation-2'] },
        },
        data: {
          status: 'expired',
          expired_at: expect.any(Date),
        },
      });
    });

    it('should return 0 if no expired quotations', async () => {
      (mockPrisma.quotations.findMany as jest.Mock).mockResolvedValue([]);

      const result = await quotationService.checkExpiredQuotations(mockCompanyId);

      expect(result).toBe(0);
      expect(mockPrisma.quotations.updateMany).not.toHaveBeenCalled();
    });

    it('should check all companies if companyId not provided', async () => {
      (mockPrisma.quotations.findMany as jest.Mock).mockResolvedValue([]);

      await quotationService.checkExpiredQuotations();

      expect(mockPrisma.quotations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            companyId: expect.anything(),
          }),
        })
      );
    });
  });
});

