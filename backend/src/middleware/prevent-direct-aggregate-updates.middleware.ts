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
import logger from '../utils/logger';
import { CustomError } from './error.middleware';

/**
 * Liste des champs interdits pour modification directe
 */
const PROTECTED_FIELDS = {
  products: ['stock'], // Le stock doit être modifié via stock_movements
  accounts: ['balance', 'debit_balance', 'credit_balance'], // Les soldes doivent être calculés depuis journal_entries
  // Ajouter d'autres champs critiques ici
};

/**
 * Middleware pour vérifier les mises à jour de produits
 */
export function preventDirectStockUpdate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  // Vérifier si on tente de modifier le stock directement
  if (req.body.stock !== undefined || req.body.stockQuantity !== undefined) {
    logger.warn('Attempt to update stock directly detected', {
      path: req.path,
      method: req.method,
      body: req.body,
      userId: (req as any).user?.id,
    });

    throw new CustomError(
      'Direct stock updates are not allowed. Use stock movements instead (createStockMovement API).',
      400,
      'DIRECT_AGGREGATE_UPDATE_FORBIDDEN',
      {
        field: 'stock',
        message: 'Stock must be modified via stock movements, not directly',
      }
    );
  }

  next();
}

/**
 * Middleware pour vérifier les mises à jour de comptes comptables
 */
export function preventDirectBalanceUpdate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  // Vérifier si on tente de modifier les soldes directement
  const balanceFields = ['balance', 'debit_balance', 'credit_balance'];
  const hasBalanceUpdate = balanceFields.some(field => req.body[field] !== undefined);

  if (hasBalanceUpdate) {
    logger.warn('Attempt to update account balance directly detected', {
      path: req.path,
      method: req.method,
      body: req.body,
      userId: (req as any).user?.id,
    });

    throw new CustomError(
      'Direct account balance updates are not allowed. Use journal entries instead.',
      400,
      'DIRECT_AGGREGATE_UPDATE_FORBIDDEN',
      {
        fields: balanceFields.filter(field => req.body[field] !== undefined),
        message: 'Account balances must be calculated from journal entries, not updated directly',
      }
    );
  }

  next();
}

/**
 * Middleware générique pour empêcher les mises à jour directes
 * À utiliser sur les routes critiques
 */
export function preventDirectAggregateUpdates(
  protectedFields: Record<string, string[]>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') {
      return next();
    }

    // Vérifier chaque modèle protégé
    for (const [model, fields] of Object.entries(protectedFields)) {
      const hasProtectedField = fields.some(field => req.body[field] !== undefined);

      if (hasProtectedField) {
        const violatedFields = fields.filter(field => req.body[field] !== undefined);

        logger.warn(`Attempt to update protected fields directly detected: ${model}`, {
          path: req.path,
          method: req.method,
          model,
          violatedFields,
          userId: (req as any).user?.id,
        });

        throw new CustomError(
          `Direct updates to ${model} protected fields are not allowed. Use the appropriate service methods instead.`,
          400,
          'DIRECT_AGGREGATE_UPDATE_FORBIDDEN',
          {
            model,
            violatedFields,
            message: `Protected fields in ${model} must be modified via events, not directly`,
          }
        );
      }
    }

    next();
  };
}

