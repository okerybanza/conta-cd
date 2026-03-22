/**
 * Middleware pour empêcher les écritures directes sur les agrégats
 *
 * Conformité DOC-02 : Aucune donnée critique ne doit être modifiée directement
 *
 * Ce middleware intercepte les requêtes qui tentent de modifier directement :
 * - products.stock (doit passer par stock_movements)
 * - accounts.balance (doit passer par journal_entries)
 * - etc.
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Middleware pour vérifier les mises à jour de produits
 */
export declare function preventDirectStockUpdate(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware pour vérifier les mises à jour de comptes comptables
 */
export declare function preventDirectBalanceUpdate(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware générique pour empêcher les mises à jour directes
 * À utiliser sur les routes critiques
 */
export declare function preventDirectAggregateUpdates(protectedFields: Record<string, string[]>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=prevent-direct-aggregate-updates.middleware.d.ts.map