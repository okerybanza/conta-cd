/**
 * DOC-10 : Messages d'erreur explicites avec solutions
 * 
 * Principe : Avant toute action bloquante :
 * - Expliquer pourquoi
 * - Indiquer quoi faire à la place
 * 
 * Un refus sans explication est une mauvaise UX.
 */

export interface ErrorWithSolution {
  message: string;
  code: string;
  solution: string;
  details?: any;
}

/**
 * Messages d'erreur avec solutions selon DOC-10
 */
export const ErrorMessages = {
  /**
   * Période clôturée
   */
  PERIOD_CLOSED: (periodName?: string): ErrorWithSolution => ({
    message: periodName
      ? `L'exercice "${periodName}" est clôturé. Aucune modification n'est autorisée.`
      : 'La période comptable est clôturée. Aucune modification n\'est autorisée.',
    code: 'PERIOD_CLOSED',
    solution: 'Créez une écriture d\'ajustement dans une période ouverte ultérieure. Si nécessaire, demandez la réouverture exceptionnelle de la période (justification obligatoire).',
  }),

  /**
   * Période verrouillée
   */
  PERIOD_LOCKED: (periodName?: string): ErrorWithSolution => ({
    message: periodName
      ? `L'exercice "${periodName}" est verrouillé. Aucune modification n'est autorisée.`
      : 'La période comptable est verrouillée. Aucune modification n\'est autorisée.',
    code: 'PERIOD_LOCKED',
    solution: 'Déverrouillez la période ou créez une écriture d\'ajustement dans une période ouverte.',
  }),

  /**
   * Période non trouvée
   */
  PERIOD_NOT_FOUND: (date?: string): ErrorWithSolution => ({
    message: date
      ? `Aucun exercice comptable n'est défini pour la date ${date}.`
      : 'Aucun exercice comptable n\'est défini pour cette date.',
    code: 'PERIOD_NOT_FOUND',
    solution: 'Créez un exercice comptable couvrant cette date avant de saisir des transactions financières.',
  }),

  /**
   * Facture validée (non modifiable)
   */
  INVOICE_VALIDATED: (invoiceNumber?: string): ErrorWithSolution => ({
    message: invoiceNumber
      ? `La facture ${invoiceNumber} est validée et ne peut plus être modifiée.`
      : 'Cette facture est validée et ne peut plus être modifiée.',
    code: 'INVOICE_VALIDATED',
    solution: 'Pour corriger une facture validée, annulez-la par inversion (création d\'un avoir) puis créez une nouvelle facture correcte.',
  }),

  /**
   * Stock insuffisant
   */
  INSUFFICIENT_STOCK: (productName?: string, available?: number, requested?: number): ErrorWithSolution => ({
    message: productName
      ? `Stock insuffisant pour "${productName}". Disponible : ${available || 0}, Demandé : ${requested || 0}`
      : `Stock insuffisant. Disponible : ${available || 0}, Demandé : ${requested || 0}`,
    code: 'INSUFFICIENT_STOCK',
    solution: 'Réduisez la quantité demandée ou créez un mouvement d\'entrée de stock (achat, ajustement) pour augmenter le stock disponible.',
  }),

  /**
   * Stock négatif interdit
   */
  NEGATIVE_STOCK_NOT_ALLOWED: (productName?: string): ErrorWithSolution => ({
    message: productName
      ? `Le stock négatif n'est pas autorisé pour "${productName}".`
      : 'Le stock négatif n\'est pas autorisé.',
    code: 'NEGATIVE_STOCK_NOT_ALLOWED',
    solution: 'Vérifiez votre stock disponible avant de créer le mouvement. Si nécessaire, ajustez la configuration du produit pour autoriser le stock négatif (datarissage).',
  }),

  /**
   * Paie validée (non modifiable)
   */
  PAYROLL_VALIDATED: (payrollId?: string): ErrorWithSolution => ({
    message: payrollId
      ? `La paie ${payrollId} est validée et ne peut plus être modifiée.`
      : 'Cette paie est validée et ne peut plus être modifiée.',
    code: 'PAYROLL_VALIDATED',
    solution: 'Pour corriger une paie validée, annulez-la par inversion puis créez une nouvelle paie correcte.',
  }),

  /**
   * Mouvement de stock validé (non modifiable)
   */
  STOCK_MOVEMENT_VALIDATED: (movementId?: string): ErrorWithSolution => ({
    message: movementId
      ? `Le mouvement de stock ${movementId} est validé et ne peut plus être modifié.`
      : 'Ce mouvement de stock est validé et ne peut plus être modifié.',
    code: 'STOCK_MOVEMENT_VALIDATED',
    solution: 'Pour corriger un mouvement validé, créez un mouvement inverse (inversion) lié à l\'original.',
  }),

  /**
   * Module non activé
   */
  MODULE_NOT_ACTIVATED: (moduleName: string): ErrorWithSolution => ({
    message: `Le module ${moduleName} n'est pas activé pour votre entreprise.`,
    code: 'MODULE_NOT_ACTIVATED',
    solution: `Activez le module ${moduleName} dans les paramètres de l'entreprise (datarissage) ou contactez votre administrateur.`,
  }),

  /**
   * Datarissage incomplet
   */
  DATARISSAGE_INCOMPLETE: (step?: number): ErrorWithSolution => ({
    message: step
      ? `Le datarissage n'est pas complet. Étape ${step} manquante.`
      : 'Le datarissage de l\'entreprise n\'est pas complet.',
    code: 'DATARISSAGE_INCOMPLETE',
    solution: 'Complétez le datarissage de l\'entreprise dans les paramètres pour activer toutes les fonctionnalités.',
  }),

  /**
   * Permission insuffisante
   */
  INSUFFICIENT_PERMISSION: (action: string, requiredRole?: string): ErrorWithSolution => ({
    message: `Vous n'avez pas la permission d'effectuer cette action : ${action}.`,
    code: 'INSUFFICIENT_PERMISSION',
    solution: requiredRole
      ? `Cette action nécessite le rôle "${requiredRole}". Contactez votre administrateur pour obtenir les permissions nécessaires.`
      : 'Contactez votre administrateur pour obtenir les permissions nécessaires.',
  }),

  /**
   * Justification manquante
   */
  JUSTIFICATION_REQUIRED: (action: string): ErrorWithSolution => ({
    message: `Une justification est obligatoire pour l'action : ${action}.`,
    code: 'JUSTIFICATION_REQUIRED',
    solution: 'Fournissez une justification écrite expliquant la raison de cette action. Cette justification sera enregistrée dans l\'audit (DOC-08).',
  }),

  /**
   * Email non trouvé
   */
  EMAIL_NOT_FOUND: (): ErrorWithSolution => ({
    message: 'Cette adresse email n\'existe pas dans la plateforme Conta.',
    code: 'EMAIL_NOT_FOUND',
    solution: 'Créez un compte avec cette adresse email ou utilisez une adresse email différente.',
  }),

  /**
   * Identifiants invalides
   */
  INVALID_CREDENTIALS: (): ErrorWithSolution => ({
    message: 'Email ou mot de passe incorrect.',
    code: 'INVALID_CREDENTIALS',
    solution: 'Vérifiez vos identifiants et réessayez. Si vous avez oublié votre mot de passe, utilisez la fonction "Mot de passe oublié".',
  }),

  /**
   * Compte verrouillé
   */
  ACCOUNT_LOCKED: (minutesLeft?: number): ErrorWithSolution => ({
    message: minutesLeft
      ? `Votre compte est temporairement verrouillé. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`
      : 'Votre compte est temporairement verrouillé.',
    code: 'ACCOUNT_LOCKED',
    solution: 'Attendez la fin de la période de verrouillage ou contactez le support si le problème persiste.',
  }),

  /**
   * Code 2FA requis
   */
  '2FA_REQUIRED': (): ErrorWithSolution => ({
    message: 'Code d\'authentification à deux facteurs requis.',
    code: '2FA_REQUIRED',
    solution: 'Entrez le code à 6 chiffres généré par votre application d\'authentification.',
  }),

  /**
   * Code 2FA invalide
   */
  INVALID_2FA_CODE: (): ErrorWithSolution => ({
    message: 'Code d\'authentification à deux facteurs invalide.',
    code: 'INVALID_2FA_CODE',
    solution: 'Vérifiez que vous avez entré le code correct depuis votre application d\'authentification. Le code change toutes les 30 secondes.',
  }),

  EMAIL_NOT_VERIFIED: (): ErrorWithSolution => ({
    message: 'Votre adresse email n\'est pas encore confirmée.',
    code: 'EMAIL_NOT_VERIFIED',
    solution: 'Consultez votre boite mail pour le code de confirmation ou demandez un nouveau code depuis la page de vérification.',
  }),

  EMAIL_VERIFICATION_REQUIRED: (): ErrorWithSolution => ({
    message: 'Une vérification d\'email est requise.',
    code: 'EMAIL_VERIFICATION_REQUIRED',
    solution: 'Demandez un nouveau code de confirmation et réessayez.',
  }),

  EMAIL_VERIFICATION_CODE_INVALID: (): ErrorWithSolution => ({
    message: 'Code de confirmation invalide.',
    code: 'EMAIL_VERIFICATION_CODE_INVALID',
    solution: 'Vérifiez le code reçu par email et réessayez. Vous pouvez demander un nouveau code.',
  }),

  EMAIL_VERIFICATION_CODE_EXPIRED: (): ErrorWithSolution => ({
    message: 'Le code de confirmation a expiré.',
    code: 'EMAIL_VERIFICATION_CODE_EXPIRED',
    solution: 'Demandez un nouveau code de confirmation depuis la page de vérification.',
  }),
};

/**
 * Créer une erreur avec solution depuis un code d'erreur
 */
export function createErrorWithSolution(
  code: string,
  ...args: any[]
): ErrorWithSolution {
  const errorFn = (ErrorMessages as any)[code];
  if (errorFn && typeof errorFn === 'function') {
    return errorFn(...args);
  }

  // Erreur générique si code non trouvé
  return {
    message: 'Une erreur est survenue',
    code,
    solution: 'Contactez le support si le problème persiste.',
  };
}
