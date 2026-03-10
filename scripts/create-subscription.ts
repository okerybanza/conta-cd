/**
 * Script pour créer un abonnement Essential avec expenses et accounting activés
 */

import '../backend/src/config/env';
import prisma from '../backend/src/config/database';

async function main() {
  console.log('🔍 Création d\'abonnement Essential...\n');

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

  // Trouver ou créer le package Essential
  let essentialPackage = await prisma.package.findUnique({
    where: { code: 'essential' },
  });

  if (!essentialPackage) {
    console.log('📦 Création du package Essential...');
    essentialPackage = await prisma.package.create({
      data: {
        code: 'essential',
        name: 'Conta Essentiel',
        description: 'La facturation simple et professionnelle pour démarrer votre activité',
        price: 9900,
        currency: 'CDF',
        billingCycle: 'monthly',
        limits: {
          customers: 50,
          products: 100,
          users: 1,
          emails_per_month: 50,
          sms_per_month: 0,
          suppliers: 0,
          storage_mb: 500,
          invoices: null,
          expenses: null, // Illimité pour le développement
          recurring_invoices: 0,
        },
        features: {
          expenses: true, // Activé pour le développement
          accounting: true, // Activé pour le développement
          recurring_invoices: false,
          api: false,
          custom_templates: false,
          multi_currency: false,
          advanced_reports: false,
          workflows: false,
          custom_branding: false,
        },
        isActive: true,
        displayOrder: 1,
      },
    });
    console.log('✅ Package Essential créé\n');
  } else {
    // Mettre à jour le package pour activer expenses et accounting
    const features = (essentialPackage.features as any) || {};
    const needsUpdate = !features.expenses || !features.accounting;
    
    if (needsUpdate) {
      console.log('🔧 Activation des fonctionnalités expenses et accounting dans le package Essential...');
      essentialPackage = await prisma.package.update({
        where: { id: essentialPackage.id },
        data: {
          features: {
            ...features,
            expenses: true,
            accounting: true,
          },
        },
      });
      console.log('✅ Fonctionnalités expenses et accounting activées\n');
    }
  }

  // Créer les abonnements pour les entreprises qui n'en ont pas
  for (const company of companies) {
    if (!company.subscription) {
      console.log(`🏢 Création d'abonnement pour: ${company.name}`);
      
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

      console.log(`✅ Abonnement créé: ${subscription.package.name} (${subscription.status})\n`);
    } else {
      console.log(`✅ ${company.name} a déjà un abonnement: ${company.subscription.package.name}\n`);
    }
  }

  console.log('🎉 Terminé !\n');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

