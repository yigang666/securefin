/**
 * SecureFin — Transaction Recording Service
 *
 * Endpoints:
 *   GET  /health        — liveness/readiness probe
 *   GET  /metrics       — Prometheus metrics (scraped by ServiceMonitor)
 *   POST /transactions  — record a new transaction
 *   GET  /transactions  — list transactions (filter + paginate)
 *
 * Observability:
 *   - Structured JSON logging via pino (logger.js)
 *   - Prometheus metrics via prom-client (metrics.js)
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const { register, transactionCounter, httpRequestDuration } = require('./metrics');

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// ── Request logging + metrics middleware ──────────────────────────────────────
// Runs on every request. Records duration and emits a structured log line.
app.use((req, res, next) => {
  const startNs = process.hrtime.bigint();
  res.on('finish', () => {
    const durationSec = Number(process.hrtime.bigint() - startNs) / 1e9;
    const path = req.route ? req.route.path : req.path;
    httpRequestDuration.observe(
      { method: req.method, path, status: String(res.statusCode) },
      durationSec,
    );
    // Skip logging /health and /metrics to reduce noise
    if (path !== '/health' && path !== '/metrics') {
      logger.info(
        { method: req.method, path, status: res.statusCode, durationMs: (durationSec * 1000).toFixed(2) },
        'request',
      );
    }
  });
  next();
});

// ── In-memory data store ──────────────────────────────────────────────────────
// Replace with PostgreSQL / MongoDB for persistent production storage.
const transactions = [];

// ── GET /health ───────────────────────────────────────────────────────────────
// Kubernetes liveness and readiness probes hit this endpoint.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── GET /metrics ──────────────────────────────────────────────────────────────
// Prometheus scrapes this endpoint (configured via Helm ServiceMonitor).
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ── POST /transactions ────────────────────────────────────────────────────────
app.post('/transactions', (req, res) => {
  const { amount, currency, description } = req.body;

  if (amount === undefined || amount === null)
    return res.status(400).json({ error: '"amount" is required' });
  if (typeof amount !== 'number' || amount <= 0)
    return res.status(400).json({ error: '"amount" must be a positive number' });
  if (!currency || typeof currency !== 'string')
    return res.status(400).json({ error: '"currency" is required and must be a string' });

  const transaction = {
    id: uuidv4(),
    amount,
    currency: currency.toUpperCase(),
    description: description || '',
    timestamp: new Date().toISOString(),
  };

  transactions.push(transaction);

  // Increment Prometheus counter per currency
  transactionCounter.inc({ currency: transaction.currency });

  logger.info(
    { txId: transaction.id, amount, currency: transaction.currency },
    'transaction recorded',
  );

  return res.status(201).json(transaction);
});

// ── GET /transactions ─────────────────────────────────────────────────────────
app.get('/transactions', (req, res) => {
  let result = [...transactions];

  if (req.query.currency) {
    const filter = req.query.currency.toUpperCase();
    result = result.filter((t) => t.currency === filter);
  }

  const limit  = Math.min(parseInt(req.query.limit,  10) || 100, 500);
  const offset = parseInt(req.query.offset, 10) || 0;
  const page   = result.slice(offset, offset + limit);

  return res.json({ total: result.length, limit, offset, data: page });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;
if (require.main === module) {
  app.listen(PORT, () => logger.info({ port: PORT }, 'SecureFin API listening'));
}

module.exports = app;
