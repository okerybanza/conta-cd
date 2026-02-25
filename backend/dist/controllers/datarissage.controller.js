"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatarissageController = void 0;
const datarissage_service_1 = __importDefault(require("../services/datarissage.service"));
const zod_1 = require("zod");
// Schémas de validation
const step1Schema = zod_1.z.object({
    raisonSociale: zod_1.z.string().min(1),
    pays: zod_1.z.string().min(1),
    devise: zod_1.z.string().length(3),
    timezone: zod_1.z.string().min(1),
    typeActivite: zod_1.z.string().min(1),
});
const step2Schema = zod_1.z.object({
    businessType: zod_1.z.enum(['commerce', 'services', 'production', 'logistique', 'ong', 'multi_activite']),
});
const step3Schema = zod_1.z.object({
    moduleFacturation: zod_1.z.boolean(),
    moduleComptabilite: zod_1.z.boolean(),
    moduleStock: zod_1.z.boolean(),
    moduleRh: zod_1.z.boolean(),
});
const step4Schema = zod_1.z.object({
    stockManagementType: zod_1.z.enum(['simple', 'multi_warehouses']),
    stockTrackingType: zod_1.z.enum(['quantity', 'lots', 'serial_numbers']),
    stockAllowNegative: zod_1.z.boolean(),
    stockValuationMethod: zod_1.z.enum(['fifo', 'weighted_average']),
}).optional();
const step5Schema = zod_1.z.object({
    rhOrganizationType: zod_1.z.enum(['simple', 'departmental', 'multi_entity']),
    rhPayrollEnabled: zod_1.z.boolean(),
    rhPayrollCycle: zod_1.z.enum(['monthly', 'other']),
    rhAccountingIntegration: zod_1.z.boolean(),
}).optional();
const step6Schema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
});
const completeDatarissageSchema = zod_1.z.object({
    step1: step1Schema,
    step2: step2Schema,
    step3: step3Schema,
    step4: step4Schema,
    step5: step5Schema,
    step6: step6Schema,
});
class DatarissageController {
    /**
     * Compléter le datarissage (toutes les étapes)
     */
    async complete(req, res, next) {
        try {
            if (!req.user || !req.user.companyId) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
                });
            }
            const data = completeDatarissageSchema.parse(req.body);
            const result = await datarissage_service_1.default.completeDatarissage(req.user.companyId, data, req.user.id);
            res.status(201).json({
                success: true,
                data: result,
                message: 'Datarissage complété avec succès',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtenir l'état du datarissage
     */
    async getStatus(req, res, next) {
        try {
            if (!req.user || !req.user.companyId) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
                });
            }
            const status = await datarissage_service_1.default.getDatarissageStatus(req.user.companyId);
            res.json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Vérifier si un champ est verrouillé
     */
    async checkLocked(req, res, next) {
        try {
            if (!req.user || !req.user.companyId) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
                });
            }
            const { field } = req.params;
            const isLocked = await datarissage_service_1.default.isFieldLocked(req.user.companyId, field);
            res.json({
                success: true,
                data: {
                    field,
                    locked: isLocked,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DatarissageController = DatarissageController;
exports.default = new DatarissageController();
//# sourceMappingURL=datarissage.controller.js.map