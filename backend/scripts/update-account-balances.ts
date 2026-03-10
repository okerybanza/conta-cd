/**
 * Script pour recalculer et mettre à jour les soldes de tous les comptes
 * basé sur les écritures comptables postées
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import prisma from '../src/config/database';
import { Decimal } from '@prisma/client/runtime/library';

async function updateAccountBalances(companyId: string) {
  console.log(`\n=== Mise à jour des soldes pour l'entreprise ${companyId} ===`);

  // Récupérer tous les comptes actifs
  const accounts = await prisma.account.findMany({
    where: {
      companyId,
      isActive: true,
    },
  });

  console.log(`📊 Comptes à mettre à jour: ${accounts.length}`);

  let updatedCount = 0;

  for (const account of accounts) {
    // Récupérer toutes les lignes d'écriture pour ce compte (écritures postées uniquement)
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        accountId: account.id,
        journalEntry: {
          companyId,
          status: 'posted',
        },
      },
    });

    // Calculer le solde selon le type de compte
    let balance = 0;

    for (const line of lines) {
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      // Pour les comptes d'actif et de charges : débit augmente, crédit diminue
      // Pour les comptes de passif, capitaux et produits : crédit augmente, débit diminue
      if (account.type === 'asset' || account.type === 'expense') {
        balance += debit - credit;
      } else {
        balance += credit - debit;
      }
    }

    // Mettre à jour le solde du compte
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: new Decimal(balance) },
    });

    if (balance !== 0) {
      updatedCount++;
      if (updatedCount <= 10) {
        console.log(`  ✅ ${account.code} (${account.name}): ${balance.toLocaleString('fr-FR')} CDF`);
      }
    }
  }

  console.log(`\n✅ ${updatedCount} comptes avec solde non nul mis à jour`);
  return updatedCount;
}

async function main() {
  console.log('🔄 Recalcul des soldes de tous les comptes...\n');

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });

  console.log(`🏢 Sociétés trouvées: ${companies.length}\n`);

  for (const company of companies) {
    console.log(`\n📊 Entreprise: ${company.name}`);
    await updateAccountBalances(company.id);
  }

  console.log('\n🎉 Mise à jour des soldes terminée !');
}

main()
  .catch((err) => {
    console.error('❌ Erreur lors de la mise à jour des soldes:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

