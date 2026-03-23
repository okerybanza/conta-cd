import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Conta.cd API',
      version: '1.0.0',
      description: 'API REST de Conta.cd — Comptabilité SYSCOHADA pour l\'Afrique Centrale',
      contact: {
        name: 'Support Conta',
        email: 'support@conta.cd',
        url: 'https://conta.cd',
      },
    },
    servers: [
      { url: 'https://conta.cd/api/v1', description: 'Production' },
      { url: 'http://localhost:3001/api/v1', description: 'Développement' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification et gestion des sessions' },
      { name: 'Invoices', description: 'Gestion des factures' },
      { name: 'Customers', description: 'Gestion des clients' },
      { name: 'Expenses', description: 'Gestion des dépenses' },
      { name: 'Payments', description: 'Gestion des paiements' },
      { name: 'Reporting', description: 'Rapports et analytics' },
      { name: 'OHADA', description: 'États financiers SYSCOHADA' },
      { name: 'Health', description: 'Monitoring et santé du système' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
