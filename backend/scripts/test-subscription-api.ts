import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const companyId = '975dc5d0-4320-437d-9ce5-f8f28f47caa5';
  
  // Simuler ce que fait subscriptionService.getActive
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
  
  console.log('Subscription from Prisma:');
  console.log('  ID:', subscription?.id);
  console.log('  Package ID:', subscription?.package_id);
  console.log('  Has packages relation:', !!subscription?.packages);
  console.log('  Packages type:', typeof subscription?.packages);
  
  if (subscription?.packages) {
    console.log('  Package name:', subscription.packages.name);
    console.log('  Package code:', subscription.packages.code);
  } else if (subscription?.package_id) {
    console.log('  ⚠️ Package relation not loaded, trying manual load...');
    const pkg = await prisma.packages.findUnique({
      where: { id: subscription.package_id },
    });
    if (pkg) {
      console.log('  ✅ Package found manually:', pkg.name);
      subscription.packages = pkg as any;
    }
  }
  
  // Simuler le mapping
  function mapSubscriptionToFrontend(sub: any) {
    return {
      id: sub.id,
      companyId: sub.company_id,
      packageId: sub.package_id,
      status: sub.status,
      billingCycle: sub.billing_cycle,
      startDate: sub.start_date ? sub.start_date.toISOString() : new Date().toISOString(),
      endDate: sub.end_date ? sub.end_date.toISOString() : undefined,
      trialEndsAt: sub.trial_ends_at ? sub.trial_ends_at.toISOString() : undefined,
      cancelledAt: sub.cancelled_at ? sub.cancelled_at.toISOString() : undefined,
      cancelledBy: sub.cancelled_by || undefined,
      paymentMethod: sub.payment_method || undefined,
      lastPaymentDate: sub.last_payment_date ? sub.last_payment_date.toISOString() : undefined,
      nextPaymentDate: sub.next_payment_date ? sub.next_payment_date.toISOString() : undefined,
      package: sub.packages ? {
        id: sub.packages.id,
        code: sub.packages.code,
        name: sub.packages.name,
        description: sub.packages.description || undefined,
        priceMonthly: Number(sub.packages.price || 0),
        priceYearly: sub.packages.billing_cycle === 'yearly' ? Number(sub.packages.price || 0) : Number(sub.packages.price || 0) * 10,
        currency: sub.packages.currency || 'CDF',
        limits: sub.packages.limits as any || {},
        features: sub.packages.features as any || {},
        isActive: sub.packages.is_active || false,
        displayOrder: sub.packages.display_order || 0,
      } : undefined,
    };
  }
  
  if (subscription) {
    const mapped = mapSubscriptionToFrontend(subscription);
    console.log('\nMapped subscription:');
    console.log('  Has package:', !!mapped.package);
    console.log('  Package name:', mapped.package?.name);
    console.log('  Package features:', JSON.stringify(mapped.package?.features, null, 2));
  }
}

test().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
