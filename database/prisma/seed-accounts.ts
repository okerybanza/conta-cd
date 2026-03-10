import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Plan Comptable RDC (République Démocratique du Congo)
 * Basé sur le système comptable OHADA adapté pour la RDC
 */
const rdcChartOfAccounts = [
  // CLASSE 1 : FINANCEMENT PERMANENT
  {
    code: '10',
    name: 'CAPITAUX',
    type: 'equity' as const,
    category: '1' as const,
    children: [
      { code: '101', name: 'Capital social', type: 'equity' as const },
      { code: '106', name: 'Réserves', type: 'equity' as const },
      { code: '120', name: 'Résultat de l\'exercice', type: 'equity' as const },
    ],
  },
  {
    code: '16',
    name: 'EMPRUNTS ET DETTES ASSIMILÉES',
    type: 'liability' as const,
    category: '1' as const,
    children: [
      { code: '161', name: 'Emprunts auprès des établissements de crédit', type: 'liability' as const },
      { code: '168', name: 'Autres emprunts et dettes assimilées', type: 'liability' as const },
    ],
  },

  // CLASSE 2 : ACTIF IMMOBILISÉ
  {
    code: '20',
    name: 'IMMOBILISATIONS INCORPORELLES',
    type: 'asset' as const,
    category: '2' as const,
    children: [
      { code: '201', name: 'Frais d\'établissement', type: 'asset' as const },
      { code: '203', name: 'Frais de recherche et développement', type: 'asset' as const },
      { code: '205', name: 'Concessions et droits similaires', type: 'asset' as const },
    ],
  },
  {
    code: '21',
    name: 'IMMOBILISATIONS CORPORELLES',
    type: 'asset' as const,
    category: '2' as const,
    children: [
      { code: '211', name: 'Terrains', type: 'asset' as const },
      { code: '213', name: 'Constructions', type: 'asset' as const },
      { code: '215', name: 'Installations techniques, matériel et outillage', type: 'asset' as const },
      { code: '218', name: 'Autres immobilisations corporelles', type: 'asset' as const },
    ],
  },
  {
    code: '22',
    name: 'IMMOBILISATIONS FINANCIÈRES',
    type: 'asset' as const,
    category: '2' as const,
    children: [
      { code: '221', name: 'Titres de participation', type: 'asset' as const },
      { code: '261', name: 'Créances rattachées à des participations', type: 'asset' as const },
    ],
  },

  // CLASSE 3 : STOCKS
  {
    code: '30',
    name: 'MARCHANDISES',
    type: 'asset' as const,
    category: '3' as const,
    children: [
      { code: '301', name: 'Marchandises', type: 'asset' as const },
    ],
  },
  {
    code: '31',
    name: 'MATIÈRES PREMIÈRES ET FOURNITURES',
    type: 'asset' as const,
    category: '3' as const,
    children: [
      { code: '311', name: 'Matières premières', type: 'asset' as const },
      { code: '315', name: 'Fournitures', type: 'asset' as const },
    ],
  },
  {
    code: '37',
    name: 'STOCKS DE PRODUITS',
    type: 'asset' as const,
    category: '3' as const,
    children: [
      { code: '371', name: 'Produits en cours', type: 'asset' as const },
      { code: '375', name: 'Produits finis', type: 'asset' as const },
    ],
  },

  // CLASSE 4 : TIERS
  {
    code: '40',
    name: 'FOURNISSEURS ET COMPTES RATTACHÉS',
    type: 'liability' as const,
    category: '4' as const,
    children: [
      { code: '401', name: 'Fournisseurs', type: 'liability' as const },
      { code: '408', name: 'Fournisseurs - Factures non parvenues', type: 'liability' as const },
    ],
  },
  {
    code: '41',
    name: 'CLIENTS ET COMPTES RATTACHÉS',
    type: 'asset' as const,
    category: '4' as const,
    children: [
      { code: '411', name: 'Clients', type: 'asset' as const },
      { code: '418', name: 'Clients - Factures à établir', type: 'asset' as const },
    ],
  },
  {
    code: '42',
    name: 'PERSONNEL ET COMPTES RATTACHÉS',
    type: 'liability' as const,
    category: '4' as const,
    children: [
      { code: '421', name: 'Personnel - Rémunérations dues', type: 'liability' as const },
      { code: '425', name: 'Personnel - Charges à payer', type: 'liability' as const },
    ],
  },
  {
    code: '44',
    name: 'ÉTAT ET AUTRES COLLECTIVITÉS PUBLIQUES',
    type: 'liability' as const,
    category: '4' as const,
    children: [
      {
        code: '445',
        name: 'État - TVA à décaisser',
        type: 'liability' as const,
        children: [
          { code: '445710', name: 'TVA collectée', type: 'liability' as const },
          { code: '445660', name: 'TVA déductible', type: 'asset' as const },
        ],
      },
      { code: '447', name: 'Autres impôts, taxes et versements assimilés', type: 'liability' as const },
    ],
  },

  // CLASSE 5 : TRÉSORERIE
  {
    code: '51',
    name: 'BANQUES, ÉTABLISSEMENTS FINANCIERS ET ASSIMILÉS',
    type: 'asset' as const,
    category: '5' as const,
    children: [
      { code: '512', name: 'Banques', type: 'asset' as const },
      { code: '514', name: 'Chèques postaux', type: 'asset' as const },
    ],
  },
  {
    code: '53',
    name: 'CAISSE',
    type: 'asset' as const,
    category: '5' as const,
    children: [
      { code: '531', name: 'Caisse', type: 'asset' as const },
    ],
  },
  {
    code: '57',
    name: 'VIREMENTS INTERNES',
    type: 'asset' as const,
    category: '5' as const,
    children: [
      { code: '571', name: 'Virements internes', type: 'asset' as const },
    ],
  },

  // CLASSE 6 : CHARGES
  {
    code: '60',
    name: 'ACHATS',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '601', name: 'Achats de marchandises', type: 'expense' as const },
      { code: '602', name: 'Achats stockés - Matières premières', type: 'expense' as const },
      { code: '606', name: 'Achats stockés - Autres approvisionnements', type: 'expense' as const },
      { code: '607', name: 'Achats de marchandises (compte d\'achat)', type: 'expense' as const },
    ],
  },
  {
    code: '61',
    name: 'SERVICES EXTÉRIEURS',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '611', name: 'Sous-traitance générale', type: 'expense' as const },
      { code: '612', name: 'Redevances pour concessions, brevets, licences', type: 'expense' as const },
      { code: '613', name: 'Locations', type: 'expense' as const },
      { code: '614', name: 'Charges locatives et de copropriété', type: 'expense' as const },
      { code: '615', name: 'Entretien et réparations', type: 'expense' as const },
      { code: '616', name: 'Primes d\'assurance', type: 'expense' as const },
      { code: '618', name: 'Divers', type: 'expense' as const },
    ],
  },
  {
    code: '62',
    name: 'AUTRES SERVICES EXTÉRIEURS',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '621', name: 'Personnel extérieur à l\'entreprise', type: 'expense' as const },
      { code: '622', name: 'Honoraires', type: 'expense' as const },
      { code: '623', name: 'Publicité, publications et relations publiques', type: 'expense' as const },
      { code: '624', name: 'Transports de biens et transports collectifs du personnel', type: 'expense' as const },
      { code: '625', name: 'Déplacements, missions et réceptions', type: 'expense' as const },
      { code: '626', name: 'Services bancaires et assimilés', type: 'expense' as const },
      { code: '627', name: 'Services et comptes de la régie d\'avances et de recettes', type: 'expense' as const },
      { code: '628', name: 'Autres services extérieurs', type: 'expense' as const },
    ],
  },
  {
    code: '63',
    name: 'IMPÔTS, TAXES ET VERSEMENTS ASSIMILÉS',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '631', name: 'Impôts, taxes et versements assimilés sur rémunérations', type: 'expense' as const },
      { code: '635', name: 'Autres impôts, taxes et versements assimilés', type: 'expense' as const },
      { code: '637', name: 'Retenues à la source et taxes assimilées', type: 'expense' as const },
    ],
  },
  {
    code: '64',
    name: 'CHARGES DE PERSONNEL',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '641', name: 'Rémunérations du personnel', type: 'expense' as const },
      { code: '645', name: 'Charges de sécurité sociale et de prévoyance', type: 'expense' as const },
      { code: '647', name: 'Autres charges sociales', type: 'expense' as const },
    ],
  },
  {
    code: '65',
    name: 'AUTRES CHARGES DE GESTION COURANTE',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '651', name: 'Redevances pour concessions, brevets, licences, marques', type: 'expense' as const },
      { code: '658', name: 'Dotations aux amortissements sur immobilisations incorporelles et corporelles', type: 'expense' as const },
    ],
  },
  {
    code: '66',
    name: 'CHARGES FINANCIÈRES',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '661', name: 'Charges d\'intérêts', type: 'expense' as const },
      { code: '665', name: 'Escomptes accordés', type: 'expense' as const },
      { code: '668', name: 'Autres charges financières', type: 'expense' as const },
    ],
  },
  {
    code: '67',
    name: 'CHARGES EXCEPTIONNELLES',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '671', name: 'Charges exceptionnelles sur opérations de gestion', type: 'expense' as const },
      { code: '678', name: 'Autres charges exceptionnelles', type: 'expense' as const },
    ],
  },
  {
    code: '68',
    name: 'DOTATIONS AUX AMORTISSEMENTS ET PROVISIONS',
    type: 'expense' as const,
    category: '6' as const,
    children: [
      { code: '681', name: 'Dotations aux amortissements sur immobilisations', type: 'expense' as const },
      { code: '686', name: 'Dotations aux provisions pour risques et charges', type: 'expense' as const },
    ],
  },

  // CLASSE 7 : PRODUITS
  {
    code: '70',
    name: 'VENTES',
    type: 'revenue' as const,
    category: '7' as const,
    children: [
      { code: '701', name: 'Ventes de produits finis', type: 'revenue' as const },
      { code: '702', name: 'Ventes de produits intermédiaires', type: 'revenue' as const },
      { code: '703', name: 'Ventes de produits résiduels', type: 'revenue' as const },
      { code: '707', name: 'Ventes de marchandises', type: 'revenue' as const },
      { code: '708', name: 'Produits des activités annexes', type: 'revenue' as const },
    ],
  },
  {
    code: '71',
    name: 'PRODUCTION STOCKÉE',
    type: 'revenue' as const,
    category: '7' as const,
    children: [
      { code: '711', name: 'Variation des stocks de produits', type: 'revenue' as const },
    ],
  },
  {
    code: '74',
    name: 'SUBVENTIONS D\'EXPLOITATION',
    type: 'revenue' as const,
    category: '7' as const,
    children: [
      { code: '741', name: 'Subventions d\'exploitation', type: 'revenue' as const },
    ],
  },
  {
    code: '75',
    name: 'AUTRES PRODUITS DE GESTION COURANTE',
    type: 'revenue' as const,
    category: '7' as const,
    children: [
      { code: '751', name: 'Revenus des créances immobilisées et des prêts', type: 'revenue' as const },
      { code: '755', name: 'Escomptes obtenus', type: 'revenue' as const },
      { code: '758', name: 'Produits divers de gestion courante', type: 'revenue' as const },
    ],
  },
  {
    code: '76',
    name: 'PRODUITS FINANCIERS',
    type: 'revenue' as const,
    category: '7' as const,
    children: [
      { code: '761', name: 'Produits de participations', type: 'revenue' as const },
      { code: '764', name: 'Revenus des autres immobilisations financières', type: 'revenue' as const },
      { code: '768', name: 'Autres produits financiers', type: 'revenue' as const },
    ],
  },
  {
    code: '77',
    name: 'PRODUITS EXCEPTIONNELS',
    type: 'revenue' as const,
    category: '7' as const,
    children: [
      { code: '771', name: 'Produits exceptionnels sur opérations de gestion', type: 'revenue' as const },
      { code: '778', name: 'Autres produits exceptionnels', type: 'revenue' as const },
    ],
  },
  {
    code: '78',
    name: 'REPRISES SUR AMORTISSEMENTS ET PROVISIONS',
    type: 'revenue' as const,
    category: '7' as const,
    children: [
      { code: '781', name: 'Reprises sur amortissements des immobilisations', type: 'revenue' as const },
      { code: '786', name: 'Reprises sur provisions pour risques et charges', type: 'revenue' as const },
    ],
  },

  // CLASSE 8 : RÉSULTATS
  {
    code: '80',
    name: 'RÉSULTATS',
    type: 'equity' as const,
    category: '8' as const,
    children: [
      { code: '801', name: 'Résultat d\'exploitation', type: 'equity' as const },
      { code: '807', name: 'Résultat financier', type: 'equity' as const },
      { code: '809', name: 'Résultat exceptionnel', type: 'equity' as const },
      { code: '890', name: 'Bénéfice', type: 'equity' as const },
      { code: '891', name: 'Perte', type: 'equity' as const },
    ],
  },
];

