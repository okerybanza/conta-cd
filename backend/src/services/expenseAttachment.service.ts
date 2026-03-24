import { randomUUID } from 'crypto';
import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';

export interface CreateAttachmentData {
  expenseId?: string;
  companyId?: string;
  filename?: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
  url?: string;
  uploadedBy?: string;
}

const uploaderInclude = {
  users: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
  },
} as const;

function withUploader<T extends { users?: unknown | null }>(row: T) {
  const { users, ...rest } = row;
  return { ...rest, uploader: users ?? null };
}

export class ExpenseAttachmentService {
  /**
   * Créer un justificatif
   */
  async create(data: CreateAttachmentData) {
    // Vérifier que la dépense existe
    const expense = await prisma.expenses.findFirst({
      where: {
        id: data.expenseId,
        company_id: data.companyId,
      },
    });

    if (!expense) {
      throw new CustomError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }

    // Créer l'attachment
    const row = await prisma.expenseAttachment.create({
      data: {
        id: randomUUID(),
        expenseId: data.expenseId!,
        companyId: data.companyId!,
        filename: data.filename!,
        originalName: data.originalName!,
        mimetype: data.mimetype!,
        size: data.size!,
        url: data.url!,
        uploadedBy: data.uploadedBy!,
      },
      include: uploaderInclude,
    });

    return withUploader(row);
  }

  /**
   * Lister les justificatifs d'une dépense
   */
  async list(companyId: string, expenseId: string) {
    // Vérifier que la dépense existe
    const expense = await prisma.expenses.findFirst({
      where: {
        id: expenseId,
        company_id: companyId,
      },
    });

    if (!expense) {
      throw new CustomError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }

    const attachments = await prisma.expenseAttachment.findMany({
      where: {
        expenseId,
        companyId,
      },
      include: uploaderInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return attachments.map(withUploader);
  }

  /**
   * Obtenir un justificatif par ID
   */
  async getById(companyId: string, attachmentId: string) {
    const attachment = await prisma.expenseAttachment.findFirst({
      where: {
        id: attachmentId,
        companyId,
      },
      include: uploaderInclude,
    });

    if (!attachment) {
      throw new CustomError('Attachment not found', 404, 'ATTACHMENT_NOT_FOUND');
    }

    return withUploader(attachment);
  }

  /**
   * Obtenir un justificatif par filename
   */
  async getByFilename(companyId: string, expenseId: string, filename: string) {
    const attachment = await prisma.expenseAttachment.findFirst({
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
  async delete(companyId: string, attachmentId: string) {
    const attachment = await this.getById(companyId, attachmentId);

    await prisma.expenseAttachment.delete({
      where: {
        id: attachmentId,
      },
    });

    return attachment;
  }

  /**
   * Supprimer tous les justificatifs d'une dépense
   */
  async deleteByExpense(companyId: string, expenseId: string) {
    await prisma.expenseAttachment.deleteMany({
      where: {
        expenseId,
        companyId,
      },
    });
  }
}

export default new ExpenseAttachmentService();
