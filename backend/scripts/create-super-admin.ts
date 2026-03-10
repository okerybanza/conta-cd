#!/usr/bin/env ts-node
/**
 * Script pour créer le compte Super Admin initial
 * 
 * Usage:
 *   npm run create:super-admin
 *   ou
 *   ts-node backend/scripts/create-super-admin.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/config/database';
import bcrypt from 'bcrypt';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Utiliser directement process.env pour éviter la validation stricte
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

const createSuperAdmin = async () => {
  console.log('👑 Création du compte Super Admin\n');

  // Demander les informations (ou utiliser des valeurs par défaut)
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@conta.cd';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

  console.log('Configuration:');
  console.log(`  Email: ${email}`);
  console.log(`  Prénom: ${firstName}`);
  console.log(`  Nom: ${lastName}`);
  console.log(`  Mot de passe: ${password.length > 0 ? '***' : 'NON DÉFINI'}`);
  console.log('');

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('⚠️  Un utilisateur avec cet email existe déjà.');
    
    if (existingUser.isSuperAdmin) {
      console.log('✅ Cet utilisateur est déjà Super Admin.');
      return;
    } else {
      console.log('🔄 Mise à jour de l\'utilisateur en Super Admin...');
      
      // Trouver ou créer l'entreprise système
      let systemCompany = await prisma.company.findFirst({
        where: {
          isSystemCompany: true,
          systemType: 'system',
        },
      });

      if (!systemCompany) {
        // Vérifier si l'email existe déjà
        const existingCompany = await prisma.company.findUnique({
          where: { email: 'system@conta.cd' },
        });
        
        if (existingCompany) {
          // Mettre à jour l'entreprise existante
          systemCompany = await prisma.company.update({
            where: { id: existingCompany.id },
            data: {
              isSystemCompany: true,
              systemType: 'system',
            },
          });
          console.log('✅ Entreprise système Conta mise à jour');
        } else {
          systemCompany = await prisma.company.create({
            data: {
              name: 'Conta Platform',
              email: 'system@conta.cd',
              isSystemCompany: true,
              systemType: 'system',
            },
          });
          console.log('✅ Entreprise système Conta créée');
        }
      }

      // Mettre à jour l'utilisateur
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isSuperAdmin: true,
          isContaUser: true,
          contaRole: 'superadmin',
          companyId: systemCompany.id,
        },
      });

      console.log('✅ Utilisateur mis à jour en Super Admin');
      return;
    }
  }

  // Trouver ou créer l'entreprise système
  let systemCompany = await prisma.company.findFirst({
    where: {
      isSystemCompany: true,
      systemType: 'system',
    },
  });

  if (!systemCompany) {
    // Vérifier si l'email existe déjà
    const existingCompany = await prisma.company.findUnique({
      where: { email: 'system@conta.cd' },
    });
    
    if (existingCompany) {
      // Mettre à jour l'entreprise existante
      systemCompany = await prisma.company.update({
        where: { id: existingCompany.id },
        data: {
          isSystemCompany: true,
          systemType: 'system',
        },
      });
      console.log('✅ Entreprise système Conta mise à jour');
    } else {
      systemCompany = await prisma.company.create({
        data: {
          name: 'Conta Platform',
          email: 'system@conta.cd',
          isSystemCompany: true,
          systemType: 'system',
        },
      });
      console.log('✅ Entreprise système Conta créée');
    }
  }

  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Créer le Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      companyId: systemCompany.id,
      isSuperAdmin: true,
      isContaUser: true,
      contaRole: 'superadmin',
      role: 'admin',
      emailVerified: true,
    },
  });

  console.log('✅ Super Admin créé avec succès !');
  console.log(`   ID: ${superAdmin.id}`);
  console.log(`   Email: ${superAdmin.email}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
};

// Exécuter
createSuperAdmin()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

