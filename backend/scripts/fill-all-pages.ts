/**
 * Script pour remplir toutes les pages avec du contenu cohérent
 * En tant qu'expert comptable d'entreprise
 */

import prisma from '../src/config/database';
import { Decimal } from '@prisma/client/runtime/library';
import { AccountService } from '../src/services/account.service';
import { FiscalPeriodService } from '../src/services/fiscalPeriod.service';
import { JournalEntryService } from '../src/services/journalEntry.service';
import { RecurringInvoiceService } from '../src/services/recurringInvoice.service';
import { DepreciationService } from '../src/services/depreciation.service';

const accountService = new AccountService();
const fiscalPeriodService = new FiscalPeriodService();
const journalEntryService = new JournalEntryService();
const recurringInvoiceService = new RecurringInvoiceService();
const depreciationService = new DepreciationService();

// Plan comptable complet (Système Comptable OHADA)
const CHART_OF_ACCOUNTS = [
  // Classe 1: Financement Permanent
  { code: '10', name: 'CAPITAUX', type: 'equity' as const, category: '1' as const, parentId: null },
  { code: '101', name: 'Capital social', type: 'equity' as const, category: '1' as const, parentCode: '10' },
  { code: '1011', name: 'Capital souscrit non appelé', type: 'equity' as const, category: '1' as const, parentCode: '101' },
  { code: '1012', name: 'Capital souscrit appelé non versé', type: 'equity' as const, category: '1' as const, parentCode: '101' },
  { code: '1013', name: 'Capital souscrit appelé versé', type: 'equity' as const, category: '1' as const, parentCode: '101' },
  { code: '11', name: 'RÉSERVES', type: 'equity' as const, category: '1' as const, parentId: null },
  { code: '111', name: 'Réserves légales', type: 'equity' as const, category: '1' as const, parentCode: '11' },
  { code: '112', name: 'Réserves statutaires', type: 'equity' as const, category: '1' as const, parentCode: '11' },
  { code: '12', name: 'RÉSULTAT', type: 'equity' as const, category: '1' as const, parentId: null },
  { code: '120', name: 'Résultat de l\'exercice', type: 'equity' as const, category: '1' as const, parentCode: '12' },
  { code: '13', name: 'SUBVENTIONS D\'INVESTISSEMENT', type: 'equity' as const, category: '1' as const, parentId: null },
  { code: '131', name: 'Subventions d\'équipement', type: 'equity' as const, category: '1' as const, parentCode: '13' },
  { code: '14', name: 'PROVISIONS POUR RISQUES ET CHARGES', type: 'liability' as const, category: '1' as const, parentId: null },
  { code: '141', name: 'Provisions pour litiges', type: 'liability' as const, category: '1' as const, parentCode: '14' },
  { code: '15', name: 'DETTES DE FINANCEMENT', type: 'liability' as const, category: '1' as const, parentId: null },
  { code: '151', name: 'Emprunts obligataires', type: 'liability' as const, category: '1' as const, parentCode: '15' },
  { code: '152', name: 'Emprunts auprès des établissements de crédit', type: 'liability' as const, category: '1' as const, parentCode: '15' },
  { code: '16', name: 'DETTES D\'EXPLOITATION', type: 'liability' as const, category: '1' as const, parentId: null },
  { code: '161', name: 'Dettes sur acquisitions d\'immobilisations', type: 'liability' as const, category: '1' as const, parentCode: '16' },
  
  // Classe 2: Actif Immobilisé
  { code: '20', name: 'IMMOBILISATIONS INCORPORELLES', type: 'asset' as const, category: '2' as const, parentId: null },
  { code: '201', name: 'Frais d\'établissement', type: 'asset' as const, category: '2' as const, parentCode: '20' },
  { code: '202', name: 'Frais de recherche et développement', type: 'asset' as const, category: '2' as const, parentCode: '20' },
  { code: '21', name: 'IMMOBILISATIONS CORPORELLES', type: 'asset' as const, category: '2' as const, parentId: null },
  { code: '211', name: 'Terrains', type: 'asset' as const, category: '2' as const, parentCode: '21' },
  { code: '212', name: 'Constructions', type: 'asset' as const, category: '2' as const, parentCode: '21' },
  { code: '213', name: 'Installations techniques, matériel et outillage', type: 'asset' as const, category: '2' as const, parentCode: '21' },
  { code: '214', name: 'Matériel de transport', type: 'asset' as const, category: '2' as const, parentCode: '21' },
  { code: '215', name: 'Matériel de bureau et matériel informatique', type: 'asset' as const, category: '2' as const, parentCode: '21' },
  { code: '216', name: 'Mobilier', type: 'asset' as const, category: '2' as const, parentCode: '21' },
  { code: '218', name: 'Autres immobilisations corporelles', type: 'asset' as const, category: '2' as const, parentCode: '21' },
  { code: '28', name: 'AMORTISSEMENTS DES IMMOBILISATIONS', type: 'asset' as const, category: '2' as const, parentId: null },
  { code: '281', name: 'Amortissements des terrains', type: 'asset' as const, category: '2' as const, parentCode: '28' },
  { code: '2813', name: 'Amortissements des installations techniques', type: 'asset' as const, category: '2' as const, parentCode: '281' },
  { code: '2814', name: 'Amortissements du matériel de transport', type: 'asset' as const, category: '2' as const, parentCode: '281' },
  { code: '2815', name: 'Amortissements du matériel de bureau', type: 'asset' as const, category: '2' as const, parentCode: '281' },
  { code: '2816', name: 'Amortissements du mobilier', type: 'asset' as const, category: '2' as const, parentCode: '281' },
  { code: '22', name: 'IMMOBILISATIONS FINANCIÈRES', type: 'asset' as const, category: '2' as const, parentId: null },
  { code: '221', name: 'Titres de participation', type: 'asset' as const, category: '2' as const, parentCode: '22' },
  
  // Classe 3: Stocks
  { code: '30', name: 'MARCHANDISES', type: 'asset' as const, category: '3' as const, parentId: null },
  { code: '301', name: 'Marchandises', type: 'asset' as const, category: '3' as const, parentCode: '30' },
  { code: '31', name: 'MATIÈRES PREMIÈRES', type: 'asset' as const, category: '3' as const, parentId: null },
  { code: '311', name: 'Matières premières', type: 'asset' as const, category: '3' as const, parentCode: '31' },
  { code: '37', name: 'STOCKS DE PRODUITS', type: 'asset' as const, category: '3' as const, parentId: null },
  { code: '371', name: 'Produits finis', type: 'asset' as const, category: '3' as const, parentCode: '37' },
  
  // Classe 4: Tiers
  { code: '40', name: 'FOURNISSEURS ET COMPTES RATTACHÉS', type: 'liability' as const, category: '4' as const, parentId: null },
  { code: '401', name: 'Fournisseurs', type: 'liability' as const, category: '4' as const, parentCode: '40' },
  { code: '41', name: 'CLIENTS ET COMPTES RATTACHÉS', type: 'asset' as const, category: '4' as const, parentId: null },
  { code: '411', name: 'Clients', type: 'asset' as const, category: '4' as const, parentCode: '41' },
  { code: '42', name: 'PERSONNEL ET COMPTES RATTACHÉS', type: 'liability' as const, category: '4' as const, parentId: null },
  { code: '421', name: 'Personnel - Rémunérations dues', type: 'liability' as const, category: '4' as const, parentCode: '42' },
  { code: '43', name: 'SÉCURITÉ SOCIALE ET AUTRES ORGANISMES', type: 'liability' as const, category: '4' as const, parentId: null },
  { code: '431', name: 'Sécurité sociale - Charges à payer', type: 'liability' as const, category: '4' as const, parentCode: '43' },
  { code: '44', name: 'ÉTAT ET AUTRES COLLECTIVITÉS PUBLIQUES', type: 'liability' as const, category: '4' as const, parentId: null },
  { code: '445', name: 'État - TVA', type: 'liability' as const, category: '4' as const, parentId: null },
  { code: '4455', name: 'TVA à décaisser', type: 'liability' as const, category: '4' as const, parentCode: '445' },
  { code: '445660', name: 'TVA déductible', type: 'asset' as const, category: '4' as const, parentCode: '445' },
  { code: '445670', name: 'TVA collectée', type: 'liability' as const, category: '4' as const, parentCode: '445' },
  { code: '45', name: 'GROUPES ET ASSOCIÉS', type: 'asset' as const, category: '4' as const, parentId: null },
  { code: '451', name: 'Associés - Comptes courants', type: 'asset' as const, category: '4' as const, parentCode: '45' },
  { code: '46', name: 'DÉBITEURS ET CRÉDITEURS DIVERS', type: 'asset' as const, category: '4' as const, parentId: null },
  { code: '461', name: 'Débiteurs divers', type: 'asset' as const, category: '4' as const, parentCode: '46' },
  { code: '467', name: 'Créanciers divers', type: 'liability' as const, category: '4' as const, parentCode: '46' },
  
  // Classe 5: Trésorerie
  { code: '50', name: 'VALEURS MOBILIÈRES DE PLACEMENT', type: 'asset' as const, category: '5' as const, parentId: null },
  { code: '501', name: 'Valeurs mobilières de placement', type: 'asset' as const, category: '5' as const, parentCode: '50' },
  { code: '51', name: 'BANQUES, ÉTABLISSEMENTS FINANCIERS ET ASSIMILÉS', type: 'asset' as const, category: '5' as const, parentId: null },
  { code: '512', name: 'Banques', type: 'asset' as const, category: '5' as const, parentCode: '51' },
  { code: '53', name: 'CAISSE', type: 'asset' as const, category: '5' as const, parentId: null },
  { code: '531', name: 'Caisse', type: 'asset' as const, category: '5' as const, parentCode: '53' },
  { code: '54', name: 'RÉGIES D\'AVANCES ET D\'ACCORDÉS', type: 'asset' as const, category: '5' as const, parentId: null },
  { code: '541', name: 'Régies d\'avances', type: 'asset' as const, category: '5' as const, parentCode: '54' },
  
  // Classe 6: Charges
  { code: '60', name: 'ACHATS', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '601', name: 'Achats de marchandises', type: 'expense' as const, category: '6' as const, parentCode: '60' },
  { code: '602', name: 'Achats de matières premières', type: 'expense' as const, category: '6' as const, parentCode: '60' },
  { code: '606', name: 'Achats de fournitures', type: 'expense' as const, category: '6' as const, parentCode: '60' },
  { code: '61', name: 'SERVICES EXTÉRIEURS', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '611', name: 'Sous-traitance', type: 'expense' as const, category: '6' as const, parentCode: '61' },
  { code: '612', name: 'Redevances de crédit-bail', type: 'expense' as const, category: '6' as const, parentCode: '61' },
  { code: '613', name: 'Locations', type: 'expense' as const, category: '6' as const, parentCode: '61' },
  { code: '614', name: 'Charges locatives et de copropriété', type: 'expense' as const, category: '6' as const, parentCode: '61' },
  { code: '615', name: 'Entretien et réparations', type: 'expense' as const, category: '6' as const, parentCode: '61' },
  { code: '616', name: 'Primes d\'assurance', type: 'expense' as const, category: '6' as const, parentCode: '61' },
  { code: '617', name: 'Études et recherches', type: 'expense' as const, category: '6' as const, parentCode: '61' },
  { code: '618', name: 'Divers', type: 'expense' as const, category: '6' as const, parentCode: '61' },
  { code: '62', name: 'AUTRES SERVICES EXTÉRIEURS', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '621', name: 'Personnel extérieur à l\'entreprise', type: 'expense' as const, category: '6' as const, parentCode: '62' },
  { code: '622', name: 'Rémunérations d\'intermédiaires et honoraires', type: 'expense' as const, category: '6' as const, parentCode: '62' },
  { code: '623', name: 'Publicité, publications et relations publiques', type: 'expense' as const, category: '6' as const, parentCode: '62' },
  { code: '624', name: 'Transports de biens et transports collectifs du personnel', type: 'expense' as const, category: '6' as const, parentCode: '62' },
  { code: '625', name: 'Déplacements, missions et réceptions', type: 'expense' as const, category: '6' as const, parentCode: '62' },
  { code: '626', name: 'Services bancaires et assimilés', type: 'expense' as const, category: '6' as const, parentCode: '62' },
  { code: '627', name: 'Services et prestations connexes', type: 'expense' as const, category: '6' as const, parentCode: '62' },
  { code: '628', name: 'Autres charges externes', type: 'expense' as const, category: '6' as const, parentCode: '62' },
  { code: '63', name: 'IMPÔTS, TAXES ET VERSEMENTS ASSIMILÉS', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '631', name: 'Impôts, taxes et versements assimilés sur rémunérations', type: 'expense' as const, category: '6' as const, parentCode: '63' },
  { code: '635', name: 'Autres impôts, taxes et versements assimilés', type: 'expense' as const, category: '6' as const, parentCode: '63' },
  { code: '64', name: 'CHARGES DE PERSONNEL', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '641', name: 'Salaires', type: 'expense' as const, category: '6' as const, parentCode: '64' },
  { code: '645', name: 'Charges sociales', type: 'expense' as const, category: '6' as const, parentCode: '64' },
  { code: '65', name: 'AUTRES CHARGES DE GESTION COURANTE', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '651', name: 'Redevances pour concessions, brevets, licences', type: 'expense' as const, category: '6' as const, parentCode: '65' },
  { code: '66', name: 'CHARGES FINANCIÈRES', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '661', name: 'Charges d\'intérêts', type: 'expense' as const, category: '6' as const, parentCode: '66' },
  { code: '67', name: 'CHARGES EXCEPTIONNELLES', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '671', name: 'Charges exceptionnelles sur opérations de gestion', type: 'expense' as const, category: '6' as const, parentCode: '67' },
  { code: '68', name: 'DOTATIONS AUX AMORTISSEMENTS', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '681', name: 'Dotations aux amortissements sur immobilisations incorporelles', type: 'expense' as const, category: '6' as const, parentCode: '68' },
  { code: '6813', name: 'Dotations aux amortissements des installations techniques', type: 'expense' as const, category: '6' as const, parentCode: '681' },
  { code: '6814', name: 'Dotations aux amortissements du matériel de transport', type: 'expense' as const, category: '6' as const, parentCode: '681' },
  { code: '6815', name: 'Dotations aux amortissements du matériel de bureau', type: 'expense' as const, category: '6' as const, parentCode: '681' },
  { code: '6816', name: 'Dotations aux amortissements du mobilier', type: 'expense' as const, category: '6' as const, parentCode: '681' },
  { code: '69', name: 'PROVISIONS POUR RISQUES ET CHARGES', type: 'expense' as const, category: '6' as const, parentId: null },
  { code: '691', name: 'Provisions pour risques', type: 'expense' as const, category: '6' as const, parentCode: '69' },
  
  // Classe 7: Produits
  { code: '70', name: 'VENTES', type: 'revenue' as const, category: '7' as const, parentId: null },
  { code: '701', name: 'Ventes de produits finis', type: 'revenue' as const, category: '7' as const, parentCode: '70' },
  { code: '702', name: 'Ventes de produits intermédiaires', type: 'revenue' as const, category: '7' as const, parentCode: '70' },
  { code: '703', name: 'Ventes de produits résiduels', type: 'revenue' as const, category: '7' as const, parentCode: '70' },
  { code: '706', name: 'Prestations de services', type: 'revenue' as const, category: '7' as const, parentCode: '70' },
  { code: '71', name: 'PRODUCTION STOCKÉE', type: 'revenue' as const, category: '7' as const, parentId: null },
  { code: '711', name: 'Variation des stocks de produits', type: 'revenue' as const, category: '7' as const, parentCode: '71' },
  { code: '74', name: 'SUBVENTIONS D\'EXPLOITATION', type: 'revenue' as const, category: '7' as const, parentId: null },
  { code: '741', name: 'Subventions d\'exploitation', type: 'revenue' as const, category: '7' as const, parentCode: '74' },
  { code: '75', name: 'AUTRES PRODUITS DE GESTION COURANTE', type: 'revenue' as const, category: '7' as const, parentId: null },
  { code: '751', name: 'Produits des activités annexes', type: 'revenue' as const, category: '7' as const, parentCode: '75' },
  { code: '76', name: 'PRODUITS FINANCIERS', type: 'revenue' as const, category: '7' as const, parentId: null },
  { code: '761', name: 'Produits de participations', type: 'revenue' as const, category: '7' as const, parentCode: '76' },
  { code: '762', name: 'Produits des autres valeurs mobilières et créances', type: 'revenue' as const, category: '7' as const, parentCode: '76' },
  { code: '77', name: 'PRODUITS EXCEPTIONNELS', type: 'revenue' as const, category: '7' as const, parentId: null },
  { code: '771', name: 'Produits exceptionnels sur opérations de gestion', type: 'revenue' as const, category: '7' as const, parentCode: '77' },
  { code: '78', name: 'REPRISES SUR PROVISIONS ET AMORTISSEMENTS', type: 'revenue' as const, category: '7' as const, parentId: null },
  { code: '781', name: 'Reprises sur amortissements', type: 'revenue' as const, category: '7' as const, parentCode: '78' },
  
  // Classe 8: Résultats
  { code: '80', name: 'RÉSULTATS', type: 'equity' as const, category: '8' as const, parentId: null },
  { code: '801', name: 'Résultat d\'exploitation', type: 'equity' as const, category: '8' as const, parentCode: '80' },
  { code: '802', name: 'Résultat financier', type: 'equity' as const, category: '8' as const, parentCode: '80' },
  { code: '803', name: 'Résultat exceptionnel', type: 'equity' as const, category: '8' as const, parentCode: '80' },
  { code: '890', name: 'BÉNÉFICE', type: 'equity' as const, category: '8' as const, parentCode: '80' },
  { code: '891', name: 'PERTE', type: 'equity' as const, category: '8' as const, parentCode: '80' },
];

