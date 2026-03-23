import { CreateAccountData, AccountType } from './account.service';

/**
 * Plan Comptable SYSCOHADA/OHADA Standard
 * Conforme aux normes de l'Organisation pour l'Harmonisation en Afrique du Droit des Affaires
 */

export interface SYSCOHADAAccount {
  code: string;
  name: string;
  type: AccountType;
  category: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
  description?: string;
  children?: SYSCOHADAAccount[];
}

/**
 * Plan comptable SYSCOHADA de base
 * Classes 1 à 8 selon les normes OHADA
 */
export const SYSCOHADA_CHART_OF_ACCOUNTS: SYSCOHADAAccount[] = [
  // CLASSE 1 : FINANCEMENT PERMANENT
  {
    code: '10',
    name: 'CAPITAUX',
    type: 'equity',
    category: '1',
    children: [
      { code: '101', name: 'Capital social', type: 'equity', category: '1' },
      { code: '106', name: 'Réserves', type: 'equity', category: '1' },
      { code: '107', name: 'Report à nouveau', type: 'equity', category: '1' },
      { code: '108', name: 'Résultat net', type: 'equity', category: '1' },
    ],
  },
  {
    code: '11',
    name: 'RÉSERVES ET ASSIMILÉS',
    type: 'equity',
    category: '1',
  },
  {
    code: '13',
    name: 'PROVISIONS POUR RISQUES ET CHARGES',
    type: 'liability',
    category: '1',
  },
  {
    code: '15',
    name: 'SUBVENTIONS D\'INVESTISSEMENT',
    type: 'equity',
    category: '1',
  },
  {
    code: '16',
    name: 'EMPLOIS ET RESSOURCES',
    type: 'equity',
    category: '1',
  },
  {
    code: '17',
    name: 'DETTES DE FINANCEMENT',
    type: 'liability',
    category: '1',
    children: [
      { code: '171', name: 'Emprunts obligataires', type: 'liability', category: '1' },
      { code: '172', name: 'Emprunts auprès des établissements de crédit', type: 'liability', category: '1' },
      { code: '174', name: 'Dettes de location-acquisition', type: 'liability', category: '1' },
    ],
  },

  // CLASSE 2 : ACTIF IMMOBILISÉ
  {
    code: '20',
    name: 'IMMOBILISATIONS INCORPORELLES',
    type: 'asset',
    category: '2',
    children: [
      { code: '201', name: 'Frais d\'établissement', type: 'asset', category: '2' },
      { code: '203', name: 'Frais de recherche et développement', type: 'asset', category: '2' },
      { code: '205', name: 'Concessions et droits similaires', type: 'asset', category: '2' },
      { code: '207', name: 'Fonds commercial', type: 'asset', category: '2' },
      { code: '208', name: 'Autres immobilisations incorporelles', type: 'asset', category: '2' },
    ],
  },
  {
    code: '21',
    name: 'IMMOBILISATIONS CORPORELLES',
    type: 'asset',
    category: '2',
    children: [
      { code: '211', name: 'Terrains', type: 'asset', category: '2' },
      { code: '213', name: 'Constructions', type: 'asset', category: '2' },
      { code: '214', name: 'Amortissements des constructions', type: 'asset', category: '2' },
      { code: '215', name: 'Installations techniques, matériel et outillage', type: 'asset', category: '2' },
      { code: '218', name: 'Autres immobilisations corporelles', type: 'asset', category: '2' },
    ],
  },
  {
    code: '23',
    name: 'IMMOBILISATIONS EN COURS',
    type: 'asset',
    category: '2',
  },
  {
    code: '25',
    name: 'PARTICIPATIONS ET CRÉANCES LIÉES',
    type: 'asset',
    category: '2',
  },
  {
    code: '26',
    name: 'AUTRES IMMOBILISATIONS FINANCIÈRES',
    type: 'asset',
    category: '2',
  },
  {
    code: '27',
    name: 'AMORTISSEMENTS DES IMMOBILISATIONS',
    type: 'asset',
    category: '2',
  },
  {
    code: '28',
    name: 'PROVISIONS POUR DÉPRÉCIATION DES IMMOBILISATIONS',
    type: 'asset',
    category: '2',
  },

  // CLASSE 3 : STOCKS
  {
    code: '30',
    name: 'MARCHANDISES',
    type: 'asset',
    category: '3',
  },
  {
    code: '31',
    name: 'MATIÈRES PREMIÈRES ET FOURNITURES',
    type: 'asset',
    category: '3',
  },
  {
    code: '32',
    name: 'AUTRES APPROVISIONNEMENTS',
    type: 'asset',
    category: '3',
  },
  {
    code: '33',
    name: 'EN-COURS DE PRODUCTION',
    type: 'asset',
    category: '3',
  },
  {
    code: '34',
    name: 'PRODUITS INTERMÉDIAIRES',
    type: 'asset',
    category: '3',
  },
  {
    code: '35',
    name: 'PRODUITS FINIS',
    type: 'asset',
    category: '3',
  },
  {
    code: '37',
    name: 'STOCKS EN COURS DE ROUTE',
    type: 'asset',
    category: '3',
  },
  {
    code: '38',
    name: 'PROVISIONS POUR DÉPRÉCIATION DES STOCKS',
    type: 'asset',
    category: '3',
  },
  {
    code: '39',
    name: 'PROVISIONS POUR DÉPRÉCIATION DES STOCKS',
    type: 'asset',
    category: '3',
  },

  // CLASSE 4 : TIERS
  {
    code: '40',
    name: 'FOURNISSEURS ET COMPTES RATTACHÉS',
    type: 'liability',
    category: '4',
    children: [
      { code: '401', name: 'Fournisseurs', type: 'liability', category: '4' },
      { code: '403', name: 'Fournisseurs - Effets à payer', type: 'liability', category: '4' },
      { code: '404', name: 'Fournisseurs d\'immobilisations', type: 'liability', category: '4' },
      { code: '408', name: 'Fournisseurs - Factures non parvenues', type: 'liability', category: '4' },
    ],
  },
  {
    code: '41',
    name: 'CLIENTS ET COMPTES RATTACHÉS',
    type: 'asset',
    category: '4',
    children: [
      { code: '411', name: 'Clients', type: 'asset', category: '4' },
      { code: '413', name: 'Clients - Effets à recevoir', type: 'asset', category: '4' },
      { code: '418', name: 'Clients - Factures à établir', type: 'asset', category: '4' },
    ],
  },
  {
    code: '42',
    name: 'PERSONNEL ET COMPTES RATTACHÉS',
    type: 'liability',
    category: '4',
    children: [
      { code: '421', name: 'Personnel - Rémunérations dues', type: 'liability', category: '4' },
      { code: '425', name: 'Personnel - Avances et acomptes', type: 'asset', category: '4' },
      { code: '428', name: 'Personnel - Charges à payer', type: 'liability', category: '4' },
    ],
  },
  {
    code: '43',
    name: 'SÉCURITÉ SOCIALE ET AUTRES ORGANISMES SOCIAUX',
    type: 'liability',
    category: '4',
  },
  {
    code: '44',
    name: 'ÉTAT ET AUTRES COLLECTIVITÉS PUBLIQUES',
    type: 'liability',
    category: '4',
    children: [
      { code: '441', name: 'État - Impôts sur les bénéfices', type: 'liability', category: '4' },
      { code: '443', name: 'État - Autres impôts et taxes', type: 'liability', category: '4' },
      { code: '445', name: 'État - TVA à décaisser', type: 'liability', category: '4' },
      { code: '4451', name: 'TVA collectée', type: 'liability', category: '4' },
      { code: '4452', name: 'TVA déductible', type: 'asset', category: '4' },
      { code: '4455', name: 'TVA à décaisser', type: 'liability', category: '4' },
      { code: '4456', name: 'TVA à récupérer', type: 'asset', category: '4' },
      { code: '4457', name: 'TVA due', type: 'liability', category: '4' },
    ],
  },
  {
    code: '45',
    name: 'GROUPES ET ASSOCIÉS',
    type: 'liability',
    category: '4',
  },
  {
    code: '46',
    name: 'DÉBITEURS ET CRÉANCIERS DIVERS',
    type: 'asset',
    category: '4',
  },
  {
    code: '47',
    name: 'COMPTES D\'ATTENTE ET RÉGULARISATION',
    type: 'asset',
    category: '4',
  },
  {
    code: '48',
    name: 'COMPTES DE RÉGULARISATION',
    type: 'asset',
    category: '4',
  },
  {
    code: '49',
    name: 'PROVISIONS POUR DÉPRÉCIATION DES COMPTES DE TIERS',
    type: 'asset',
    category: '4',
  },

  // CLASSE 5 : FINANCES
  {
    code: '50',
    name: 'VALEURS MOBILIÈRES DE PLACEMENT',
    type: 'asset',
    category: '5',
  },
  {
    code: '51',
    name: 'BANQUES, ÉTABLISSEMENTS FINANCIERS ET ASSIMILÉS',
    type: 'asset',
    category: '5',
    children: [
      { code: '512', name: 'Banques', type: 'asset', category: '5' },
      { code: '514', name: 'Banques - Dépôts et crédits', type: 'asset', category: '5' },
      { code: '515', name: 'Banques - Virements internes', type: 'asset', category: '5' },
    ],
  },
  {
    code: '53',
    name: 'CAISSE',
    type: 'asset',
    category: '5',
    children: [
      { code: '531', name: 'Caisse', type: 'asset', category: '5' },
      { code: '532', name: 'Caisse - Devises', type: 'asset', category: '5' },
    ],
  },
  {
    code: '54',
    name: 'RÉGIES D\'AVANCES ET ACCRÉDITIFS',
    type: 'asset',
    category: '5',
  },
  {
    code: '55',
    name: 'INSTITUTIONS FINANCIÈRES',
    type: 'asset',
    category: '5',
  },
  {
    code: '56',
    name: 'BANQUES, TRÉSORERIE ET ASSIMILÉS',
    type: 'asset',
    category: '5',
  },
  {
    code: '57',
    name: 'VIREMENTS INTERNES',
    type: 'asset',
    category: '5',
  },
  {
    code: '58',
    name: 'PROVISIONS POUR DÉPRÉCIATION DES VALEURS MOBILIÈRES',
    type: 'asset',
    category: '5',
  },

  // CLASSE 6 : CHARGES
  {
    code: '60',
    name: 'ACHATS',
    type: 'expense',
    category: '6',
    children: [
      { code: '601', name: 'Achats stockés - Matières premières', type: 'expense', category: '6' },
      { code: '602', name: 'Achats stockés - Autres approvisionnements', type: 'expense', category: '6' },
      { code: '603', name: 'Achats stockés - Variation des stocks', type: 'expense', category: '6' },
      { code: '604', name: 'Achats d\'études et prestations de services', type: 'expense', category: '6' },
      { code: '605', name: 'Achats de matériel, équipements et travaux', type: 'expense', category: '6' },
      { code: '606', name: 'Achats non stockés de matières et fournitures', type: 'expense', category: '6' },
      { code: '607', name: 'Achats de marchandises', type: 'expense', category: '6' },
      { code: '608', name: 'Autres achats', type: 'expense', category: '6' },
    ],
  },
  {
    code: '61',
    name: 'SERVICES EXTÉRIEURS',
    type: 'expense',
    category: '6',
    children: [
      { code: '611', name: 'Sous-traitance', type: 'expense', category: '6' },
      { code: '612', name: 'Redevances de crédit-bail', type: 'expense', category: '6' },
      { code: '613', name: 'Locations', type: 'expense', category: '6' },
      { code: '614', name: 'Charges locatives et de copropriété', type: 'expense', category: '6' },
      { code: '615', name: 'Entretien et réparations', type: 'expense', category: '6' },
      { code: '616', name: 'Primes d\'assurance', type: 'expense', category: '6' },
      { code: '617', name: 'Études et recherches', type: 'expense', category: '6' },
      { code: '618', name: 'Divers', type: 'expense', category: '6' },
    ],
  },
  {
    code: '62',
    name: 'AUTRES SERVICES EXTÉRIEURS',
    type: 'expense',
    category: '6',
    children: [
      { code: '621', name: 'Personnel extérieur à l\'entreprise', type: 'expense', category: '6' },
      { code: '622', name: 'Rémunérations d\'intermédiaires et honoraires', type: 'expense', category: '6' },
      { code: '623', name: 'Publicité, publications, relations publiques', type: 'expense', category: '6' },
      { code: '624', name: 'Transports de biens et transports collectifs du personnel', type: 'expense', category: '6' },
      { code: '625', name: 'Déplacements, missions et réceptions', type: 'expense', category: '6' },
      { code: '626', name: 'Services bancaires et assimilés', type: 'expense', category: '6' },
      { code: '627', name: 'Services et commissions bancaires', type: 'expense', category: '6' },
      { code: '628', name: 'Autres services extérieurs', type: 'expense', category: '6' },
    ],
  },
  {
    code: '63',
    name: 'IMPÔTS, TAXES ET ASSIMILÉS',
    type: 'expense',
    category: '6',
    children: [
      { code: '631', name: 'Impôts, taxes et assimilés sur rémunérations', type: 'expense', category: '6' },
      { code: '633', name: 'Impôts, taxes et assimilés sur rémunérations', type: 'expense', category: '6' },
      { code: '635', name: 'Autres impôts, taxes et assimilés', type: 'expense', category: '6' },
      { code: '637', name: 'Autres charges d\'impôts', type: 'expense', category: '6' },
    ],
  },
  {
    code: '64',
    name: 'CHARGES DE PERSONNEL',
    type: 'expense',
    category: '6',
    children: [
      { code: '641', name: 'Rémunérations du personnel', type: 'expense', category: '6' },
      { code: '645', name: 'Charges de sécurité sociale et de prévoyance', type: 'expense', category: '6' },
      { code: '646', name: 'Charges de retraites et assimilées', type: 'expense', category: '6' },
      { code: '647', name: 'Autres charges sociales', type: 'expense', category: '6' },
    ],
  },
  {
    code: '65',
    name: 'AUTRES CHARGES DE GESTION COURANTE',
    type: 'expense',
    category: '6',
  },
  {
    code: '66',
    name: 'CHARGES FINANCIÈRES',
    type: 'expense',
    category: '6',
    children: [
      { code: '661', name: 'Charges d\'intérêts', type: 'expense', category: '6' },
      { code: '666', name: 'Pertes de change', type: 'expense', category: '6' },
      { code: '668', name: 'Autres charges financières', type: 'expense', category: '6' },
    ],
  },
  {
    code: '67',
    name: 'CHARGES EXCEPTIONNELLES',
    type: 'expense',
    category: '6',
  },
  {
    code: '68',
    name: 'DOTATIONS AUX AMORTISSEMENTS ET PROVISIONS',
    type: 'expense',
    category: '6',
    children: [
      { code: '681', name: 'Dotations aux amortissements sur immobilisations', type: 'expense', category: '6' },
      { code: '686', name: 'Dotations aux provisions pour risques et charges', type: 'expense', category: '6' },
      { code: '687', name: 'Dotations aux provisions pour dépréciations', type: 'expense', category: '6' },
    ],
  },
  {
    code: '69',
    name: 'PARTICIPATION DES SALARIÉS AUX RÉSULTATS',
    type: 'expense',
    category: '6',
  },

  // CLASSE 7 : PRODUITS
  {
    code: '70',
    name: 'VENTES',
    type: 'revenue',
    category: '7',
    children: [
      { code: '701', name: 'Ventes de produits finis', type: 'revenue', category: '7' },
      { code: '702', name: 'Ventes de produits intermédiaires', type: 'revenue', category: '7' },
      { code: '703', name: 'Ventes de produits résiduels', type: 'revenue', category: '7' },
      { code: '704', name: 'Travaux', type: 'revenue', category: '7' },
      { code: '705', name: 'Études', type: 'revenue', category: '7' },
      { code: '706', name: 'Prestations de services', type: 'revenue', category: '7' },
      { code: '707', name: 'Ventes de marchandises', type: 'revenue', category: '7' },
      { code: '708', name: 'Produits des activités annexes', type: 'revenue', category: '7' },
      { code: '709', name: 'Rabais, remises et ristournes accordés', type: 'revenue', category: '7' },
    ],
  },
  {
    code: '71',
    name: 'PRODUCTION STOCKÉE',
    type: 'revenue',
    category: '7',
  },
  {
    code: '72',
    name: 'PRODUCTION IMMOBILISÉE',
    type: 'revenue',
    category: '7',
  },
  {
    code: '74',
    name: 'SUBVENTIONS D\'EXPLOITATION',
    type: 'revenue',
    category: '7',
  },
  {
    code: '75',
    name: 'AUTRES PRODUITS DE GESTION COURANTE',
    type: 'revenue',
    category: '7',
  },
  {
    code: '76',
    name: 'PRODUITS FINANCIERS',
    type: 'revenue',
    category: '7',
    children: [
      { code: '761', name: 'Produits de participations', type: 'revenue', category: '7' },
      { code: '764', name: 'Revenus des autres valeurs mobilières et créances', type: 'revenue', category: '7' },
      { code: '765', name: 'Escomptes obtenus', type: 'revenue', category: '7' },
      { code: '766', name: 'Gains de change', type: 'revenue', category: '7' },
      { code: '768', name: 'Autres produits financiers', type: 'revenue', category: '7' },
    ],
  },
  {
    code: '77',
    name: 'PRODUITS EXCEPTIONNELS',
    type: 'revenue',
    category: '7',
  },
  {
    code: '78',
    name: 'REPRISES SUR PROVISIONS ET AMORTISSEMENTS',
    type: 'revenue',
    category: '7',
  },
  {
    code: '79',
    name: 'TRANSFERTS DE CHARGES',
    type: 'revenue',
    category: '7',
  },

  // CLASSE 8 : COMPTES SPÉCIAUX
  {
    code: '80',
    name: 'COMPTES SPÉCIAUX',
    type: 'asset',
    category: '8',
  },
  {
    code: '88',
    name: 'COMPTES DE RÉSULTAT',
    type: 'equity',
    category: '8',
    children: [
      { code: '881', name: 'Résultat d\'exploitation', type: 'equity', category: '8' },
      { code: '882', name: 'Résultat financier', type: 'equity', category: '8' },
      { code: '883', name: 'Résultat exceptionnel', type: 'equity', category: '8' },
      { code: '884', name: 'Résultat net', type: 'equity', category: '8' },
    ],
  },
  {
    code: '89',
    name: 'BILAN',
    type: 'equity',
    category: '8',
  },
];

