import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'cancelled';

/**
 * Service de validation des factures
 * Assure la cohérence des données et des transitions de statut
 */
export class InvoiceValidationService {
  /**
   * Matrice des transitions de statut autorisées
   */
  private static readonly ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ['sent', 'cancelled'], // Un brouillon peut être envoyé ou annulé
    sent: ['paid', 'partially_paid', 'cancelled'], // Une facture envoyée peut être payée, partiellement payée ou annulée
    partially_paid: ['paid', 'cancelled'], // Une facture partiellement payée peut être complètement payée ou annulée
    paid: [], // Une facture payée ne peut plus changer de statut
    cancelled: [], // Une facture annulée ne peut plus changer de statut
  };

  /**
   * Vérifier si une transition de statut est autorisée
   */
  static validateStatusTransition(oldStatus: InvoiceStatus, newStatus: InvoiceStatus): void {
    if (oldStatus === newStatus) {
      // Pas de changement, c'est valide
      return;
    }

    const allowedTransitions = this.ALLOWED_TRANSITIONS[oldStatus];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new CustomError(
        `Transition de statut non autorisée : "${oldStatus}" → "${newStatus}". Transitions autorisées : ${allowedTransitions.join(', ') || 'aucune'}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    logger.info('Status transition validated', {
      oldStatus,
      newStatus,
    });
  }

  /**
   * Vérifier si une facture peut être modifiée selon son statut
   */
  static validateCanModify(status: InvoiceStatus): void {
    const nonModifiableStatuses: InvoiceStatus[] = ['paid', 'cancelled'];
    
    if (nonModifiableStatuses.includes(status)) {
      throw new CustomError(
        `Impossible de modifier une facture avec le statut "${status}". Les factures payées ou annulées ne peuvent pas être modifiées.`,
        400,
        'INVOICE_NOT_MODIFIABLE'
      );
    }
  }

  /**
   * Vérifier si une facture peut être supprimée selon son statut
   */
  static validateCanDelete(status: InvoiceStatus): void {
    const nonDeletableStatuses: InvoiceStatus[] = ['paid', 'partially_paid', 'sent'];
    
    if (nonDeletableStatuses.includes(status)) {
      throw new CustomError(
        `Impossible de supprimer une facture avec le statut "${status}". Seules les factures en brouillon ou annulées peuvent être supprimées.`,
        400,
        'INVOICE_NOT_DELETABLE'
      );
    }
  }

  /**
   * Valider les calculs financiers d'une facture
   * Vérifie la cohérence HT/TTC et les arrondis
   */
  static validateFinancialCalculations(
    lines: Array<{ quantity: number; unitPrice: number; taxRate: number }>,
    transportFees: number = 0,
    platformFees: number = 0,
    expectedSubtotal: number,
    expectedTaxAmount: number,
    expectedTotalAmount: number,
    tolerance: number = 0.01 // Tolérance d'arrondi en unité monétaire
  ): void {
    // Calculer les totaux à partir des lignes
    let calculatedSubtotal = 0;
    let calculatedTaxAmount = 0;

    for (const line of lines) {
      if (line.quantity < 0) {
        throw new CustomError('La quantité ne peut pas être négative', 400, 'VALIDATION_ERROR');
      }
      if (line.unitPrice < 0) {
        throw new CustomError('Le prix unitaire ne peut pas être négatif', 400, 'VALIDATION_ERROR');
      }
      if (line.taxRate < 0 || line.taxRate > 100) {
        throw new CustomError('Le taux de taxe doit être entre 0 et 100%', 400, 'VALIDATION_ERROR');
      }

      const lineSubtotal = line.quantity * line.unitPrice;
      const lineTax = lineSubtotal * (line.taxRate / 100);
      
      calculatedSubtotal += lineSubtotal;
      calculatedTaxAmount += lineTax;
    }

    // Arrondir à 2 décimales
    calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;
    calculatedTaxAmount = Math.round(calculatedTaxAmount * 100) / 100;
    const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount + transportFees + platformFees;
    const calculatedTotalAmountRounded = Math.round(calculatedTotalAmount * 100) / 100;

    // Vérifier les écarts avec tolérance
    const subtotalDiff = Math.abs(calculatedSubtotal - expectedSubtotal);
    const taxDiff = Math.abs(calculatedTaxAmount - expectedTaxAmount);
    const totalDiff = Math.abs(calculatedTotalAmountRounded - expectedTotalAmount);

    if (subtotalDiff > tolerance) {
      throw new CustomError(
        `Incohérence dans le calcul du sous-total HT. Calculé: ${calculatedSubtotal}, Attendu: ${expectedSubtotal}, Différence: ${subtotalDiff}`,
        400,
        'CALCULATION_ERROR'
      );
    }

    if (taxDiff > tolerance) {
      throw new CustomError(
        `Incohérence dans le calcul de la taxe. Calculé: ${calculatedTaxAmount}, Attendu: ${expectedTaxAmount}, Différence: ${taxDiff}`,
        400,
        'CALCULATION_ERROR'
      );
    }

    if (totalDiff > tolerance) {
      throw new CustomError(
        `Incohérence dans le calcul du total TTC. Calculé: ${calculatedTotalAmountRounded}, Attendu: ${expectedTotalAmount}, Différence: ${totalDiff}`,
        400,
        'CALCULATION_ERROR'
      );
    }

    logger.debug('Financial calculations validated', {
      calculatedSubtotal,
      calculatedTaxAmount,
      calculatedTotalAmount: calculatedTotalAmountRounded,
      expectedSubtotal,
      expectedTaxAmount,
      expectedTotalAmount,
    });
  }

  /**
   * Valider les dates d'une facture
   */
  static validateDates(invoiceDate: Date, dueDate?: Date): void {
    if (!invoiceDate) {
      throw new CustomError('La date de facture est obligatoire', 400, 'VALIDATION_ERROR');
    }

    if (dueDate) {
      // La date d'échéance ne peut pas être antérieure à la date de facture
      if (dueDate < invoiceDate) {
        throw new CustomError(
          'La date d\'échéance ne peut pas être antérieure à la date de facture',
          400,
          'VALIDATION_ERROR'
        );
      }
    }
  }

  /**
   * Valider qu'un montant de paiement ne dépasse pas le solde restant
   */
  static validatePaymentAmount(
    paymentAmount: number,
    totalAmount: number,
    paidAmount: number
  ): void {
    if (paymentAmount <= 0) {
      throw new CustomError('Le montant du paiement doit être positif', 400, 'VALIDATION_ERROR');
    }

    const remainingBalance = totalAmount - paidAmount;
    
    if (paymentAmount > remainingBalance) {
      throw new CustomError(
        `Le montant du paiement (${paymentAmount}) dépasse le solde restant (${remainingBalance})`,
        400,
        'PAYMENT_AMOUNT_EXCEEDS_BALANCE'
      );
    }
  }

  /**
   * Valider la cohérence entre le statut et les montants payés
   */
  static validateStatusConsistency(
    status: InvoiceStatus,
    totalAmount: number,
    paidAmount: number
  ): void {
    const remainingBalance = totalAmount - paidAmount;
    const tolerance = 0.01; // Tolérance pour les arrondis

    switch (status) {
      case 'paid':
        if (remainingBalance > tolerance) {
          throw new CustomError(
            `Le statut "payée" est incohérent : il reste ${remainingBalance} à payer`,
            400,
            'STATUS_INCONSISTENCY'
          );
        }
        break;
      
      case 'partially_paid':
        if (paidAmount <= 0) {
          throw new CustomError(
            'Le statut "partiellement payée" nécessite un montant payé > 0',
            400,
            'STATUS_INCONSISTENCY'
          );
        }
        if (remainingBalance <= tolerance) {
          throw new CustomError(
            'Le statut "partiellement payée" est incohérent : la facture est complètement payée',
            400,
            'STATUS_INCONSISTENCY'
          );
        }
        break;
      
      case 'sent':
        if (paidAmount > 0 && remainingBalance > tolerance) {
          // Si un paiement existe, le statut devrait être 'partially_paid' ou 'paid'
          // Mais on ne force pas, on log juste un avertissement
          logger.warn('Invoice status might be inconsistent', {
            status,
            paidAmount,
            remainingBalance,
          });
        }
        break;
    }
  }
}

export default InvoiceValidationService;

