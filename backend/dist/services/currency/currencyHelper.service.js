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
exports.CurrencyHelperService = void 0;
const database_1 = __importDefault(require("../../config/database"));
class CurrencyHelperService {
    /**
     * Convert an array of amounts to base currency
     * @param amounts Array of amounts with their currencies and dates
     * @param baseCurrency Target base currency
     * @returns Total amount in base currency
     */
    async convertToBaseCurrency(amounts, baseCurrency) {
        const exchangeRateService = (await Promise.resolve().then(() => __importStar(require('./exchangeRate.service')))).default;
        let total = 0;
        for (const item of amounts) {
            if (item.currency === baseCurrency) {
                total += item.amount;
            }
            else {
                const converted = await exchangeRateService.convert(item.amount, item.currency, baseCurrency, item.date);
                total += converted;
            }
        }
        return total;
    }
    /**
     * Format amount with currency symbol
     * @param amount Amount to format
     * @param currency Currency code
     * @returns Formatted string
     */
    formatAmount(amount, currency) {
        try {
            return new Intl.NumberFormat('fr-CD', {
                style: 'currency',
                currency: currency,
            }).format(amount);
        }
        catch (error) {
            // Fallback for unsupported currencies
            return `${amount.toFixed(2)} ${currency}`;
        }
    }
    /**
     * Get company base currency
     * @param companyId Company ID
     * @returns Base currency code
     */
    async getCompanyBaseCurrency(companyId) {
        const settings = await database_1.default.currency_settings.findUnique({
            where: { company_id: companyId },
            select: { base_currency: true },
        });
        return settings?.base_currency || 'CDF';
    }
    /**
     * Get supported currencies list
     * @returns Array of currency codes
     */
    getSupportedCurrencies() {
        return [
            'CDF', // Congolese Franc
            'USD', // US Dollar
            'EUR', // Euro
            'GBP', // British Pound
            'CHF', // Swiss Franc
            'CAD', // Canadian Dollar
            'AUD', // Australian Dollar
            'JPY', // Japanese Yen
            'CNY', // Chinese Yuan
            'ZAR', // South African Rand
            'XAF', // Central African CFA Franc
            'XOF', // West African CFA Franc
        ];
    }
}
exports.CurrencyHelperService = CurrencyHelperService;
exports.default = new CurrencyHelperService();
//# sourceMappingURL=currencyHelper.service.js.map