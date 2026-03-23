import request from 'supertest';
import app from '../../app';

describe('Health Check - Endpoint critique', () => {
  it('GET /api/v1/health retourne 200 ou 503', async () => {
    const res = await request(app).get('/api/v1/health');
    expect([200, 503]).toContain(res.status);
  });

  it('retourne les champs requis', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('services');
    expect(res.body).toHaveProperty('memory');
  });

  it('services contient database et redis', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.body.services).toHaveProperty('database');
    expect(res.body.services).toHaveProperty('redis');
  });
});
