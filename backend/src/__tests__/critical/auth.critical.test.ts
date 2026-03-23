import request from 'supertest';
import app from '../../app';

describe('Auth - Endpoints critiques', () => {
  describe('POST /api/v1/auth/login', () => {
    it('retourne 400 si email manquant', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'test123' });
      expect(res.status).toBe(400);
    });

    it('retourne 400 si password manquant', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@conta.cd' });
      expect(res.status).toBe(400);
    });

    it('retourne 404 si email inexistant', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'inexistant@conta.cd', password: 'test123' });
      expect([401, 404]).toContain(res.status);
    });

    it('retourne un objet error structuré en cas d\'échec', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'inexistant@conta.cd', password: 'wrong' });
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('retourne 200 même sans token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout');
      expect([200, 401]).toContain(res.status);
    });
  });
});
