import { Request } from 'express';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import storageService from './storage.service';
import subscriptionService from './subscription.service';
import packageService from './package.service';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes: string[] = [
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
  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating upload directory', error);
    }
  }

  /**
   * Valider le fichier
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new CustomError('No file provided', 400, 'NO_FILE');
    }

    if (file.size > this.maxFileSize) {
      throw new CustomError(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new CustomError(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      );
    }
  }

  /**
   * Upload un fichier
   */
  async uploadFile(
    file: Express.Multer.File,
    companyId: string,
    expenseId: string
  ): Promise<UploadedFile> {
    this.validateFile(file);

    // Vérifier le quota de stockage AVANT l'upload
    try {
      const subscription = await subscriptionService.getActive(companyId);
      const limits = await packageService.getLimits(subscription.package_id);
      const storageLimitMB = limits.storage_mb;

      await storageService.checkStorageLimit(companyId, file.size, storageLimitMB);
    } catch (error: any) {
      // Si le quota est dépassé, renvoyer l'erreur telle quelle (QUOTA_EXCEEDED 403)
      throw error;
    }

    // Créer le répertoire pour l'entreprise et la dépense
    const companyDir = path.join(this.uploadDir, companyId);
    const expenseDir = path.join(companyDir, expenseId);
    await fs.mkdir(expenseDir, { recursive: true });

    // Générer un nom de fichier unique
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
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
  getFilePath(companyId: string, expenseId: string, filename: string): string {
    return path.join(this.uploadDir, companyId, expenseId, filename);
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(companyId: string, expenseId: string, filename: string): Promise<void> {
    const filePath = this.getFilePath(companyId, expenseId, filename);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw new CustomError('Error deleting file', 500, 'FILE_DELETE_ERROR');
      }
    }
  }

  /**
   * Supprimer tous les fichiers d'une dépense
   */
  async deleteExpenseFiles(companyId: string, expenseId: string): Promise<void> {
    const expenseDir = path.join(this.uploadDir, companyId, expenseId);
    try {
      await fs.rmdir(expenseDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error('Error deleting expense files directory', error);
      }
    }
  }

  /**
   * Lire un fichier
   */
  async readFile(companyId: string, expenseId: string, filename: string): Promise<Buffer> {
    const filePath = this.getFilePath(companyId, expenseId, filename);
    try {
      return await fs.readFile(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new CustomError('File not found', 404, 'FILE_NOT_FOUND');
      }
      throw new CustomError('Error reading file', 500, 'FILE_READ_ERROR');
    }
  }
}

export default new FileUploadService();

