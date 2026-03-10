import 'dotenv/config';
import prisma from '../src/config/database';
import bcrypt from 'bcrypt';

async function getVerificationCode(email: string) {
  const user = await prisma.users.findFirst({
    where: {
      email,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      email_verification_token: true,
      email_verification_expires_at: true,
      email_verified: true,
    },
  });

  if (!user) {
    console.log('❌ Utilisateur non trouvé');
    return;
  }

  console.log('✅ Utilisateur trouvé:', {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified,
    hasToken: !!user.email_verification_token,
    expiresAt: user.email_verification_expires_at,
  });

  // En mode développement, le code peut être dans la réponse
  // Ici on ne peut pas décrypter le hash, mais on peut vérifier l'état
  if (user.email_verified) {
    console.log('✅ Email déjà vérifié');
  } else if (user.email_verification_token) {
    console.log('📧 Code de vérification présent (hashé dans la BD)');
    console.log('💡 En mode développement, le code devrait être dans la réponse API');
  }
}

getVerificationCode('okerytop11@gmail.com')
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