/**
 * Convertit le plan comptable SYSCOHADA en format CreateAccountData
 */
export function convertToAccountData(
  account: SYSCOHADAAccount,
  parentId?: string
): CreateAccountData[] {
  const accounts: CreateAccountData[] = [];

  // Compte principal
  accounts.push({
    code: account.code,
    name: account.name,
    type: account.type,
    category: account.category,
    parentId,
    description: account.description,
  });

  // Comptes enfants (récursif)
  if (account.children) {
    account.children.forEach((child) => {
      accounts.push(...convertToAccountData(child, account.code));
    });
  }

  return accounts;
}

/**
 * Récupère tous les comptes du plan SYSCOHADA
 */
export function getAllSYSCOHADAAccounts(): CreateAccountData[] {
  const allAccounts: CreateAccountData[] = [];
  SYSCOHADA_CHART_OF_ACCOUNTS.forEach((account) => {
    allAccounts.push(...convertToAccountData(account));
  });
  return allAccounts;
}

/**
 * Service pour gérer le plan comptable SYSCOHADA
 */
class SYSCOHADAChartOfAccountsService {
  /**
   * Initialise le plan comptable SYSCOHADA pour une entreprise
   */
  async initializeChartOfAccounts(companyId: string): Promise<{ success: boolean; message: string }> {
    // Cette méthode devrait appeler l'API backend pour créer tous les comptes
    // Pour l'instant, retourne les données à créer
    const accounts = getAllSYSCOHADAAccounts();
    return {
      success: true,
      message: `${accounts.length} comptes SYSCOHADA prêts à être créés`,
    };
  }

