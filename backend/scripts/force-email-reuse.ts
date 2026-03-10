import 'dotenv/config';
import prisma from '../src/config/database';
import accountDeletionService from '../src/services/account-deletion.service';

async function forceEmailReuse(email: string) {
  console.log(`\n🔧 Forcer la réutilisation de l'email: ${email}\n`);
  
  // Trouver le compte supprimé
  const deletedUsers = await prisma.users.findMany({
    where: {
      deleted_at: { not: null },
      email: { startsWith: 'deleted_' },
    },
    select: {
      id: true,
      email: true,
      preferences: true,
    },
  });

  let found = false;
  for (const user of deletedUsers) {
    const prefs = user.preferences as any;
    if (prefs?.deletedAccount?.originalEmail === email) {
      found = true;
      console.log('📦 Compte supprimé trouvé:', user.id);
      
      // Forcer l'expiration de la période de grâce (mettre une date passée)
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Hier

      await prisma.users.update({
        where: { id: user.id },
        data: {
          preferences: {
            ...prefs,
            deletedAccount: {
              ...prefs.deletedAccount,
              gracePeriodEnd: expiredDate.toISOString(),
            },
          },
        },
      });

      console.log('✅ Période de grâce expirée manuellement');
      
      // Vérifier que l'email peut maintenant être réutilisé
      const canReuse = await accountDeletionService.canReuseEmail(email);
      console.log('\n📊 Vérification de la réutilisation:');
      console.log(JSON.stringify(canReuse, null, 2));
      
      if (canReuse.canReuse) {
        console.log('\n✅ L\'email peut maintenant être réutilisé pour une nouvelle inscription!');
      } else {
        console.log('\n⚠️  L\'email ne peut toujours pas être réutilisé:', canReuse.reason);
      }
      
      break;
    }
  }

  if (!found) {
    console.log('❌ Aucun compte supprimé trouvé avec cet email');
  }
}

const email = process.argv[2] || 'okerytop11@gmail.com';
forceEmailReuse(email)
  .then(() => {
    console.log('\n✅ Opération terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
