import { JournalEntryLineData } from './journalEntry/journalEntryHelper.service';
import { CreateJournalEntryData, UpdateJournalEntryData, JournalEntryFilters, JournalEntrySourceType, JournalEntryStatus } from './journalEntry/journalEntryCore.service';
export { JournalEntryLineData, CreateJournalEntryData, UpdateJournalEntryData, JournalEntryFilters, JournalEntrySourceType, JournalEntryStatus };
export declare class JournalEntryService {
    private getAccountBySettingOrCode;
    private generateEntryNumber;
    private validateBalance;
    create(companyId: string, data: CreateJournalEntryData): Promise<any>;
    getById(companyId: string, entryId: string): Promise<any>;
    list(companyId: string, filters?: JournalEntryFilters): Promise<{
        entries: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    update(companyId: string, entryId: string, data: UpdateJournalEntryData): Promise<any>;
    delete(companyId: string, entryId: string): Promise<{
        success: boolean;
    }>;
    post(companyId: string, entryId: string, userId?: string): Promise<any>;
    reverse(companyId: string, entryId: string, userId: string, reason: string): Promise<any>;
    createForInvoice(companyId: string, invoiceId: string, invoiceData: any): Promise<any>;
    createForCreditNote(companyId: string, creditNoteId: string, creditNoteData: any): Promise<any>;
    ensureForCreditNote(companyId: string, creditNoteId: string, creditNoteData: any): Promise<any>;
    ensureForInvoice(companyId: string, invoiceId: string, invoiceData: any): Promise<any>;
    createForExpense(companyId: string, expenseId: string, expenseData: any): Promise<any>;
    ensureForExpense(companyId: string, expenseId: string, expenseData: any): Promise<any>;
    deleteForInvoice(companyId: string, invoiceId: string): Promise<void>;
    createForPayment(companyId: string, paymentId: string, paymentData: any): Promise<any>;
}
declare const _default: JournalEntryService;
export default _default;
//# sourceMappingURL=journalEntry.service.d.ts.map