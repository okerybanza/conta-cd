import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import searchController from '../controllers/search.controller';

const router = Router();

/**
 * @route   GET /api/v1/search
 * @desc    Recherche globale dans tous les modules
 * @access  Private
 */
router.get('/', authenticate as any, searchController.globalSearch.bind(searchController) as any);

export default router;

