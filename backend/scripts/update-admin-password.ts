/**
 * Script pour mettre à jour le mot de passe de admin@enterprise.test
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  let email = 'admin@entreprise.test'; // Email correct avec "entreprise"
  const password = 'admin123'; // Mot de passe simple pour les tests
  
  console.log(`🔐 Mise à jour/création du mot de passe pour ${email}...`);
  
  // Générer le hash du mot de passe
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Chercher l'utilisateur
  let user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    // Chercher avec une variante de l'email
    user = await prisma.user.findFirst({
      where: { 
        email: { contains: 'admin' },
      },
    });
    
    if (user) {
      console.log(`⚠️  Utilisateur trouvé avec email différent: ${user.email}`);
      email = user.email;
    } else {
      // Créer l'utilisateur s'il n'existe pas
      const company = await prisma.company.findFirst();
      if (!company) {
        console.error('❌ Aucune entreprise trouvée. Créez d\'abord une entreprise.');
        return;
      }
      
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: 'Admin',
          lastName: 'Test',
          role: 'admin',
          companyId: company.id,
        },
      });
      console.log(`✅ Utilisateur créé: ${user.email}`);
    }
  }
  
  // Mettre à jour le mot de passe
  user = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  
  console.log(`✅ Mot de passe mis à jour pour ${user.email}`);
  console.log(`📧 Email: ${user.email}`);
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

