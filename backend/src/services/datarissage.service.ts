import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';

// Types pour les étapes du datarissage
export type BusinessType = 'commerce' | 'services' | 'production' | 'logistique' | 'ong' | 'multi_activite';

export type StockManagementType = 'simple' | 'multi_warehouses';
export type StockTrackingType = 'quantity' | 'lots' | 'serial_numbers';
export type StockValuationMethod = 'fifo' | 'weighted_average';

export type RhOrganizationType = 'simple' | 'departmental' | 'multi_entity';
export type PayrollCycle = 'monthly' | 'other';

export interface DatarissageStep1Data {
  // Étape 1 - Identification
  raisonSociale?: string;
  pays?: string;
  devise?: string;
  timezone?: string;
  typeActivite?: string;
}

export interface DatarissageStep2Data {
  // Étape 2 - Type d'entreprise
  businessType?: BusinessType;
}

export interface DatarissageStep3Data {
  // Étape 3 - Activation modules
  moduleFacturation?: boolean;
  moduleComptabilite?: boolean;
  moduleStock?: boolean;
  moduleRh?: boolean;
}

export interface DatarissageStep4Data {
  // Étape 4 - Configuration Stock (si activé)
  stockManagementType?: StockManagementType;
  stockTrackingType?: StockTrackingType;
  stockAllowNegative?: boolean;
  stockValuationMethod?: StockValuationMethod;
}

export interface DatarissageStep5Data {
  // Étape 5 - Configuration RH (si activé)
  rhOrganizationType?: RhOrganizationType;
  rhPayrollEnabled?: boolean;
  rhPayrollCycle?: PayrollCycle;
  rhAccountingIntegration?: boolean;
}

export interface DatarissageStep6Data {
  // Étape 6 - Administrateur principal
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface DatarissageCompleteData {
  step1?: DatarissageStep1Data;
  step2?: DatarissageStep2Data;
  step3?: DatarissageStep3Data;
  step4?: DatarissageStep4Data;
  step5?: DatarissageStep5Data;
  step6?: DatarissageStep6Data;
}

export class DatarissageService {
  /**
   * Vérifier si le datarissage est déjà complété
   */
  async isCompleted(companyId: string): Promise<boolean> {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { datarissage_completed: true },
    });

