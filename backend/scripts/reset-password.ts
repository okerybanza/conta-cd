import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  try {
    const user = await prisma.users.findFirst({
      where: { email },
    });

    if (!user) {
      console.error(`Utilisateur avec l'email ${email} non trouvé`);
      process.exit(1);
    }

    // Valider le mot de passe
    if (newPassword.length < 8) {
      console.error('Le mot de passe doit contenir au moins 8 caractères');
      process.exit(1);
    }

    if (!/^(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
      console.error('Le mot de passe doit contenir au moins une majuscule et un chiffre');
      process.exit(1);
    }

    // Hasher le nouveau mot de passe
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    const passwordHash = await bcrypt.hash(newPassword, rounds);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        failed_login_attempts: 0,
        locked_until: null,
        password_reset_token: null,
        password_reset_expires_at: null,
      },
    });

    console.log(`✅ Mot de passe réinitialisé pour ${email}`);
    console.log(`Nouveau mot de passe: ${newPassword}`);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: ts-node scripts/reset-password.ts <email> <nouveau_mot_de_passe>');
  console.error('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre');
  process.exit(1);
}

resetPassword(email, password);
