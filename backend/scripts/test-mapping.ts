import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function mapSubscriptionToFrontend(subscription: any) {
  return {
    id: subscription.id,
    companyId: subscription.company_id,
    packageId: subscription.package_id,
    status: subscription.status,
    billingCycle: subscription.billing_cycle,
    startDate: subscription.start_date ? subscription.start_date.toISOString() : new Date().toISOString(),
    endDate: subscription.end_date ? subscription.end_date.toISOString() : undefined,
    trialEndsAt: subscription.trial_ends_at ? subscription.trial_ends_at.toISOString() : undefined,
    cancelledAt: subscription.cancelled_at ? subscription.cancelled_at.toISOString() : undefined,
    cancelledBy: subscription.cancelled_by || undefined,
    paymentMethod: subscription.payment_method || undefined,
    lastPaymentDate: subscription.last_payment_date ? subscription.last_payment_date.toISOString() : undefined,
    nextPaymentDate: subscription.next_payment_date ? subscription.next_payment_date.toISOString() : undefined,
    package: subscription.packages ? {
      id: subscription.packages.id,
      code: subscription.packages.code,
      name: subscription.packages.name,
      description: subscription.packages.description || undefined,
      priceMonthly: Number(subscription.packages.price || 0),
      priceYearly: subscription.packages.billing_cycle === 'yearly' ? Number(subscription.packages.price || 0) : Number(subscription.packages.price || 0) * 10,
      currency: subscription.packages.currency || 'CDF',
      limits: subscription.packages.limits as any || {},
      features: subscription.packages.features as any || {},
      isActive: subscription.packages.is_active || false,
      displayOrder: subscription.packages.display_order || 0,
    } : undefined,
  };
}

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
  
  if (!subscription) {
    console.log('No subscription found');
    await prisma.$disconnect();
    return;
  }
  
  const mapped = mapSubscriptionToFrontend(subscription);
  console.log('Mapped subscription:', JSON.stringify({
    hasPackage: !!mapped.package,
    packageName: mapped.package?.name,
    packageCode: mapped.package?.code,
  }, null, 2));
  
  await prisma.$disconnect();
}

test().catch(console.error);
