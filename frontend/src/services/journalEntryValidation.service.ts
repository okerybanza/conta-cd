import { Account, AccountType } from './account.service';
import { JournalEntryLineData, CreateJournalEntryData } from './journalEntry.service';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

class JournalEntryValidationService {
  /**
   * Valide une écriture comptable complète
   */
  async validateEntry(
    entry: CreateJournalEntryData,
    accounts: Account[]
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Validation de l'équilibrage
    const balanceResult = this.validateBalance(entry.lines);
    if (!balanceResult.isValid) {
      errors.push(...balanceResult.errors);
    }

    // 2. Validation des lignes
    entry.lines.forEach((line, index) => {
      const lineErrors = this.validateLine(line, index, accounts);
      errors.push(...lineErrors.filter((e) => e.severity === 'error'));
      warnings.push(...lineErrors.filter((e) => e.severity === 'warning'));
    });

    // 3. Validation de la cohérence des comptes
    const accountCoherence = this.validateAccountCoherence(entry.lines, accounts);
    if (!accountCoherence.isValid) {
      errors.push(...accountCoherence.errors);
    }

    // 4. Validation des règles comptables
    const rulesResult = this.validateAccountingRules(entry.lines, accounts);
    if (!rulesResult.isValid) {
      errors.push(...rulesResult.errors);
      warnings.push(...rulesResult.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valide l'équilibrage Débit = Crédit
   */
  validateBalance(lines: JournalEntryLineData[]): ValidationResult {
    const errors: ValidationError[] = [];
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);

    if (difference > 0.01) {
      errors.push({
        field: 'balance',
        message: `L'écriture n'est pas équilibrée. Débit: ${totalDebit.toFixed(2)}, Crédit: ${totalCredit.toFixed(2)}, Différence: ${difference.toFixed(2)}`,
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Valide une ligne d'écriture
   */
  validateLine(
    line: JournalEntryLineData,
    index: number,
    accounts: Account[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Vérifier que le compte est sélectionné
    if (!line.accountId) {
      errors.push({
        field: `lines[${index}].accountId`,
        message: 'Un compte doit être sélectionné',
        severity: 'error',
      });
      return errors;
    }

    // Trouver le compte
    const account = accounts.find((a) => a.id === line.accountId);
    if (!account) {
      errors.push({
        field: `lines[${index}].accountId`,
        message: 'Compte introuvable',
        severity: 'error',
      });
      return errors;
    }

    // Vérifier que le compte est actif
    if (!account.isActive) {
      errors.push({
        field: `lines[${index}].accountId`,
        message: `Le compte ${account.code} - ${account.name} est inactif`,
        severity: 'error',
      });
    }

    // Vérifier que débit OU crédit est renseigné (pas les deux)
    if (line.debit > 0 && line.credit > 0) {
      errors.push({
        field: `lines[${index}]`,
        message: 'Une ligne ne peut pas avoir à la fois un débit et un crédit',
        severity: 'error',
      });
    }

    // Vérifier qu'au moins un montant est renseigné
    if (line.debit === 0 && line.credit === 0) {
      errors.push({
        field: `lines[${index}]`,
        message: 'Une ligne doit avoir un montant en débit ou en crédit',
        severity: 'error',
      });
    }

    // Vérifier les montants négatifs
    if (line.debit < 0) {
      errors.push({
        field: `lines[${index}].debit`,
        message: 'Le débit ne peut pas être négatif',
        severity: 'error',
      });
    }

    if (line.credit < 0) {
      errors.push({
        field: `lines[${index}].credit`,
        message: 'Le crédit ne peut pas être négatif',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Valide la cohérence des comptes utilisés
   */
  validateAccountCoherence(
    lines: JournalEntryLineData[],
    accounts: Account[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const accountIds = new Set<string>();

    lines.forEach((line, index) => {
      if (!line.accountId) return;

      // Vérifier les doublons de compte dans la même écriture
      if (accountIds.has(line.accountId)) {
        const account = accounts.find((a) => a.id === line.accountId);
        errors.push({
          field: `lines[${index}].accountId`,
          message: `Le compte ${account?.code || line.accountId} est utilisé plusieurs fois dans cette écriture`,
          severity: 'warning',
        });
      }
      accountIds.add(line.accountId);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Valide les règles comptables (compatibilité des types de comptes)
   */
  validateAccountingRules(
    lines: JournalEntryLineData[],
    accounts: Account[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    lines.forEach((line, index) => {
      if (!line.accountId) return;

      const account = accounts.find((a) => a.id === line.accountId);
      if (!account) return;

      // Règle : Les comptes d'actif (1) augmentent au débit, diminuent au crédit
      if (account.type === 'asset' && line.credit > 0 && line.debit === 0) {
        warnings.push({
          field: `lines[${index}]`,
          message: `Attention : Le compte ${account.code} (Actif) est crédité. Vérifiez que c'est intentionnel.`,
          severity: 'warning',
        });
      }

      // Règle : Les comptes de passif (2) augmentent au crédit, diminuent au débit
      if (account.type === 'liability' && line.debit > 0 && line.credit === 0) {
        warnings.push({
          field: `lines[${index}]`,
          message: `Attention : Le compte ${account.code} (Passif) est débité. Vérifiez que c'est intentionnel.`,
          severity: 'warning',
        });
      }

      // Règle : Les comptes de capital (3) augmentent au crédit, diminuent au débit
      if (account.type === 'equity' && line.debit > 0 && line.credit === 0) {
        warnings.push({
          field: `lines[${index}]`,
          message: `Attention : Le compte ${account.code} (Capital) est débité. Vérifiez que c'est intentionnel.`,
          severity: 'warning',
        });
      }

      // Règle : Les comptes de produits (7) augmentent au crédit
      if (account.type === 'revenue' && line.debit > 0 && line.credit === 0) {
        warnings.push({
          field: `lines[${index}]`,
          message: `Attention : Le compte ${account.code} (Produit) est débité. Vérifiez que c'est intentionnel (ex: avoir).`,
          severity: 'warning',
        });
      }

      // Règle : Les comptes de charges (6) augmentent au débit
      if (account.type === 'expense' && line.credit > 0 && line.debit === 0) {
        warnings.push({
          field: `lines[${index}]`,
          message: `Attention : Le compte ${account.code} (Charge) est crédité. Vérifiez que c'est intentionnel (ex: reprise).`,
          severity: 'warning',
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valide le nombre minimum de lignes
   */
  validateMinLines(lines: JournalEntryLineData[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (lines.length < 2) {
      errors.push({
        field: 'lines',
        message: 'Une écriture comptable doit avoir au moins 2 lignes',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Valide qu'au moins une ligne a un montant
   */
  validateHasAmounts(lines: JournalEntryLineData[]): ValidationResult {
    const errors: ValidationError[] = [];
    const hasAmount = lines.some(
      (line) => (line.debit > 0 || line.credit > 0) && line.accountId
    );

    if (!hasAmount) {
      errors.push({
        field: 'lines',
        message: 'Au moins une ligne doit avoir un montant',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}

export default new JournalEntryValidationService();

