"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAgedBalance = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const agedBalance_service_1 = __importDefault(require("../services/agedBalance.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const agedBalanceQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(['receivables', 'payables']),
    asOfDate: zod_1.z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
});
/**
 * Générer la Balance Âgée
 */
const generateAgedBalance = async (req, res) => {
    try {
        const companyId = (0, auth_middleware_1.getCompanyId)(req);
        // Valider les paramètres
        const params = agedBalanceQuerySchema.parse(req.query);
        const report = await agedBalance_service_1.default.generateAgedBalance(companyId, params.type, params.asOfDate);
        logger_1.default.info(`Aged balance generated for company ${companyId}`, {
            companyId,
            type: params.type,
            totalItems: report.items.length,
            totalAmount: report.totals.total,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logger_1.default.error('Error generating aged balance', {
            error: error.message,
            stack: error.stack,
        });
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parameters',
                errors: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating aged balance',
        });
    }
};
exports.generateAgedBalance = generateAgedBalance;
//# sourceMappingURL=agedBalance.controller.js.map