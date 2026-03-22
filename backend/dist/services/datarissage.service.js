"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatarissageService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
class DatarissageService {
    /**
     * Vérifier si le datarissage est déjà complété
     */
    async isCompleted(companyId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            select: { datarissage_completed: true },
        });
        return company?.datarissage_completed || false;
    }
    /**
     * Valider les données d'une étape
     */
    validateStep1(data) {
        if (!data.raisonSociale || data.raisonSociale.trim().length === 0) {
            throw new error_middleware_1.CustomError('Raison sociale requise', 400, 'MISSING_RAISON_SOCIALE');
        }
        if (!data.pays || data.pays.trim().length === 0) {
            throw new error_middleware_1.CustomError('Pays requis', 400, 'MISSING_PAYS');
        }
        if (!data.devise || data.devise.trim().length !== 3) {
            throw new error_middleware_1.CustomError('Devise invalide (3 caractères requis)', 400, 'INVALID_DEVISE');
        }
        if (!data.timezone || data.timezone.trim().length === 0) {
            throw new error_middleware_1.CustomError('Fuseau horaire requis', 400, 'MISSING_TIMEZONE');
        }
        if (!data.typeActivite || data.typeActivite.trim().length === 0) {
            throw new error_middleware_1.CustomError('Type d\'activité requis', 400, 'MISSING_TYPE_ACTIVITE');
        }
    }
    validateStep2(data) {
        const validBusinessTypes = ['commerce', 'services', 'production', 'logistique', 'ong', 'multi_activite'];
        if (!validBusinessTypes.includes(data.businessType)) {
            throw new error_middleware_1.CustomError('Type d\'entreprise invalide', 400, 'INVALID_BUSINESS_TYPE');
        }
    }
    validateStep3(data) {
        // Au moins un module doit être activé
        if (!data.moduleFacturation && !data.moduleComptabilite && !data.moduleStock && !data.moduleRh) {
            throw new error_middleware_1.CustomError('Au moins un module doit être activé', 400, 'NO_MODULE_ACTIVATED');
        }
        // Si Stock activé, les prérequis doivent être remplis
        if (data.moduleStock && !data.moduleFacturation) {
            throw new error_middleware_1.CustomError('Le module Stock nécessite le module Facturation', 400, 'STOCK_REQUIRES_FACTURATION');
        }
        // Si RH activé, les prérequis doivent être remplis
        if (data.moduleRh && !data.moduleComptabilite) {
            throw new error_middleware_1.CustomError('Le module RH nécessite le module Comptabilité', 400, 'RH_REQUIRES_COMPTABILITE');
        }
    }
    validateStep4(data) {
        const validManagementTypes = ['simple', 'multi_warehouses'];
        if (!validManagementTypes.includes(data.stockManagementType)) {
            throw new error_middleware_1.CustomError('Type de gestion stock invalide', 400, 'INVALID_STOCK_MANAGEMENT_TYPE');
        }
        const validTrackingTypes = ['quantity', 'lots', 'serial_numbers'];
        if (!validTrackingTypes.includes(data.stockTrackingType)) {
            throw new error_middleware_1.CustomError('Type de suivi stock invalide', 400, 'INVALID_STOCK_TRACKING_TYPE');
        }
        const validValuationMethods = ['fifo', 'weighted_average'];
        if (!validValuationMethods.includes(data.stockValuationMethod)) {
            throw new error_middleware_1.CustomError('Méthode de valorisation invalide', 400, 'INVALID_STOCK_VALUATION_METHOD');
        }
    }
    validateStep5(data) {
        const validOrgTypes = ['simple', 'departmental', 'multi_entity'];
        if (!validOrgTypes.includes(data.rhOrganizationType)) {
            throw new error_middleware_1.CustomError('Type d\'organisation RH invalide', 400, 'INVALID_RH_ORGANIZATION_TYPE');
        }
        const validPayrollCycles = ['monthly', 'other'];
        if (!validPayrollCycles.includes(data.rhPayrollCycle)) {
            throw new error_middleware_1.CustomError('Cycle de paie invalide', 400, 'INVALID_PAYROLL_CYCLE');
        }
        // Si paie activée, vérifier que les règles sont claires
        if (data.rhPayrollEnabled && !data.rhPayrollCycle) {
            throw new error_middleware_1.CustomError('Cycle de paie requis si paie activée', 400, 'PAYROLL_CYCLE_REQUIRED');
        }
    }
    validateStep6(data) {
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            throw new error_middleware_1.CustomError('Email invalide', 400, 'INVALID_EMAIL');
        }
        if (!data.password || data.password.length < 8) {
            throw new error_middleware_1.CustomError('Mot de passe doit contenir au moins 8 caractères', 400, 'PASSWORD_TOO_SHORT');
        }
        if (!data.firstName || data.firstName.trim().length === 0) {
            throw new error_middleware_1.CustomError('Prénom requis', 400, 'MISSING_FIRST_NAME');
        }
        if (!data.lastName || data.lastName.trim().length === 0) {
            throw new error_middleware_1.CustomError('Nom requis', 400, 'MISSING_LAST_NAME');
        }
    }
    /**
     * Compléter le datarissage (toutes les étapes)
     */
    async completeDatarissage(companyId, data, userId) {
        // Vérifier que le datarissage n'est pas déjà complété
        const isCompleted = await this.isCompleted(companyId);
        if (isCompleted) {
            throw new error_middleware_1.CustomError('Le datarissage est déjà complété et ne peut pas être modifié', 403, 'DATARISSAGE_ALREADY_COMPLETED');
        }
        // Valider toutes les étapes
        this.validateStep1(data.step1);
        this.validateStep2(data.step2);
        this.validateStep3(data.step3);
        if (data.step3.moduleStock) {
            if (!data.step4) {
                throw new error_middleware_1.CustomError('Configuration Stock requise si module Stock activé', 400, 'STOCK_CONFIG_REQUIRED');
            }
            this.validateStep4(data.step4);
        }
        if (data.step3.moduleRh) {
            if (!data.step5) {
                throw new error_middleware_1.CustomError('Configuration RH requise si module RH activé', 400, 'RH_CONFIG_REQUIRED');
            }
            this.validateStep5(data.step5);
        }
        this.validateStep6(data.step6);
        // Vérifier que l'email n'existe pas déjà
        const existingUser = await database_1.default.users.findFirst({
            where: {
                email: data.step6.email,
                deleted_at: null,
            },
        });
        if (existingUser) {
            throw new error_middleware_1.CustomError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTS');
        }
        // Exécuter le datarissage dans une transaction
        const result = await database_1.default.$transaction(async (tx) => {
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
            const bcrypt = (await Promise.resolve().then(() => __importStar(require('bcrypt')))).default;
            const env = (await Promise.resolve().then(() => __importStar(require('../config/env')))).default;
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
            logger_1.default.info('Datarissage complété', {
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
    async getDatarissageStatus(companyId) {
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
            include: {
                company_datarissage_settings: true,
            },
        });
        if (!company) {
            throw new error_middleware_1.CustomError('Entreprise non trouvée', 404, 'COMPANY_NOT_FOUND');
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
    async isFieldLocked(companyId, field) {
        const settings = await database_1.default.company_datarissage_settings.findUnique({
            where: { company_id: companyId },
        });
        if (!settings) {
            return false; // Pas encore de datarissage, donc pas verrouillé
        }
        const lockMap = {
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
exports.DatarissageService = DatarissageService;
exports.default = new DatarissageService();
//# sourceMappingURL=datarissage.service.js.map