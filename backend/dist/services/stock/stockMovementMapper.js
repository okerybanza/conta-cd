"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapMovementToDto = mapMovementToDto;
/**
 * ARCH-004: Mapping Prisma -> DTO pour les mouvements de stock (getById, list).
 */
function mapMovementToDto(movement) {
    return {
        id: movement.id,
        companyId: movement.company_id,
        movementNumber: movement.id,
        movementType: movement.movement_type,
        status: movement.status,
        reference: movement.reference || undefined,
        referenceId: movement.reference_id || undefined,
        reason: movement.reason || undefined,
        createdAt: movement.created_at ? new Date(movement.created_at).toISOString() : undefined,
        updatedAt: movement.validated_at ? new Date(movement.validated_at).toISOString() : undefined,
        validatedAt: movement.validated_at ? new Date(movement.validated_at).toISOString() : undefined,
        validatedBy: movement.validated_by || undefined,
        createdBy: movement.created_by || undefined,
        items: movement.items?.map((item) => ({
            id: item.id,
            productId: item.product_id,
            product: item.products
                ? {
                    id: item.products.id,
                    name: item.products.name,
                    sku: item.products.sku || undefined,
                }
                : undefined,
            warehouseId: item.warehouse_id || undefined,
            warehouse: item.warehouses
                ? { id: item.warehouses.id, name: item.warehouses.name }
                : undefined,
            warehouseToId: item.warehouse_to_id || undefined,
            quantity: Number(item.quantity || 0),
            batchId: item.batch_id || undefined,
            serialNumber: item.serial_number || undefined,
        })) || [],
        creator: movement.users
            ? {
                id: movement.users.id,
                firstName: movement.users.first_name || undefined,
                lastName: movement.users.last_name || undefined,
            }
            : undefined,
        validator: movement.validated_by_user
            ? {
                id: movement.validated_by_user.id,
                firstName: movement.validated_by_user.first_name || undefined,
                lastName: movement.validated_by_user.last_name || undefined,
            }
            : undefined,
    };
}
//# sourceMappingURL=stockMovementMapper.js.map