async function createChartOfAccounts(companyId: string) {
  console.log('📊 Création du plan comptable...');
  
  const accountMap = new Map<string, string>(); // code -> id
  
  // Créer les comptes racines d'abord
  for (const accountData of CHART_OF_ACCOUNTS) {
    if (!accountData.parentCode && !accountData.parentId) {
      try {
        const account = await accountService.create(companyId, {
          code: accountData.code,
          name: accountData.name,
          type: accountData.type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
          category: accountData.category,
          parentId: undefined,
        });
        accountMap.set(accountData.code, account.id);
        console.log(`  ✓ ${accountData.code} - ${accountData.name}`);
      } catch (error: any) {
        if (error.code !== 'ACCOUNT_CODE_EXISTS') {
          console.error(`  ✗ Erreur pour ${accountData.code}: ${error.message}`);
        }
      }
    }
  }
  
  // Créer les comptes enfants
  for (const accountData of CHART_OF_ACCOUNTS) {
    if (accountData.parentCode) {
      const parentId = accountMap.get(accountData.parentCode);
      if (parentId) {
        try {
          const account = await accountService.create(companyId, {
            code: accountData.code,
            name: accountData.name,
            type: accountData.type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
            category: accountData.category,
            parentId,
          });
          accountMap.set(accountData.code, account.id);
          console.log(`  ✓ ${accountData.code} - ${accountData.name} (parent: ${accountData.parentCode})`);
        } catch (error: any) {
          if (error.code !== 'ACCOUNT_CODE_EXISTS') {
            console.error(`  ✗ Erreur pour ${accountData.code}: ${error.message}`);
          }
        }
      }
    }
  }
  
  console.log(`✅ Plan comptable créé (${accountMap.size} comptes)\n`);
  return accountMap;
}

