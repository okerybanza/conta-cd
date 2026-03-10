import 'dotenv/config';
import prisma from '../src/config/database';

async function fixCompanyEmail() {
  const company = await prisma.companies.findFirst({
    where: { email: 'okerytop11@gmail.com' },
  });

  if (company) {
    const newEmail = `deleted_company_${Date.now()}_${company.id}_okerytop11@gmail.com`;
    await prisma.companies.update({
      where: { id: company.id },
      data: { email: newEmail },
    });
    console.log('✅ Email de l\'entreprise modifié:', newEmail);
  } else {
    console.log('❌ Aucune entreprise trouvée');
  }
}

fixCompanyEmail()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
