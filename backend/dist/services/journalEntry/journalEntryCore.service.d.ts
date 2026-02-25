import { JournalEntryLineData } from './journalEntryHelper.service';
export type JournalEntrySourceType = 'invoice' | 'expense' | 'payment' | 'manual' | 'credit_note' | 'payroll';
export type JournalEntryStatus = 'draft' | 'posted' | 'reversed';
export interface CreateJournalEntryData {
    entryDate: string | Date;
    description?: string;
    reference?: string;
    sourceType: JournalEntrySourceType;
    sourceId?: string;
    lines: JournalEntryLineData[];
    reason?: string;
    notes?: string;
    createdBy?: string;
}
export interface UpdateJournalEntryData {
    entryDate?: string | Date;
    description?: string;
    reference?: string;
    reason?: string;
    lines?: JournalEntryLineData[];
    notes?: string;
    status?: JournalEntryStatus;
}
export interface JournalEntryFilters {
    startDate?: string | Date;
    endDate?: string | Date;
    sourceType?: JournalEntrySourceType;
    sourceId?: string;
    status?: JournalEntryStatus;
    accountId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class JournalEntryCoreService {
    /**
     * Créer une écriture comptable
     */
    create(companyId: string, data: CreateJournalEntryData): Promise<any>;
    /**
     * Obtenir une écriture par ID
     */
    getById(companyId: string, entryId: string): Promise<any>;
    /**
     * Lister les écritures
     */
    list(companyId: string, filters?: JournalEntryFilters): Promise<{
        entries: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Mettre à jour une écriture
     */
    update(companyId: string, entryId: string, data: UpdateJournalEntryData): Promise<any>;
    /**
     * Supprimer une écriture
     */
    delete(companyId: string, entryId: string): Promise<{
        success: boolean;
    }>;
}
declare const _default: JournalEntryCoreService;
export default _default;
//# sourceMappingURL=journalEntryCore.service.d.ts.map