async function createFiscalPeriods(companyId: string) {
  console.log('📅 Création des exercices comptables...');
  
  const periods = [
    {
      name: 'Exercice 2024',
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 11, 31),
      notes: 'Exercice comptable 2024',
    },
    {
      name: 'Exercice 2023',
      startDate: new Date(2023, 0, 1),
      endDate: new Date(2023, 11, 31),
      notes: 'Exercice comptable 2023 (clos)',
    },
  ];
  
  const createdPeriods = [];
  for (const periodData of periods) {
    try {
      const period = await fiscalPeriodService.create(companyId, periodData);
      createdPeriods.push(period);
      console.log(`  ✓ ${period.name} (${periodData.startDate.toLocaleDateString()} - ${periodData.endDate.toLocaleDateString()})`);
    } catch (error: any) {
      if (error.code !== 'OVERLAPPING_PERIOD') {
        console.error(`  ✗ Erreur pour ${periodData.name}: ${error.message}`);
      }
    }
  }
  
  // Clore l'exercice 2023
  if (createdPeriods.length > 1) {
    try {
      await fiscalPeriodService.close(companyId, createdPeriods[1].id, createdPeriods[1].id);
      console.log(`  ✓ Exercice 2023 clos`);
    } catch (error: any) {
      console.error(`  ✗ Erreur lors de la clôture: ${error.message}`);
    }
  }
  
  console.log(`✅ ${createdPeriods.length} exercices créés\n`);
  return createdPeriods;
}

