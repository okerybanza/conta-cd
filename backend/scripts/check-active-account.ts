import 'dotenv/config';
import prisma from '../src/config/database';

async function checkActiveAccount(email: string) {
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
      created_at: true,
    },
  });

  if (activeUser) {
    console.log('✅ Compte ACTIF trouvé:', JSON.stringify(activeUser, null, 2));
  } else {
    console.log('❌ Aucun compte actif trouvé');
  }

  // Vérifier aussi les entreprises avec cet email
  const company = await prisma.companies.findFirst({
    where: { email },
  });

  if (company) {
    console.log('📦 Entreprise trouvée:', JSON.stringify(company, null, 2));
  }
}

checkActiveAccount('okerytop11@gmail.com')
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
