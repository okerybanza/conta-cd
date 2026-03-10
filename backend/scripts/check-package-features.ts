import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkPackage(packageId: string) {
  try {
    const pkg = await prisma.packages.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      console.error(`Package ${packageId} non trouvé`);
      process.exit(1);
    }

    const features = pkg.features as any;
    console.log('Package:', {
      id: pkg.id,
      name: pkg.name,
      code: pkg.code,
      features: features,
      accounting: features?.accounting,
    });
  } catch (error: any) {
    console.error('Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const packageId = process.argv[2];
if (!packageId) {
  console.error('Usage: ts-node scripts/check-package-features.ts <packageId>');
  process.exit(1);
}

checkPackage(packageId);