async function createJournalEntries(companyId: string, userId: string, accountMap: Map<string, string>) {
  console.log('📝 Création des écritures comptables...');
  
  const entries: any[] = [];
  
  // Récupérer les comptes nécessaires
  const caisseId = accountMap.get('531');
  const banqueId = accountMap.get('512');
  const clientsId = accountMap.get('411');
  const ventesId = accountMap.get('706');
  const tvaCollecteeId = accountMap.get('445670');
  const fournisseursId = accountMap.get('401');
  const achatsId = accountMap.get('601');
  const tvaDeductibleId = accountMap.get('445660');
  
  if (!caisseId || !banqueId || !clientsId || !ventesId || !tvaCollecteeId) {
    console.log('  ⚠️ Comptes manquants, création d\'écritures limitée');
    return entries;
  }
  
  // Créer quelques écritures manuelles pour l'année 2024
  const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  
  for (const month of months) {
    // Écriture de vente
    if (clientsId && ventesId && tvaCollecteeId) {
      const amountHt = Math.floor(Math.random() * 5000000) + 1000000;
      const tva = amountHt * 0.16;
      const amountTtc = amountHt + tva;
      
      try {
        const entry = await journalEntryService.create(companyId, {
          entryDate: new Date(2024, month, Math.floor(Math.random() * 28) + 1),
          description: `Vente de services - ${new Date(2024, month).toLocaleDateString('fr-FR', { month: 'long' })}`,
          sourceType: 'manual',
          lines: [
            {
              accountId: clientsId,
              description: 'Client - Vente de services',
              debit: amountTtc,
              credit: 0,
              currency: 'CDF',
            },
            {
              accountId: ventesId,
              description: 'Ventes de services',
              debit: 0,
              credit: amountHt,
              currency: 'CDF',
            },
            {
              accountId: tvaCollecteeId,
              description: 'TVA collectée',
              debit: 0,
              credit: tva,
              currency: 'CDF',
            },
          ],
          createdBy: userId,
        });
        
        // Poster l'écriture
        await journalEntryService.post(companyId, entry.id);
        entries.push(entry);
      } catch (error: any) {
        console.error(`  ✗ Erreur écriture vente: ${error.message}`);
      }
    }
    
    // Écriture d'achat
    if (fournisseursId && achatsId && tvaDeductibleId) {
      const amountHt = Math.floor(Math.random() * 2000000) + 500000;
      const tva = amountHt * 0.16;
      const amountTtc = amountHt + tva;
      
      try {
        const entry = await journalEntryService.create(companyId, {
          entryDate: new Date(2024, month, Math.floor(Math.random() * 28) + 1),
          description: `Achat de marchandises - ${new Date(2024, month).toLocaleDateString('fr-FR', { month: 'long' })}`,
          sourceType: 'manual',
          lines: [
            {
              accountId: achatsId,
              description: 'Achats de marchandises',
              debit: amountHt,
              credit: 0,
              currency: 'CDF',
            },
            {
              accountId: tvaDeductibleId,
              description: 'TVA déductible',
              debit: tva,
              credit: 0,
              currency: 'CDF',
            },
            {
              accountId: fournisseursId,
              description: 'Fournisseur',
              debit: 0,
              credit: amountTtc,
              currency: 'CDF',
            },
          ],
          createdBy: userId,
        });
        
        // Poster l'écriture
        await journalEntryService.post(companyId, entry.id);
        entries.push(entry);
      } catch (error: any) {
        console.error(`  ✗ Erreur écriture achat: ${error.message}`);
      }
    }
  }
  
  console.log(`✅ ${entries.length} écritures comptables créées\n`);
  return entries;
}

