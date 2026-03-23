import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';

export interface CreateEmployeeDocumentData {
  employeeId?: string;
  documentType?: string;
  name?: string;
  description?: string;
  fileId?: string;
  expiryDate?: Date | string;
  notes?: string;
}

export interface UpdateEmployeeDocumentData {
  documentType?: string;
  name?: string;
  description?: string;
  fileId?: string;
  expiryDate?: Date | string | null;
  notes?: string;
}

export interface EmployeeDocumentFilters {
  employeeId?: string;
  documentType?: string;
  isExpired?: boolean;
  page?: number;
  limit?: number;
}

export class EmployeeDocumentService {
  /**
   * Vérifier et mettre à jour le statut d'expiration
   */
  private async checkExpiration(document: any) {
    if (document.expiryDate && new Date(document.expiryDate) < new Date()) {
      if (!document.isExpired) {
        await prisma.employeeDocument.update({
          where: { id: document.id },
          data: { isExpired: true },
        });
        document.isExpired = true;
      }
    }
    return document;
  }

  /**
   * Créer un document employé
   */
  async create(companyId: string, data: CreateEmployeeDocumentData) {
    // Vérifier que l'employé existe
    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (!employee) {
      throw new CustomError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    // Vérifier que le fichier existe
    const file = await prisma.fileUpload.findFirst({
      where: {
        id: data.fileId,
        company_id: companyId,
      },
    });

    if (!file) {
      throw new CustomError('File not found', 404, 'FILE_NOT_FOUND');
    }

    // Vérifier la date d'expiration
    let isExpired = false;
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      isExpired = expiryDate < new Date();
    }

    const document = await prisma.employeeDocument.create({
      data: {
        company_id: companyId,
        employeeId: data.employeeId,
        documentType: data.documentType,
        name: data.name,
        description: data.description,
        fileId: data.fileId,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        isExpired,
        notes: data.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
        file: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            size: true,
            path: true,
          },
        },
      },
    });

    logger.info(`Employee document created: ${document.id}`, {
      company_id: companyId,
      documentId: document.id,
      employeeId: data.employeeId,
      documentType: data.documentType,
    });

    return document;
  }

  /**
   * Obtenir un document par ID
   */
  async getById(companyId: string, documentId: string) {
    const document = await prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            department: true,
          },
        },
        file: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            size: true,
            path: true,
          },
        },
      },
    });

    if (!document) {
      throw new CustomError('Employee document not found', 404, 'EMPLOYEE_DOCUMENT_NOT_FOUND');
    }

    // Vérifier l'expiration
    await this.checkExpiration(document);

    return document;
  }

  /**
   * Lister les documents
   */
  async list(companyId: string, filters: EmployeeDocumentFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.employee_documentsWhereInput = {
      company_id: companyId,
      deleted_at: null,
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.documentType && { documentType: filters.documentType }),
      ...(filters.isExpired !== undefined && { isExpired: filters.isExpired }),
    };

    const [documents, total] = await Promise.all([
      prisma.employeeDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
            },
          },
          file: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              mimeType: true,
              size: true,
            },
          },
        },
      }),
      prisma.employeeDocument.count({ where }),
    ]);

    // Vérifier l'expiration pour chaque document
    for (const doc of documents) {
      await this.checkExpiration(doc);
    }

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mettre à jour un document
   */
  async update(companyId: string, documentId: string, data: UpdateEmployeeDocumentData) {
    const document = await this.getById(companyId, documentId);

    const updateData: Prisma.employee_documentsUpdateInput = {};

    if (data.documentType !== undefined) updateData.document_type = data.documentType;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.fileId !== undefined) {
      // Vérifier que le nouveau fichier existe
      const file = await prisma.fileUpload.findFirst({
        where: {
          id: data.fileId,
          company_id: companyId,
        },
      });

      if (!file) {
        throw new CustomError('File not found', 404, 'FILE_NOT_FOUND');
      }

      (updateData as any).file = {
        connect: { id: data.fileId },
      };
    }

    if (data.expiryDate !== undefined) {
      if (data.expiryDate === null) {
        updateData.expiry_date = null;
        updateData.is_expired = false;
      } else {
        const expiryDate = new Date(data.expiryDate);
        updateData.expiry_date = expiryDate;
        updateData.is_expired = expiryDate < new Date();
      }
    }

    const updated = await prisma.employeeDocument.update({
      where: { id: documentId },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
        file: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            size: true,
            path: true,
          },
        },
      },
    });

    logger.info(`Employee document updated: ${documentId}`, {
      company_id: companyId,
      documentId,
    });

    return updated;
  }

  /**
   * Supprimer un document (soft delete)
   */
  async delete(companyId: string, documentId: string) {
    const document = await this.getById(companyId, documentId);

    await prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        deleted_at: new Date(),
      },
    });

    logger.info(`Employee document deleted: ${documentId}`, {
      company_id: companyId,
      documentId,
    });

    return { success: true };
  }

  /**
   * Obtenir les documents expirés ou expirant bientôt
   */
  async getExpiringDocuments(companyId: string, daysBeforeExpiry: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);

    const documents = await prisma.employeeDocument.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        expiryDate: {
          lte: expiryDate,
          gte: new Date(), // Pas encore expiré
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            email: true,
          },
        },
        file: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return documents;
  }

  /**
   * Obtenir les documents expirés
   */
  async getExpiredDocuments(companyId: string) {
    const documents = await prisma.employeeDocument.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
        isExpired: true,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            email: true,
          },
        },
        file: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return documents;
  }
}

export default new EmployeeDocumentService();