  /**
   * Valide qu'un code de compte respecte le format SYSCOHADA
   */
  validateAccountCode(code: string): { isValid: boolean; message?: string } {
    // Format SYSCOHADA : 2 à 6 chiffres
    if (!/^\d{2,6}$/.test(code)) {
      return {
        isValid: false,
        message: 'Le code de compte doit contenir entre 2 et 6 chiffres',
      };
    }

    // Vérifier que le code commence par une classe valide (1-8)
    const firstDigit = parseInt(code[0]);
    if (firstDigit < 1 || firstDigit > 8) {
      return {
        isValid: false,
        message: 'Le code de compte doit commencer par un chiffre entre 1 et 8 (classes SYSCOHADA)',
      };
    }

    return { isValid: true };
  }

  /**
   * Trouve un compte dans le plan SYSCOHADA par son code
   */
  findAccountByCode(code: string): SYSCOHADAAccount | null {
    const findInTree = (accounts: SYSCOHADAAccount[]): SYSCOHADAAccount | null => {
      for (const account of accounts) {
        if (account.code === code) {
          return account;
        }
        if (account.children) {
          const found = findInTree(account.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInTree(SYSCOHADA_CHART_OF_ACCOUNTS);
  }
}

export default new SYSCOHADAChartOfAccountsService();

