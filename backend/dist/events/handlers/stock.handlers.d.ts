/**
 * Handlers pour les événements Stock (DOC-03)
 *
 * Ces handlers mettent à jour les agrégats calculés à partir des événements
 * Le stock est calculé, jamais stocké directement
 */
import { StockMovementValidated, StockMovementReversed } from '../domain-event';
/**
 * Handler pour StockMovementValidated
 * Met à jour le cache de stock calculé pour chaque produit/entrepôt
 * DOC-03 : Le stock est calculé, jamais stocké
 */
export declare function handleStockMovementValidated(event: StockMovementValidated): Promise<void>;
/**
 * Handler pour StockMovementReversed
 * Recalcule le stock après inversion d'un mouvement
 */
export declare function handleStockMovementReversed(event: StockMovementReversed): Promise<void>;
//# sourceMappingURL=stock.handlers.d.ts.map