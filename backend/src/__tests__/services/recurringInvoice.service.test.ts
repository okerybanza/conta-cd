import recurringInvoiceService, { CreateRecurringInvoiceData, UpdateRecurringInvoiceData } from '../../services/recurringInvoice.service';
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
    customers: {
      findFirst: jest.fn(),
    },
    recurring_invoices: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    recurring_invoice_lines: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    invoices: {
      create: jest.fn(),
    },
    invoice_lines: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      recurring_invoices: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      recurring_invoice_lines: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      invoices: {
        create: jest.fn(),
      },
      invoice_lines: {
        createMany: jest.fn(),
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

// Mock invoiceService
jest.mock('../../services/invoice.service', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

import prisma from '../../config/database';
import invoiceService from '../../services/invoice.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockInvoiceService = invoiceService as jest.Mocked<typeof invoiceService>;

describe('RecurringInvoiceService', () => {
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockCustomerId = 'customer-123';
  const mockRecurringInvoiceId = 'recurring-invoice-123';
  const mockInvoiceId = 'invoice-123';

  const mockCustomer = {
    id: mockCustomerId,
    company_id: mockCompanyId,
    type: 'business' as const,
    business_name: 'Test Company',
    deleted_at: null,
  };

  const mockCreateData: CreateRecurringInvoiceData = {
    customerId: mockCustomerId,
    name: 'Test Recurring Invoice',
    description: 'Test Description',
    frequency: 'monthly',
    interval: 1,
    startDate: new Date('2024-01-01'),
    dueDateDays: 30,
    currency: 'CDF',
    lines: [
      {
        name: 'Product 1',
        quantity: 2,
        unitPrice: 1000,
        taxRate: 16,
      },
    ],
    transportFees: 100,
    platformFees: 50,
  };

  const mockRecurringInvoice = {
    id: mockRecurringInvoiceId,
    company_id: mockCompanyId,
    customer_id: mockCustomerId,
    name: 'Test Recurring Invoice',
    description: 'Test Description',
    frequency: 'monthly',
    interval: 1,
    start_date: new Date('2024-01-01'),
    end_date: null,
    next_run_date: new Date('2024-02-01'),
    last_run_date: null,
    due_date_days: 30,
    currency: 'CDF',
    reference: null,
    po_number: null,
    notes: null,
    payment_terms: null,
    transport_fees: new Decimal(100),
    platform_fees: new Decimal(50),
    auto_send: false,
    send_to_customer: true,
    is_active: true,
    total_generated: 0,
    last_invoice_id: null,
    created_by: mockUserId,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    deleted_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a recurring invoice successfully', async () => {
      const mockCreatedRecurringInvoice = {
        ...mockRecurringInvoice,
        id: 'new-recurring-invoice-id',
      };

      const mockTx = {
        recurring_invoices: {
          create: jest.fn().mockResolvedValue(mockCreatedRecurringInvoice),
        },
        recurring_invoice_lines: {
          create: jest.fn().mockResolvedValue({
            id: 'line-1',
            recurring_invoice_id: mockCreatedRecurringInvoice.id,
            product_id: null,
            description: 'Product 1',
            quantity: new Decimal(2),
            unit_price: new Decimal(1000),
            tax_rate: new Decimal(16),
          }),
        },
      };

      (mockPrisma.customers.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => callback(mockTx));
      
      // Mock getById qui est appelé après la création
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValueOnce(mockCreatedRecurringInvoice);
      (mockPrisma.recurring_invoice_lines.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await recurringInvoiceService.create(mockCompanyId, mockUserId, mockCreateData);

      expect(mockPrisma.customers.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCustomerId,
          company_id: mockCompanyId,
          deleted_at: null,
        },
      });

      expect(mockTx.recurring_invoices.create).toHaveBeenCalled();
      expect(mockTx.recurring_invoice_lines.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if customer not found', async () => {
      (mockPrisma.customers.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        recurringInvoiceService.create(mockCompanyId, mockUserId, mockCreateData)
      ).rejects.toThrow(CustomError);

      await expect(
        recurringInvoiceService.create(mockCompanyId, mockUserId, mockCreateData)
      ).rejects.toThrow('Customer not found');
    });

    it('should throw error if no lines provided', async () => {
      (mockPrisma.customers.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      const dataWithoutLines = { ...mockCreateData, lines: [] };

      await expect(
        recurringInvoiceService.create(mockCompanyId, mockUserId, dataWithoutLines)
      ).rejects.toThrow(CustomError);

      await expect(
        recurringInvoiceService.create(mockCompanyId, mockUserId, dataWithoutLines)
      ).rejects.toThrow('Recurring invoice must have at least one line');
    });
  });

  describe('getById', () => {
    it('should return recurring invoice with lines', async () => {
      const mockLines = [
        {
          id: 'line-1',
          recurring_invoice_id: mockRecurringInvoiceId,
          product_id: null,
          name: 'Product 1',
          description: null,
          quantity: new Decimal(2),
          unit_price: new Decimal(1000),
          tax_rate: new Decimal(16),
        },
      ];

      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValue(mockRecurringInvoice);
      (mockPrisma.recurring_invoice_lines.findMany as jest.Mock).mockResolvedValue(mockLines);

      const result = await recurringInvoiceService.getById(mockCompanyId, mockRecurringInvoiceId);

      expect(mockPrisma.recurring_invoices.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockRecurringInvoiceId,
          company_id: mockCompanyId,
          deleted_at: null,
        },
        include: {
          customers: expect.any(Object),
          recurring_invoice_lines: expect.any(Object),
          users: expect.any(Object),
        },
      });

      expect(result).toBeDefined();
    });

    it('should throw error if recurring invoice not found', async () => {
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        recurringInvoiceService.getById(mockCompanyId, mockRecurringInvoiceId)
      ).rejects.toThrow(CustomError);

      await expect(
        recurringInvoiceService.getById(mockCompanyId, mockRecurringInvoiceId)
      ).rejects.toThrow('Recurring invoice not found');
    });
  });

  describe('list', () => {
    it('should return list of recurring invoices with pagination', async () => {
      const mockRecurringInvoices = [mockRecurringInvoice];
      const mockCount = 1;

      (mockPrisma.recurring_invoices.findMany as jest.Mock).mockResolvedValue(mockRecurringInvoices);
      (mockPrisma.recurring_invoices.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await recurringInvoiceService.list(mockCompanyId, { page: 1, limit: 20 });

      expect(mockPrisma.recurring_invoices.findMany).toHaveBeenCalled();
      expect(mockPrisma.recurring_invoices.count).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it('should filter by isActive', async () => {
      (mockPrisma.recurring_invoices.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.recurring_invoices.count as jest.Mock).mockResolvedValue(0);

      await recurringInvoiceService.list(mockCompanyId, { page: 1, limit: 20, isActive: true });

      expect(mockPrisma.recurring_invoices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_active: true,
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update recurring invoice successfully', async () => {
      // Mock findFirst pour vérifier l'existence (appelé avant la transaction)
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValueOnce(mockRecurringInvoice);

      const mockTx = {
        recurring_invoices: {
          update: jest.fn().mockResolvedValue({ ...mockRecurringInvoice, name: 'Updated Name' }),
        },
        recurring_invoice_lines: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          create: jest.fn().mockResolvedValue({
            id: 'line-1',
            recurring_invoice_id: mockRecurringInvoiceId,
            product_id: null,
            description: 'Product 1',
            quantity: new Decimal(2),
            unit_price: new Decimal(1000),
            tax_rate: new Decimal(16),
          }),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => callback(mockTx));

      // Mock getById qui est appelé après la mise à jour
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValueOnce({
        ...mockRecurringInvoice,
        name: 'Updated Name',
      });
      (mockPrisma.recurring_invoice_lines.findMany as jest.Mock).mockResolvedValueOnce([]);

      const updateData: UpdateRecurringInvoiceData = {
        name: 'Updated Name',
        lines: mockCreateData.lines,
      };

      const result = await recurringInvoiceService.update(
        mockCompanyId,
        mockRecurringInvoiceId,
        updateData
      );

      expect(mockPrisma.recurring_invoices.findFirst).toHaveBeenCalled();
      expect(mockTx.recurring_invoices.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if recurring invoice not found', async () => {
      const mockTx = {
        recurring_invoices: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
        recurring_invoice_lines: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => callback(mockTx));

      await expect(
        recurringInvoiceService.update(mockCompanyId, mockRecurringInvoiceId, { name: 'Updated' })
      ).rejects.toThrow(CustomError);
    });
  });

  describe('delete', () => {
    it('should soft delete recurring invoice', async () => {
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValue(mockRecurringInvoice);
      (mockPrisma.recurring_invoices.update as jest.Mock).mockResolvedValue({
        ...mockRecurringInvoice,
        deleted_at: new Date(),
      });

      await recurringInvoiceService.delete(mockCompanyId, mockRecurringInvoiceId);

      expect(mockPrisma.recurring_invoices.findFirst).toHaveBeenCalled();
      expect(mockPrisma.recurring_invoices.update).toHaveBeenCalledWith({
        where: { id: mockRecurringInvoiceId },
        data: {
          deleted_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
      });
    });

    it('should throw error if recurring invoice not found', async () => {
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        recurringInvoiceService.delete(mockCompanyId, mockRecurringInvoiceId)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('generateNextInvoice', () => {
    it('should generate invoice from recurring invoice', async () => {
      const mockInvoice = {
        id: mockInvoiceId,
        invoice_number: 'INV-001',
      };

      const mockRecurringInvoiceWithRelations = {
        ...mockRecurringInvoice,
        recurring_invoice_lines: [
          {
            id: 'line-1',
            product_id: null,
            description: 'Product 1',
            quantity: new Decimal(2),
            unit_price: new Decimal(1000),
            tax_rate: new Decimal(16),
            tax_amount: new Decimal(320),
            subtotal: new Decimal(2000),
            total: new Decimal(2320),
          },
        ],
        customers: mockCustomer,
      };

      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValue(mockRecurringInvoiceWithRelations);
      (mockPrisma.recurring_invoices.update as jest.Mock).mockResolvedValue(mockRecurringInvoice);
      (mockInvoiceService.create as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await recurringInvoiceService.generateNextInvoice(mockRecurringInvoiceId);

      expect(mockPrisma.recurring_invoices.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockRecurringInvoiceId,
          deleted_at: null,
          is_active: true,
        },
        include: {
          recurring_invoice_lines: true,
          customers: true,
        },
      });
      expect(mockInvoiceService.create).toHaveBeenCalled();
      expect(mockPrisma.recurring_invoices.update).toHaveBeenCalled();
      expect(result).toBe(mockInvoiceId);
    });

    it('should throw error if recurring invoice not found', async () => {
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        recurringInvoiceService.generateNextInvoice(mockRecurringInvoiceId)
      ).rejects.toThrow(CustomError);

      await expect(
        recurringInvoiceService.generateNextInvoice(mockRecurringInvoiceId)
      ).rejects.toThrow('Recurring invoice not found or inactive');
    });

    it('should throw error if recurring invoice is not active', async () => {
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        recurringInvoiceService.generateNextInvoice(mockRecurringInvoiceId)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('processRecurringInvoices', () => {
    it('should process active recurring invoices', async () => {
      const mockRecurringInvoices = [mockRecurringInvoice];
      const mockInvoice = { id: mockInvoiceId };

      (mockPrisma.recurring_invoices.findMany as jest.Mock).mockResolvedValue(mockRecurringInvoices);
      (mockPrisma.recurring_invoices.findFirst as jest.Mock).mockResolvedValue({
        ...mockRecurringInvoice,
        recurring_invoice_lines: [
          {
            id: 'line-1',
            product_id: null,
            description: 'Product 1',
            quantity: new Decimal(2),
            unit_price: new Decimal(1000),
            tax_rate: new Decimal(16),
            tax_amount: new Decimal(320),
            subtotal: new Decimal(2000),
            total: new Decimal(2320),
          },
        ],
        customers: mockCustomer,
      });
      (mockPrisma.recurring_invoices.update as jest.Mock).mockResolvedValue(mockRecurringInvoice);
      (mockInvoiceService.create as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await recurringInvoiceService.processRecurringInvoices();

      expect(mockPrisma.recurring_invoices.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          deleted_at: null,
          next_run_date: {
            lte: expect.any(Date),
          },
          OR: [
            { end_date: null },
            { end_date: { gte: expect.any(Date) } },
          ],
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].success).toBe(true);
      expect(result[0].invoiceId).toBe(mockInvoiceId);
    });
  });
});

