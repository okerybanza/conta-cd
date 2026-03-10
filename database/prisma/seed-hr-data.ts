import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import path from 'path';

// Importer Prisma Client depuis le chemin où il est généré (backend/node_modules/.prisma/client)
const prismaModule = require(path.resolve(__dirname, '../../backend/node_modules/.prisma/client'));
const { PrismaClient } = prismaModule;
const prisma = new PrismaClient() as any;

// Importer les services pour créer les écritures comptables
let journalEntryService: any;
let accountService: any;
let payrollService: any;

async function initServices() {
  try {
    // Import dynamique pour éviter les erreurs si les services ne sont pas disponibles
    const journalEntryModule = await import('../../backend/src/services/journalEntry.service');
    journalEntryService = journalEntryModule.default;
    const accountModule = await import('../../backend/src/services/account.service');
    accountService = accountModule.default;
    const payrollModule = await import('../../backend/src/services/payroll.service');
    payrollService = payrollModule.default;
  } catch (error) {
    console.warn('⚠️  Services non disponibles, certaines fonctionnalités seront limitées');
  }
}

/**
 * Script de seed pour créer des données HR cohérentes
 * Génère : employés, pointages, fiches de paie avec écritures comptables
 */
async function main() {
  console.log('🌱 Création de données HR de test...\n');

  // Initialiser les services
  await initServices();

  // Récupérer la première entreprise et le premier utilisateur
  // Essayer d'abord avec l'email "entreprise.test"
  let company = await prisma.company.findFirst({
    where: { email: { contains: 'entreprise.test' } },
    include: {
      users: {
        where: { deletedAt: null },
        take: 1,
      },
    },
  });

  // Si pas trouvé, prendre la première entreprise
  if (!company) {
    company = await prisma.company.findFirst({
      include: {
        users: {
          where: { deletedAt: null },
          take: 1,
        },
      },
    });
  }

  // Si aucune entreprise, créer une entreprise de test
  if (!company) {
    console.log('⚠️  Aucune entreprise trouvée. Création d\'une entreprise de test...');
    
    try {
      // Créer l'entreprise
      company = await prisma.company.create({
        data: {
          name: 'Entreprise Test',
          email: 'entreprise.test@example.com',
          phone: '+243900000000',
          city: 'Kinshasa',
          country: 'RDC',
          currency: 'CDF',
          invoicePrefix: 'FAC',
          invoiceNumberingType: 'sequential',
          nextInvoiceNumber: 1,
        },
        include: {
          users: true,
        },
      });

      console.log(`✅ Entreprise créée: ${company.name}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de l\'entreprise:', error.message);
      return;
    }
  }

  let user = company.users?.[0];
  
  // Si pas d'utilisateur dans l'entreprise, chercher n'importe quel utilisateur
  if (!user && company) {
    const anyUser = await prisma.user.findFirst({
      where: { 
        companyId: company.id,
        deletedAt: null 
      },
    });
    user = anyUser || null;
  }

  // Si toujours pas d'utilisateur, créer un utilisateur de test
  if (!user && company) {
    console.log('⚠️  Aucun utilisateur trouvé. Création d\'un utilisateur de test...');
    try {
      user = await prisma.user.create({
        data: {
          companyId: company.id,
          email: 'admin@entreprise.test',
          passwordHash: '$2b$10$placeholder', // Hash temporaire
          firstName: 'Admin',
          lastName: 'Test',
          role: 'admin',
        },
      });
      console.log(`✅ Utilisateur créé: ${user.email}\n`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
      return;
    }
  }

  if (!company || !user) {
    console.log('❌ Impossible de créer ou trouver une entreprise et un utilisateur.');
    return;
  }

  console.log(`📊 Entreprise: ${company!.name}`);
  console.log(`👤 Utilisateur: ${user!.email}\n`);

  // Dates pour les données (derniers 6 mois)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  // 1. Créer des employés
  console.log('👥 Création d\'employés...');
  const employees: any[] = [];
  const employeeData = [
    {
      employeeNumber: 'EMP001',
      firstName: 'Jean',
      lastName: 'Mukamba',
      email: 'jean.mukamba@example.com',
      phone: '+243900000001',
      position: 'Directeur Général',
      department: 'Direction',
      hireDate: new Date(2023, 0, 15), // 15 janvier 2023
      baseSalary: 5000000, // 5 000 000 CDF
      employmentType: 'full_time',
    },
    {
      employeeNumber: 'EMP002',
      firstName: 'Marie',
      lastName: 'Kabila',
      email: 'marie.kabila@example.com',
      phone: '+243900000002',
      position: 'Comptable',
      department: 'Comptabilité',
      hireDate: new Date(2023, 2, 1), // 1er mars 2023
      baseSalary: 2500000, // 2 500 000 CDF
      employmentType: 'full_time',
    },
    {
      employeeNumber: 'EMP003',
      firstName: 'Paul',
      lastName: 'Tshisekedi',
      email: 'paul.tshisekedi@example.com',
      phone: '+243900000003',
      position: 'Développeur',
      department: 'IT',
      hireDate: new Date(2023, 5, 1), // 1er juin 2023
      baseSalary: 3000000, // 3 000 000 CDF
      employmentType: 'full_time',
    },
    {
      employeeNumber: 'EMP004',
      firstName: 'Sophie',
      lastName: 'Lumumba',
      email: 'sophie.lumumba@example.com',
      phone: '+243900000004',
      position: 'Secrétaire',
      department: 'Administration',
      hireDate: new Date(2023, 8, 1), // 1er septembre 2023
      baseSalary: 1500000, // 1 500 000 CDF
      employmentType: 'full_time',
    },
    {
      employeeNumber: 'EMP005',
      firstName: 'David',
      lastName: 'Kasa-Vubu',
      email: 'david.kasavubu@example.com',
      phone: '+243900000005',
      position: 'Commercial',
      department: 'Ventes',
      hireDate: new Date(2024, 0, 1), // 1er janvier 2024
      baseSalary: 2000000, // 2 000 000 CDF + commissions
      employmentType: 'full_time',
    },
  ];

  for (const empData of employeeData) {
    const existing = await (prisma as any).employee.findFirst({
      where: {
        companyId: company!.id,
        employeeNumber: empData.employeeNumber,
      },
    });

    let employee;
    if (existing) {
      employee = existing;
      console.log(`  ✓ Employé existant: ${empData.firstName} ${empData.lastName}`);
    } else {
      employee = await (prisma as any).employee.create({
        data: {
          companyId: company!.id,
          employeeNumber: empData.employeeNumber,
          firstName: empData.firstName,
          lastName: empData.lastName,
          email: empData.email,
          phone: empData.phone,
          position: empData.position,
          department: empData.department,
          hireDate: empData.hireDate,
          baseSalary: new Decimal(empData.baseSalary),
          currency: 'CDF',
          salaryFrequency: 'monthly',
          employmentType: empData.employmentType,
          status: 'active',
          city: 'Kinshasa',
          country: 'RDC',
        },
      });
      console.log(`  ✓ Employé créé: ${empData.firstName} ${empData.lastName} (${empData.employeeNumber})`);
    }
    employees.push(employee);
  }

  console.log(`\n✅ ${employees.length} employés créés/trouvés\n`);

  // 2. Créer des pointages pour les 6 derniers mois
  console.log('📅 Création de pointages...');
  let attendanceCount = 0;

  for (const employee of employees) {
    // Créer des pointages pour chaque jour ouvrable des 6 derniers mois
    const startDate = new Date(Math.max(employee.hireDate.getTime(), sixMonthsAgo.getTime()));
    const endDate = new Date(now);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Ignorer les weekends (samedi = 6, dimanche = 0)
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      // 5% de chance d'absence
      if (Math.random() < 0.05) continue;

      const dateStr = d.toISOString().split('T')[0];
      const checkIn = new Date(d);
      checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0); // Entre 8h et 10h

      const checkOut = new Date(d);
      checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0); // Entre 17h et 19h

      const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      const status = hoursWorked < 6 ? 'absent' : 'present';

      try {
        await (prisma as any).attendance.upsert({
          where: {
            companyId_employeeId_date: {
              companyId: company!.id,
              employeeId: employee.id,
              date: d,
            },
          },
          update: {},
          create: {
            companyId: company!.id,
            employeeId: employee.id,
            date: d,
            checkIn: status === 'present' ? checkIn : null,
            checkOut: status === 'present' ? checkOut : null,
            hoursWorked: status === 'present' ? new Decimal(hoursWorked.toFixed(2)) : new Decimal(0),
            status: status,
          },
        });
        attendanceCount++;
      } catch (error: any) {
        // Ignorer les erreurs de contrainte unique
        if (!error.message?.includes('Unique constraint')) {
          console.error(`  ⚠️  Erreur pointage ${dateStr}:`, error.message);
        }
      }
    }
  }

  console.log(`✅ ${attendanceCount} pointages créés\n`);

  // 3. Créer des fiches de paie pour les 6 derniers mois
  console.log('💰 Création de fiches de paie...');
  let payrollCount = 0;
  let totalPayrollCost = 0;

  for (const employee of employees) {
    // Calculer les mois depuis l'embauche
    const startDate = new Date(Math.max(employee.hireDate.getTime(), sixMonthsAgo.getTime()));
    const endDate = new Date(now);

    // Créer une fiche de paie par mois
    for (let month = new Date(startDate); month <= endDate; month.setMonth(month.getMonth() + 1)) {
      const periodStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const periodEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const payDate = new Date(month.getFullYear(), month.getMonth() + 1, 5); // Paiement le 5 du mois suivant

      // Ignorer si la période est dans le futur
      if (payDate > now) continue;

      const baseSalary = Number(employee.baseSalary);
      
      // Calculer les déductions (impôts, sécurité sociale, etc.)
      // En RDC, environ 10% de déductions (impôts + sécurité sociale)
      const taxRate = 0.10;
      const totalDeductions = baseSalary * taxRate;
      const netSalary = baseSalary - totalDeductions;

      // Charges patronales (environ 20% du salaire brut)
      const employerContributions = baseSalary * 0.20;
      const totalCost = baseSalary + employerContributions;

      // Créer les items de paie
      const items = [
        {
          type: 'base_salary',
          description: 'Salaire de base',
          amount: baseSalary,
          isDeduction: false,
        },
        {
          type: 'tax',
          description: 'Impôt sur le revenu',
          amount: baseSalary * 0.05,
          isDeduction: true,
        },
        {
          type: 'social_security',
          description: 'Sécurité sociale',
          amount: baseSalary * 0.05,
          isDeduction: true,
        },
      ];

      // Ajouter des primes occasionnelles (10% de chance)
      if (Math.random() < 0.1) {
        const bonus = baseSalary * 0.1;
        items.push({
          type: 'bonus',
          description: 'Prime de performance',
          amount: bonus,
          isDeduction: false,
        });
      }

      try {
        // Vérifier si la fiche de paie existe déjà
        const existing = await (prisma as any).payroll.findFirst({
          where: {
            companyId: company!.id,
            employeeId: employee.id,
            periodStart,
            periodEnd,
          },
        });

        if (existing) {
          console.log(`  ✓ Fiche de paie existante: ${employee.firstName} ${employee.lastName} - ${periodStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`);
          continue;
        }

        // Créer la fiche de paie
        const payroll = await (prisma as any).payroll.create({
          data: {
            companyId: company!.id,
            employeeId: employee.id,
            periodStart,
            periodEnd,
            payDate,
            status: 'approved', // Approuvée directement
            grossSalary: new Decimal(baseSalary),
            totalDeductions: new Decimal(totalDeductions),
            netSalary: new Decimal(netSalary),
            currency: 'CDF',
            paymentMethod: 'bank_transfer',
            items: {
              create: items.map(item => ({
                type: item.type,
                description: item.description,
                amount: new Decimal(item.amount),
                isDeduction: item.isDeduction,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // Marquer comme payée
        await (prisma as any).payroll.update({
          where: { id: payroll.id },
          data: {
            status: 'paid',
            paidAt: payDate,
            paidBy: user.id,
          },
        });

        // Créer l'écriture comptable pour la paie
        await createPayrollJournalEntry(company!.id, payroll, user!.id, totalCost, netSalary, totalDeductions, employerContributions);

        payrollCount++;
        totalPayrollCost += totalCost;

        console.log(`  ✓ Fiche de paie créée: ${employee.firstName} ${employee.lastName} - ${periodStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} (${formatCurrency(netSalary)} net)`);
      } catch (error: any) {
        console.error(`  ⚠️  Erreur fiche de paie ${employee.employeeNumber}:`, error.message);
      }
    }
  }

  console.log(`\n✅ ${payrollCount} fiches de paie créées`);
  console.log(`💰 Coût total des salaires: ${formatCurrency(totalPayrollCost)}\n`);

  // 4. Résumé
  console.log('📊 RÉSUMÉ DES DONNÉES HR:');
  console.log(`  • Employés: ${employees.length}`);
  console.log(`  • Pointages: ${attendanceCount}`);
  console.log(`  • Fiches de paie: ${payrollCount}`);
  console.log(`  • Coût total salaires: ${formatCurrency(totalPayrollCost)}`);
  console.log('\n✅ Données HR créées avec succès!\n');
}

/**
 * Créer une écriture comptable pour une fiche de paie
 */
async function createPayrollJournalEntry(
  companyId: string,
  payroll: any,
  userId: string,
  totalCost: number,
  netSalary: number,
  totalDeductions: number,
  employerContributions: number
) {
  if (!journalEntryService || !accountService) {
    console.warn('  ⚠️  Services comptables non disponibles, écriture non créée');
    return;
  }

  try {
    // Récupérer les comptes nécessaires
    const accounts = await Promise.all([
      accountService.getByCode(companyId, '641'), // Charges de personnel
      accountService.getByCode(companyId, '421'), // Salaires à payer
      accountService.getByCode(companyId, '431'), // Sécurité sociale
      accountService.getByCode(companyId, '512'), // Banques (pour le paiement)
    ]).catch(() => {
      console.warn('  ⚠️  Comptes comptables non trouvés, écriture non créée');
      return null;
    });

    if (!accounts || accounts.some(a => !a)) {
      return;
    }

    const [chargesAccount, salairesAccount, securiteAccount, banqueAccount] = accounts;

    // Créer l'écriture comptable
    // Débit: Charges de personnel (coût total pour l'entreprise)
    // Crédit: Salaires à payer (salaire net)
    // Crédit: Sécurité sociale (déductions + charges patronales)
    const lines = [
      {
        accountId: chargesAccount.id,
        description: `Paie ${payroll.employee.firstName} ${payroll.employee.lastName} - ${new Date(payroll.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
        debit: totalCost,
        credit: 0,
      },
      {
        accountId: salairesAccount.id,
        description: `Salaire net ${payroll.employee.firstName} ${payroll.employee.lastName}`,
        debit: 0,
        credit: netSalary,
      },
      {
        accountId: securiteAccount.id,
        description: `Charges sociales ${payroll.employee.firstName} ${payroll.employee.lastName}`,
        debit: 0,
        credit: totalDeductions + employerContributions,
      },
    ];

    // Créer l'écriture
    await journalEntryService.create(companyId, {
      entryDate: payroll.payDate,
      description: `Écriture automatique - Paie ${payroll.employee.firstName} ${payroll.employee.lastName}`,
      sourceType: 'payroll',
      sourceId: payroll.id,
      lines,
      createdBy: userId,
    });

    // Lier l'écriture à la fiche de paie
      const journalEntry = await (prisma as any).journalEntry.findFirst({
      where: {
        companyId,
        sourceType: 'payroll',
        sourceId: payroll.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (journalEntry) {
        await (prisma as any).payroll.update({
        where: { id: payroll.id },
        data: { journalEntryId: journalEntry.id },
      });
    }
  } catch (error: any) {
    console.warn(`  ⚠️  Erreur création écriture comptable: ${error.message}`);
  }
}

/**
 * Formater un montant en devise
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0,
  }).format(amount);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