/**
 * Fonction récursive pour créer les comptes avec leur hiérarchie
 */
async function createAccountRecursive(
  companyId: string,
  accountData: any,
  parentId: string | null = null
): Promise<string> {
  const { code, name, type, category, children, ...rest } = accountData;

  // Créer le compte
  const account = await prisma.account.upsert({
    where: {
      companyId_code: {
        companyId,
        code,
      },
    },
    update: {
      name,
      type,
      category,
      parentId,
      ...rest,
    },
    create: {
      companyId,
      code,
      name,
      type,
      category,
      parentId,
      isActive: true,
      balance: new Prisma.Decimal(0),
      ...rest,
    },
  });

  // Créer les enfants récursivement
  if (children && children.length > 0) {
    for (const child of children) {
      await createAccountRecursive(companyId, child, account.id);
    }
  }

  return account.id;
}

async function main() {
  console.log('🌱 Seeding plan comptable RDC...');

  // Récupérer toutes les entreprises
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });

  if (companies.length === 0) {
    console.log('⚠️  Aucune entreprise trouvée. Créez d\'abord une entreprise.');
    return;
  }

  for (const company of companies) {
    console.log(`\n📊 Création du plan comptable pour: ${company.name}`);

    let createdCount = 0;
    for (const accountData of rdcChartOfAccounts) {
      await createAccountRecursive(company.id, accountData);
      createdCount++;
    }

    console.log(`✅ ${createdCount} comptes principaux créés pour ${company.name}`);
  }

  console.log('\n🎉 Seeding plan comptable terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

