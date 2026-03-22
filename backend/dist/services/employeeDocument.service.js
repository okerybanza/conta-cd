"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDocumentService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("../middleware/error.middleware");
class EmployeeDocumentService {
    /**
     * Vérifier et mettre à jour le statut d'expiration
     */
    async checkExpiration(document) {
        if (document.expiryDate && new Date(document.expiryDate) < new Date()) {
            if (!document.isExpired) {
                await database_1.default.employeeDocument.update({
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
    async create(companyId, data) {
        // Vérifier que l'employé existe
        const employee = await database_1.default.employee.findFirst({
            where: {
                id: data.employeeId,
                companyId,
                deletedAt: null,
            },
        });
        if (!employee) {
            throw new error_middleware_1.CustomError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }
        // Vérifier que le fichier existe
        const file = await database_1.default.fileUpload.findFirst({
            where: {
                id: data.fileId,
                companyId,
            },
        });
        if (!file) {
            throw new error_middleware_1.CustomError('File not found', 404, 'FILE_NOT_FOUND');
        }
        // Vérifier la date d'expiration
        let isExpired = false;
        if (data.expiryDate) {
            const expiryDate = new Date(data.expiryDate);
            isExpired = expiryDate < new Date();
        }
        const document = await database_1.default.employeeDocument.create({
            data: {
                companyId,
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
        logger_1.default.info(`Employee document created: ${document.id}`, {
            companyId,
            documentId: document.id,
            employeeId: data.employeeId,
            documentType: data.documentType,
        });
        return document;
    }
    /**
     * Obtenir un document par ID
     */
    async getById(companyId, documentId) {
        const document = await database_1.default.employeeDocument.findFirst({
            where: {
                id: documentId,
                companyId,
                deletedAt: null,
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
            throw new error_middleware_1.CustomError('Employee document not found', 404, 'EMPLOYEE_DOCUMENT_NOT_FOUND');
        }
        // Vérifier l'expiration
        await this.checkExpiration(document);
        return document;
    }
    /**
     * Lister les documents
     */
    async list(companyId, filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            deletedAt: null,
            ...(filters.employeeId && { employeeId: filters.employeeId }),
            ...(filters.documentType && { documentType: filters.documentType }),
            ...(filters.isExpired !== undefined && { isExpired: filters.isExpired }),
        };
        const [documents, total] = await Promise.all([
            database_1.default.employeeDocument.findMany({
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
            database_1.default.employeeDocument.count({ where }),
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
    async update(companyId, documentId, data) {
        const document = await this.getById(companyId, documentId);
        const updateData = {};
        if (data.documentType !== undefined)
            updateData.documentType = data.documentType;
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.notes !== undefined)
            updateData.notes = data.notes;
        if (data.fileId !== undefined) {
            // Vérifier que le nouveau fichier existe
            const file = await database_1.default.fileUpload.findFirst({
                where: {
                    id: data.fileId,
                    companyId,
                },
            });
            if (!file) {
                throw new error_middleware_1.CustomError('File not found', 404, 'FILE_NOT_FOUND');
            }
            updateData.file = {
                connect: { id: data.fileId },
            };
        }
        if (data.expiryDate !== undefined) {
            if (data.expiryDate === null) {
                updateData.expiryDate = null;
                updateData.isExpired = false;
            }
            else {
                const expiryDate = new Date(data.expiryDate);
                updateData.expiryDate = expiryDate;
                updateData.isExpired = expiryDate < new Date();
            }
        }
        const updated = await database_1.default.employeeDocument.update({
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
        logger_1.default.info(`Employee document updated: ${documentId}`, {
            companyId,
            documentId,
        });
        return updated;
    }
    /**
     * Supprimer un document (soft delete)
     */
    async delete(companyId, documentId) {
        const document = await this.getById(companyId, documentId);
        await database_1.default.employeeDocument.update({
            where: { id: documentId },
            data: {
                deletedAt: new Date(),
            },
        });
        logger_1.default.info(`Employee document deleted: ${documentId}`, {
            companyId,
            documentId,
        });
        return { success: true };
    }
    /**
     * Obtenir les documents expirés ou expirant bientôt
     */
    async getExpiringDocuments(companyId, daysBeforeExpiry = 30) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);
        const documents = await database_1.default.employeeDocument.findMany({
            where: {
                companyId,
                deletedAt: null,
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
    async getExpiredDocuments(companyId) {
        const documents = await database_1.default.employeeDocument.findMany({
            where: {
                companyId,
                deletedAt: null,
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
exports.EmployeeDocumentService = EmployeeDocumentService;
exports.default = new EmployeeDocumentService();
//# sourceMappingURL=employeeDocument.service.js.map