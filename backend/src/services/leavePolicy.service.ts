import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';

export interface CreateLeavePolicyData {
  name?: string;
  leaveType?: string;
  daysPerYear?: number;
  daysPerMonth?: number;
  maxAccumulation?: number;
  carryForward?: boolean;
  requiresApproval?: boolean;
  minNoticeDays?: number;
  description?: string;
}

export interface UpdateLeavePolicyData {
  name?: string;
  daysPerYear?: number;
  daysPerMonth?: number;
  maxAccumulation?: number;
  carryForward?: boolean;
  requiresApproval?: boolean;
  minNoticeDays?: number;
  isActive?: boolean;
  description?: string;
}

export interface LeavePolicyFilters {
  leaveType?: string;
  isActive?: boolean;
}

export class LeavePolicyService {
  /**
   * Créer une politique de congés
   */
  async create(companyId: string, data: CreateLeavePolicyData) {
    // Vérifier l'unicité du type de congé
    const existing = await prisma.leavePolicy.findUnique({
      where: {
        companyId_leaveType: {
          company_id: companyId,
          leaveType: data.leaveType,
        },
      },
    });

    if (existing) {
      throw new CustomError(
        `Leave policy for type ${data.leaveType} already exists`,
        409,
        'LEAVE_POLICY_EXISTS'
      );
    }

    // Validation
    if (data.daysPerYear < 0) {
      throw new CustomError('Days per year must be positive', 400, 'VALIDATION_ERROR');
    }

    if (data.daysPerMonth && data.daysPerMonth < 0) {
      throw new CustomError('Days per month must be positive', 400, 'VALIDATION_ERROR');
    }

    const policy = await prisma.leavePolicy.create({
      data: {
        company_id: companyId,
        name: data.name,
        leaveType: data.leaveType,
        daysPerYear: new Decimal(data.daysPerYear),
        daysPerMonth: data.daysPerMonth ? new Decimal(data.daysPerMonth) : null,
        maxAccumulation: data.maxAccumulation ? new Decimal(data.maxAccumulation) : null,
        carryForward: data.carryForward ?? false,
        requiresApproval: data.requiresApproval ?? true,
        minNoticeDays: data.minNoticeDays ?? 0,
        description: data.description,
        isActive: true,
      },
    });

    logger.info(`Leave policy created: ${policy.id}`, {
      company_id: companyId,
      policyId: policy.id,
      leaveType: data.leaveType,
    });

    return policy;
  }

  /**
   * Obtenir une politique par ID
   */
  async getById(companyId: string, policyId: string) {
    const policy = await prisma.leavePolicy.findFirst({
      where: {
        id: policyId,
        company_id: companyId,
      },
    });

    if (!policy) {
      throw new CustomError('Leave policy not found', 404, 'LEAVE_POLICY_NOT_FOUND');
    }

    return policy;
  }

  /**
   * Obtenir une politique par type
   */
  async getByType(companyId: string, leaveType: string) {
    const policy = await prisma.leavePolicy.findUnique({
      where: {
        companyId_leaveType: {
          company_id: companyId,
          leaveType,
        },
      },
    });

    return policy;
  }

  /**
   * Lister les politiques de congés
   */
  async list(companyId: string, filters: LeavePolicyFilters = {}) {
    const where: Prisma.leave_policiesWhereInput = {
      company_id: companyId,
      ...(filters.leaveType && { leaveType: filters.leaveType }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    const policies = await prisma.leavePolicy.findMany({
      where,
      orderBy: {
        leaveType: 'asc',
      },
    });

    return {
      data: policies,
      total: policies.length,
    };
  }

  /**
   * Mettre à jour une politique
   */
  async update(companyId: string, policyId: string, data: UpdateLeavePolicyData) {
    const policy = await this.getById(companyId, policyId);

    const updateData: Prisma.leave_policiesUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.daysPerYear !== undefined) {
      if (data.daysPerYear < 0) {
        throw new CustomError('Days per year must be positive', 400, 'VALIDATION_ERROR');
      }
      updateData.days_per_year = new Decimal(data.daysPerYear);
    }
    if (data.daysPerMonth !== undefined) {
      if (data.daysPerMonth < 0) {
        throw new CustomError('Days per month must be positive', 400, 'VALIDATION_ERROR');
      }
      updateData.days_per_month = data.daysPerMonth ? new Decimal(data.daysPerMonth) : null;
    }
    if (data.maxAccumulation !== undefined) {
      updateData.max_accumulation = data.maxAccumulation
        ? new Decimal(data.maxAccumulation)
        : null;
    }
    if (data.carryForward !== undefined) updateData.carry_forward = data.carryForward;
    if (data.requiresApproval !== undefined) updateData.requires_approval = data.requiresApproval;
    if (data.minNoticeDays !== undefined) updateData.min_notice_days = data.minNoticeDays;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.description !== undefined) updateData.description = data.description;

    const updated = await prisma.leavePolicy.update({
      where: { id: policyId },
      data: updateData,
    });

    logger.info(`Leave policy updated: ${policyId}`, {
      company_id: companyId,
      policyId,
    });

    return updated;
  }

  /**
   * Supprimer une politique
   */
  async delete(companyId: string, policyId: string) {
    const policy = await this.getById(companyId, policyId);

    await prisma.leavePolicy.delete({
      where: { id: policyId },
    });

    logger.info(`Leave policy deleted: ${policyId}`, {
      company_id: companyId,
      policyId,
    });

    return { success: true };
  }

  /**
   * Créer les politiques par défaut pour RDC
   */
  async createDefaultPolicies(companyId: string) {
    const defaultPolicies: CreateLeavePolicyData[] = [
      {
        name: 'Congés payés',
        leaveType: 'paid',
        daysPerYear: 12, // Minimum légal RDC : 1 jour/mois = 12 jours/an
        daysPerMonth: 1,
        carryForward: true,
        requiresApproval: true,
        minNoticeDays: 7,
        description: 'Congés payés annuels (minimum légal RDC)',
      },
      {
        name: 'Congés maladie',
        leaveType: 'sick',
        daysPerYear: 30,
        requiresApproval: true,
        minNoticeDays: 0,
        description: 'Congés pour maladie',
      },
      {
        name: 'Congés sans solde',
        leaveType: 'unpaid',
        daysPerYear: 0, // Pas de limite
        requiresApproval: true,
        minNoticeDays: 14,
        description: 'Congés sans rémunération',
      },
      {
        name: 'Congé maternité',
        leaveType: 'maternity',
        daysPerYear: 98, // 14 semaines selon législation RDC
        requiresApproval: true,
        minNoticeDays: 30,
        description: 'Congé maternité (14 semaines)',
      },
      {
        name: 'Congé paternité',
        leaveType: 'paternity',
        daysPerYear: 3,
        requiresApproval: true,
        minNoticeDays: 7,
        description: 'Congé paternité (3 jours)',
      },
    ];

    const created = [];

    for (const policyData of defaultPolicies) {
      try {
        const policy = await this.create(companyId, policyData);
        created.push(policy);
      } catch (error: any) {
        // Ignorer si la politique existe déjà
        if (error.code !== 'LEAVE_POLICY_EXISTS') {
          throw error;
        }
      }
    }

    logger.info(`Default leave policies created for company: ${companyId}`, {
      company_id: companyId,
      count: created.length,
    });

    return created;
  }
}

export default new LeavePolicyService();

