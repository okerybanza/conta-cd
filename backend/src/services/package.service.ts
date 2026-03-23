import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface PackageLimits {
  customers?: number | null;
  products?: number | null;
  users?: number | null;
  emails_per_month?: number | null;
  // sms_per_month?: number | null; // SMS désactivé - ne garder que Email et WhatsApp
  suppliers?: number | null;
  storage_mb?: number | null;
  invoices?: number | null;
  expenses?: number | null;
  recurring_invoices?: number | null;
}

export interface PackageFeatures {
  expenses?: boolean;
  accounting?: boolean;
  recurring_invoices?: boolean;
  api?: boolean;
  custom_templates?: boolean;
  multi_currency?: boolean;
  advanced_reports?: boolean;
  workflows?: boolean;
  custom_branding?: boolean;
  stock?: boolean;
  hr?: boolean;
}

export class PackageService {
  /**
   * Obtenir tous les packages actifs
   */
  async getAll(): Promise<any[]> {
    const packages = await prisma.packages.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        display_order: 'asc',
      },
    });

    return packages;
  }

  /**
   * Obtenir un package par ID
   */
  async getById(packageId: string) {
    const packageData = await prisma.packages.findUnique({
      where: { id: packageId },
    });

    if (!packageData) {
      throw new CustomError('Package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    return packageData;
  }

  /**
   * Obtenir un package par code
   */
  async getByCode(code: string) {
    const packageData = await prisma.packages.findUnique({
      where: { code },
    });

    if (!packageData) {
      throw new CustomError('Package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    return packageData;
  }

  /**
   * Obtenir les limites d'un package
   */
  async getLimits(packageId: string): Promise<PackageLimits> {
    const packageData = await this.getById(packageId);
    return (packageData.limits as PackageLimits) || {};
  }

  /**
   * Obtenir les fonctionnalités d'un package
   */
  async getFeatures(packageId: string): Promise<PackageFeatures> {
    const packageData = await this.getById(packageId);
    return (packageData.features as PackageFeatures) || {};
  }

  /**
   * Vérifier si un package a une fonctionnalité
   */
  async hasFeature(packageId: string, feature: keyof PackageFeatures): Promise<boolean> {
    const features = await this.getFeatures(packageId);
    return features[feature] === true;
  }

  /**
   * Obtenir la limite d'une métrique pour un package
   */
  async getLimit(packageId: string, metric: keyof PackageLimits): Promise<number | null> {
    const limits = await this.getLimits(packageId);
    const limit = limits[metric];

    // null signifie illimité
    return limit === null ? null : (limit || 0);
  }

  /**
   * Créer un nouveau package (Super Admin uniquement)
   */
  async create(data: {
    code: string;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    limits?: PackageLimits;
    features?: PackageFeatures;
    isActive?: boolean;
    displayOrder?: number;
  }) {
    // Vérifier si le code existe déjà
    const existing = await prisma.packages.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new CustomError('Un package avec ce code existe déjà', 400, 'PACKAGE_CODE_EXISTS');
    }

    // Obtenir le dernier displayOrder pour définir le suivant
    const lastPackage = await prisma.packages.findFirst({
      orderBy: { display_order: 'desc' },
    });

    const newPackage = await prisma.packages.create({
      data: {
        id: randomUUID(),
        code: data.code,
        name: data.name,
        description: data.description || null,
        price: data.price,
        currency: data.currency || 'CDF',
        limits: (data.limits || {}) as Prisma.JsonObject,
        features: (data.features || {}) as Prisma.JsonObject,
        is_active: data.isActive !== undefined ? data.isActive : true,
        display_order: data.displayOrder !== undefined ? data.displayOrder : (lastPackage?.display_order || 0) + 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    logger.info(`Package created: ${newPackage.id}`, {
      packageId: newPackage.id,
      code: newPackage.code,
      name: newPackage.name,
    });

    return newPackage;
  }

  /**
   * Mettre à jour un package (Super Admin uniquement)
   */
  async update(packageId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    limits?: PackageLimits;
    features?: PackageFeatures;
    isActive?: boolean;
    displayOrder?: number;
  }) {
    const packageData = await this.getById(packageId);

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.limits) updateData.limits = data.limits;
    if (data.features) updateData.features = data.features;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;

    const updated = await prisma.packages.update({
      where: { id: packageId },
      data: updateData,
    });

    logger.info(`Package updated: ${packageId}`, {
      packageId,
      changes: Object.keys(data),
    });

    return updated;
  }

  /**
   * Supprimer un package (Super Admin uniquement)
   * Conditions :
   * - Ne peut pas être supprimé s'il a des subscriptions actives
   * - Ne peut pas être supprimé s'il est le seul plan actif
   */
  async delete(packageId: string, force: boolean = false) {
    const packageData = await this.getById(packageId);

    // Vérifier s'il y a des subscriptions actives
    const activeSubscriptions = await prisma.subscriptions.count({
      where: {
        package_id: packageId,
        status: 'active',
      },
    });

    if (activeSubscriptions > 0 && !force) {
      throw new CustomError(
        `Ce plan ne peut pas être supprimé car ${activeSubscriptions} entreprise${activeSubscriptions > 1 ? 's' : ''} ${activeSubscriptions > 1 ? 'l\'utilisent' : 'l\'utilise'} actuellement. Vous pouvez le désactiver à la place.`,
        400,
        'PACKAGE_HAS_ACTIVE_SUBSCRIPTIONS'
      );
    }

    // Vérifier s'il reste d'autres plans actifs
    const otherActivePackages = await prisma.packages.count({
      where: {
        is_active: true,
        id: { not: packageId },
      },
    });

    if (otherActivePackages === 0 && !force) {
      throw new CustomError(
        'Ce plan ne peut pas être supprimé car il est le dernier plan actif. Vous devez avoir au moins un plan actif.',
        400,
        'LAST_ACTIVE_PACKAGE'
      );
    }

    // Si force est true, désactiver toutes les subscriptions actives
    if (force && activeSubscriptions > 0) {
      await prisma.subscriptions.updateMany({
        where: {
          package_id: packageId,
          status: 'active',
        },
        data: {
          status: 'cancelled',
        },
      });
    }

    // Supprimer le package
    await prisma.packages.delete({
      where: { id: packageId },
    });

    logger.info(`Package deleted: ${packageId}`, {
      packageId,
      code: packageData.code,
      name: packageData.name,
      force,
      activeSubscriptions: activeSubscriptions,
    });

    return { success: true, message: 'Package supprimé avec succès' };
  }

  /**
   * Obtenir le nombre de subscriptions actives pour un package
   */
  async getActiveSubscriptionsCount(packageId: string): Promise<number> {
    return await prisma.subscriptions.count({
      where: {
        package_id: packageId,
        status: 'active',
      },
    });
  }
}

export default new PackageService();

