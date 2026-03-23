/**
 * Service de gestion des contrats RH (DOC-04)
 * 
 * Principe : Un employé peut avoir plusieurs contrats successifs, jamais simultanés actifs
 * Architecture événementielle : chaque action génère un événement
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';
import { eventBus } from '../events/event-bus';
import { EmployeeContractCreated, EmployeeContractTerminated } from '../events/domain-event';

export interface CreateEmployeeContractData {
  employeeId?: string;
  contractType?: 'CDI' | 'CDD' | 'journalier' | 'consultant';
  startDate?: Date | string;
  endDate?: Date | string;
  baseSalary?: number;
  currency?: string;
  workType?: 'full_time' | 'part_time';
  hoursPerWeek?: number;
  notes?: string;
}

export interface UpdateEmployeeContractData {
  endDate?: Date | string;
  baseSalary?: number;
  workType?: 'full_time' | 'part_time';
  hoursPerWeek?: number;
  notes?: string;
}

export class EmployeeContractService {
  /**
   * Créer un contrat RH (DOC-04)
   * Invariant : un employé actif doit avoir un contrat actif
   * Invariant : jamais de contrats simultanés actifs
   */
  async create(companyId: string, data: CreateEmployeeContractData, userId?: string) {
    // Vérifier que l'employé existe et est actif
    const employee = await prisma.employees.findFirst({
      where: {
        id: data.employeeId,
        company_id: companyId,
        status: 'active',
        deleted_at: null,
      },
    });

    if (!employee) {
      throw new CustomError(
        'Employee not found or not active',
        404,
        'EMPLOYEE_NOT_FOUND'
      );
    }

    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    // Vérifier l'invariant : pas de contrats simultanés actifs
    const overlappingContracts = await prisma.employee_contracts.findMany({
      where: {
        employee_id: data.employeeId,
        company_id: companyId,
        status: 'active',
        deleted_at: null,
        OR: [
          {
            // Contrat existant qui chevauche
            AND: [
              { start_date: { lte: endDate || new Date('2099-12-31') } },
              {
                OR: [
                  { end_date: null },
                  { end_date: { gte: startDate } },
                ],
              },
            ],
          },
        ],
      },
    });

    if (overlappingContracts.length > 0) {
      throw new CustomError(
        'Un contrat actif existe déjà pour cette période',
        409,
        'OVERLAPPING_CONTRACT'
      );
    }

    // Terminer les contrats précédents si nécessaire
    if (overlappingContracts.length === 0) {
      // Vérifier s'il y a des contrats précédents non terminés
      const previousContracts = await prisma.employee_contracts.findMany({
        where: {
          employee_id: data.employeeId,
          company_id: companyId,
          status: 'active',
          deleted_at: null,
          start_date: { lt: startDate },
          OR: [
            { end_date: null },
            { end_date: { gte: startDate } },
          ],
        },
      });

      // Terminer automatiquement les contrats précédents
      for (const prevContract of previousContracts) {
        await prisma.employee_contracts.update({
          where: { id: prevContract.id },
          data: {
            status: 'expired',
            end_date: new Date(startDate.getTime() - 1), // Un jour avant le nouveau contrat
          },
        });
      }
    }

    const contract = await prisma.employee_contracts.create({
      data: {
        id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyId,
        employee_id: data.employeeId,
        contract_type: data.contractType,
        start_date: startDate as any,
        end_date: endDate,
        base_salary: new Prisma.Decimal(data.baseSalary),
        currency: data.currency || 'CDF',
        work_type: data.workType || 'full_time',
        hours_per_week: data.hoursPerWeek ? new Prisma.Decimal(data.hoursPerWeek) : null,
        status: 'active',
        notes: data.notes,
      },
      include: {
        employees: {
          select: {
            id: true,
            employee_number: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Publier l'événement (DOC-04)
    const event = new (EmployeeContractCreated as any)(
      contract.id,
      data.employeeId,
      data.contractType,
      startDate as any,
      data.baseSalary as any,
      data.currency || 'CDF',
      {
        userId,
        companyId,
        timestamp: new Date(),
      }
    );
    eventBus.publish(event);

    logger.info(`Employee contract created: ${contract.id}`, {
      companyId,
      employeeId: data.employeeId,
      contractId: contract.id,
    });

    return contract;
  }

  /**
   * Obtenir un contrat par ID
   */
  async getById(companyId: string, contractId: string) {
    const contract = await prisma.employee_contracts.findFirst({
      where: {
        id: contractId as any,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        employees: {
          select: {
            id: true,
            employee_number: true,
            first_name: true,
            last_name: true,
            status: true,
          },
        },
      },
    });

    if (!contract) {
      throw new CustomError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
    }

    return contract;
  }

  /**
   * Obtenir le contrat actif d'un employé
   */
  async getActiveContract(companyId: string, employeeId: string) {
    const contract = await prisma.employee_contracts.findFirst({
      where: {
        employee_id: employeeId,
        company_id: companyId,
        status: 'active',
        deleted_at: null,
        OR: [
          { end_date: null },
          { end_date: { gte: new Date() } },
        ],
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    return contract;
  }

  /**
   * Lister les contrats d'un employé
   */
  async listByEmployee(companyId: string, employeeId: string) {
    const contracts = await prisma.employee_contracts.findMany({
      where: {
        employee_id: employeeId,
        company_id: companyId,
        deleted_at: null,
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    return contracts;
  }

  /**
   * Mettre à jour un contrat
   */
  async update(
    companyId: string,
    contractId: string,
    data: UpdateEmployeeContractData,
    userId?: string
  ) {
    const contract = await this.getById(companyId, contractId);

    // Ne pas permettre la modification d'un contrat terminé
    if (contract.status !== 'active') {
      throw new CustomError(
        'Cannot update a terminated or expired contract',
        400,
        'CONTRACT_NOT_ACTIVE'
      );
    }

    const updateData: Prisma.employee_contractsUpdateInput = {};

    if (data.endDate !== undefined) {
      updateData.end_date = data.endDate ? new Date(data.endDate) : null;
      // Si date de fin définie et passée, marquer comme expiré
      if (data.endDate && new Date(data.endDate) < new Date()) {
        updateData.status = 'expired';
      }
    }
    if (data.baseSalary !== undefined) {
      updateData.base_salary = new Prisma.Decimal(data.baseSalary);
    }
    if (data.workType !== undefined) {
      updateData.work_type = data.workType;
    }
    if (data.hoursPerWeek !== undefined) {
      updateData.hours_per_week = data.hoursPerWeek ? new Prisma.Decimal(data.hoursPerWeek) : null;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const updated = await prisma.employee_contracts.update({
      where: { id: contractId },
      data: updateData,
    });

    logger.info(`Employee contract updated: ${contractId}`, { companyId, contractId });
    return updated;
  }

  /**
   * Terminer un contrat (DOC-04 : immutabilité)
   */
  async terminate(
    companyId: string,
    contractId: string,
    reason?: string,
    userId?: string
  ) {
    const contract = await this.getById(companyId, contractId);

    if (contract.status !== 'active') {
      throw new CustomError(
        'Contract is already terminated or expired',
        400,
        'CONTRACT_NOT_ACTIVE'
      );
    }

    const terminated = await prisma.employee_contracts.update({
      where: { id: contractId },
      data: {
        status: 'terminated',
        terminated_at: new Date(),
        terminated_by: userId || null,
        termination_reason: reason,
        end_date: new Date(), // Si pas de date de fin, utiliser aujourd'hui
      },
    });

    // Publier l'événement (DOC-04)
    const event = new (EmployeeContractTerminated as any)(
      contractId as any,
      contract.employee_id,
      new Date() as any,
      reason,
      {
        userId,
        companyId,
        timestamp: new Date(),
      }
    );
    eventBus.publish(event);

    logger.info(`Employee contract terminated: ${contractId}`, {
      companyId,
      contractId,
      employeeId: contract.employee_id,
    });

    return terminated;
  }
}

export default new EmployeeContractService();

