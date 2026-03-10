/**
 * Script de seed complet pour créer des données de démonstration
 * 
 * Crée :
 * - 3-4 entreprises de test avec différents profils
 * - Utilisateurs par rôle (Owner, Admin, Comptable, RH, Manager, Employé)
 * - Clients et fournisseurs
 * - Produits avec stock
 * - Factures dans différents états
 * - Écritures comptables
 * - Données RH complètes
 * - Mouvements de stock
 */

import path from 'path';
import { randomUUID } from 'crypto';

// Importer Prisma Client depuis le backend
const prismaModule = require(path.resolve(__dirname, '../../backend/node_modules/.prisma/client'));
const { PrismaClient, Prisma } = prismaModule;
const { Decimal } = require('@prisma/client/runtime/library');
// Importer bcrypt depuis le backend
const bcrypt = require(path.resolve(__dirname, '../../backend/node_modules/bcrypt'));

const prisma = new PrismaClient();

// Couleurs pour les avatars
const avatarColors = [
  'linear-gradient(to bottom right, #0D3B66, #0A2E4D)',
  'linear-gradient(to bottom right, #FFC107, #E6A800)',
  'linear-gradient(to bottom right, #1FAB89, #188A6F)',
  'linear-gradient(to bottom right, #EF4444, #DC2626)',
  'linear-gradient(to bottom right, #8B5CF6, #7C3AED)',
];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helper pour générer les données de base (id, timestamps)
function getBaseData() {
  const now = new Date();
  return {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
  };
}

