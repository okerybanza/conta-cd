export interface CreateFiscalPeriodData {
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    notes?: string;
}
export interface UpdateFiscalPeriodData {
    name?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    notes?: string;
}
export interface FiscalPeriodFilters {
    isClosed?: boolean;
    isLocked?: boolean;
    year?: number;
}
export declare class FiscalPeriodService {
    /**
     * Crée automatiquement la période fiscale de l'année en cours
     * si aucune période n'existe pour cette entreprise
     */
    ensureCurrentYearPeriod(companyId: string): Promise<void>;
    /**
     * Créer un exercice comptable
     */
    create(companyId: string, data: CreateFiscalPeriodData, userId?: string): Promise<any>;
    /**
     * Obtenir un exercice par ID
     */
    getById(companyId: string, periodId: string): Promise<any>;
    /**
     * Lister les exercices
     */
    list(companyId: string, filters?: FiscalPeriodFilters): Promise<any>;
    /**
     * Obtenir l'exercice en cours (non clos)
     */
    getCurrent(companyId: string): Promise<any>;
    /**
     * Vérifier qu'une date est dans une période ouverte
     */
    validatePeriod(companyId: string, date: Date): Promise<{
        isValid: boolean;
        period?: any;
        message?: string;
    }>;
    /**
     * Helper pour vérifier si une période est verrouillée/close (P0001/P0002 compliance)
     */
    checkLock(companyId: string, date: Date): Promise<void>;
    /**
     * Clôturer un exercice (DOC-09)
     */
    close(companyId: string, periodId: string, userId: string, userRole?: string): Promise<any>;
    /**
     * Rouvrir un exercice (DOC-09: exige justification + audit)
     */
    reopen(companyId: string, periodId: string, userId: string, userRole?: string, justification?: string): Promise<any>;
    /**
     * Verrouiller une période (DOC-09)
     */
    lock(companyId: string, periodId: string, userId: string, userRole?: string): Promise<any>;
    /**
     * Déverrouiller une période (DOC-09)
     */
    unlock(companyId: string, periodId: string, userId: string, userRole?: string): Promise<any>;
    /**
     * Mettre à jour un exercice
     */
    update(companyId: string, periodId: string, data: UpdateFiscalPeriodData): Promise<any>;
    /**
     * Supprimer un exercice
     */
    delete(companyId: string, periodId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
declare const _default: FiscalPeriodService;
export default _default;
//# sourceMappingURL=fiscalPeriod.service.d.ts.map