import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSubscriptionForEmail(email: string) {
  console.log('🔍 Debug abonnement pour utilisateur :', email);

  const user = await prisma.users.findFirst({
    where: {
      email,
      deleted_at: null,
    },
    include: {
      companies: true,
    },
  });

  if (!user) {
    console.log('❌ Utilisateur non trouvé');
    return;
  }

  console.log('👤 Utilisateur:', {
    id: user.id,
    email: user.email,
    company_id: user.company_id,
  });

  if (!user.company_id) {
    console.log('⚠️ Utilisateur sans entreprise associée');
    return;
  }

  // Récupérer la dernière subscription active/trial pour cette entreprise
  const sub = await prisma.subscriptions.findFirst({
    where: {
      company_id: user.company_id,
      status: { in: ['active', 'trial'] },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!sub) {
    console.log('⚠️ Aucune subscription active/trial trouvée pour cette entreprise');
    return;
  }

  console.log('📦 Subscription brute:', {
    id: sub.id,
    status: sub.status,
    package_id: sub.package_id,
    // Le type Prisma ne nous donne pas directement la relation ici
    hasPackageRelation: 'n/a',
  });

  if (sub.package_id) {
    console.log('ℹ️ Vérification manuelle du package_id...');
    const pkg = await prisma.packages.findUnique({
      where: { id: sub.package_id },
    });

    if (!pkg) {
      console.log('❌ Aucun package trouvé avec cet ID, tentative de correction…');

      // Essayer de trouver un package STARTER actif
      const starter = await prisma.packages.findFirst({
        where: {
          code: 'STARTER',
          is_active: true,
        },
      });

      if (!starter) {
        console.log('❌ Aucun package STARTER actif trouvé, impossible de corriger automatiquement.');
        return;
      }

      console.log('🛠️ Mise à jour de la subscription pour utiliser le package STARTER', {
        subscriptionId: sub.id,
        oldPackageId: sub.package_id,
        newPackageId: starter.id,
      });

      await prisma.subscriptions.update({
        where: { id: sub.id },
        data: {
          package_id: starter.id,
          updated_at: new Date(),
        },
      });

      console.log('✅ Subscription mise à jour avec succès.');
    } else {
      console.log('✅ Package trouvé manuellement par ID:', {
        id: pkg.id,
        code: pkg.code,
        name: pkg.name,
        is_active: pkg.is_active,
        billing_cycle: pkg.billing_cycle,
      });
    }
  } else {
    console.log('⚠️ Subscription sans package_id défini.');
  }
}

async function main() {
  try {
    const email = process.argv[2] || 'okerybanza@gmail.com';
    await debugSubscriptionForEmail(email);
  } catch (err) {
    console.error('❌ Erreur dans debug-subscription-package:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

