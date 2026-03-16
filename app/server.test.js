/**
 * Integration tests for the SecureFin API.
 * Uses supertest — no real HTTP server is started.
 * LOG_LEVEL=silent suppresses pino output during test runs (set in package.json test script).
 */

'use strict';

const request = require('supertest');
const app = require('./server');

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /metrics', () => {
  it('returns 200 with Prometheus text format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('securefin_transactions_total');
    expect(res.text).toContain('securefin_http_request_duration_seconds');
  });
});

describe('POST /transactions', () => {
  it('creates a transaction and returns 201', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ amount: 42.5, currency: 'usd', description: 'Coffee' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.amount).toBe(42.5);
    expect(res.body.currency).toBe('USD');
    expect(res.body.description).toBe('Coffee');
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 400 when amount is missing', async () => {
    const res = await request(app).post('/transactions').send({ currency: 'USD' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await request(app).post('/transactions').send({ amount: -10, currency: 'USD' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when currency is missing', async () => {
    const res = await request(app).post('/transactions').send({ amount: 10 });
    expect(res.status).toBe(400);
  });
});

describe('GET /transactions', () => {
  it('returns paginated transaction list', async () => {
    const res = await request(app).get('/transactions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.limit).toBe('number');
    expect(typeof res.body.offset).toBe('number');
  });

  it('filters by currency', async () => {
    await request(app).post('/transactions').send({ amount: 100, currency: 'EUR' });
    const res = await request(app).get('/transactions?currency=EUR');
    expect(res.status).toBe(200);
    res.body.data.forEach((t) => expect(t.currency).toBe('EUR'));
  });
});
