import stockService from '../../services/stock.service';
import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    products: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock StockMovementService
jest.mock('../../services/stock-movement.service', () => ({
  __esModule: true,
  default: {
    calculateStock: jest.fn(),
    create: jest.fn(),
    validate: jest.fn(),
  },
}));

// Mock EventBus
jest.mock('../../events/event-bus', () => ({
  eventBus: {
    publish: jest.fn(),
    publishAll: jest.fn(),
  },
}));

// Mock Domain Events
jest.mock('../../events/domain-event', () => ({
  StockMovementCreated: jest.fn().mockImplementation((metadata, movementId, movementType, reference, referenceId, reason) => ({
    metadata, movementId, movementType, reference, referenceId, reason
  })),
  StockAdjusted: jest.fn().mockImplementation((metadata, productId, oldQuantity, newQuantity, reason, warehouseId) => ({
    metadata, productId, oldQuantity, newQuantity, reason, warehouseId
  })),
}));

import { eventBus } from '../../events/event-bus';
import stockMovementService from '../../services/stock-movement.service';

describe('StockService', () => {
  const mockCompanyId = 'company-123';
  const mockProductId = 'product-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkStock', () => {
    it('should return available: true for services', async () => {
      (prisma.products.findFirst as jest.Mock).mockResolvedValue({
        id: mockProductId,
        name: 'Service Test',
        type: 'service',
        track_stock: false,
      });

      const result = await stockService.checkStock(mockCompanyId, mockProductId, 10);

      expect(result.available).toBe(true);
      expect(result.availableQuantity).toBe(Infinity);
    });

    it('should return available: true if stock tracking is disabled', async () => {
      (prisma.products.findFirst as jest.Mock).mockResolvedValue({
        id: mockProductId,
        name: 'Product No Track',
        type: 'product',
        track_stock: false,
      });

      const result = await stockService.checkStock(mockCompanyId, mockProductId, 10);

      expect(result.available).toBe(true);
    });

    it('should return available: true if enough stock', async () => {
      (prisma.products.findFirst as jest.Mock).mockResolvedValue({
        id: mockProductId,
        name: 'Product Test',
        type: 'product',
        track_stock: true,
      });
      (stockMovementService.calculateStock as jest.Mock).mockResolvedValue(20);

      const result = await stockService.checkStock(mockCompanyId, mockProductId, 10);

      expect(result.available).toBe(true);
      expect(result.availableQuantity).toBe(20);
    });

    it('should return available: false if not enough stock', async () => {
      (prisma.products.findFirst as jest.Mock).mockResolvedValue({
        id: mockProductId,
        name: 'Product Test',
        type: 'product',
        track_stock: true,
      });
      (stockMovementService.calculateStock as jest.Mock).mockResolvedValue(5);

      const result = await stockService.checkStock(mockCompanyId, mockProductId, 10);

      expect(result.available).toBe(false);
      expect(result.availableQuantity).toBe(5);
    });
  });

  describe('decrementStock', () => {
    it('should create and validate a stock movement', async () => {
      const mockMovementId = 'mv-123';
      (stockMovementService.create as jest.Mock).mockResolvedValue(mockMovementId);

      await stockService.decrementStock(mockCompanyId, mockProductId, 10, 'REF-1', 'ID-1', 'user-1');

      expect(stockMovementService.create).toHaveBeenCalledWith(
        mockCompanyId,
        'user-1',
        expect.objectContaining({
          movementType: 'OUT',
          items: [{ productId: mockProductId, quantity: 10 }],
          reference: 'REF-1',
          referenceId: 'ID-1',
        })
      );
      expect(stockMovementService.validate).toHaveBeenCalledWith(mockCompanyId, mockMovementId, 'user-1');
    });
  });

  describe('incrementStock', () => {
    it('should create and validate a stock movement', async () => {
      const mockMovementId = 'mv-456';
      (stockMovementService.create as jest.Mock).mockResolvedValue(mockMovementId);

      await stockService.incrementStock(mockCompanyId, mockProductId, 5, 'REF-2', 'ID-2', 'user-2');

      expect(stockMovementService.create).toHaveBeenCalledWith(
        mockCompanyId,
        'user-2',
        expect.objectContaining({
          movementType: 'IN',
          items: [{ productId: mockProductId, quantity: 5 }],
          reference: 'REF-2',
          referenceId: 'ID-2',
        })
      );
      expect(stockMovementService.validate).toHaveBeenCalledWith(mockCompanyId, mockMovementId, 'user-2');
    });
  });

  describe('adjustStock (Event Driven)', () => {
    it('should publish a StockAdjusted event', async () => {
      const mockMovementId = 'mv-789';
      (stockMovementService.calculateStock as jest.Mock).mockResolvedValue(10);
      (stockMovementService.create as jest.Mock).mockResolvedValue(mockMovementId);

      await stockService.adjustStock(mockCompanyId, mockProductId, 15, 'Inventory count', 'user-1');

      expect(eventBus.publish).toHaveBeenCalled();
      const event = (eventBus.publish as jest.Mock).mock.calls[0][0];
      expect(event.productId).toBe(mockProductId);
      expect(event.newQuantity).toBe(15);
      expect(event.reason).toBe('Inventory count');
    });
  });

  describe('getProductStock', () => {
    it('should call stockMovementService.calculateStock', async () => {
      (stockMovementService.calculateStock as jest.Mock).mockResolvedValue(100);

      const stock = await stockService.getProductStock(mockCompanyId, mockProductId);

      expect(stock).toBe(100);
      expect(stockMovementService.calculateStock).toHaveBeenCalledWith(mockCompanyId, mockProductId);
    });
  });
});
