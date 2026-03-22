"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const storage_service_1 = __importDefault(require("./storage.service"));
const subscription_service_1 = __importDefault(require("./subscription.service"));
const package_service_1 = __importDefault(require("./package.service"));
class FileUploadService {
    uploadDir;
    maxFileSize = 10 * 1024 * 1024; // 10MB
    allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    constructor() {
        // Définir le répertoire d'upload (uploads/expenses)
        this.uploadDir = path.join(process.cwd(), 'uploads', 'expenses');
        this.ensureUploadDir();
    }
    /**
     * Créer le répertoire d'upload s'il n'existe pas
     */
    async ensureUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
        catch (error) {
            logger_1.default.error('Error creating upload directory', error);
        }
    }
    /**
     * Valider le fichier
     */
    validateFile(file) {
        if (!file) {
            throw new error_middleware_1.CustomError('No file provided', 400, 'NO_FILE');
        }
        if (file.size > this.maxFileSize) {
            throw new error_middleware_1.CustomError(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`, 400, 'FILE_TOO_LARGE');
        }
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new error_middleware_1.CustomError(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`, 400, 'INVALID_FILE_TYPE');
        }
    }
    /**
     * Upload un fichier
     */
    async uploadFile(file, companyId, expenseId) {
        this.validateFile(file);
        // Vérifier le quota de stockage AVANT l'upload
        try {
            const subscription = await subscription_service_1.default.getActive(companyId);
            const limits = await package_service_1.default.getLimits(subscription.package_id);
            const storageLimitMB = limits.storage_mb;
            await storage_service_1.default.checkStorageLimit(companyId, file.size, storageLimitMB ?? null);
        }
        catch (error) {
            // Si le quota est dépassé, renvoyer l'erreur telle quelle (QUOTA_EXCEEDED 403)
            throw error;
        }
        // Créer le répertoire pour l'entreprise et la dépense
        const companyDir = path.join(this.uploadDir, companyId);
        const expenseDir = path.join(companyDir, expenseId);
        await fs.mkdir(expenseDir, { recursive: true });
        // Générer un nom de fichier unique
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${(0, crypto_1.randomUUID)()}${fileExtension}`;
        const filePath = path.join(expenseDir, uniqueFilename);
        // Sauvegarder le fichier
        await fs.writeFile(filePath, file.buffer);
        // Générer l'URL
        const url = `/api/v1/expenses/${expenseId}/attachments/${uniqueFilename}`;
        return {
            filename: uniqueFilename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: filePath,
            url,
        };
    }
    /**
     * Obtenir le chemin d'un fichier
     */
    getFilePath(companyId, expenseId, filename) {
        return path.join(this.uploadDir, companyId, expenseId, filename);
    }
    /**
     * Supprimer un fichier
     */
    async deleteFile(companyId, expenseId, filename) {
        const filePath = this.getFilePath(companyId, expenseId, filename);
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw new error_middleware_1.CustomError('Error deleting file', 500, 'FILE_DELETE_ERROR');
            }
        }
    }
    /**
     * Supprimer tous les fichiers d'une dépense
     */
    async deleteExpenseFiles(companyId, expenseId) {
        const expenseDir = path.join(this.uploadDir, companyId, expenseId);
        try {
            await fs.rmdir(expenseDir, { recursive: true });
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                logger_1.default.error('Error deleting expense files directory', error);
            }
        }
    }
    /**
     * Lire un fichier
     */
    async readFile(companyId, expenseId, filename) {
        const filePath = this.getFilePath(companyId, expenseId, filename);
        try {
            return await fs.readFile(filePath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new error_middleware_1.CustomError('File not found', 404, 'FILE_NOT_FOUND');
            }
            throw new error_middleware_1.CustomError('Error reading file', 500, 'FILE_READ_ERROR');
        }
    }
}
exports.FileUploadService = FileUploadService;
exports.default = new FileUploadService();
//# sourceMappingURL=fileUpload.service.js.map