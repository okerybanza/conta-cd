/**
 * Script pour vérifier et corriger les abonnements
 */

// Charger les variables d'environnement depuis le backend
import '../backend/src/config/env';
import prisma from '../backend/src/config/database';

async function main() {
  console.log('🔍 Vérification des abonnements...\n');

  // Récupérer toutes les entreprises
  const companies = await prisma.company.findMany({
    include: {
      subscription: {
        include: {
          package: true,
        },
      },
    },
  });

  console.log(`📊 Total entreprises: ${companies.length}\n`);

  for (const company of companies) {
    console.log(`\n🏢 Entreprise: ${company.name} (${company.id})`);
    
    if (!company.subscription) {
      console.log('  ⚠️  Pas d\'abonnement actif');
      console.log('  💡 Solution: Créer un abonnement Essential avec expenses activé');
      
      // Trouver le package Essential
      const essentialPackage = await prisma.package.findUnique({
        where: { code: 'essential' },
      });

      if (essentialPackage) {
        console.log('  ✅ Package Essential trouvé, création de l\'abonnement...');
        
        const subscription = await prisma.subscription.create({
          data: {
            companyId: company.id,
            packageId: essentialPackage.id,
            status: 'active',
            billingCycle: 'monthly',
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          },
          include: {
            package: true,
          },
        });

        console.log(`  ✅ Abonnement créé: ${subscription.package.name}`);
      } else {
        console.log('  ❌ Package Essential non trouvé. Exécutez le seed: npm run seed');
      }
    } else {
      const sub = company.subscription;
      const pkg = sub.package;
      const features = (pkg.features as any) || {};
      
      console.log(`  📦 Package: ${pkg.name} (${pkg.code})`);
      console.log(`  📊 Statut: ${sub.status}`);
      console.log(`  💰 Fonctionnalités:`);
      console.log(`     - expenses: ${features.expenses ? '✅' : '❌'}`);
      console.log(`     - accounting: ${features.accounting ? '✅' : '❌'}`);
      console.log(`     - recurring_invoices: ${features.recurring_invoices ? '✅' : '❌'}`);

      if (!features.expenses) {
        console.log('  ⚠️  La fonctionnalité "expenses" n\'est pas activée');
        console.log('  💡 Solution: Mettre à jour le package pour activer expenses');
        
        // Mettre à jour le package pour activer expenses
        const updatedFeatures = {
          ...features,
          expenses: true,
        };

        await prisma.package.update({
          where: { id: pkg.id },
          data: {
            features: updatedFeatures,
          },
        });

        console.log('  ✅ Fonctionnalité "expenses" activée dans le package');
      }
    }
  }

  console.log('\n✅ Vérification terminée\n');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Erreur:', error);
  process.exit(1);
});

