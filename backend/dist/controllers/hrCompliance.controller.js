"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrComplianceController = void 0;
const zod_1 = require("zod");
const auth_middleware_1 = require("../middleware/auth.middleware");
const hrCompliance_service_1 = __importDefault(require("../services/hrCompliance.service"));
const complianceQuerySchema = zod_1.z.object({
    periodStart: zod_1.z.string().optional(),
    periodEnd: zod_1.z.string().optional(),
});
class HrComplianceController {
    async getRdcReport(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { periodStart, periodEnd } = complianceQuerySchema.parse(req.query);
            // Par défaut : 3 derniers mois
            const end = periodEnd ? new Date(periodEnd) : new Date();
            const start = periodStart
                ? new Date(periodStart)
                : new Date(end.getFullYear(), end.getMonth() - 2, 1);
            const report = await hrCompliance_service_1.default.generateComplianceReport((0, auth_middleware_1.getCompanyId)(req), start, end);
            res.json(report);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.HrComplianceController = HrComplianceController;
exports.default = new HrComplianceController();
//# sourceMappingURL=hrCompliance.controller.js.map