#!/usr/bin/env ts-node
/**
 * Script pour mettre à jour ou créer le compte Super Admin
 */

import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import prisma from '../src/config/database';
import env from '../src/config/env';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const updateSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL || 'contadmin@conta.cd';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Okenc@23';
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

  console.log('👑 Mise à jour du compte Super Admin\n');
  console.log('Configuration:');
  console.log(`  Email: ${email}`);
  console.log(`  Prénom: ${firstName}`);
  console.log(`  Nom: ${lastName}`);
  console.log(`  Mot de passe: ***\n`);

  try {
    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, parseInt(env.BCRYPT_ROUNDS));

    if (user) {
      // Mettre à jour l'utilisateur existant
      console.log('📝 Mise à jour de l\'utilisateur existant...');
      
      user = await prisma.user.update({
        where: { email },
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          isSuperAdmin: true,
          isContaUser: true,
          contaRole: 'superadmin',
          emailVerified: true,
        },
      });

      console.log('✅ Super Admin mis à jour avec succès !');
    } else {
      // Créer un nouvel utilisateur
      console.log('📝 Création d\'un nouvel utilisateur...');

      // Vérifier/créer l'entreprise système
      let systemCompany = await prisma.company.findFirst({
        where: { isSystemCompany: true },
      });

      if (!systemCompany) {
        console.log('📝 Création de l\'entreprise système Conta...');
        systemCompany = await prisma.company.create({
          data: {
            name: 'Conta Platform',
            email: 'contact@conta.cd',
            isSystemCompany: true,
            systemType: 'platform',
          },
        });
        console.log('✅ Entreprise système Conta créée');
      }

      // Créer l'utilisateur Super Admin
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          isSuperAdmin: true,
          isContaUser: true,
          contaRole: 'superadmin',
          emailVerified: true,
          role: 'admin',
          companyId: systemCompany.id,
        },
      });

      console.log('✅ Super Admin créé avec succès !');
    }

    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Super Admin: ${user.isSuperAdmin}`);
    console.log(`   Conta User: ${user.isContaUser}`);
    console.log(`   Rôle: ${user.contaRole}\n`);

    console.log('✅ Script terminé avec succès');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

updateSuperAdmin();

