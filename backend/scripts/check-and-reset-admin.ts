import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/config/database';
import bcrypt from 'bcrypt';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

async function checkAndResetAdmin() {
  console.log('🔍 Vérification du Super Admin...\n');

  const email = 'admin@conta.cd';
  // Utiliser le même mot de passe que les scripts de démo pour rester cohérents
  const newPassword = 'Demo123!';

  try {
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé. Création...');
      
      // Trouver ou créer l'entreprise système
      let systemCompany = await prisma.company.findFirst({
        where: {
          isSystemCompany: true,
          systemType: 'system',
        },
      });

      if (!systemCompany) {
        systemCompany = await prisma.company.create({
          data: {
            name: 'Conta Platform',
            email: 'system@conta.cd',
            isSystemCompany: true,
            systemType: 'system',
          },
        });
        console.log('✅ Entreprise système créée');
      }

      // Créer le Super Admin
      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          companyId: systemCompany.id,
          isSuperAdmin: true,
          isContaUser: true,
          contaRole: 'superadmin',
          role: 'admin',
          emailVerified: true,
        },
      });
      console.log('✅ Super Admin créé');
      console.log(`   ID: ${newUser.id}`);
    } else {
      console.log('✅ Utilisateur trouvé:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   isSuperAdmin: ${user.isSuperAdmin}`);
      console.log(`   isContaUser: ${user.isContaUser}`);
      console.log(`   contaRole: ${user.contaRole}`);
      
      // Vérifier le mot de passe
      console.log('\n🔐 Test du mot de passe...');
      const testPassword = newPassword;
      const isValid = await bcrypt.compare(testPassword, user.passwordHash);
      
      if (!isValid) {
        console.log('⚠️  Mot de passe incorrect. Réinitialisation...');
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
        console.log('✅ Mot de passe réinitialisé');
      } else {
        console.log('✅ Mot de passe correct');
      }

      // S'assurer que l'utilisateur est bien Super Admin
      if (!user.isSuperAdmin || !user.isContaUser) {
        console.log('\n🔄 Mise à jour des permissions...');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isSuperAdmin: true,
            isContaUser: true,
            contaRole: 'superadmin',
          },
        });
        console.log('✅ Permissions mises à jour');
      }
    }

    console.log('\n✅ Configuration terminée !');
    console.log(`\n📋 Identifiants:`);
    console.log(`   Email: ${email}`);
    console.log(`   Mot de passe: ${newPassword}`);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndResetAdmin();
