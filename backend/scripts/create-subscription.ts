import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const prisma = new PrismaClient();

async function createSubscription(email: string) {
  try {
    const user = await prisma.users.findFirst({
      where: { email },
    });

    if (!user || !user.company_id) {
      console.error(`Utilisateur ou entreprise non trouvé pour ${email}`);
      process.exit(1);
    }

    // Trouver un package avec la fonctionnalité accounting
    const packages = await prisma.packages.findMany({
      where: {
        is_active: true,
      },
    });

    // Chercher un package avec accounting activé
    let selectedPackage = packages.find(pkg => {
      const features = pkg.features as any;
      return features?.accounting === true;
    });

    // Si aucun package avec accounting, prendre le premier package actif
    if (!selectedPackage) {
      selectedPackage = packages[0];
      console.log(`⚠️  Aucun package avec accounting trouvé, utilisation du package: ${selectedPackage?.name}`);
    }

    if (!selectedPackage) {
      console.error('Aucun package actif trouvé');
      process.exit(1);
    }

    console.log(`Création d'un abonnement avec le package: ${selectedPackage.name} (${selectedPackage.id})`);

    // Vérifier qu'il n'y a pas déjà un abonnement
    const existing = await prisma.subscriptions.findUnique({
      where: { company_id: user.company_id },
    });

    if (existing) {
      console.log(`⚠️  Un abonnement existe déjà. Mise à jour du statut à 'active'...`);
      await prisma.subscriptions.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          package_id: selectedPackage.id,
          updated_at: new Date(),
        },
      });
      console.log(`✅ Abonnement mis à jour`);
    } else {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const subscription = await prisma.subscriptions.create({
        data: {
          id: randomUUID(),
          company_id: user.company_id,
          package_id: selectedPackage.id,
          status: 'active',
          billing_cycle: 'monthly',
          start_date: startDate,
          end_date: endDate,
          next_payment_date: endDate,
          updated_at: new Date(),
        },
      });

      console.log(`✅ Abonnement créé: ${subscription.id}`);
      console.log(`Status: ${subscription.status}`);
    }
  } catch (error: any) {
    console.error('Erreur:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: ts-node scripts/create-subscription.ts <email>');
  process.exit(1);
}

createSubscription(email);
