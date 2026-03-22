"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntryHelperService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../middleware/error.middleware");
const account_service_1 = __importDefault(require("../account.service"));
class JournalEntryHelperService {
    /**
     * Récupérer un compte comptable via un paramètre de configuration
     */
    async getAccountBySettingOrCode(companyId, settingKey, defaultCode) {
        const setting = await database_1.default.settings.findFirst({
            where: {
                company_id: companyId,
                key: settingKey,
            },
        });
        const code = setting?.value || defaultCode;
        return account_service_1.default.getByCode(companyId, code);
    }
    /**
     * Générer le numéro d'écriture
     */
    async generateEntryNumber(companyId) {
        const year = new Date().getFullYear();
        const count = await database_1.default.journal_entries.count({
            where: {
                company_id: companyId,
                entry_date: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            },
        });
        return `EC-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    /**
     * Valider l'équilibre débit/crédit
     */
    validateBalance(lines) {
        const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new error_middleware_1.CustomError(`Unbalanced entry: Debit (${totalDebit}) must equal Credit (${totalCredit})`, 400, 'UNBALANCED_ENTRY');
        }
        if (lines.length < 2) {
            throw new error_middleware_1.CustomError('Entry must have at least 2 lines', 400, 'INSUFFICIENT_LINES');
        }
    }
}
exports.JournalEntryHelperService = JournalEntryHelperService;
exports.default = new JournalEntryHelperService();
//# sourceMappingURL=journalEntryHelper.service.js.map