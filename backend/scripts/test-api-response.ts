import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const companyId = '975dc5d0-4320-437d-9ce5-f8f28f47caa5';
  
  // Simuler exactement ce que fait le service
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
  
  if (!subscription) {
    console.log('No subscription found');
    return;
  }
  
  console.log('Raw subscription from Prisma:');
  console.log(JSON.stringify({
    id: subscription.id,
    package_id: subscription.package_id,
    hasPackages: !!subscription.packages,
    packages: subscription.packages ? {
      id: subscription.packages.id,
      name: subscription.packages.name,
      code: subscription.packages.code,
    } : null,
  }, null, 2));
  
  // Simuler le mapping
  const pkg = (subscription as any).packages;
  const mapped = {
    id: subscription.id,
    packageId: subscription.package_id,
    package: pkg ? {
      id: pkg.id,
      name: pkg.name,
      code: pkg.code,
    } : undefined,
  };
  
  console.log('\nMapped response:');
  console.log(JSON.stringify(mapped, null, 2));
  console.log('\nHas package in mapped:', !!mapped.package);
}

test().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