async function createRecurringInvoices(companyId: string, userId: string) {
  console.log('🔄 Création des factures récurrentes...');
  
  // Récupérer les clients et produits
  const customers = await prisma.customer.findMany({
    where: { companyId, deletedAt: null },
    take: 5,
  });
  
  const products = await prisma.product.findMany({
    where: { companyId, isActive: true },
    take: 3,
  });
  
  if (customers.length === 0 || products.length === 0) {
    console.log('  ⚠️ Clients ou produits manquants, création limitée');
    return [];
  }
  
  const recurringInvoices = [];
  
  const frequencies: Array<'monthly' | 'quarterly' | 'yearly'> = ['monthly', 'quarterly', 'yearly'];
  
  for (let i = 0; i < Math.min(5, customers.length); i++) {
    const customer = customers[i];
    const product = products[i % products.length];
    const frequency = frequencies[i % frequencies.length];
    
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 11, 31);
    
    try {
      const recurring = await recurringInvoiceService.create(companyId, userId, {
        customerId: customer.id,
        name: `Facture récurrente - ${product.name}`,
        description: `Facture récurrente pour ${product.name}`,
        frequency,
        interval: 1,
        startDate,
        endDate,
        dueDateDays: 30,
        currency: 'CDF',
        lines: [
          {
            productId: product.id,
            name: product.name,
            description: product.description || product.name,
            quantity: 1,
            unitPrice: Number(product.unitPrice),
            taxRate: product.taxRate ? Number(product.taxRate) : 16,
          },
        ],
        autoSend: false,
        sendToCustomer: false,
      });
      
      recurringInvoices.push(recurring);
      console.log(`  ✓ ${recurring.name} (${frequency})`);
    } catch (error: any) {
      console.error(`  ✗ Erreur facture récurrente: ${error.message}`);
    }
  }
  
  console.log(`✅ ${recurringInvoices.length} factures récurrentes créées\n`);
  return recurringInvoices;
}

