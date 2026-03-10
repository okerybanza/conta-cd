import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkUser(email: string) {
  try {
    const user = await prisma.users.findFirst({
      where: { email },
    });

    if (!user) {
      console.error(`Utilisateur avec l'email ${email} non trouvé`);
      process.exit(1);
    }

    console.log('Utilisateur:', {
      id: user.id,
      email: user.email,
      company_id: user.company_id,
      role: user.role,
      is_super_admin: user.is_super_admin,
    });

    if (user.company_id) {
      const company = await prisma.companies.findUnique({
        where: { id: user.company_id },
      });

      const subscriptions = await prisma.subscriptions.findMany({
        where: { company_id: user.company_id },
        orderBy: { created_at: 'desc' },
        take: 1,
      });

      console.log('Entreprise:', {
        id: company?.id,
        name: company?.name,
      });

      if (subscriptions.length > 0) {
        const sub = subscriptions[0];
        console.log('Abonnement:', {
          id: sub.id,
          package_id: sub.package_id,
          status: sub.status,
        });
      } else {
        console.log('⚠️  Aucun abonnement trouvé pour cette entreprise');
      }
    } else {
      console.log('⚠️  L\'utilisateur n\'a pas d\'entreprise associée');
    }
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: ts-node scripts/check-user-company.ts <email>');
  process.exit(1);
}

checkUser(email);