    return company?.datarissage_completed || false;
  }

  /**
   * Valider les données d'une étape
   */
  private validateStep1(data: DatarissageStep1Data): void {
    if (!data.raisonSociale || data.raisonSociale.trim().length === 0) {
      throw new CustomError('Raison sociale requise', 400, 'MISSING_RAISON_SOCIALE');
    }
    if (!data.pays || data.pays.trim().length === 0) {
      throw new CustomError('Pays requis', 400, 'MISSING_PAYS');
    }
    if (!data.devise || data.devise.trim().length !== 3) {
      throw new CustomError('Devise invalide (3 caractères requis)', 400, 'INVALID_DEVISE');
    }
    if (!data.timezone || data.timezone.trim().length === 0) {
      throw new CustomError('Fuseau horaire requis', 400, 'MISSING_TIMEZONE');
    }
    if (!data.typeActivite || data.typeActivite.trim().length === 0) {
      throw new CustomError('Type d\'activité requis', 400, 'MISSING_TYPE_ACTIVITE');
    }
  }

  private validateStep2(data: DatarissageStep2Data): void {
    const validBusinessTypes: BusinessType[] = ['commerce', 'services', 'production', 'logistique', 'ong', 'multi_activite'];
    if (!validBusinessTypes.includes(data.businessType)) {
      throw new CustomError('Type d\'entreprise invalide', 400, 'INVALID_BUSINESS_TYPE');
    }
  }

  private validateStep3(data: DatarissageStep3Data): void {
    // Au moins un module doit être activé
    if (!data.moduleFacturation && !data.moduleComptabilite && !data.moduleStock && !data.moduleRh) {
      throw new CustomError('Au moins un module doit être activé', 400, 'NO_MODULE_ACTIVATED');
    }

    // Si Stock activé, les prérequis doivent être remplis
    if (data.moduleStock && !data.moduleFacturation) {
      throw new CustomError('Le module Stock nécessite le module Facturation', 400, 'STOCK_REQUIRES_FACTURATION');
    }

    // Si RH activé, les prérequis doivent être remplis
    if (data.moduleRh && !data.moduleComptabilite) {
      throw new CustomError('Le module RH nécessite le module Comptabilité', 400, 'RH_REQUIRES_COMPTABILITE');
    }
  }

  private validateStep4(data: DatarissageStep4Data): void {
    const validManagementTypes: StockManagementType[] = ['simple', 'multi_warehouses'];
    if (!validManagementTypes.includes(data.stockManagementType)) {
      throw new CustomError('Type de gestion stock invalide', 400, 'INVALID_STOCK_MANAGEMENT_TYPE');
    }

    const validTrackingTypes: StockTrackingType[] = ['quantity', 'lots', 'serial_numbers'];
    if (!validTrackingTypes.includes(data.stockTrackingType)) {
      throw new CustomError('Type de suivi stock invalide', 400, 'INVALID_STOCK_TRACKING_TYPE');
    }

    const validValuationMethods: StockValuationMethod[] = ['fifo', 'weighted_average'];
    if (!validValuationMethods.includes(data.stockValuationMethod)) {
      throw new CustomError('Méthode de valorisation invalide', 400, 'INVALID_STOCK_VALUATION_METHOD');
    }
  }

  private validateStep5(data: DatarissageStep5Data): void {
    const validOrgTypes: RhOrganizationType[] = ['simple', 'departmental', 'multi_entity'];
    if (!validOrgTypes.includes(data.rhOrganizationType)) {
      throw new CustomError('Type d\'organisation RH invalide', 400, 'INVALID_RH_ORGANIZATION_TYPE');
    }

    const validPayrollCycles: PayrollCycle[] = ['monthly', 'other'];
    if (!validPayrollCycles.includes(data.rhPayrollCycle)) {
      throw new CustomError('Cycle de paie invalide', 400, 'INVALID_PAYROLL_CYCLE');
    }

    // Si paie activée, vérifier que les règles sont claires
    if (data.rhPayrollEnabled && !data.rhPayrollCycle) {
      throw new CustomError('Cycle de paie requis si paie activée', 400, 'PAYROLL_CYCLE_REQUIRED');
    }
  }

  private validateStep6(data: DatarissageStep6Data): void {
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new CustomError('Email invalide', 400, 'INVALID_EMAIL');
    }
    if (!data.password || data.password.length < 8) {
      throw new CustomError('Mot de passe doit contenir au moins 8 caractères', 400, 'PASSWORD_TOO_SHORT');
    }
    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new CustomError('Prénom requis', 400, 'MISSING_FIRST_NAME');
    }
    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new CustomError('Nom requis', 400, 'MISSING_LAST_NAME');
    }
  }

  /**
   * Compléter le datarissage (toutes les étapes)
   */
  async completeDatarissage(companyId: string, data: DatarissageCompleteData, userId?: string): Promise<any> {
    // Vérifier que le datarissage n'est pas déjà complété
    const isCompleted = await this.isCompleted(companyId);
    if (isCompleted) {
      throw new CustomError('Le datarissage est déjà complété et ne peut pas être modifié', 403, 'DATARISSAGE_ALREADY_COMPLETED');
    }

    // Valider toutes les étapes
    this.validateStep1(data.step1);
    this.validateStep2(data.step2);
    this.validateStep3(data.step3);

    if (data.step3.moduleStock) {
      if (!data.step4) {
        throw new CustomError('Configuration Stock requise si module Stock activé', 400, 'STOCK_CONFIG_REQUIRED');
      }
      this.validateStep4(data.step4);
    }

    if (data.step3.moduleRh) {
      if (!data.step5) {
        throw new CustomError('Configuration RH requise si module RH activé', 400, 'RH_CONFIG_REQUIRED');
      }
      this.validateStep5(data.step5);
    }

    this.validateStep6(data.step6);

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.users.findFirst({
      where: {
        email: data.step6.email,
        deleted_at: null,
      },
    });

    if (existingUser) {
      throw new CustomError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTS');
    }

    // Exécuter le datarissage dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour l'entreprise avec les informations de base
      const company = await tx.companies.update({
        where: { id: companyId },
        data: {
          name: data.step1.raisonSociale,
          country: data.step1.pays,
          currency: data.step1.devise,
          timezone: data.step1.timezone,
          business_type: data.step2.businessType,
          // Modules
          module_facturation_enabled: data.step3.moduleFacturation,
          module_comptabilite_enabled: data.step3.moduleComptabilite,
          module_stock_enabled: data.step3.moduleStock,
          module_rh_enabled: data.step3.moduleRh,
          // Configuration Stock
          ...(data.step3.moduleStock && data.step4 ? {
            stock_management_type: data.step4.stockManagementType,
            stock_tracking_type: data.step4.stockTrackingType,
            stock_allow_negative: data.step4.stockAllowNegative,
            stock_valuation_method: data.step4.stockValuationMethod,
          } : {}),
          // Configuration RH
          ...(data.step3.moduleRh && data.step5 ? {
            rh_organization_type: data.step5.rhOrganizationType,
            rh_payroll_enabled: data.step5.rhPayrollEnabled,
            rh_payroll_cycle: data.step5.rhPayrollCycle,
            rh_accounting_integration: data.step5.rhAccountingIntegration,
          } : {}),
          datarissage_completed: true,
          datarissage_completed_at: new Date(),
        },
      });

      // 2. Créer les paramètres de verrouillage
      const bcrypt = (await import('bcrypt')).default;
      const env = (await import('../config/env')).default;
      const passwordHash = await bcrypt.hash(data.step6.password, parseInt(env.BCRYPT_ROUNDS));

      // 3. Créer l'administrateur principal (Owner) - DOC-01 Étape 6
      const owner = await tx.users.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: data.step6.email,
          password_hash: passwordHash,
          first_name: data.step6.firstName,
          last_name: data.step6.lastName,
          company_id: companyId,
          role: 'owner', // DOC-01 : Rôle Owner (propriétaire de la société)
          email_verified: false,
        },
      });

      // 4. Créer les paramètres de verrouillage
      await tx.company_datarissage_settings.create({
        data: {
          company_id: companyId,
          currency_locked: true,
          business_type_locked: true,
          stock_management_type_locked: data.step3.moduleStock,
          stock_valuation_method_locked: data.step3.moduleStock,
          rh_payroll_enabled_locked: data.step3.moduleRh && data.step5?.rhPayrollEnabled === true,
          locked_at: new Date(),
          locked_by: userId || owner.id,
        },
      });

      // 5. Initialiser les modules activés
      if (data.step3.moduleComptabilite) {
        // Initialiser le plan comptable OHADA si nécessaire
        // (Cette logique devrait être dans un service dédié)
      }

      if (data.step3.moduleStock) {
        // Initialiser les tables de stock si nécessaire
        // (Cette logique devrait être dans un service dédié)
      }

      if (data.step3.moduleRh) {
        // Initialiser les tables RH si nécessaire
        // (Cette logique devrait être dans un service dédié)
      }

      logger.info('Datarissage complété', {
        companyId,
        businessType: data.step2.businessType,
        modules: {
          facturation: data.step3.moduleFacturation,
          comptabilite: data.step3.moduleComptabilite,
          stock: data.step3.moduleStock,
          rh: data.step3.moduleRh,
        },
      });

      return {
        company,
        owner: {
          id: owner.id,
          email: owner.email,
          first_name: owner.first_name,
          last_name: owner.last_name,
        },
      };
    });

    return result;
  }

  /**
   * Obtenir l'état actuel du datarissage
   */
  async getDatarissageStatus(companyId: string): Promise<any> {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      include: {
        company_datarissage_settings: true,
      },
    });

    if (!company) {
      throw new CustomError('Entreprise non trouvée', 404, 'COMPANY_NOT_FOUND');
    }

    return {
      completed: company.datarissage_completed,
      completedAt: company.datarissage_completed_at,
      businessType: company.business_type,
      modules: {
        facturation: company.module_facturation_enabled,
        comptabilite: company.module_comptabilite_enabled,
        stock: company.module_stock_enabled,
        rh: company.module_rh_enabled,
      },
      lockedSettings: company.company_datarissage_settings,
    };
  }

  /**
   * Vérifier si un élément est verrouillé
   */
  async isFieldLocked(companyId: string, field: string): Promise<boolean> {
    const settings = await prisma.company_datarissage_settings.findUnique({
      where: { company_id: companyId },
    });

    if (!settings) {
      return false; // Pas encore de datarissage, donc pas verrouillé
    }

    const lockMap: Record<string, keyof typeof settings> = {
      currency: 'currency_locked',
      businessType: 'business_type_locked',
      stockManagementType: 'stock_management_type_locked',
      stockValuationMethod: 'stock_valuation_method_locked',
      rhPayrollEnabled: 'rh_payroll_enabled_locked',
    };

    const lockField = lockMap[field];
    if (!lockField) {
      return false;
    }

    return settings[lockField] || false;
  }
}

export default new DatarissageService();

