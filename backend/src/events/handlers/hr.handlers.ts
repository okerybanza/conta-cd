/**
 * Handlers pour les événements RH (DOC-04)
 * 
 * Principe : La RH émet des événements comptables, ne modifie jamais directement les soldes
 */

import {
  PayrollValidated,
  EmployeeContractCreated,
  EmployeeContractTerminated,
} from '../domain-event';
import logger from '../../utils/logger';
import prisma from '../../config/database';
import journalEntryService from '../../services/journalEntry.service';
import accountService from '../../services/account.service';

/**
 * Handler : Validation d'une paie
 * Génère les écritures comptables correspondantes
 */
// CHECKLIST ÉTAPE 2 : Ce handler est maintenant obsolète car l'écriture comptable est créée atomiquement lors de la validation
// Conservé pour compatibilité, mais ne devrait plus être appelé
export async function handlePayrollValidated(event: PayrollValidated): Promise<void> {
  const { companyId } = event.metadata;

  // Vérifier si l'écriture comptable existe déjà (créée atomiquement lors de la validation)
  const existingEntry = await prisma.journal_entries.findFirst({
    where: {
      company_id: companyId,
      source_type: 'manual',
      source_id: event.payrollId,
      status: {
        not: 'reversed',
      },
    },
  });

  if (existingEntry) {
    // L'écriture existe déjà, créée atomiquement - ne rien faire
    logger.debug(`Accounting entry already exists for payroll (created atomically): ${event.payrollId}`, {
      payrollId: event.payrollId,
      companyId,
      entryId: existingEntry.id,
    });
    return;
  }

  // Si l'écriture n'existe pas, c'est une anomalie - logger et ne pas créer pour éviter les doublons
  logger.warn(`Accounting entry missing for payroll (should have been created atomically): ${event.payrollId}`, {
    payrollId: event.payrollId,
    companyId,
  });
  // Ne pas créer l'écriture ici car elle devrait avoir été créée atomiquement
  // Cela indique un problème dans le flux de validation
}

/**
 * Handler : Création d'un contrat employé
 */
export async function handleEmployeeContractCreated(event: EmployeeContractCreated): Promise<void> {
  try {
    const { companyId } = event.metadata;

    // Vérifier l'invariant : un employé actif doit avoir un contrat actif
    const employee = await prisma.employees.findFirst({
      where: {
        id: event.employeeId,
        company_id: companyId,
        status: 'active',
      },
    });

    if (!employee) return;

    // Vérifier qu'il n'y a pas d'autre contrat actif simultané
    const activeContracts = await prisma.employee_contracts.findMany({
      where: {
        employee_id: event.employeeId,
        company_id: companyId,
        status: 'active',
        deleted_at: null,
        id: { not: event.contractId },
        OR: [
          { end_date: null },
          { end_date: { gte: event.startDate } },
        ],
      },
    });

    if (activeContracts.length > 0) {
      logger.error('Multiple active contracts found for employee', {
        employeeId: event.employeeId,
        contractId: event.contractId,
      });
    }
  } catch (error: any) {
    logger.error('Error handling EmployeeContractCreated event', {
      contractId: event.contractId,
      error: error.message,
    });
  }
}

/**
 * Handler : Résiliation d'un contrat
 */
export async function handleEmployeeContractTerminated(event: EmployeeContractTerminated): Promise<void> {
  try {
    const { companyId } = event.metadata;

    const activeContracts = await prisma.employee_contracts.findMany({
      where: {
        employee_id: event.employeeId,
        company_id: companyId,
        status: 'active',
        deleted_at: null,
        id: { not: event.contractId },
        OR: [
          { end_date: null },
          { end_date: { gte: new Date() } },
        ],
      },
    });

    if (activeContracts.length === 0) {
      await prisma.employees.update({
        where: { id: event.employeeId },
        data: {
          status: 'terminated',
          termination_date: event.terminationDate,
        },
      });
    }
  } catch (error: any) {
    logger.error('Error handling EmployeeContractTerminated event', {
      contractId: event.contractId,
      error: error.message,
    });
  }
}
