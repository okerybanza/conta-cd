import prisma from './src/config/database';

async function main() {
  console.log('NODE_ENV=', process.env.NODE_ENV);
  const email = 'okerybanza@gmail.com';
  const user = await prisma.users.findFirst({
    where: { email },
    select: { id: true, email: true, company_id: true },
  });
  console.log('User:', user);
  if (!user || !user.company_id) {
    console.log('No user/company for', email);
    return;
  }
  const companyId = user.company_id;
  const sub = await prisma.subscriptions.findFirst({
    where: { company_id: companyId, status: { in: ['active', 'trial'] } },
    include: { packages: true },
    orderBy: { created_at: 'desc' },
  });
  console.log('Subscription:', {
    id: sub?.id,
    status: sub?.status,
    package_id: sub?.package_id,
    packageCode: sub?.packages?.code,
    packageName: sub?.packages?.name,
  });
  if (sub?.packages) {
    console.log('Package features keys:', sub.packages.features && typeof sub.packages.features === 'object' ? Object.keys(sub.packages.features as any) : sub.packages.features);
    console.log('Raw features:', JSON.stringify(sub.packages.features, null, 2));
  }
}

main().catch((e) => { console.error(e); }).finally(async () => {
  await prisma.$disconnect();
});
