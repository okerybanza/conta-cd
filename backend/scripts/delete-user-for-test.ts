import 'dotenv/config';
import prisma from '../src/config/database';
import accountDeletionService from '../src/services/account-deletion.service';

async function deleteUserForTest(email: string) {
  console.log(`\n🗑️  Suppression du compte: ${email}\n`);
  
  // Trouver l'utilisateur
  const user = await prisma.users.findFirst({
    where: {
      email,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
    },
  });

  if (!user) {
    console.log('❌ Aucun compte actif trouvé avec cet email');
    return;
  }

  console.log('📋 Compte trouvé:', JSON.stringify(user, null, 2));
  console.log('\n⚠️  Suppression du compte...\n');

  try {
    // Supprimer le compte (soft delete)
    const result = await accountDeletionService.deleteAccount(
      user.id,
      user.id, // Auto-suppression
      {
        reason: 'Suppression pour test - réutilisation de l\'email',
      }
    );

    console.log('✅ Compte supprimé avec succès:');
    console.log(JSON.stringify(result, null, 2));

    // Vérifier que l'email peut être réutilisé
    console.log('\n🔍 Vérification de la réutilisation de l\'email...');
    const canReuse = await accountDeletionService.canReuseEmail(email);
    console.log('📊 Résultat:', JSON.stringify(canReuse, null, 2));

    if (!canReuse.canReuse) {
      console.log('\n⚠️  L\'email ne peut pas être réutilisé immédiatement.');
      console.log(`   Raison: ${canReuse.reason}`);
      if (canReuse.gracePeriodEnd) {
        console.log(`   Période de grâce jusqu'à: ${canReuse.gracePeriodEnd}`);
      }
    } else {
      console.log('\n✅ L\'email peut être réutilisé pour une nouvelle inscription!');
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression:', error.message);
    throw error;
  }
}

const email = process.argv[2] || 'okerytop11@gmail.com';
deleteUserForTest(email)
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
