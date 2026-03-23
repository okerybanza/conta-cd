/**
 * Service de gestion des entrepôts (Warehouses)
 * DOC-03 : Support multi-entrepôts
 */

import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import auditService from './audit.service';

export interface CreateWarehouseData {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  country?: string;
  isDefault?: boolean;
  notes?: string;
}

export interface UpdateWarehouseData extends Partial<CreateWarehouseData> {
  isActive?: boolean;
}

export class WarehouseService {
  /**
   * Créer un entrepôt
   * DOC-08 : Audit logging obligatoire
   */
  async create(companyId: string, data: CreateWarehouseData, userId?: string): Promise<any> {
    // Si c'est l'entrepôt par défaut, désactiver les autres
    if (data.isDefault) {
      await prisma.warehouses.updateMany({
        where: {
          company_id: companyId,
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
    }

    const warehouse = await prisma.warehouses.create({
      data: {
        id: uuidv4(),
        company_id: companyId,
        name: data.name,
        code: data.code || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        is_default: data.isDefault || false,
        notes: data.notes || null,
        is_active: true,
      },
    });

    logger.info(`Warehouse created`, {
      warehouseId: warehouse.id,
      companyId,
      name: warehouse.name,
    });

    // DOC-08: Log de création
    if (userId) {
      await auditService.logCreate(
        companyId,
        userId,
        undefined,
        undefined,
        'warehouse',
        warehouse.id,
        warehouse,
        'stock'
      );
    }

    return warehouse;
  }

  /**
   * Lister les entrepôts d'une entreprise
   */
  async list(companyId: string, includeInactive = false): Promise<any[]> {
    const warehouses = await prisma.warehouses.findMany({
      where: {
        company_id: companyId,
        ...(includeInactive ? {} : { is_active: true }),
        deleted_at: null,
      },
      orderBy: [
        { is_default: 'desc' },
        { name: 'asc' },
      ],
    });

    return warehouses;
  }

  /**
   * Obtenir un entrepôt par ID
   */
  async getById(companyId: string, warehouseId: string): Promise<any> {
    const warehouse = await prisma.warehouses.findFirst({
      where: {
        id: warehouseId,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (!warehouse) {
      throw new CustomError('Warehouse not found', 404, 'WAREHOUSE_NOT_FOUND');
    }

    return warehouse;
  }

  /**
   * Mettre à jour un entrepôt
   * DOC-08 : Audit logging obligatoire
   */
  async update(
    companyId: string,
    warehouseId: string,
    data: UpdateWarehouseData,
    userId?: string
  ): Promise<any> {
    const before = await this.getById(companyId, warehouseId); // Vérifier existence et récupérer état avant

    // Si on définit comme défaut, désactiver les autres
    if (data.isDefault) {
      await prisma.warehouses.updateMany({
        where: {
          company_id: companyId,
          is_default: true,
          id: { not: warehouseId },
        },
        data: {
          is_default: false,
        },
      });
    }

    const warehouse = await prisma.warehouses.update({
      where: { id: warehouseId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code !== undefined && { code: data.code || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.country !== undefined && { country: data.country || null }),
        ...(data.isDefault !== undefined && { is_default: data.isDefault }),
        ...(data.isActive !== undefined && { is_active: data.isActive }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        updated_at: new Date(),
      },
    });

    logger.info(`Warehouse updated`, {
      warehouseId,
      companyId,
    });

    // DOC-08: Log de modification
    if (userId) {
      await auditService.logUpdate(
        companyId,
        userId,
        undefined,
        undefined,
        'warehouse',
        warehouseId,
        before,
        warehouse,
        'stock'
      );
    }

    return warehouse;
  }

  /**
   * Supprimer un entrepôt (soft delete)
   * DOC-08 : Audit logging obligatoire
   * DOC-03 : Vérification mouvements validés (règle non négociable)
   */
  async delete(companyId: string, warehouseId: string, userId?: string): Promise<void> {
    const before = await this.getById(companyId, warehouseId); // Vérifier existence et récupérer état avant

    // Vérifier qu'il n'y a pas de mouvements de stock liés
    const movementsCount = await prisma.stock_movement_items.count({
      where: {
        warehouse_id: warehouseId,
        stock_movements: {
          company_id: companyId,
          status: 'VALIDATED',
        },
      },
    });

    if (movementsCount > 0) {
      throw new CustomError(
        `Cannot delete warehouse with validated stock movements (${movementsCount} movements)`,
        400,
        'WAREHOUSE_HAS_MOVEMENTS'
      );
    }

    await prisma.warehouses.update({
      where: { id: warehouseId },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
    });

    logger.info(`Warehouse deleted`, {
      warehouseId,
      companyId,
    });

    // DOC-08: Log de suppression (soft delete)
    if (userId) {
      await auditService.logDelete(
        companyId,
        userId,
        undefined,
        undefined,
        'warehouse',
        warehouseId,
        before,
        'stock'
      );
    }
  }

  /**
   * Obtenir l'entrepôt par défaut d'une entreprise
   */
  async getDefault(companyId: string): Promise<any | null> {
    const warehouse = await prisma.warehouses.findFirst({
      where: {
        company_id: companyId,
        is_default: true,
        is_active: true,
        deleted_at: null,
      },
    });

    return warehouse;
  }
}

export default new WarehouseService();