async function createDepreciationPlans(companyId: string, userId: string, accountMap: Map<string, string>) {
  console.log('📉 Création des plans d\'amortissement...');
  
  const assetAccountId = accountMap.get('215'); // Matériel de bureau
  const depreciationAccountId = accountMap.get('2815'); // Amortissements du matériel de bureau
  const expenseAccountId = accountMap.get('6815'); // Dotations aux amortissements du matériel de bureau
  
  if (!assetAccountId || !depreciationAccountId || !expenseAccountId) {
    console.log('  ⚠️ Comptes manquants, création limitée');
    return [];
  }
  
  const depreciations = [];
  
  const assets = [
    { name: 'Ordinateurs portables', cost: 8000000, life: 3 },
    { name: 'Serveurs', cost: 15000000, life: 5 },
    { name: 'Imprimantes', cost: 3000000, life: 4 },
    { name: 'Mobilier de bureau', cost: 5000000, life: 10 },
  ];
  
  for (const asset of assets) {
    try {
      const depreciation = await depreciationService.create(companyId, {
        assetAccountId,
        depreciationAccountId: depreciationAccountId,
        assetName: asset.name,
        acquisitionDate: new Date(2024, 0, 1),
        acquisitionCost: asset.cost,
        depreciationMethod: 'linear',
        usefulLife: asset.life,
        notes: `Plan d'amortissement pour ${asset.name}`,
      });
      
      depreciations.push(depreciation);
      console.log(`  ✓ ${depreciation.assetName} (${asset.cost} CDF, ${asset.life} ans)`);
    } catch (error: any) {
      console.error(`  ✗ Erreur plan d'amortissement: ${error.message}`);
    }
  }
  
  console.log(`✅ ${depreciations.length} plans d'amortissement créés\n`);
  return depreciations;
}

async function main() {
  try {
    console.log('🚀 Démarrage du remplissage complet des pages...\n');
    
    // Récupérer toutes les entreprises
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
      include: {
        users: {
          take: 1,
        },
      },
    });
    
    if (companies.length === 0) {
      console.log('❌ Aucune entreprise trouvée');
      return;
    }
    
    for (const company of companies) {
      console.log(`\n📦 Entreprise: ${company.name} (${company.id})\n`);
      
      const userId = company.users[0]?.id;
      if (!userId) {
        console.log('  ⚠️ Aucun utilisateur trouvé pour cette entreprise');
        continue;
      }
      
      // 1. Créer le plan comptable
      const accountMap = await createChartOfAccounts(company.id);
      
      // 2. Créer les exercices comptables
      await createFiscalPeriods(company.id);
      
      // 3. Créer les écritures comptables
      await createJournalEntries(company.id, userId, accountMap);
      
      // 4. Créer les factures récurrentes
      await createRecurringInvoices(company.id, userId);
      
      // 5. Créer les plans d'amortissement
      await createDepreciationPlans(company.id, userId, accountMap);
      
      console.log(`\n✅ Entreprise ${company.name} complétée\n`);
    }
    
    console.log('\n🎉 Remplissage complet terminé!\n');
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

