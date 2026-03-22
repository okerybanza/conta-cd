"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveBalanceController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const leaveBalance_service_1 = __importDefault(require("../services/leaveBalance.service"));
const zod_1 = require("zod");
const getBalanceSchema = zod_1.z.object({
    leaveType: zod_1.z.string().min(1),
    year: zod_1.z.coerce.number().int().positive().optional(),
});
const getEmployeeBalancesSchema = zod_1.z.object({
    year: zod_1.z.coerce.number().int().positive().optional(),
});
class LeaveBalanceController {
    async getBalance(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { employeeId } = req.params;
            const { leaveType, year } = getBalanceSchema.parse(req.query);
            const balanceYear = year || new Date().getFullYear();
            const balance = await leaveBalance_service_1.default.getBalance((0, auth_middleware_1.getCompanyId)(req), employeeId, leaveType, balanceYear);
            res.json(balance);
        }
        catch (error) {
            next(error);
        }
    }
    async getEmployeeBalances(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const { employeeId } = req.params;
            const { year } = getEmployeeBalancesSchema.parse(req.query);
            const balanceYear = year || new Date().getFullYear();
            const balances = await leaveBalance_service_1.default.getEmployeeBalances((0, auth_middleware_1.getCompanyId)(req), employeeId, balanceYear);
            res.json(balances);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LeaveBalanceController = LeaveBalanceController;
exports.default = new LeaveBalanceController();
//# sourceMappingURL=leaveBalance.controller.js.map