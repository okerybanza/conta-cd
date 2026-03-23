import stockMovementService from '../../services/stock-movement.service';
import prisma from '../../config/database';
import { CustomError } from '../../middleware/error.middleware';
import fiscalPeriodService from '../../services/fiscalPeriod.service';
import auditService from '../../services/audit.service';
import { eventBus } from '../../events/event-bus';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        stock_movements: {
            create: jest.fn(),
            update: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        companies: {
            findUnique: jest.fn(),
        },
        warehouses: {
            findFirst: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback({
            stock_movements: {
                create: jest.fn(),
                update: jest.fn(),
            },
            products: {
                update: jest.fn(),
            }
        })),
    },
}));

// Mock Dependencies
jest.mock('../../services/fiscalPeriod.service');
jest.mock('../../services/audit.service');
jest.mock('../../services/datarissage.service');
jest.mock('../../events/event-bus', () => ({
    eventBus: {
        publish: jest.fn(),
        publishAll: jest.fn(),
    },
}));

// Mock Domain Events
jest.mock('../../events/domain-event', () => ({
    StockMovementValidated: jest.fn().mockImplementation((metadata, movementId, type, items, reference, referenceId) => ({
        metadata, movementId, type, items, reference, referenceId
    })),
    StockMovementReversed: jest.fn().mockImplementation((metadata, originalId, reversalId, reason) => ({
        metadata, originalId, reversalId, reason
    })),
    StockMovementCreated: jest.fn().mockImplementation((metadata, movementId, type, reference, referenceId, reason) => ({
        metadata, movementId, type, reference, referenceId, reason
    })),
}));

describe('StockMovementService', () => {
    const mockCompanyId = 'comp-1';
    const mockUserId = 'user-1';

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
        (prisma.companies.findUnique as jest.Mock).mockResolvedValue({
            id: mockCompanyId,
            module_stock_enabled: true,
            datarissage_completed: true,
            stock_allow_negative: false,
        });
        (fiscalPeriodService.validatePeriod as jest.Mock).mockResolvedValue({ isValid: true });
    });

    describe('create', () => {
        it('should create a DRAFT stock movement', async () => {
            const data: any = {
                movementType: 'IN' as const,
                items: [{ productId: 'p1', quantity: 10, warehouseId: 'w1' }],
                reason: 'Restock',
            };

            const movementId = await stockMovementService.create(mockCompanyId, mockUserId, data);

            expect(movementId).toBeDefined();
            expect(prisma.stock_movements.create).toHaveBeenCalled();
            expect(auditService.logCreate).toHaveBeenCalled();
        });
    });

    describe('validate', () => {
        it('should validate a DRAFT movement and publish event', async () => {
            const mockMovement: any = {
                id: 'mv-1',
                status: 'DRAFT' as any,
                movement_type: 'IN' as any,
                items: [
                    {
                        product_id: 'p1',
                        quantity: new Decimal(10),
                        products: { is_active: true, name: 'P1' },
                    },
                ],
            };

            (prisma.stock_movements.findFirst as jest.Mock).mockResolvedValue(mockMovement);

            // Mock transaction results
            const mockTx: any = {
                stock_movements: {
                    update: jest.fn().mockResolvedValue({}),
                },
                products: {
                    update: jest.fn().mockResolvedValue({}),
                },
                companies: {
                    findUnique: jest.fn().mockResolvedValue({
                        id: mockCompanyId,
                        stock_valuation_method: 'FIFO',
                        rh_accounting_integration: true
                    })
                }
            };
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => await callback(mockTx));

            await stockMovementService.validate(mockCompanyId, 'mv-1', mockUserId);

            expect(mockTx.stock_movements.update).toHaveBeenCalledWith({
                where: { id: 'mv-1' },
                data: expect.objectContaining({ status: 'VALIDATED' }),
            });
            expect(eventBus.publish).toHaveBeenCalled();
            expect(auditService.createLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'VALIDATE_MOVEMENT' }));
        });
    });

    describe('calculateStock', () => {
        it('should correctly sum IN and OUT movements', async () => {
            const mockMovements: any[] = [
                {
                    movement_type: 'IN' as any,
                    items: [{ quantity: new Decimal(100) }],
                },
                {
                    movement_type: 'OUT' as any,
                    items: [{ quantity: new Decimal(30) }],
                },
            ];

            (prisma.stock_movements.findMany as jest.Mock).mockResolvedValue(mockMovements);

            const stock = await stockMovementService.calculateStock(mockCompanyId, 'p1');

            expect(stock).toBe(70);
        });
    });

    describe('reverse', () => {
        it('should create a reversal movement and mark original as reversed', async () => {
            const mockOriginal: any = {
                id: 'mv-1',
                status: 'VALIDATED' as any,
                movement_type: 'IN' as any,
                items: [{ product_id: 'p1', quantity: new Decimal(10), warehouse_id: 'w1' }],
            };

            (prisma.stock_movements.findFirst as jest.Mock).mockResolvedValue(mockOriginal);

            const mockTx: any = {
                stock_movements: {
                    create: jest.fn().mockResolvedValue({}),
                    update: jest.fn().mockResolvedValue({}),
                }
            };
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => await callback(mockTx));

            await stockMovementService.reverse(mockCompanyId, 'mv-1', mockUserId, 'Wrong input');

            expect(mockTx.stock_movements.create).toHaveBeenCalled();
            expect(mockTx.stock_movements.update).toHaveBeenCalledWith({
                where: { id: 'mv-1' },
                data: { reversed_at: expect.any(Date) },
            });
            expect(auditService.createLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'REVERSE_STOCK_MOVEMENT' }));
        });
    });
});
