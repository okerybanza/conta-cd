export declare class JournalEntryWorkflowService {
    /**
     * Valider et poster une écriture
     * ACCT-014: Si userId fourni, le posteur doit être différent du créateur (ségrégation des tâches).
     */
    post(companyId: string, entryId: string, userId?: string): Promise<any>;
    /**
     * Contrepasser une écriture (Reverse)
     */
    reverse(companyId: string, entryId: string, userId: string, reason: string): Promise<any>;
}
declare const _default: JournalEntryWorkflowService;
export default _default;
//# sourceMappingURL=journalEntryWorkflow.service.d.ts.map