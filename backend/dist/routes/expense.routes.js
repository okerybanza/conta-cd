"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expense_controller_1 = __importDefault(require("../controllers/expense.controller"));
const expenseAttachment_controller_1 = __importDefault(require("../controllers/expenseAttachment.controller"));
const expenseApproval_controller_1 = __importDefault(require("../controllers/expenseApproval.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Configuration multer pour l'upload de fichiers (mémoire)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});
// Routes principales des dépenses
router.post('/', expense_controller_1.default.create.bind(expense_controller_1.default));
router.get('/', expense_controller_1.default.list.bind(expense_controller_1.default));
router.get('/:id', expense_controller_1.default.getById.bind(expense_controller_1.default));
router.put('/:id', expense_controller_1.default.update.bind(expense_controller_1.default));
router.delete('/:id', expense_controller_1.default.delete.bind(expense_controller_1.default));
router.post('/:id/duplicate', expense_controller_1.default.duplicate.bind(expense_controller_1.default));
// Routes pour les justificatifs (attachments)
router.post('/:id/attachments', upload.single('file'), expenseAttachment_controller_1.default.upload.bind(expenseAttachment_controller_1.default));
router.get('/:id/attachments', expenseAttachment_controller_1.default.list.bind(expenseAttachment_controller_1.default));
router.get('/:id/attachments/:filename', expenseAttachment_controller_1.default.download.bind(expenseAttachment_controller_1.default));
router.delete('/:id/attachments/:attachmentId', expenseAttachment_controller_1.default.delete.bind(expenseAttachment_controller_1.default));
// Routes pour les approbations
router.post('/:id/approval/request', expenseApproval_controller_1.default.requestApproval.bind(expenseApproval_controller_1.default));
router.get('/:id/approvals', expenseApproval_controller_1.default.getByExpense.bind(expenseApproval_controller_1.default));
router.get('/approvals/pending', expenseApproval_controller_1.default.listPending.bind(expenseApproval_controller_1.default));
router.get('/approvals/:id', expenseApproval_controller_1.default.getById.bind(expenseApproval_controller_1.default));
router.post('/approvals/:id/approve', expenseApproval_controller_1.default.approve.bind(expenseApproval_controller_1.default));
router.post('/approvals/:id/reject', expenseApproval_controller_1.default.reject.bind(expenseApproval_controller_1.default));
// Routes pour les règles d'approbation
router.post('/approval-rules', expenseApproval_controller_1.default.createRule.bind(expenseApproval_controller_1.default));
router.get('/approval-rules', expenseApproval_controller_1.default.listRules.bind(expenseApproval_controller_1.default));
router.get('/approval-rules/:id', expenseApproval_controller_1.default.getRuleById.bind(expenseApproval_controller_1.default));
router.put('/approval-rules/:id', expenseApproval_controller_1.default.updateRule.bind(expenseApproval_controller_1.default));
router.delete('/approval-rules/:id', expenseApproval_controller_1.default.deleteRule.bind(expenseApproval_controller_1.default));
exports.default = router;
//# sourceMappingURL=expense.routes.js.map