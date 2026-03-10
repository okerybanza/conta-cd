import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/config/database';
import bcrypt from 'bcrypt';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testLogin() {
  console.log('🔐 Test de connexion...\n');

  const email = 'admin@conta.cd';
  const password = 'ChangeMe123!';

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé');
    console.log(`   Email: ${user.email}`);
    console.log(`   isSuperAdmin: ${user.isSuperAdmin}`);
    console.log(`   isContaUser: ${user.isContaUser}`);
    console.log(`   lockedUntil: ${user.lockedUntil}`);
    console.log(`   failedLoginAttempts: ${user.failedLoginAttempts}`);

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`\n🔐 Test du mot de passe: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);

    if (!isValid) {
      console.log('⚠️  Le mot de passe ne correspond pas');
    } else {
      console.log('✅ Le mot de passe est correct !');
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log(`⚠️  Compte verrouillé jusqu'à: ${user.lockedUntil}`);
    } else {
      console.log('✅ Compte non verrouillé');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
