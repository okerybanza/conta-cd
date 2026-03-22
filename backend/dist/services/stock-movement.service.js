"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementService = void 0;
/**
 * Service de gestion des mouvements de stock (DOC-03)
 * ARCH-004: Façade qui délègue calcul, validation et mapping à services/stock/
 */
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const library_1 = require("@prisma/client/runtime/library");
const event_bus_1 = require("../events/event-bus");
const domain_event_1 = require("../events/domain-event");
const crypto_1 = require("crypto");
const audit_service_1 = __importDefault(require("./audit.service"));
const fiscalPeriod_service_1 = __importDefault(require("./fiscalPeriod.service"));
const stockMovementCalculation_service_1 = __importDefault(require("./stock/stockMovementCalculation.service"));
const stockMovementValidation_service_1 = __importDefault(require("./stock/stockMovementValidation.service"));
const stockMovementMapper_1 = require("./stock/stockMovementMapper");
class StockMovementService {
    async create(companyId, userId, data) {
        await stockMovementValidation_service_1.default.ensureStockModuleEnabled(companyId);
        const periodValidation = await fiscalPeriod_service_1.default.validatePeriod(companyId, new Date());
        if (!periodValidation.isValid) {
            throw new error_middleware_1.CustomError(periodValidation.message || 'Période de stock verrouillée ou close', 400, 'INVALID_PERIOD');
        }
        if (!['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'].includes(data.movementType)) {
            throw new error_middleware_1.CustomError(`Invalid movement type: ${data.movementType}. Allowed types: IN, OUT, ADJUSTMENT, TRANSFER`, 400, 'INVALID_MOVEMENT_TYPE');
        }
        if (!data.items || data.items.length === 0) {
            throw new error_middleware_1.CustomError('Movement must have at least one item', 400, 'EMPTY_MOVEMENT');
        }
        if (data.movementType === 'TRANSFER') {
            const invalidTransfer = data.items.find(item => !item.warehouseToId);
            if (invalidTransfer) {
                throw new error_middleware_1.CustomError('TRANSFER movements must specify warehouseToId for all items', 400, 'INVALID_TRANSFER');
            }
        }
        const movementId = (0, crypto_1.randomUUID)();
        await database_1.default.stock_movements.create({
            data: {
                id: movementId,
                company_id: companyId,
                movement_type: data.movementType,
                reference: data.reference || null,
                reference_id: data.referenceId || null,
                status: 'DRAFT',
                reason: data.reason || null,
                created_by: userId,
                created_at: new Date(),
                items: {
                    create: data.items.map(item => ({
                        id: (0, crypto_1.randomUUID)(),
                        product_id: item.productId,
                        warehouse_id: item.warehouseId || null,
                        warehouse_to_id: item.warehouseToId || null,
                        quantity: new library_1.Decimal(item.quantity),
                        batch_id: item.batchId || null,
                        serial_number: item.serialNumber || null,
                        created_at: new Date(),
                    })),
                },
            },
        });
        logger_1.default.info(`Stock movement created (DRAFT)`, {
            movementId,
            companyId,
            movementType: data.movementType,
            itemsCount: data.items.length,
        });
        await audit_service_1.default.logCreate(companyId, userId, undefined, undefined, 'stock_movement', movementId, data, 'stock');
        return movementId;
    }
    async validate(companyId, movementId, userId) {
        await stockMovementValidation_service_1.default.ensureStockModuleEnabled(companyId);
        const periodValidation = await fiscalPeriod_service_1.default.validatePeriod(companyId, new Date());
        if (!periodValidation.isValid) {
            throw new error_middleware_1.CustomError('Impossible de valider un mouvement sur une période close ou verrouillée', 400, 'INVALID_PERIOD');
        }
        const movement = await database_1.default.stock_movements.findFirst({
            where: { id: movementId, company_id: companyId },
            include: {
                items: {
                    include: {
                        products: true,
                        warehouse_from: true, warehouse_to: true,
                    },
                },
            },
        });
        if (!movement) {
            throw new error_middleware_1.CustomError('Stock movement not found', 404, 'MOVEMENT_NOT_FOUND');
        }
        if (movement.status === 'VALIDATED') {
            throw new error_middleware_1.CustomError('Movement already validated', 400, 'ALREADY_VALIDATED');
        }
        const getStock = (productId, warehouseId) => stockMovementCalculation_service_1.default.calculateStock(companyId, productId, warehouseId);
        const validation = await stockMovementValidation_service_1.default.validateMovement(companyId, movement, getStock);
        if (!validation.valid) {
            throw new error_middleware_1.CustomError(`Movement validation failed: ${validation.errors.join('; ')}`, 400, 'VALIDATION_FAILED', { errors: validation.errors, warnings: validation.warnings });
        }
        await database_1.default.$transaction(async (tx) => {
            await tx.stock_movements.update({
                where: { id: movementId },
                data: {
                    status: 'VALIDATED',
                    validated_by: userId,
                    validated_at: new Date(),
                },
            });
            const validatedEvent = new domain_event_1.StockMovementValidated({ companyId, userId, timestamp: new Date() }, movementId, movement.movement_type, movement.items.map((item) => ({
                productId: item.product_id,
                warehouseId: item.warehouse_id || undefined,
                warehouseToId: item.warehouse_to_id || undefined,
                quantity: Number(item.quantity),
                batchId: item.batch_id || undefined,
                serialNumber: item.serial_number || undefined,
            })), movement.reference || undefined, movement.reference_id || undefined);
            await event_bus_1.eventBus.publish(validatedEvent);
        });
        logger_1.default.info(`Stock movement validated`, { movementId, companyId, movementType: movement.movement_type });
        await audit_service_1.default.createLog({
            companyId,
            userId,
            action: movement.movement_type === 'ADJUSTMENT' ? 'ADJUST_STOCK' : 'VALIDATE_MOVEMENT',
            entityType: 'stock_movement',
            entityId: movementId,
            module: 'stock',
            beforeState: { status: 'DRAFT' },
            afterState: { status: 'VALIDATED' },
            justification: movement.reason || undefined,
            metadata: { movementType: movement.movement_type },
        });
    }
    async reverse(companyId, movementId, userId, reason) {
        const originalMovement = await database_1.default.stock_movements.findFirst({
            where: { id: movementId, company_id: companyId, status: 'VALIDATED' },
            include: { items: true },
        });
        if (!originalMovement) {
            throw new error_middleware_1.CustomError('Validated movement not found', 404, 'MOVEMENT_NOT_FOUND');
        }
        if (originalMovement.reversed_at) {
            throw new error_middleware_1.CustomError('Movement already reversed', 400, 'ALREADY_REVERSED');
        }
        const periodValidation = await fiscalPeriod_service_1.default.validatePeriod(companyId, new Date());
        if (!periodValidation.isValid) {
            throw new error_middleware_1.CustomError('Impossible d\'inverser un mouvement sur une période close ou verrouillée', 400, 'INVALID_PERIOD');
        }
        const reversalMovementId = (0, crypto_1.randomUUID)();
        const reversedType = stockMovementValidation_service_1.default.getReversedType(originalMovement.movement_type);
        await database_1.default.$transaction(async (tx) => {
            await tx.stock_movements.create({
                data: {
                    id: reversalMovementId,
                    company_id: companyId,
                    movement_type: reversedType,
                    reference: originalMovement.reference || null,
                    reference_id: originalMovement.reference_id || null,
                    status: 'VALIDATED',
                    reason,
                    created_by: userId,
                    validated_by: userId,
                    created_at: new Date(),
                    validated_at: new Date(),
                    reversed_from_id: movementId,
                    reversed_at: new Date(),
                    items: {
                        create: originalMovement.items.map((item) => ({
                            id: (0, crypto_1.randomUUID)(),
                            product_id: item.product_id,
                            warehouse_id: item.warehouse_id || null,
                            warehouse_to_id: item.warehouse_id || null,
                            quantity: item.quantity,
                            batch_id: item.batch_id || null,
                            serial_number: item.serial_number || null,
                        })),
                    },
                },
            });
            await tx.stock_movements.update({
                where: { id: movementId },
                data: { reversed_at: new Date() },
            });
            await event_bus_1.eventBus.publish(new domain_event_1.StockMovementReversed({ companyId, userId, timestamp: new Date() }, movementId, reversalMovementId, reason));
        });
        logger_1.default.info(`Stock movement reversed`, { originalMovementId: movementId, reversalMovementId, companyId });
        await audit_service_1.default.createLog({
            companyId,
            userId,
            action: 'REVERSE_STOCK_MOVEMENT',
            entityType: 'stock_movement',
            entityId: movementId,
            module: 'stock',
            beforeState: { reversed: false },
            afterState: { reversed: true, reversalId: reversalMovementId },
            justification: reason,
            metadata: { reason },
        });
        return reversalMovementId;
    }
    async calculateStock(companyId, productId, warehouseId) {
        return stockMovementCalculation_service_1.default.calculateStock(companyId, productId, warehouseId);
    }
    async calculateStockMany(companyId, productIds, warehouseId) {
        return stockMovementCalculation_service_1.default.calculateStockMany(companyId, productIds, warehouseId);
    }
    async getById(companyId, movementId) {
        const movement = await database_1.default.stock_movements.findFirst({
            where: { id: movementId, company_id: companyId },
            include: {
                items: {
                    include: {
                        products: { select: { id: true, name: true, sku: true } },
                        warehouse_from: { select: { id: true, name: true } }, warehouse_to: { select: { id: true, name: true } },
                    },
                },
                users: { select: { id: true, first_name: true, last_name: true } },
                validated_by_user: { select: { id: true, first_name: true, last_name: true } },
            },
        });
        if (!movement) {
            throw new error_middleware_1.CustomError('Stock movement not found', 404, 'MOVEMENT_NOT_FOUND');
        }
        return (0, stockMovementMapper_1.mapMovementToDto)(movement);
    }
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = { company_id: companyId };
        if (filters.movementType)
            where.movement_type = filters.movementType;
        if (filters.status)
            where.status = filters.status;
        if (filters.startDate || filters.endDate) {
            where.created_at = {};
            if (filters.startDate)
                where.created_at.gte = filters.startDate;
            if (filters.endDate)
                where.created_at.lte = filters.endDate;
        }
        const [movements, total] = await Promise.all([
            database_1.default.stock_movements.findMany({
                where,
                include: {
                    items: {
                        include: {
                            products: { select: { id: true, name: true, sku: true } },
                            warehouse_from: { select: { id: true, name: true } }, warehouse_to: { select: { id: true, name: true } },
                        },
                    },
                    users: { select: { id: true, first_name: true, last_name: true } },
                    validated_by_user: { select: { id: true, first_name: true, last_name: true } },
                },
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            database_1.default.stock_movements.count({ where }),
        ]);
        return {
            data: movements.map(stockMovementMapper_1.mapMovementToDto),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.StockMovementService = StockMovementService;
exports.default = new StockMovementService();
//# sourceMappingURL=stock-movement.service.js.map