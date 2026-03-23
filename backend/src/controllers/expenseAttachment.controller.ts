import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import expenseAttachmentService from '../services/expenseAttachment.service';
import fileUploadService from '../services/fileUpload.service';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class ExpenseAttachmentController {
  /**
   * POST /api/v1/expenses/:id/attachments
   * Upload un justificatif
   */
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: expenseId } = req.params;
      const companyId = getCompanyId(req);
      const file = req.file;

      if (!file) {
        throw new CustomError('No file provided', 400, 'NO_FILE');
      }

      // Upload le fichier
      const uploadedFile = await fileUploadService.uploadFile(file, companyId, expenseId);

      // Enregistrer dans la base de données
      const attachment = await expenseAttachmentService.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/:id/attachments
   * Lister les justificatifs d'une dépense
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: expenseId } = req.params;
      const companyId = getCompanyId(req);

      const attachments = await expenseAttachmentService.list(companyId, expenseId);

      res.json({
        success: true,
        data: attachments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/:id/attachments/:filename
   * Télécharger un justificatif
   */
  async download(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: expenseId, filename } = req.params;
      const companyId = getCompanyId(req);

      // Vérifier que l'attachment existe
      const attachment = await expenseAttachmentService.getByFilename(
        companyId,
        expenseId,
        filename
      );

      if (!attachment) {
        throw new CustomError('Attachment not found', 404, 'ATTACHMENT_NOT_FOUND');
      }

      // Lire le fichier
      const fileBuffer = await fileUploadService.readFile(companyId, expenseId, filename);

      // Déterminer le Content-Type
      const contentType = attachment.mimetype || 'application/octet-stream';

      // Envoyer le fichier
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(attachment.originalName)}"`
      );
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/expenses/:id/attachments/:attachmentId
   * Supprimer un justificatif
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: expenseId, attachmentId } = req.params;
      const companyId = getCompanyId(req);

      // Récupérer l'attachment pour obtenir le filename
      const attachment = await expenseAttachmentService.getById(companyId, attachmentId);

      if (!attachment) {
        throw new CustomError('Attachment not found', 404, 'ATTACHMENT_NOT_FOUND');
      }

      // Supprimer le fichier du système de fichiers
      await fileUploadService.deleteFile(companyId, expenseId, attachment.filename);

      // Supprimer de la base de données
      await expenseAttachmentService.delete(companyId, attachmentId);

      res.json({
        success: true,
        message: 'Attachment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseAttachmentController();

