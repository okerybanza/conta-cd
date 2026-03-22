"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const employee_controller_1 = __importDefault(require("../controllers/employee.controller"));
const attendance_controller_1 = __importDefault(require("../controllers/attendance.controller"));
const payroll_controller_1 = __importDefault(require("../controllers/payroll.controller"));
const leaveRequest_controller_1 = __importDefault(require("../controllers/leaveRequest.controller"));
const leavePolicy_controller_1 = __importDefault(require("../controllers/leavePolicy.controller"));
const leaveBalance_controller_1 = __importDefault(require("../controllers/leaveBalance.controller"));
const employeeDocument_controller_1 = __importDefault(require("../controllers/employeeDocument.controller"));
const hrCompliance_controller_1 = __importDefault(require("../controllers/hrCompliance.controller"));
const router = (0, express_1.Router)();
// ARCH-013: Limiter les rapports de conformité RH par utilisateur
const hrComplianceLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 rapports par 5 minutes et par utilisateur
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip || req.socket?.remoteAddress || 'unknown',
    message: {
        success: false,
        message: 'Trop de demandes de rapport de conformité. Veuillez réessayer plus tard.',
    },
});
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes Employees
router.post('/employees', employee_controller_1.default.create.bind(employee_controller_1.default));
router.get('/employees', employee_controller_1.default.list.bind(employee_controller_1.default));
router.get('/employees/:id', employee_controller_1.default.getById.bind(employee_controller_1.default));
router.put('/employees/:id', employee_controller_1.default.update.bind(employee_controller_1.default));
router.delete('/employees/:id', employee_controller_1.default.delete.bind(employee_controller_1.default));
// Routes Attendance
router.post('/attendance', attendance_controller_1.default.create.bind(attendance_controller_1.default));
router.get('/attendance', attendance_controller_1.default.list.bind(attendance_controller_1.default));
router.get('/attendance/:id', attendance_controller_1.default.getById.bind(attendance_controller_1.default));
router.put('/attendance/:id', attendance_controller_1.default.update.bind(attendance_controller_1.default));
router.delete('/attendance/:id', attendance_controller_1.default.delete.bind(attendance_controller_1.default));
router.get('/attendance/employee/:employeeId/stats', attendance_controller_1.default.getEmployeeStats.bind(attendance_controller_1.default));
// Routes Payroll
router.post('/payroll', payroll_controller_1.default.create.bind(payroll_controller_1.default));
router.get('/payroll', payroll_controller_1.default.list.bind(payroll_controller_1.default));
router.get('/payroll/:id/pdf', payroll_controller_1.default.generatePDF.bind(payroll_controller_1.default));
router.get('/payroll/:id', payroll_controller_1.default.getById.bind(payroll_controller_1.default));
router.put('/payroll/:id', payroll_controller_1.default.update.bind(payroll_controller_1.default));
router.post('/payroll/:id/approve', payroll_controller_1.default.approve.bind(payroll_controller_1.default));
router.post('/payroll/:id/mark-paid', payroll_controller_1.default.markAsPaid.bind(payroll_controller_1.default));
router.delete('/payroll/:id', payroll_controller_1.default.delete.bind(payroll_controller_1.default));
// Routes Leave Requests (Demandes de congés)
router.post('/leave-requests', leaveRequest_controller_1.default.create.bind(leaveRequest_controller_1.default));
router.get('/leave-requests', leaveRequest_controller_1.default.list.bind(leaveRequest_controller_1.default));
router.get('/leave-requests/:id', leaveRequest_controller_1.default.getById.bind(leaveRequest_controller_1.default));
router.put('/leave-requests/:id', leaveRequest_controller_1.default.update.bind(leaveRequest_controller_1.default));
router.post('/leave-requests/:id/approve', leaveRequest_controller_1.default.approve.bind(leaveRequest_controller_1.default));
router.post('/leave-requests/:id/reject', leaveRequest_controller_1.default.reject.bind(leaveRequest_controller_1.default));
router.post('/leave-requests/:id/cancel', leaveRequest_controller_1.default.cancel.bind(leaveRequest_controller_1.default));
// Routes Leave Policies (Politiques de congés)
router.post('/leave-policies', leavePolicy_controller_1.default.create.bind(leavePolicy_controller_1.default));
router.get('/leave-policies', leavePolicy_controller_1.default.list.bind(leavePolicy_controller_1.default));
router.get('/leave-policies/:id', leavePolicy_controller_1.default.getById.bind(leavePolicy_controller_1.default));
router.get('/leave-policies/type/:type', leavePolicy_controller_1.default.getByType.bind(leavePolicy_controller_1.default));
router.put('/leave-policies/:id', leavePolicy_controller_1.default.update.bind(leavePolicy_controller_1.default));
router.delete('/leave-policies/:id', leavePolicy_controller_1.default.delete.bind(leavePolicy_controller_1.default));
router.post('/leave-policies/defaults', leavePolicy_controller_1.default.createDefaults.bind(leavePolicy_controller_1.default));
// Routes Leave Balances (Soldes de congés)
router.get('/leave-balances/employee/:employeeId', leaveBalance_controller_1.default.getEmployeeBalances.bind(leaveBalance_controller_1.default));
router.get('/leave-balances/employee/:employeeId/balance', leaveBalance_controller_1.default.getBalance.bind(leaveBalance_controller_1.default));
// Routes Employee Documents (Documents employés)
router.post('/employee-documents', employeeDocument_controller_1.default.create.bind(employeeDocument_controller_1.default));
router.get('/employee-documents', employeeDocument_controller_1.default.list.bind(employeeDocument_controller_1.default));
router.get('/employee-documents/:id', employeeDocument_controller_1.default.getById.bind(employeeDocument_controller_1.default));
router.put('/employee-documents/:id', employeeDocument_controller_1.default.update.bind(employeeDocument_controller_1.default));
router.delete('/employee-documents/:id', employeeDocument_controller_1.default.delete.bind(employeeDocument_controller_1.default));
router.get('/employee-documents/expiring', employeeDocument_controller_1.default.getExpiring.bind(employeeDocument_controller_1.default));
router.get('/employee-documents/expired', employeeDocument_controller_1.default.getExpired.bind(employeeDocument_controller_1.default));
// Route Conformité légale RH (RDC)
router.get('/compliance/rdc', hrComplianceLimiter, hrCompliance_controller_1.default.getRdcReport.bind(hrCompliance_controller_1.default));
exports.default = router;
//# sourceMappingURL=hr.routes.js.map