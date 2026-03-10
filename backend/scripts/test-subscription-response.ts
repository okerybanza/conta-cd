import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const companyId = '975dc5d0-4320-437d-9ce5-f8f28f47caa5';
  const subscription = await prisma.subscriptions.findFirst({
    where: { 
      company_id: companyId,
      status: { in: ['active', 'trial'] },
    },
    include: {
      packages: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  
  console.log('Subscription:', JSON.stringify({
    id: subscription?.id,
    package_id: subscription?.package_id,
    hasPackages: !!subscription?.packages,
    packagesType: typeof subscription?.packages,
    packagesValue: subscription?.packages ? 'exists' : 'null/undefined',
  }, null, 2));
  
  await prisma.$disconnect();
}

test().catch(console.error);
