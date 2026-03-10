import { AuthService } from '../src/services/auth.service';
import prisma from '../src/config/database';
import logger from '../src/utils/logger';

const authService = new AuthService();

interface TestAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  accountType: 'startup' | 'entrepreneur' | 'ong_firm' | 'expert_comptable';
}

const testAccounts: TestAccount[] = [
  {
    email: 'test-startup@example.com',
    password: 'Test123!@#',
    firstName: 'Jean',
    lastName: 'Dupont',
    companyName: 'Tech Startup SARL',
    accountType: 'startup',
  },
  {
    email: 'test-entrepreneur@example.com',
    password: 'Test123!@#',
    firstName: 'Marie',
    lastName: 'Martin',
    companyName: 'Entreprise Individuelle',
    accountType: 'entrepreneur',
  },
  {
    email: 'test-ong@example.com',
    password: 'Test123!@#',
    firstName: 'Paul',
    lastName: 'Bernard',
    companyName: 'ONG Solidarité',
    accountType: 'ong_firm',
  },
];

async function testRegistration() {
  console.log('\n🧪 === TEST D\'INSCRIPTION ===\n');

  for (const account of testAccounts) {
    try {
      console.log(`\n📝 Test inscription: ${account.email} (${account.accountType})`);
      console.log('   Données:', {
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        companyName: account.companyName,
        accountType: account.accountType,
      });

      // 1. Vérifier si l'email existe déjà
      const existingUser = await prisma.users.findFirst({
        where: { email: account.email },
      });

      if (existingUser) {
        console.log(`   ⚠️  Email ${account.email} existe déjà, suppression...`);
        await prisma.users.delete({ where: { id: existingUser.id } });
        const existingCompany = await prisma.companies.findFirst({
          where: { email: account.email },
        });
        if (existingCompany) {
          await prisma.companies.delete({ where: { id: existingCompany.id } });
        }
      }

      // 2. Créer le compte
      const result = await authService.register({
        email: account.email,
        password: account.password,
        firstName: account.firstName,
        lastName: account.lastName,
        companyName: account.companyName,
        accountType: account.accountType,
      });

      console.log('   ✅ Inscription réussie');
      console.log('   User ID:', result.user.id);
      console.log('   Company ID:', result.company.id);

      // 3. Vérifier les données dans la base
      const user = await prisma.users.findUnique({
        where: { id: result.user.id },
        include: { companies: true },
      });

      const company = await prisma.companies.findUnique({
        where: { id: result.company.id },
      });

      console.log('\n   📊 Vérification des données:');
      console.log('   User:', {
        id: user?.id,
        email: user?.email,
        firstName: user?.first_name,
        lastName: user?.last_name,
        role: user?.role,
        companyId: user?.company_id,
      });

      console.log('   Company:', {
        id: company?.id,
        name: company?.name,
        email: company?.email,
        accountType: company?.account_type,
        createdAt: company?.created_at,
        updatedAt: company?.updated_at,
      });

      // 4. Vérifications - Mapping correct des account types
      const accountTypeMap: Record<string, string> = {
        entrepreneur: 'ENTREPRENEUR',
        startup: 'STARTUP',
        ong_firm: 'ONG_FIRM',
        expert_comptable: 'EXPERT_COMPTABLE',
      };
      const expectedAccountType = accountTypeMap[account.accountType] || 'STARTUP';

      const checks = {
        userExists: !!user,
        companyExists: !!company,
        emailMatch: user?.email === account.email,
        firstNameMatch: user?.first_name === account.firstName,
        lastNameMatch: user?.last_name === account.lastName,
        companyNameMatch: company?.name === account.companyName,
        accountTypeMatch: company?.account_type === expectedAccountType,
        userLinkedToCompany: user?.company_id === company?.id,
        roleIsAdmin: user?.role === 'admin',
        timestampsSet: !!(company?.created_at && company?.updated_at),
      };

      console.log('\n   ✅ Vérifications:');
      Object.entries(checks).forEach(([key, value]) => {
        const icon = value ? '✓' : '✗';
        const color = value ? '\x1b[32m' : '\x1b[31m';
        console.log(`   ${color}${icon}\x1b[0m ${key}: ${value}`);
      });

      const allPassed = Object.values(checks).every(v => v);
      if (allPassed) {
        console.log('   \x1b[32m✅ Tous les tests passés!\x1b[0m');
      } else {
        console.log('   \x1b[31m❌ Certains tests ont échoué\x1b[0m');
      }

      // 5. Test du login
      console.log('\n   🔐 Test du login...');
      try {
        const loginResult = await authService.login({
          email: account.email,
          password: account.password,
        });
        console.log('   ✅ Login réussi');
        console.log('   Token reçu:', !!loginResult.accessToken);
        console.log('   Refresh token reçu:', !!loginResult.refreshToken);
      } catch (loginError: any) {
        console.log('   ❌ Erreur login:', loginError.message);
      }

    } catch (error: any) {
      console.error(`   ❌ Erreur pour ${account.email}:`, error.message);
      console.error('   Stack:', error.stack);
    }
  }

  console.log('\n✅ === FIN DES TESTS ===\n');
}

async function cleanup() {
  console.log('\n🧹 Nettoyage des comptes de test...');
  for (const account of testAccounts) {
    try {
      const user = await prisma.users.findFirst({
        where: { email: account.email },
      });
      if (user) {
        await prisma.users.delete({ where: { id: user.id } });
        console.log(`   ✓ Supprimé: ${account.email}`);
      }
      const company = await prisma.companies.findFirst({
        where: { email: account.email },
      });
      if (company) {
        await prisma.companies.delete({ where: { id: company.id } });
      }
    } catch (error) {
      // Ignore
    }
  }
}

async function main() {
  try {
    await testRegistration();
    
    // Optionnel: nettoyer après les tests
    // await cleanup();
    
    process.exit(0);
  } catch (error: any) {
    console.error('Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
