import * as fs from 'fs/promises';
import * as path from 'path';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import env from '../config/env';

export class StorageService {
  /**
   * Calculer l'espace de stockage utilisé par une entreprise (en bytes)
   */
  async calculateStorageUsage(companyId: string): Promise<number> {
    const uploadDirs = [
      path.join(env.UPLOAD_DIR || './uploads', 'expenses', companyId),
      path.join(env.UPLOAD_DIR || './uploads', 'logos', companyId),
      path.join(env.UPLOAD_DIR || './uploads', companyId),
    ];

    let totalSize = 0;

    for (const dir of uploadDirs) {
      try {
        const size = await this.calculateDirectorySize(dir);
        totalSize += size;
      } catch (error: any) {
        // Si le répertoire n'existe pas, c'est normal (pas encore d'uploads)
        if (error.code !== 'ENOENT') {
          logger.warn(`Error calculating storage for ${dir}:`, error);
        }
      }
    }

    return totalSize;
  }

  /**
   * Calculer la taille d'un répertoire récursivement
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          totalSize += await this.calculateDirectorySize(fullPath);
        } else if (entry.isFile()) {
          try {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          } catch (error: any) {
            if (error.code !== 'ENOENT') {
              logger.warn(`Error getting file stats for ${fullPath}:`, error);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return totalSize;
  }

  /**
   * Vérifier si l'ajout d'un fichier dépasserait la limite de stockage
   */
  async checkStorageLimit(
    companyId: string,
    fileSize: number,
    storageLimitMB: number | null
  ): Promise<void> {
    if (storageLimitMB === null) {
      return; // Illimité
    }

    const currentUsage = await this.calculateStorageUsage(companyId);
    const storageLimitBytes = storageLimitMB * 1024 * 1024; // Convertir MB en bytes

    if (currentUsage + fileSize > storageLimitBytes) {
      const currentUsageMB = (currentUsage / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      const limitMB = storageLimitMB.toFixed(2);

      throw new CustomError(
        `Espace de stockage insuffisant. Utilisation actuelle: ${currentUsageMB} MB / ${limitMB} MB. Fichier: ${fileSizeMB} MB. Veuillez upgrader votre plan.`,
        403,
        'QUOTA_EXCEEDED',
        {
          metric: 'storage',
          limit: storageLimitBytes,
          currentUsage: currentUsage,
          fileSize: fileSize,
        }
      );
    }
  }

  /**
   * Obtenir l'usage de stockage formaté
   */
  formatStorage(bytes: number): { value: number; unit: string; display: string } {
    if (bytes < 1024) {
      return { value: bytes, unit: 'B', display: `${bytes} B` };
    }
    if (bytes < 1024 * 1024) {
      return { value: bytes / 1024, unit: 'KB', display: `${(bytes / 1024).toFixed(2)} KB` };
    }
    if (bytes < 1024 * 1024 * 1024) {
      return {
        value: bytes / (1024 * 1024),
        unit: 'MB',
        display: `${(bytes / (1024 * 1024)).toFixed(2)} MB`,
      };
    }
    return {
      value: bytes / (1024 * 1024 * 1024),
      unit: 'GB',
      display: `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`,
    };
  }
}

export default new StorageService();
