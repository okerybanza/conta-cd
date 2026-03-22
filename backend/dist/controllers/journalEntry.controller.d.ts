import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class JournalEntryController {
    /**
     * POST /api/v1/journal-entries
     * Créer une écriture comptable
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/journal-entries
     * Lister les écritures comptables
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/journal-entries/:id
     * Obtenir une écriture par ID
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/journal-entries/:id
     * Mettre à jour une écriture (seulement si draft)
     */
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/journal-entries/:id/post
     * Poster une écriture (changer de draft à posted)
     * ACCT-014: Ségrégation des tâches — le posteur doit être différent du créateur si plusieurs utilisateurs.
     */
    post(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/journal-entries/:id/reverse
     * SPRINT 1 - TASK 1.3 (ARCH-010): Reverse a posted journal entry
     * Creates a compensating entry with flipped debits/credits
     */
    reverse(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/journal-entries/:id
     * Supprimer une écriture (seulement si draft)
     */
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: JournalEntryController;
export default _default;
//# sourceMappingURL=journalEntry.controller.d.ts.map