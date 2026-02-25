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
exports.StorageService = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const error_middleware_1 = require("../middleware/error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = __importDefault(require("../config/env"));
class StorageService {
    /**
     * Calculer l'espace de stockage utilisé par une entreprise (en bytes)
     */
    async calculateStorageUsage(companyId) {
        const uploadDirs = [
            path.join(env_1.default.UPLOAD_DIR || './uploads', 'expenses', companyId),
            path.join(env_1.default.UPLOAD_DIR || './uploads', 'logos', companyId),
            path.join(env_1.default.UPLOAD_DIR || './uploads', companyId),
        ];
        let totalSize = 0;
        for (const dir of uploadDirs) {
            try {
                const size = await this.calculateDirectorySize(dir);
                totalSize += size;
            }
            catch (error) {
                // Si le répertoire n'existe pas, c'est normal (pas encore d'uploads)
                if (error.code !== 'ENOENT') {
                    logger_1.default.warn(`Error calculating storage for ${dir}:`, error);
                }
            }
        }
        return totalSize;
    }
    /**
     * Calculer la taille d'un répertoire récursivement
     */
    async calculateDirectorySize(dirPath) {
        let totalSize = 0;
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    totalSize += await this.calculateDirectorySize(fullPath);
                }
                else if (entry.isFile()) {
                    try {
                        const stats = await fs.stat(fullPath);
                        totalSize += stats.size;
                    }
                    catch (error) {
                        if (error.code !== 'ENOENT') {
                            logger_1.default.warn(`Error getting file stats for ${fullPath}:`, error);
                        }
                    }
                }
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
        return totalSize;
    }
    /**
     * Vérifier si l'ajout d'un fichier dépasserait la limite de stockage
     */
    async checkStorageLimit(companyId, fileSize, storageLimitMB) {
        if (storageLimitMB === null) {
            return; // Illimité
        }
        const currentUsage = await this.calculateStorageUsage(companyId);
        const storageLimitBytes = storageLimitMB * 1024 * 1024; // Convertir MB en bytes
        if (currentUsage + fileSize > storageLimitBytes) {
            const currentUsageMB = (currentUsage / (1024 * 1024)).toFixed(2);
            const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
            const limitMB = storageLimitMB.toFixed(2);
            throw new error_middleware_1.CustomError(`Espace de stockage insuffisant. Utilisation actuelle: ${currentUsageMB} MB / ${limitMB} MB. Fichier: ${fileSizeMB} MB. Veuillez upgrader votre plan.`, 403, 'QUOTA_EXCEEDED', {
                metric: 'storage',
                limit: storageLimitBytes,
                currentUsage: currentUsage,
                fileSize: fileSize,
            });
        }
    }
    /**
     * Obtenir l'usage de stockage formaté
     */
    formatStorage(bytes) {
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
exports.StorageService = StorageService;
exports.default = new StorageService();
//# sourceMappingURL=storage.service.js.map