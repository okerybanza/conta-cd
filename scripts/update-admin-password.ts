/**
 * Script pour mettre à jour le mot de passe de admin@enterprise.test
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

// Résoudre le chemin vers le dossier backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendPath = path.resolve(__dirname, '../backend');

// Utiliser Prisma depuis le dossier backend
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const email = 'admin@enterprise.test';
  const password = 'admin123'; // Mot de passe simple pour les tests
  
  console.log(`🔐 Mise à jour du mot de passe pour ${email}...`);
  
  // Générer le hash du mot de passe
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Mettre à jour l'utilisateur
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });
  
  console.log(`✅ Mot de passe mis à jour pour ${user.email}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Mot de passe: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

