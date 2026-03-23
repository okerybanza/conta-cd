import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import employeeController from '../controllers/employee.controller';
import attendanceController from '../controllers/attendance.controller';
import payrollController from '../controllers/payroll.controller';
import leaveRequestController from '../controllers/leaveRequest.controller';
import leavePolicyController from '../controllers/leavePolicy.controller';
import leaveBalanceController from '../controllers/leaveBalance.controller';
import employeeDocumentController from '../controllers/employeeDocument.controller';
import hrComplianceController from '../controllers/hrCompliance.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Routes Employees
router.post('/employees', employeeController.create.bind(employeeController) as any);
router.get('/employees', employeeController.list.bind(employeeController) as any);
router.get('/employees/:id', employeeController.getById.bind(employeeController) as any);
router.put('/employees/:id', employeeController.update.bind(employeeController) as any);
router.delete('/employees/:id', employeeController.delete.bind(employeeController) as any);

// Routes Attendance
router.post('/attendance', attendanceController.create.bind(attendanceController) as any);
router.get('/attendance', attendanceController.list.bind(attendanceController) as any);
router.get('/attendance/:id', attendanceController.getById.bind(attendanceController) as any);
router.put('/attendance/:id', attendanceController.update.bind(attendanceController) as any);
router.delete('/attendance/:id', attendanceController.delete.bind(attendanceController) as any);
router.get('/attendance/employee/:employeeId/stats', attendanceController.getEmployeeStats.bind(attendanceController) as any);

// Routes Payroll
router.post('/payroll', payrollController.create.bind(payrollController) as any);
router.get('/payroll', payrollController.list.bind(payrollController) as any);
router.get('/payroll/:id/pdf', payrollController.generatePDF.bind(payrollController) as any);
router.get('/payroll/:id', payrollController.getById.bind(payrollController) as any);
router.put('/payroll/:id', payrollController.update.bind(payrollController) as any);
router.post('/payroll/:id/approve', payrollController.approve.bind(payrollController) as any);
router.post('/payroll/:id/mark-paid', payrollController.markAsPaid.bind(payrollController) as any);
router.delete('/payroll/:id', payrollController.delete.bind(payrollController) as any);

// Routes Leave Requests (Demandes de congés)
router.post('/leave-requests', leaveRequestController.create.bind(leaveRequestController) as any);
router.get('/leave-requests', leaveRequestController.list.bind(leaveRequestController) as any);
router.get('/leave-requests/:id', leaveRequestController.getById.bind(leaveRequestController) as any);
router.put('/leave-requests/:id', leaveRequestController.update.bind(leaveRequestController) as any);
router.post('/leave-requests/:id/approve', leaveRequestController.approve.bind(leaveRequestController) as any);
router.post('/leave-requests/:id/reject', leaveRequestController.reject.bind(leaveRequestController) as any);
router.post('/leave-requests/:id/cancel', leaveRequestController.cancel.bind(leaveRequestController) as any);

// Routes Leave Policies (Politiques de congés)
router.post('/leave-policies', leavePolicyController.create.bind(leavePolicyController) as any);
router.get('/leave-policies', leavePolicyController.list.bind(leavePolicyController) as any);
router.get('/leave-policies/:id', leavePolicyController.getById.bind(leavePolicyController) as any);
router.get('/leave-policies/type/:type', leavePolicyController.getByType.bind(leavePolicyController) as any);
router.put('/leave-policies/:id', leavePolicyController.update.bind(leavePolicyController) as any);
router.delete('/leave-policies/:id', leavePolicyController.delete.bind(leavePolicyController) as any);
router.post('/leave-policies/defaults', leavePolicyController.createDefaults.bind(leavePolicyController) as any);

// Routes Leave Balances (Soldes de congés)
router.get('/leave-balances/employee/:employeeId', leaveBalanceController.getEmployeeBalances.bind(leaveBalanceController) as any);
router.get('/leave-balances/employee/:employeeId/balance', leaveBalanceController.getBalance.bind(leaveBalanceController) as any);

// Routes Employee Documents (Documents employés)
router.post('/employee-documents', employeeDocumentController.create.bind(employeeDocumentController) as any);
router.get('/employee-documents', employeeDocumentController.list.bind(employeeDocumentController) as any);
router.get('/employee-documents/:id', employeeDocumentController.getById.bind(employeeDocumentController) as any);
router.put('/employee-documents/:id', employeeDocumentController.update.bind(employeeDocumentController) as any);
router.delete('/employee-documents/:id', employeeDocumentController.delete.bind(employeeDocumentController) as any);
router.get('/employee-documents/expiring', employeeDocumentController.getExpiring.bind(employeeDocumentController) as any);
router.get('/employee-documents/expired', employeeDocumentController.getExpired.bind(employeeDocumentController) as any);

// Route Conformité légale RH (RDC)
router.get('/compliance/rdc', hrComplianceController.getRdcReport.bind(hrComplianceController) as any);

export default router;

