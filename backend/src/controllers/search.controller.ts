import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import searchService from '../services/search.service';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export class SearchController {
  /**
   * Recherche globale
   * GET /api/v1/search?q=query&limit=10
   */
  async globalSearch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { q, limit } = searchSchema.parse(req.query);
      const results = await searchService.globalSearch(getCompanyId(req), q, limit);

      res.json({
        success: true,
        data: results.results,
        total: results.total,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SearchController();

