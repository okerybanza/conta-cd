// Fixtures de données pour les tests E2E
// Définit des données de test standardisées et réutilisables

export const PLAN_FIXTURES = {
  FREE: {
    name: 'Plan Gratuit',
    description: 'Plan gratuit avec limitations',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly' as const,
    limits: {
      customers: 10,
      products: 20,
      invoices: 50,
      users: 1,
      storage: 100, // 100 MB
    },
    features: ['basic_invoicing', 'basic_reports'],
    isActive: true,
  },
  STARTER: {
    name: 'Plan Starter',
    description: 'Plan starter pour petites entreprises',
    price: 29.99,
    currency: 'USD',
    billingPeriod: 'monthly' as const,
    limits: {
      customers: 100,
      products: 500,
      invoices: 1000,
      users: 3,
      storage: 1000, // 1 GB
    },
    features: ['advanced_invoicing', 'recurring_invoices', 'basic_reports', 'email_support'],
    isActive: true,
  },
  PROFESSIONAL: {
    name: 'Plan Professional',
    description: 'Plan professionnel pour entreprises en croissance',
    price: 99.99,
    currency: 'USD',
    billingPeriod: 'monthly' as const,
    limits: {
      customers: 1000,
      products: 5000,
      invoices: 10000,
      users: 10,
      storage: 10000, // 10 GB
    },
    features: [
      'advanced_invoicing',
      'recurring_invoices',
      'credit_notes',
      'quotations',
      'advanced_reports',
      'accounting',
      'priority_support',
    ],
    isActive: true,
  },
  ENTERPRISE: {
    name: 'Plan Enterprise',
    description: 'Plan entreprise avec fonctionnalités illimitées',
    price: 299.99,
    currency: 'USD',
    billingPeriod: 'monthly' as const,
    limits: {
      customers: -1, // Illimité
      products: -1,
      invoices: -1,
      users: -1,
      storage: -1,
    },
    features: [
      'all_features',
      'custom_integrations',
      'dedicated_support',
      'custom_reports',
      'api_access',
    ],
    isActive: true,
  },
};

export const USER_FIXTURES = {
  SUPERADMIN: {
    email: 'superadmin@conta.cd',
    password: 'superadmin123',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'superadmin',
  },
  ADMIN: {
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
  USER: {
    email: 'user@test.com',
    password: 'user123',
    firstName: 'Standard',
    lastName: 'User',
    role: 'user',
  },
};

export const COMPANY_FIXTURES = {
  STARTUP: {
    name: 'Test Startup',
    email: 'startup@test.com',
    phone: '+243812345678',
    address: '123 Test Street',
    city: 'Kinshasa',
    country: 'RDC',
    currency: 'CDF',
  },
  SME: {
    name: 'Test SME',
    email: 'sme@test.com',
    phone: '+243812345679',
    address: '456 Business Ave',
    city: 'Lubumbashi',
    country: 'RDC',
    currency: 'CDF',
  },
};

export const CUSTOMER_FIXTURES = {
  PARTICULIER: {
    type: 'particulier' as const,
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@test.com',
    phone: '+243900000001',
    address: '123 Client Street',
    city: 'Kinshasa',
    country: 'RDC',
  },
  ENTREPRISE: {
    type: 'entreprise' as const,
    businessName: 'Entreprise Test SARL',
    email: 'entreprise@test.com',
    phone: '+243900000002',
    nif: 'NIF123456',
    rccm: 'RCCM123456',
    address: '456 Business Ave',
    city: 'Kinshasa',
    country: 'RDC',
  },
};

export const PRODUCT_FIXTURES = {
  PRODUCT: {
    name: 'Produit Test',
    description: 'Description du produit test',
    price: 10000,
    taxRate: 16,
    type: 'product' as const,
    currentStock: 100,
    minStock: 10,
    unit: 'unité',
  },
  SERVICE: {
    name: 'Service Test',
    description: 'Description du service test',
    price: 50000,
    taxRate: 16,
    type: 'service' as const,
    unit: 'heure',
  },
};

