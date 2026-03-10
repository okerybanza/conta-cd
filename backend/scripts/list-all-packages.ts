import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const packages = await prisma.packages.findMany({
    orderBy: { display_order: 'asc' },
  });
  
  console.log('\n=== PLANS EXISTANTS ===\n');
  packages.forEach((pkg, index) => {
    console.log(`${index + 1}. ${pkg.name} (${pkg.code})`);
    console.log(`   Prix: ${pkg.price} ${pkg.currency || 'CDF'}`);
    console.log(`   Actif: ${pkg.is_active ? 'Oui' : 'Non'}`);
    console.log(`   Ordre: ${pkg.display_order}`);
    console.log(`   Features:`, JSON.stringify(pkg.features, null, 2));
    console.log(`   Limits:`, JSON.stringify(pkg.limits, null, 2));
    console.log('');
  });
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
