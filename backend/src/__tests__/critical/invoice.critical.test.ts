import request from 'supertest';
import app from '../../app';

describe('Invoices - Endpoints critiques', () => {
  describe('Sans authentification', () => {
    it('GET /api/v1/invoices retourne 401', async () => {
      const res = await request(app).get('/api/v1/invoices');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/invoices retourne 401', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .send({ customerId: 'test' });
      expect(res.status).toBe(401);
    });
  });

  describe('Structure de réponse', () => {
    it('erreur 401 a un format structuré', async () => {
      const res = await request(app).get('/api/v1/invoices');
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });
});
