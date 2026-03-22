"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const auth_middleware_1 = require("../middleware/auth.middleware");
const search_service_1 = __importDefault(require("../services/search.service"));
const zod_1 = require("zod");
const searchSchema = zod_1.z.object({
    q: zod_1.z.string().min(2).max(100),
    limit: zod_1.z.coerce.number().int().positive().max(50).optional().default(10),
});
class SearchController {
    /**
     * Recherche globale
     * GET /api/v1/search?q=query&limit=10
     */
    async globalSearch(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { q, limit } = searchSchema.parse(req.query);
            const results = await search_service_1.default.globalSearch((0, auth_middleware_1.getCompanyId)(req), q, limit);
            res.json({
                success: true,
                data: results.results,
                total: results.total,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SearchController = SearchController;
exports.default = new SearchController();
//# sourceMappingURL=search.controller.js.map