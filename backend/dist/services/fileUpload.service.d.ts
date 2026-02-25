export interface UploadedFile {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    url: string;
}
export declare class FileUploadService {
    private readonly uploadDir;
    private readonly maxFileSize;
    private readonly allowedMimeTypes;
    constructor();
    /**
     * Créer le répertoire d'upload s'il n'existe pas
     */
    private ensureUploadDir;
    /**
     * Valider le fichier
     */
    private validateFile;
    /**
     * Upload un fichier
     */
    uploadFile(file: Express.Multer.File, companyId: string, expenseId: string): Promise<UploadedFile>;
    /**
     * Obtenir le chemin d'un fichier
     */
    getFilePath(companyId: string, expenseId: string, filename: string): string;
    /**
     * Supprimer un fichier
     */
    deleteFile(companyId: string, expenseId: string, filename: string): Promise<void>;
    /**
     * Supprimer tous les fichiers d'une dépense
     */
    deleteExpenseFiles(companyId: string, expenseId: string): Promise<void>;
    /**
     * Lire un fichier
     */
    readFile(companyId: string, expenseId: string, filename: string): Promise<Buffer>;
}
declare const _default: FileUploadService;
export default _default;
//# sourceMappingURL=fileUpload.service.d.ts.map