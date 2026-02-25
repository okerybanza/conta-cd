"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = require("crypto");
class UsageService {
    /**
     * Obtenir la période actuelle (format: "YYYY-MM")
     */
    getCurrentPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }
    /**
     * Incrémenter un compteur d'usage
     */
    async increment(companyId, metric, amount = 1, period) {
        const currentPeriod = period || this.getCurrentPeriod();
        const periodDate = new Date(`${currentPeriod}-01T00:00:00.000Z`);
        await database_1.default.usages.upsert({
            where: {
                company_id_metric_period_period_date: {
                    company_id: companyId,
                    metric: metric,
                    period: currentPeriod,
                    period_date: periodDate,
                },
            },
            update: {
                value: {
                    increment: amount,
                },
            },
            create: {
                id: (0, crypto_1.randomUUID)(),
                company_id: companyId,
                period: currentPeriod,
                period_date: periodDate,
                metric,
                value: amount,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        logger_1.default.debug(`Usage incremented: ${metric}`, {
            companyId,
            period: currentPeriod,
            amount,
        });
    }
    /**
     * Décrémenter un compteur d'usage
     */
    async decrement(companyId, metric, amount = 1, period) {
        const currentPeriod = period || this.getCurrentPeriod();
        const periodDate = new Date(`${currentPeriod}-01T00:00:00.000Z`);
        const usage = await database_1.default.usages.findUnique({
            where: {
                company_id_metric_period_period_date: {
                    company_id: companyId,
                    metric: metric,
                    period: currentPeriod,
                    period_date: periodDate,
                },
            },
        });
        if (usage) {
            const newValue = Math.max(0, Number(usage.value) - amount);
            await database_1.default.usages.update({
                where: {
                    company_id_metric_period_period_date: {
                        company_id: companyId,
                        metric: metric,
                        period: currentPeriod,
                        period_date: periodDate,
                    },
                },
                data: {
                    value: newValue,
                },
            });
        }
        logger_1.default.debug(`Usage decremented: ${metric}`, {
            companyId,
            period: currentPeriod,
            amount,
        });
    }
    /**
     * Obtenir la valeur d'un compteur
     */
    async get(companyId, metric, period) {
        const currentPeriod = period || this.getCurrentPeriod();
        const periodDate = new Date(`${currentPeriod}-01T00:00:00.000Z`);
        const usage = await database_1.default.usages.findUnique({
            where: {
                company_id_metric_period_period_date: {
                    company_id: companyId,
                    metric: metric,
                    period: currentPeriod,
                    period_date: periodDate,
                },
            },
        });
        return usage ? Number(usage.value) : 0;
    }
    /**
     * Vérifier si une limite est atteinte
     */
    async checkLimit(companyId, metric, limit) {
        // null signifie illimité
        if (limit === null) {
            return false; // Pas de limite, donc pas atteinte
        }
        const currentUsage = await this.get(companyId, metric);
        return currentUsage >= limit;
    }
    /**
     * Obtenir tous les usages d'une entreprise pour la période actuelle
     */
    async getAll(companyId, period) {
        const currentPeriod = period || this.getCurrentPeriod();
        const usages = await database_1.default.usages.findMany({
            where: {
                company_id: companyId,
                period: currentPeriod,
            },
        });
        const result = {};
        for (const usage of usages) {
            result[usage.metric] = Number(usage.value);
        }
        return result;
    }
    /**
     * Réinitialiser les compteurs pour une nouvelle période
     * (Appelé automatiquement au début de chaque mois)
     */
    async resetPeriod(companyId, period) {
        await database_1.default.usages.deleteMany({
            where: {
                company_id: companyId,
                period,
            },
        });
        logger_1.default.info(`Usage reset for period: ${period}`, { companyId });
    }
    /**
     * Obtenir l'usage d'une métrique pour plusieurs périodes
     */
    async getHistory(companyId, metric, months = 12) {
        const now = new Date();
        const periods = [];
        for (let i = 0; i < months; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            periods.push(`${year}-${month}`);
        }
        const usages = await database_1.default.usages.findMany({
            where: {
                company_id: companyId,
                metric,
                period: {
                    in: periods,
                },
            },
            orderBy: {
                period: 'desc',
            },
        });
        // Créer un map pour accès rapide
        const usageMap = new Map(usages.map((u) => [u.period, Number(u.value)]));
        // Retourner toutes les périodes avec leur count (0 si pas d'usage)
        return periods.map((period) => ({
            period,
            count: Number(usageMap.get(period)) || 0,
        }));
    }
}
exports.UsageService = UsageService;
exports.default = new UsageService();
//# sourceMappingURL=usage.service.js.map