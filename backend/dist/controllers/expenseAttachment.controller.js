"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseAttachmentController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const expenseAttachment_service_1 = __importDefault(require("../services/expenseAttachment.service"));
const fileUpload_service_1 = __importDefault(require("../services/fileUpload.service"));
const error_middleware_1 = require("../middleware/error.middleware");
class ExpenseAttachmentController {
    /**
     * POST /api/v1/expenses/:id/attachments
     * Upload un justificatif
     */
    async upload(req, res, next) {
        try {
            const { id: expenseId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const file = req.file;
            if (!file) {
                throw new error_middleware_1.CustomError('No file provided', 400, 'NO_FILE');
            }
            // Upload le fichier
            const uploadedFile = await fileUpload_service_1.default.uploadFile(file, companyId, expenseId);
            // Enregistrer dans la base de données
            const attachment = await expenseAttachment_service_1.default.create({
                expenseId,
                companyId,
                filename: uploadedFile.filename,
                originalName: uploadedFile.originalName,
                mimetype: uploadedFile.mimetype,
                size: uploadedFile.size,
                url: uploadedFile.url,
                uploadedBy: req.user.id,
            });
            res.status(201).json({
                success: true,
                data: attachment,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses/:id/attachments
     * Lister les justificatifs d'une dépense
     */
    async list(req, res, next) {
        try {
            const { id: expenseId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            const attachments = await expenseAttachment_service_1.default.list(companyId, expenseId);
            res.json({
                success: true,
                data: attachments,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/expenses/:id/attachments/:filename
     * Télécharger un justificatif
     */
    async download(req, res, next) {
        try {
            const { id: expenseId, filename } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            // Vérifier que l'attachment existe
            const attachment = await expenseAttachment_service_1.default.getByFilename(companyId, expenseId, filename);
            if (!attachment) {
                throw new error_middleware_1.CustomError('Attachment not found', 404, 'ATTACHMENT_NOT_FOUND');
            }
            // Lire le fichier
            const fileBuffer = await fileUpload_service_1.default.readFile(companyId, expenseId, filename);
            // Déterminer le Content-Type
            const contentType = attachment.mimetype || 'application/octet-stream';
            // Envoyer le fichier
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
            res.send(fileBuffer);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/v1/expenses/:id/attachments/:attachmentId
     * Supprimer un justificatif
     */
    async delete(req, res, next) {
        try {
            const { id: expenseId, attachmentId } = req.params;
            const companyId = (0, auth_middleware_1.getCompanyId)(req);
            // Récupérer l'attachment pour obtenir le filename
            const attachment = await expenseAttachment_service_1.default.getById(companyId, attachmentId);
            if (!attachment) {
                throw new error_middleware_1.CustomError('Attachment not found', 404, 'ATTACHMENT_NOT_FOUND');
            }
            // Supprimer le fichier du système de fichiers
            await fileUpload_service_1.default.deleteFile(companyId, expenseId, attachment.filename);
            // Supprimer de la base de données
            await expenseAttachment_service_1.default.delete(companyId, attachmentId);
            res.json({
                success: true,
                message: 'Attachment deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExpenseAttachmentController = ExpenseAttachmentController;
exports.default = new ExpenseAttachmentController();
//# sourceMappingURL=expenseAttachment.controller.js.map