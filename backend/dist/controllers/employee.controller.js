"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const employee_service_1 = __importDefault(require("../services/employee.service"));
const zod_1 = require("zod");
const preprocessEmptyString = (val) => {
    if (val === '' || val === null)
        return undefined;
    return val;
};
const preprocessData = (data) => {
    if (typeof data !== 'object' || data === null)
        return data;
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        cleaned[key] = preprocessEmptyString(value);
    }
    return cleaned;
};
const baseEmployeeSchema = zod_1.z.object({
    employeeNumber: zod_1.z.string().min(1),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    mobile: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    hireDate: zod_1.z.string().min(1),
    terminationDate: zod_1.z.string().optional(),
    employmentType: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    baseSalary: zod_1.z.number().nonnegative(),
    currency: zod_1.z.string().optional(),
    salaryFrequency: zod_1.z.string().optional(),
    bankAccount: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    nif: zod_1.z.string().optional(),
    socialSecurityNumber: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const createEmployeeSchema = zod_1.z.preprocess(preprocessData, baseEmployeeSchema);
const updateEmployeeSchema = zod_1.z.preprocess(preprocessData, baseEmployeeSchema.partial());
const listEmployeesSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).optional(),
});
class EmployeeController {
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = createEmployeeSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const employee = await employee_service_1.default.create(companyId, data);
            res.status(201).json({ success: true, data: employee });
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const employee = await employee_service_1.default.getById(companyId, req.params.id);
            res.json({ success: true, data: employee });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const filters = listEmployeesSchema.parse(req.query);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const result = await employee_service_1.default.list(companyId, filters);
            res.json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const data = updateEmployeeSchema.parse(req.body);
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const employee = await employee_service_1.default.update(companyId, req.params.id, data);
            res.json({ success: true, data: employee });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            if (!req.user)
                throw new Error('User not authenticated');
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            await employee_service_1.default.delete(companyId, req.params.id);
            res.json({ success: true, message: 'Employee deleted successfully' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EmployeeController = EmployeeController;
exports.default = new EmployeeController();
//# sourceMappingURL=employee.controller.js.map