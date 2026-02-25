"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseAttachmentService = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middleware/error.middleware");
class ExpenseAttachmentService {
    /**
     * Créer un justificatif
     */
    async create(data) {
        // Vérifier que la dépense existe
        const expense = await database_1.default.expense.findFirst({
            where: {
                id: data.expenseId,
                companyId: data.companyId,
            },
        });
        if (!expense) {
            throw new error_middleware_1.CustomError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
        }
        // Créer l'attachment
        const attachment = await database_1.default.expenseAttachment.create({
            data: {
                expenseId: data.expenseId,
                companyId: data.companyId,
                filename: data.filename,
                originalName: data.originalName,
                mimetype: data.mimetype,
                size: data.size,
                url: data.url,
                uploadedBy: data.uploadedBy,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        return attachment;
    }
    /**
     * Lister les justificatifs d'une dépense
     */
    async list(companyId, expenseId) {
        // Vérifier que la dépense existe
        const expense = await database_1.default.expense.findFirst({
            where: {
                id: expenseId,
                companyId,
            },
        });
        if (!expense) {
            throw new error_middleware_1.CustomError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
        }
        const attachments = await database_1.default.expenseAttachment.findMany({
            where: {
                expenseId,
                companyId,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return attachments;
    }
    /**
     * Obtenir un justificatif par ID
     */
    async getById(companyId, attachmentId) {
        const attachment = await database_1.default.expenseAttachment.findFirst({
            where: {
                id: attachmentId,
                companyId,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        if (!attachment) {
            throw new error_middleware_1.CustomError('Attachment not found', 404, 'ATTACHMENT_NOT_FOUND');
        }
        return attachment;
    }
    /**
     * Obtenir un justificatif par filename
     */
    async getByFilename(companyId, expenseId, filename) {
        const attachment = await database_1.default.expenseAttachment.findFirst({
            where: {
                expenseId,
                companyId,
                filename,
            },
        });
        return attachment;
    }
    /**
     * Supprimer un justificatif
     */
    async delete(companyId, attachmentId) {
        const attachment = await this.getById(companyId, attachmentId);
        await database_1.default.expenseAttachment.delete({
            where: {
                id: attachmentId,
            },
        });
        return attachment;
    }
    /**
     * Supprimer tous les justificatifs d'une dépense
     */
    async deleteByExpense(companyId, expenseId) {
        await database_1.default.expenseAttachment.deleteMany({
            where: {
                expenseId,
                companyId,
            },
        });
    }
}
exports.ExpenseAttachmentService = ExpenseAttachmentService;
exports.default = new ExpenseAttachmentService();
//# sourceMappingURL=expenseAttachment.service.js.map