async function main() {
  console.log('🌱 Création des données de démonstration...\n');

  try {
    // 1. Créer les entreprises de test
    console.log('📦 Création des entreprises...');
    
    const companies = [
      {
        name: 'Le Bon Pain',
        business_name: 'Le Bon Pain SARL',
        email: 'contact@lebonpain.cd',
        phone: '+243900000001',
        address: 'Avenue Kasa-Vubu 123',
        city: 'Kinshasa',
        country: 'RDC',
        currency: 'CDF',
        business_type: 'commerce',
        module_facturation_enabled: true,
        module_comptabilite_enabled: true,
        module_stock_enabled: true,
        module_rh_enabled: true,
        stock_management_type: 'fifo',
        stock_tracking_type: 'batch',
        stock_allow_negative: false,
        stock_valuation_method: 'fifo',
        rh_organization_type: 'hierarchical',
        rh_payroll_enabled: true,
        rh_payroll_cycle: 'monthly',
        rh_accounting_integration: true,
        datarissage_completed: true,
        datarissage_completed_at: new Date(),
        invoice_prefix: 'FAC',
        next_invoice_number: 100,
      },
      {
        name: 'Tech Solutions RDC',
        business_name: 'Tech Solutions RDC SARL',
        email: 'info@techsolutions.cd',
        phone: '+243900000002',
        address: 'Boulevard du 30 Juin 456',
        city: 'Kinshasa',
        country: 'RDC',
        currency: 'USD',
        business_type: 'services',
        module_facturation_enabled: true,
        module_comptabilite_enabled: true,
        module_stock_enabled: false,
        module_rh_enabled: true,
        rh_organization_type: 'flat',
        rh_payroll_enabled: true,
        rh_payroll_cycle: 'monthly',
        rh_accounting_integration: true,
        datarissage_completed: true,
        datarissage_completed_at: new Date(),
        invoice_prefix: 'INV',
        next_invoice_number: 50,
      },
      {
        name: 'Agro Distribution',
        business_name: 'Agro Distribution SPRL',
        email: 'contact@agrodist.cd',
        phone: '+243900000003',
        address: 'Route de Matadi 789',
        city: 'Kinshasa',
        country: 'RDC',
        currency: 'CDF',
        business_type: 'logistique',
        module_facturation_enabled: true,
        module_comptabilite_enabled: true,
        module_stock_enabled: true,
        module_rh_enabled: false,
        stock_management_type: 'lifo',
        stock_tracking_type: 'serial',
        stock_allow_negative: false,
        stock_valuation_method: 'average',
        datarissage_completed: true,
        datarissage_completed_at: new Date(),
        invoice_prefix: 'AGR',
        next_invoice_number: 200,
      },
    ];

    const createdCompanies = [];
    for (const companyData of companies) {
      const existing = await prisma.companies.findFirst({
        where: { email: companyData.email },
      });

      if (existing) {
        console.log(`  ⚠️  Entreprise ${companyData.name} existe déjà`);
        createdCompanies.push(existing);
      } else {
        const now = new Date();
        const company = await prisma.companies.create({
          data: {
            id: randomUUID(),
            created_at: now,
            updated_at: now,
          },
        });
        console.log(`  ✅ ${company.name} créée`);
        createdCompanies.push(company);
      }
    }

    // 2. Créer les utilisateurs par rôle
    console.log('\n👥 Création des utilisateurs...');
    
    const passwordHash = await hashPassword('Demo123!@#');
    const usersData = [];

    for (const company of createdCompanies) {
      // Owner
      usersData.push({
        email: `owner@${company.email.split('@')[1]}`,
        passwordHash,
        first_name: 'Propriétaire',
        last_name: company.name.split(' ')[0],
        role: 'owner',
        company_id: company.id,
        email_verified: true,
      });

      // Admin
      usersData.push({
        email: `admin@${company.email.split('@')[1]}`,
        passwordHash,
        first_name: 'Admin',
        last_name: company.name.split(' ')[0],
        role: 'admin',
        company_id: company.id,
        email_verified: true,
      });

      // Comptable
      usersData.push({
        email: `comptable@${company.email.split('@')[1]}`,
        passwordHash,
        first_name: 'Comptable',
        last_name: company.name.split(' ')[0],
        role: 'accountant',
        company_id: company.id,
        email_verified: true,
      });

      // RH
      if (company.module_rh_enabled) {
        usersData.push({
          email: `rh@${company.email.split('@')[1]}`,
          passwordHash,
          first_name: 'RH',
          last_name: company.name.split(' ')[0],
        role: 'rh',
        company_id: company.id,
          email_verified: true,
        });
      }

      // Manager
      usersData.push({
        email: `manager@${company.email.split('@')[1]}`,
        passwordHash,
        first_name: 'Manager',
        last_name: company.name.split(' ')[0],
        role: 'manager',
        company_id: company.id,
        email_verified: true,
      });

      // Employé
      usersData.push({
        email: `employe@${company.email.split('@')[1]}`,
        passwordHash,
        first_name: 'Employé',
        last_name: company.name.split(' ')[0],
        role: 'employee',
        company_id: company.id,
        email_verified: true,
      });
    }

    const createdUsers = [];
    for (const userData of usersData) {
      const existing = await prisma.users.findFirst({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`  ⚠️  Utilisateur ${userData.email} existe déjà`);
        createdUsers.push(existing);
      } else {
        const user = await prisma.users.create({
          data: {
            email: userData.email,
            password_hash: userData.passwordHash,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            company_id: userData.company_id,
            email_verified: userData.email_verified || false,
          },
        });
        console.log(`  ✅ ${user.email} (${user.role}) créé`);
        createdUsers.push(user);
      }
    }

    // 3. Créer clients et fournisseurs
    console.log('\n👤 Création des clients et fournisseurs...');
    
    const customersData = [
      { name: 'Restaurant Le Jardin', type: 'business', email: 'contact@lejardin.cd', phone: '+243900100001' },
      { name: 'Hôtel Grand', type: 'business', email: 'reservation@grandhotel.cd', phone: '+243900100002' },
      { name: 'Super Marché Central', type: 'business', email: 'info@supermarche.cd', phone: '+243900100003' },
      { name: 'Jean Kabila', type: 'particulier', first_name: 'Jean', last_name: 'Kabila', email: 'jean.kabila@email.cd', phone: '+243900100004' },
      { name: 'Marie Tshisekedi', type: 'particulier', first_name: 'Marie', last_name: 'Tshisekedi', email: 'marie.tshi@email.cd', phone: '+243900100005' },
    ];

    const suppliersData = [
      { name: 'Fournisseur Alimentaire SA', email: 'contact@fournisseur-alim.cd', phone: '+243900200001' },
      { name: 'Distributeur Général', email: 'info@distributeur.cd', phone: '+243900200002' },
      { name: 'Import Export RDC', email: 'contact@importexport.cd', phone: '+243900200003' },
    ];

    const createdCustomers = [];
    for (const company of createdCompanies) {
      for (const customerData of customersData) {
        const existing = await prisma.customers.findFirst({
          where: {
            company_id: company.id,
            ...(customerData.type === 'business'
              ? { business_name: customerData.name }
              : { first_name: (customerData as any).firstName, last_name: (customerData as any).lastName }),
          },
        });

        if (!existing) {
          const customer = await prisma.customers.create({
            data: {
              ...getBaseData(),
              company_id: company.id,
              type: customerData.type,
              ...(customerData.type === 'business'
                ? { business_name: customerData.name, email: customerData.email, phone: customerData.phone }
                : {
                    first_name: (customerData as any).firstName,
                    last_name: (customerData as any).lastName,
                    email: customerData.email,
                    phone: customerData.phone,
                  }),
            },
          });
          createdCustomers.push(customer);
        }
      }
    }
    console.log(`  ✅ ${createdCustomers.length} clients créés`);

    const createdSuppliers = [];
    for (const company of createdCompanies) {
      for (const supplierData of suppliersData) {
        const existing = await prisma.suppliers.findFirst({
          where: { company_id: company.id, name: supplierData.name },
        });

        if (!existing) {
          const supplier = await prisma.suppliers.create({
            data: {
              ...getBaseData(),
              company_id: company.id,
              name: supplierData.name,
              email: supplierData.email,
              phone: supplierData.phone,
            },
          });
          createdSuppliers.push(supplier);
        }
      }
    }
    console.log(`  ✅ ${createdSuppliers.length} fournisseurs créés`);

    // 4. Créer produits avec stock (pour les entreprises avec stock)
    console.log('\n📦 Création des produits...');
    
    const productsData = [
      { name: 'Pain blanc', sku: 'PAIN-001', price: 500, cost: 300, tax_rate: 0, min_stock: 50 },
      { name: 'Pain complet', sku: 'PAIN-002', price: 600, cost: 350, tax_rate: 0, min_stock: 30 },
      { name: 'Croissant', sku: 'CROI-001', price: 800, cost: 400, tax_rate: 0, min_stock: 40 },
      { name: 'Baguette', sku: 'BAGU-001', price: 400, cost: 200, tax_rate: 0, min_stock: 60 },
      { name: 'Service conseil', sku: 'SERV-001', price: 50000, cost: 0, tax_rate: 16, min_stock: 0 },
      { name: 'Développement web', sku: 'DEV-001', price: 150000, cost: 0, tax_rate: 16, min_stock: 0 },
      { name: 'Riz 25kg', sku: 'RIZ-001', price: 25000, cost: 20000, tax_rate: 0, min_stock: 100 },
      { name: 'Huile 5L', sku: 'HUI-001', price: 15000, cost: 12000, tax_rate: 0, min_stock: 50 },
    ];

    const createdProducts = [];
    for (const company of createdCompanies) {
      if (company.moduleStockEnabled) {
        // Produits avec stock
        for (const productData of productsData.filter(p => p.minStock > 0)) {
          const existing = await prisma.products.findFirst({
            where: { company_id: company.id, sku: productData.sku },
          });

          if (!existing) {
            const product = await prisma.products.create({
              data: {
                ...getBaseData(),
                company_id: company.id,
                name: productData.name,
                sku: productData.sku,
                price: new Decimal(productData.price),
                cost: new Decimal(productData.cost),
                tax_rate: new Decimal(productData.taxRate),
                min_stock: productData.minStock,
                is_active: true,
              },
            });
            createdProducts.push(product);
          }
        }
      } else {
        // Produits sans stock (services)
        for (const productData of productsData.filter(p => p.minStock === 0)) {
          const existing = await prisma.products.findFirst({
            where: { company_id: company.id, sku: productData.sku },
          });

          if (!existing) {
            const product = await prisma.products.create({
              data: {
                ...getBaseData(),
                company_id: company.id,
                name: productData.name,
                sku: productData.sku,
                price: new Decimal(productData.price),
                cost: new Decimal(productData.cost),
                tax_rate: new Decimal(productData.taxRate),
                is_active: true,
              },
            });
            createdProducts.push(product);
          }
        }
      }
    }
    console.log(`  ✅ ${createdProducts.length} produits créés`);

    // 5. Créer factures dans différents états
    console.log('\n📄 Création des factures...');
    
    const invoices = [];
    for (const company of createdCompanies) {
      const companyCustomers = await prisma.customers.findMany({
        where: { company_id: company.id },
        take: 3,
      });
      const companyProducts = await prisma.products.findMany({
        where: { company_id: company.id },
        take: 3,
      });

      if (companyCustomers.length > 0 && companyProducts.length > 0) {
        // Facture draft
        const draftInvoice = await prisma.invoices.create({
          data: {
            ...getBaseData(),
            company_id: company.id,
            customer_id: companyCustomers[0].id,
            invoice_number: `${company.invoice_prefix}-${company.next_invoice_number}`,
            invoice_date: new Date(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'draft',
            currency: company.currency,
            subtotal: 100000,
            tax_amount: 16000,
            total_amount: 116000,
            invoice_lines: {
              create: [
                {
                  id: randomUUID(),
                  created_at: new Date(),
                  updated_at: new Date(),
                  product_id: companyProducts[0].id,
                  description: companyProducts[0].name,
                  quantity: 2,
                  unit_price: 50000,
                  tax_rate: 16,
                  line_total: 116000,
                },
              ],
            },
          },
        });
        invoices.push(draftInvoice);

        // Facture validée
        const validatedInvoice = await prisma.invoices.create({
          data: {
            customer_id: companyCustomers[1]?.id || companyCustomers[0].id,
            invoice_number: `${company.invoice_prefix}-${company.next_invoice_number! + 1}`,
            invoice_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            status: 'validated',
            currency: company.currency,
            subtotal: 200000,
            tax_amount: 32000,
            total_amount: 232000,
            validated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
            invoice_lines: {
              create: [
                {
                  id: randomUUID(),
                  created_at: new Date(),
                  updated_at: new Date(),
                  product_id: companyProducts[1]?.id || companyProducts[0].id,
                  description: companyProducts[1]?.name || companyProducts[0].name,
                  quantity: 4,
                  unit_price: 50000,
                  tax_rate: 16,
                  line_total: 232000,
                },
              ],
            },
          },
        });
        invoices.push(validatedInvoice);

        // Facture payée
        const paidInvoice = await prisma.invoices.create({
          data: {
            customer_id: companyCustomers[2]?.id || companyCustomers[0].id,
            invoice_number: `${company.invoice_prefix}-${company.next_invoice_number! + 2}`,
            invoice_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            status: 'paid',
            currency: company.currency,
            subtotal: 150000,
            tax_amount: 24000,
            total_amount: 174000,
            paid_amount: 174000,
            validated_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
            paid_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            invoice_lines: {
              create: [
                {
                  id: randomUUID(),
                  created_at: new Date(),
                  updated_at: new Date(),
                  product_id: companyProducts[2]?.id || companyProducts[0].id,
                  description: companyProducts[2]?.name || companyProducts[0].name,
                  quantity: 3,
                  unit_price: 50000,
                  tax_rate: 16,
                  line_total: 174000,
                },
              ],
            },
          },
        });
        invoices.push(paidInvoice);
      }
    }
    console.log(`  ✅ ${invoices.length} factures créées`);

    // 6. Créer paiements
    console.log('\n💳 Création des paiements...');
    
    const payments = [];
    for (const invoice of invoices.filter(i => i.status === 'paid' || i.status === 'validated')) {
      const payment = await prisma.payments.create({
        data: {
          invoiceId: invoice.id,
          customer_id: invoice.customerId,
          amount: invoice.status === 'paid' ? invoice.total_amount: invoice.totalAmount / 2,
          currency: invoice.currency,
          paymentDate: invoice.status === 'paid' ? invoice.paidAt! : new Date(),
          paymentMethod: 'bank_transfer',
          status: invoice.status === 'paid' ? 'completed' : 'pending',
        },
      });
      payments.push(payment);
    }
    console.log(`  ✅ ${payments.length} paiements créés`);

    // 7. Créer périodes fiscales
    console.log('\n📅 Création des périodes fiscales...');
    
    const periods = [];
    for (const company of createdCompanies) {
      if (company.moduleComptabiliteEnabled) {
        const currentYear = new Date().getFullYear();
        const period = await prisma.fiscalPeriods.create({
          data: {
            name: `Exercice ${currentYear}`,
            startDate: new Date(currentYear, 0, 1),
            endDate: new Date(currentYear, 11, 31),
            isClosed: false,
            isLocked: false,
          },
        });
        periods.push(period);
      }
    }
    console.log(`  ✅ ${periods.length} périodes fiscales créées`);

    // 8. Créer données RH (pour les entreprises avec module RH)
    console.log('\n👔 Création des données RH...');
    
    let employeesCount = 0;
    for (const company of createdCompanies) {
      if (company.module_rh_enabled) {
        const companyUsers = await prisma.users.findMany({
          where: { company_id: company.id, role: { in: ['rh', 'employee', 'manager'] } },
          take: 5,
        });

        for (let i = 0; i < companyUsers.length; i++) {
          const user = companyUsers[i];
          const employeeNumber = `EMP-${company.id.slice(0, 8).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;

          const existing = await prisma.employees.findFirst({
            where: { company_id: company.id, employeeNumber },
          });

          if (!existing) {
            const employee = await prisma.employees.create({
              data: {
                employeeNumber,
                first_name: user.firstName || 'Employé',
                last_name: user.lastName || 'Test',
                email: user.email,
                phone: `+243900${3000 + i}`,
                hireDate: new Date(Date.now() - (i + 1) * 365 * 24 * 60 * 60 * 1000),
                status: 'active',
                baseSalary: 500000 + i * 100000,
                currency: company.currency,
                position: i === 0 ? 'Responsable RH' : i === 1 ? 'Manager' : 'Employé',
                department: 'Administration',
              },
            });

            // Créer un contrat
            await prisma.employeeContracts.create({
              data: {
                employeeId: employee.id,
                contractType: 'cdi',
                startDate: employee.hireDate,
                baseSalary: employee.baseSalary,
                currency: company.currency,
                workType: 'full_time',
                hoursPerWeek: 40,
                status: 'active',
              },
            });

            employeesCount++;
          }
        }
      }
    }
    console.log(`  ✅ ${employeesCount} employés et contrats créés`);

    // 9. Créer mouvements de stock (pour les entreprises avec stock)
    console.log('\n📦 Création des mouvements de stock...');
    
    let movementsCount = 0;
    for (const company of createdCompanies) {
      if (company.moduleStockEnabled) {
        const companyProducts = await prisma.products.findMany({
          where: { company_id: company.id },
          take: 3,
        });

        const warehouses = await prisma.warehouses.findMany({
          where: { company_id: company.id },
        });

        let defaultWarehouse;
        if (warehouses.length === 0) {
          defaultWarehouse = await prisma.warehouses.create({
            data: {
              ...getBaseData(),
              company_id: company.id,
              name: 'Entrepôt Principal',
              code: 'WH-001',
              address: company.address || '',
              city: company.city || '',
              is_active: true,
            },
          });
        } else {
          defaultWarehouse = warehouses[0];
        }

        for (const product of companyProducts) {
          // Mouvement d'entrée (IN)
          const entryMovement = await prisma.stock_movements.create({
            data: {
              ...getBaseData(),
              company_id: company.id,
              movement_type: 'IN',
              reference: 'purchase',
              status: 'VALIDATED',
              validated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              reason: 'Stock initial',
              items: {
                create: [
                  {
                    id: randomUUID(),
                    product_id: product.id,
                    warehouse_id: defaultWarehouse.id,
                    quantity: new Decimal(100),
                    created_at: new Date(),
                  },
                ],
              },
            },
          });
          movementsCount++;

          // Mouvement de sortie (OUT)
          const exitMovement = await prisma.stock_movements.create({
            data: {
              ...getBaseData(),
              company_id: company.id,
              movement_type: 'OUT',
              reference: 'sale',
              status: 'VALIDATED',
              validated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              reason: 'Vente',
              items: {
                create: [
                  {
                    id: randomUUID(),
                    product_id: product.id,
                    warehouse_id: defaultWarehouse.id,
                    quantity: new Decimal(20),
                    created_at: new Date(),
                  },
                ],
              },
            },
          });
          movementsCount++;
        }
      }
    }
    console.log(`  ✅ ${movementsCount} mouvements de stock créés`);

    // 10. Créer devis (quotations)
    console.log('\n📋 Création des devis...');
    
    const quotations = [];
    for (const company of createdCompanies) {
      const companyCustomers = await prisma.customers.findMany({
        where: { company_id: company.id },
        take: 2,
      });
      const companyProducts = await prisma.products.findMany({
        where: { company_id: company.id },
        take: 2,
      });

      if (companyCustomers.length > 0 && companyProducts.length > 0) {
        // Devis draft
        const draftQuotation = await prisma.quotations.create({
          data: {
            customer_id: companyCustomers[0].id,
            quotationNumber: `${company.quotationPrefix || 'DEV'}-${company.nextQuotationNumber || 1}`,
            quotationDate: new Date(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'draft',
            currency: company.currency,
            subtotal: 80000,
            tax_amount: 12800,
            total_amount: 92800,
            quotationLines: {
              create: [
                {
                  id: randomUUID(),
                  created_at: new Date(),
                  updated_at: new Date(),
                  product_id: companyProducts[0].id,
                  description: companyProducts[0].name,
                  quantity: 1,
                  unit_price: 80000,
                  tax_rate: 16,
                  line_total: 92800,
                },
              ],
            },
          },
        });
        quotations.push(draftQuotation);

        // Devis envoyé
        const sentQuotation = await prisma.quotations.create({
          data: {
            customer_id: companyCustomers[1]?.id || companyCustomers[0].id,
            quotationNumber: `${company.quotationPrefix || 'DEV'}-${(company.nextQuotationNumber || 1) + 1}`,
            quotationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            expirationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            status: 'sent',
            currency: company.currency,
            subtotal: 120000,
            tax_amount: 19200,
            total_amount: 139200,
            sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            quotationLines: {
              create: [
                {
                  id: randomUUID(),
                  created_at: new Date(),
                  updated_at: new Date(),
                  product_id: companyProducts[1]?.id || companyProducts[0].id,
                  description: companyProducts[1]?.name || companyProducts[0].name,
                  quantity: 2,
                  unit_price: 60000,
                  tax_rate: 16,
                  line_total: 139200,
                },
              ],
            },
          },
        });
        quotations.push(sentQuotation);
      }
    }
    console.log(`  ✅ ${quotations.length} devis créés`);

    // 11. Créer notes de crédit
    console.log('\n📝 Création des notes de crédit...');
    
    const creditNotes = [];
    for (const company of createdCompanies) {
      const validatedInvoices = await prisma.invoices.findMany({
        where: { company_id: company.id, status: 'validated' },
        take: 1,
      });

      for (const invoice of validatedInvoices) {
        const creditNote = await prisma.creditNotes.create({
          data: {
            invoiceId: invoice.id,
            creditNoteNumber: `${company.creditNotePrefix || 'AV'}-${company.nextCreditNoteNumber || 1}`,
            creditNoteDate: new Date(),
            amount: invoice.subtotal,
            tax_amount: invoice.taxAmount,
            total_amount: invoice.totalAmount * 0.1, // 10% de remboursement
            status: 'draft',
            reason: 'Erreur de facturation',
            currency: invoice.currency,
          },
        });
        creditNotes.push(creditNote);
      }
    }
    console.log(`  ✅ ${creditNotes.length} notes de crédit créées`);

    // 12. Créer dépenses
    console.log('\n💰 Création des dépenses...');
    
    const expenses = [];
    for (const company of createdCompanies) {
      const companySuppliers = await prisma.suppliers.findMany({
        where: { company_id: company.id },
        take: 2,
      });

      if (companySuppliers.length > 0) {
        // Dépense draft
        const draftExpense = await prisma.expenses.create({
          data: {
            expenseNumber: `DEP-${Date.now()}`,
            expenseDate: new Date(),
            supplier_id: companySuppliers[0].id,
            description: 'Achat de matériel de bureau',
            amount: 50000,
            tax_amount: 8000,
            total_amount: 58000,
            currency: company.currency,
            status: 'draft',
            paymentMethod: 'cash',
          },
        });
        expenses.push(draftExpense);

        // Dépense validée
        const validatedExpense = await prisma.expenses.create({
          data: {
            expenseNumber: `DEP-${Date.now() + 1}`,
            expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            supplier_id: companySuppliers[1]?.id || companySuppliers[0].id,
            description: 'Frais de transport',
            amount: 30000,
            tax_amount: 4800,
            total_amount: 34800,
            currency: company.currency,
            status: 'validated',
            validated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            paymentMethod: 'bank_transfer',
          },
        });
        expenses.push(validatedExpense);
      }
    }
    console.log(`  ✅ ${expenses.length} dépenses créées`);

    // 13. Créer comptes comptables
    console.log('\n📊 Création des comptes comptables...');
    
    const accounts = [];
    const accountCodes = [
      { code: '411', name: 'Clients', type: 'asset', category: 'current_asset' },
      { code: '401', name: 'Fournisseurs', type: 'liability', category: 'current_liability' },
      { code: '512', name: 'Banque', type: 'asset', category: 'current_asset' },
      { code: '531', name: 'Caisse', type: 'asset', category: 'current_asset' },
      { code: '701', name: 'Ventes de produits', type: 'revenue', category: 'revenue' },
      { code: '601', name: 'Achats', type: 'expense', category: 'expense' },
      { code: '421', name: 'Personnel', type: 'liability', category: 'current_liability' },
    ];

    for (const company of createdCompanies) {
      if (company.moduleComptabiliteEnabled) {
        for (const accountData of accountCodes) {
          const existing = await prisma.accounts.findFirst({
            where: { company_id: company.id, code: accountData.code },
          });

          if (!existing) {
            const account = await prisma.accounts.create({
              data: {
                code: accountData.code,
                name: accountData.name,
                type: accountData.type,
                category: accountData.category,
                is_active: true,
                balance: new Decimal(0),
              },
            });
            accounts.push(account);
          }
        }
      }
    }
    console.log(`  ✅ ${accounts.length} comptes comptables créés`);

    // 14. Créer écritures comptables
    console.log('\n📔 Création des écritures comptables...');
    
    const journalEntries = [];
    for (const company of createdCompanies) {
      if (company.moduleComptabiliteEnabled) {
        const companyAccounts = await prisma.accounts.findMany({
          where: { company_id: company.id },
          take: 4,
        });

        if (companyAccounts.length >= 2) {
          // Écriture draft
          const draftEntry = await prisma.journalEntries.create({
            data: {
              entryNumber: `ECR-${Date.now()}`,
              entryDate: new Date(),
              description: 'Écriture de test',
              sourceType: 'manual',
              status: 'draft',
              journalEntryLines: {
                create: [
                  {
                    accountId: companyAccounts[0].id,
                    description: 'Débit',
                    debit: new Decimal(100000),
                    credit: new Decimal(0),
                  },
                  {
                    accountId: companyAccounts[1].id,
                    description: 'Crédit',
                    debit: new Decimal(0),
                    credit: new Decimal(100000),
                  },
                ],
              },
            },
          });
          journalEntries.push(draftEntry);

          // Écriture validée
          const postedEntry = await prisma.journalEntries.create({
            data: {
              entryNumber: `ECR-${Date.now() + 1}`,
              entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              description: 'Écriture validée',
              sourceType: 'manual',
              status: 'posted',
              postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
              journalEntryLines: {
                create: [
                  {
                    accountId: companyAccounts[2]?.id || companyAccounts[0].id,
                    description: 'Débit',
                    debit: new Decimal(50000),
                    credit: new Decimal(0),
                  },
                  {
                    accountId: companyAccounts[3]?.id || companyAccounts[1].id,
                    description: 'Crédit',
                    debit: new Decimal(0),
                    credit: new Decimal(50000),
                  },
                ],
              },
            },
          });
          journalEntries.push(postedEntry);
        }
      }
    }
    console.log(`  ✅ ${journalEntries.length} écritures comptables créées`);

    // 15. Créer factures partiellement payées et annulées
    console.log('\n📄 Création de factures supplémentaires...');
    
    let additionalInvoices = 0;
    for (const company of createdCompanies) {
      const companyCustomers = await prisma.customers.findMany({
        where: { company_id: company.id },
        take: 1,
      });
      const companyProducts = await prisma.products.findMany({
        where: { company_id: company.id },
        take: 1,
      });

      if (companyCustomers.length > 0 && companyProducts.length > 0) {
        // Facture partiellement payée
        const partialInvoice = await prisma.invoices.create({
          data: {
            customer_id: companyCustomers[0].id,
            invoice_number: `${company.invoice_prefix}-${company.next_invoice_number! + 10}`,
            invoice_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            status: 'partially_paid',
            currency: company.currency,
            subtotal: 300000,
            tax_amount: 48000,
            total_amount: 348000,
            paid_amount: 174000,
            validated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            invoice_lines: {
              create: [
                {
                  id: randomUUID(),
                  created_at: new Date(),
                  updated_at: new Date(),
                  product_id: companyProducts[0].id,
                  description: companyProducts[0].name,
                  quantity: 6,
                  unit_price: 50000,
                  tax_rate: 16,
                  line_total: 348000,
                },
              ],
            },
          },
        });
        additionalInvoices++;

        // Paiement partiel
        await prisma.payments.create({
          data: {
            invoiceId: partialInvoice.id,
            customer_id: partialInvoice.customerId,
            amount: 174000,
            currency: company.currency,
            paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            paymentMethod: 'bank_transfer',
            status: 'completed',
          },
        });

        // Facture annulée
        const cancelledInvoice = await prisma.invoices.create({
          data: {
            customer_id: companyCustomers[0].id,
            invoice_number: `${company.invoice_prefix}-${company.next_invoice_number! + 11}`,
            invoice_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            due_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            status: 'cancelled',
            currency: company.currency,
            subtotal: 50000,
            tax_amount: 8000,
            total_amount: 58000,
            validated_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
            invoice_lines: {
              create: [
                {
                  id: randomUUID(),
                  created_at: new Date(),
                  updated_at: new Date(),
                  product_id: companyProducts[0].id,
                  description: companyProducts[0].name,
                  quantity: 1,
                  unit_price: 50000,
                  tax_rate: 16,
                  line_total: 58000,
                },
              ],
            },
          },
        });
        additionalInvoices++;
      }
    }
    console.log(`  ✅ ${additionalInvoices} factures supplémentaires créées`);

    // 16. Créer mouvements de stock ADJUSTMENT et TRANSFER
    console.log('\n📦 Création de mouvements de stock avancés...');
    
    let advancedMovements = 0;
    for (const company of createdCompanies) {
      if (company.moduleStockEnabled) {
        const companyProducts = await prisma.products.findMany({
          where: { company_id: company.id },
          take: 1,
        });
        const warehouses = await prisma.warehouses.findMany({
          where: { company_id: company.id },
        });

        if (companyProducts.length > 0 && warehouses.length > 0) {
          const product = companyProducts[0];
          const warehouse = warehouses[0];

          // Mouvement d'ajustement (ADJUSTMENT)
          const adjustmentMovement = await prisma.stock_movements.create({
            data: {
              movement_type: 'ADJUSTMENT',
              reference: 'adjustment',
              status: 'VALIDATED',
              validated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              reason: 'Ajustement inventaire',
              items: {
                create: [
                  {
                    id: randomUUID(),
                    created_at: new Date(),
                    updated_at: new Date(),
                    product_id: product.id,
                    warehouse_id: warehouse.id,
                    quantity: new Decimal(5),
                  },
                ],
              },
            },
          });
          advancedMovements++;

          // Transfert entre entrepôts (TRANSFER) - si plusieurs entrepôts
          if (warehouses.length > 1) {
            const transferMovement = await prisma.stock_movements.create({
              data: {
                movement_type: 'TRANSFER',
                reference: 'transfer',
                status: 'VALIDATED',
                validated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                reason: 'Transfert entre entrepôts',
                items: {
                  create: [
                    {
                      id: randomUUID(),
                      created_at: new Date(),
                      updated_at: new Date(),
                      product_id: product.id,
                      warehouse_id: warehouse.id, // Source
                      warehouseToId: warehouses[1].id, // Destination
                      quantity: new Decimal(10),
                    },
                  ],
                },
              },
            });
            advancedMovements++;
          }
        }
      }
    }
    console.log(`  ✅ ${advancedMovements} mouvements de stock avancés créés`);

    // 17. Créer paies validées
    console.log('\n💼 Création des paies...');
    
    let payrollsCount = 0;
    for (const company of createdCompanies) {
      if (company.module_rh_enabled && company.rh_payroll_enabled) {
        const companyEmployees = await prisma.employees.findMany({
          where: { company_id: company.id, status: 'active' },
          take: 2,
        });

        for (const employee of companyEmployees) {
          const contract = await prisma.employeeContracts.findFirst({
            where: { employeeId: employee.id, status: 'active' },
          });

          if (contract) {
            const periodStart = new Date();
            periodStart.setDate(1); // Premier jour du mois
            const periodEnd = new Date(periodStart);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            periodEnd.setDate(0); // Dernier jour du mois
            const payDate = new Date(periodEnd);
            payDate.setDate(payDate.getDate() + 5); // 5 jours après la fin du mois

            const grossSalary = contract.baseSalary;
            const totalDeductions = grossSalary * 0.15; // 15% de déductions
            const netSalary = grossSalary - totalDeductions;

            const payroll = await prisma.payrolls.create({
              data: {
                employeeId: employee.id,
                periodStart: periodStart,
                periodEnd: periodEnd,
                payDate: payDate,
                grossSalary: new Decimal(grossSalary),
                totalDeductions: new Decimal(totalDeductions),
                netSalary: new Decimal(netSalary),
                currency: company.currency,
                status: 'validated',
              },
            });
            payrollsCount++;
          }
        }
      }
    }
    console.log(`  ✅ ${payrollsCount} paies créées`);

    // 18. Créer demandes de congés
    console.log('\n🏖️  Création des demandes de congés...');
    
    let leaveRequestsCount = 0;
    for (const company of createdCompanies) {
      if (company.module_rh_enabled) {
        const companyEmployees = await prisma.employees.findMany({
          where: { company_id: company.id, status: 'active' },
          take: 2,
        });

        for (const employee of companyEmployees) {
          const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const endDate = new Date(Date.now() + 37 * 24 * 60 * 60 * 1000);
          const daysRequested = new Decimal(7);

          const leaveRequest = await prisma.leaveRequests.create({
            data: {
              employeeId: employee.id,
              leaveType: 'annual',
              startDate: startDate,
              endDate: endDate,
              daysRequested: daysRequested,
              status: 'pending',
              reason: 'Congés annuels',
            },
          });
          leaveRequestsCount++;
        }
      }
    }
    console.log(`  ✅ ${leaveRequestsCount} demandes de congés créées`);

    // 19. Créer pointages
    console.log('\n⏰ Création des pointages...');
    
    let attendancesCount = 0;
    for (const company of createdCompanies) {
      if (company.module_rh_enabled) {
        const companyEmployees = await prisma.employees.findMany({
          where: { company_id: company.id, status: 'active' },
          take: 3,
        });

        for (const employee of companyEmployees) {
          for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(8, 0, 0, 0);

            const checkIn = new Date(date);
            checkIn.setHours(8, 30, 0, 0);

            const checkOut = new Date(date);
            checkOut.setHours(17, 0, 0, 0);

            const existing = await prisma.attendances.findFirst({
              where: {
                company_id: company.id,
                employeeId: employee.id,
                date: date,
              },
            });

            if (!existing) {
              await prisma.attendances.create({
                data: {
                  employeeId: employee.id,
                  date: date,
                  checkIn: checkIn,
                  checkOut: checkOut,
                  hoursWorked: new Decimal(8.5),
                  status: 'present',
                },
              });
              attendancesCount++;
            }
          }
        }
      }
    }
    console.log(`  ✅ ${attendancesCount} pointages créés`);

    // 20. Créer période clôturée (pour tester les verrous)
    console.log('\n🔒 Création de périodes clôturées...');
    
    let closedPeriodsCount = 0;
    for (const company of createdCompanies) {
      if (company.moduleComptabiliteEnabled) {
        const lastYear = new Date().getFullYear() - 1;
        const closedPeriod = await prisma.fiscalPeriods.create({
          data: {
            name: `Exercice ${lastYear}`,
            startDate: new Date(lastYear, 0, 1),
            endDate: new Date(lastYear, 11, 31),
            isClosed: true,
            isLocked: true,
            closedAt: new Date(lastYear, 11, 31),
          },
        });
        closedPeriodsCount++;
      }
    }
    console.log(`  ✅ ${closedPeriodsCount} périodes clôturées créées`);

    // 21. Créer expert-comptable (pour tester multi-sociétés)
    console.log('\n👔 Création d\'expert-comptable...');
    
    let accountantsCount = 0;
    if (createdCompanies.length >= 2) {
      const accountantUser = await prisma.users.findFirst({
        where: { role: 'accountant', company_id: createdCompanies[0].id },
      });

      if (accountantUser) {
        // Lier l'expert-comptable à une deuxième entreprise
        const accountantLink = await prisma.companyAccountants.create({
          data: {
            userId: accountantUser.id,
            permissions: ['read_accounting', 'validate_entries'],
            is_active: true,
          },
        });
        accountantsCount++;
      }
    }
    console.log(`  ✅ ${accountantsCount} liens expert-comptable créés`);

    console.log('\n✅ Données de démonstration créées avec succès !\n');
    console.log('📋 Résumé complet :');
    console.log(`  - ${createdCompanies.length} entreprises`);
    console.log(`  - ${createdUsers.length} utilisateurs`);
    console.log(`  - ${createdCustomers.length} clients`);
    console.log(`  - ${createdSuppliers.length} fournisseurs`);
    console.log(`  - ${createdProducts.length} produits`);
    console.log(`  - ${invoices.length + additionalInvoices} factures (draft, validated, paid, partially_paid, cancelled)`);
    console.log(`  - ${payments.length} paiements`);
    console.log(`  - ${quotations.length} devis (draft, sent)`);
    console.log(`  - ${creditNotes.length} notes de crédit`);
    console.log(`  - ${expenses.length} dépenses`);
    console.log(`  - ${accounts.length} comptes comptables`);
    console.log(`  - ${journalEntries.length} écritures comptables`);
    console.log(`  - ${periods.length + closedPeriodsCount} périodes fiscales (ouvertes et clôturées)`);
    console.log(`  - ${employeesCount} employés`);
    console.log(`  - ${movementsCount + advancedMovements} mouvements de stock (purchase, sale, adjustment, transfer)`);
    console.log(`  - ${payrollsCount} paies validées`);
    console.log(`  - ${leaveRequestsCount} demandes de congés`);
    console.log(`  - ${attendancesCount} pointages`);
    console.log(`  - ${accountantsCount} liens expert-comptable`);
    console.log('\n🔑 Identifiants de test :');
    console.log('  Email: owner@lebonpain.cd (ou admin@, comptable@, rh@, manager@, employe@)');
    console.log('  Mot de passe: Demo123!@#');
    console.log('\n📌 Tous les processus métier sont couverts pour les tests !');
    console.log('\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
