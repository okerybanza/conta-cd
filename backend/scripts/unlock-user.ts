import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

async function unlockUser(email: string) {
  try {
    const user = await prisma.users.findFirst({
      where: { email },
    });

    if (!user) {
      console.error(`Utilisateur avec l'email ${email} non trouvé`);
      process.exit(1);
    }

    await prisma.users.update({
      where: { id: user.id },
      data: {
        locked_until: null,
        failed_login_attempts: 0,
      },
    });

    console.log(`✅ Compte déverrouillé pour ${email}`);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: ts-node scripts/unlock-user.ts <email>');
  process.exit(1);
}

unlockUser(email);
