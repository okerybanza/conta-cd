import 'dotenv/config';
import prisma from '../src/config/database';

async function checkEmailStatus(email: string) {
  console.log(`\n🔍 Vérification de l'email: ${email}\n`);
  
  // 1. Vérifier si un compte actif existe
  const activeUser = await prisma.users.findFirst({
    where: {
      email,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      created_at: true,
      email_verified: true,
    },
  });

  if (activeUser) {
    console.log('❌ Compte ACTIF trouvé:');
    console.log(JSON.stringify(activeUser, null, 2));
    return { status: 'active', user: activeUser };
  }

  // 2. Chercher un compte supprimé
  const deletedUsers = await prisma.users.findMany({
    where: {
      deleted_at: { not: null },
      email: { startsWith: 'deleted_' },
    },
    select: {
      id: true,
      email: true,
      deleted_at: true,
      preferences: true,
    },
  });

  for (const user of deletedUsers) {
    const prefs = user.preferences as any;
    if (prefs?.deletedAccount?.originalEmail === email) {
      const gracePeriodEnd = new Date(prefs.deletedAccount.gracePeriodEnd);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log('📦 Compte SUPPRIMÉ trouvé:');
      console.log({
        id: user.id,
        deletedAt: prefs.deletedAccount.deletedAt,
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        canRestore: prefs.deletedAccount.canRestore && gracePeriodEnd > now,
        anonymized: prefs.deletedAccount.anonymized || false,
      });

      if (gracePeriodEnd > now) {
        return { 
          status: 'deleted_grace_period', 
          daysRemaining,
          canRestore: true,
          user 
        };
      } else {
        return { 
          status: 'deleted_grace_expired', 
          canReuse: true,
          user 
        };
      }
    }
  }

  console.log('✅ Aucun compte trouvé - Email disponible pour inscription');
  return { status: 'available', canReuse: true };
}

const email = process.argv[2] || 'okerytop11@gmail.com';
checkEmailStatus(email)
  .then((result) => {
    console.log('\n📊 Résultat:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
