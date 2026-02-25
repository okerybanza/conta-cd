export interface JournalEntryLineData {
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
    currency?: string;
}
export declare class JournalEntryHelperService {
    /**
     * Récupérer un compte comptable via un paramètre de configuration
     */
    getAccountBySettingOrCode(companyId: string, settingKey: string, defaultCode: string): Promise<any>;
    /**
     * Générer le numéro d'écriture
     */
    generateEntryNumber(companyId: string): Promise<string>;
    /**
     * Valider l'équilibre débit/crédit
     */
    validateBalance(lines: JournalEntryLineData[]): void;
}
declare const _default: JournalEntryHelperService;
export default _default;
//# sourceMappingURL=journalEntryHelper.service.d.ts.map