/**
 * SecureFin — Transaction Recording Service
 *
 * Provides two endpoints:
 *   POST /transactions  — record a new transaction
 *   GET  /transactions  — list all recorded transactions
 *
 * Storage: in-memory array (replace with a persistent DB for production).
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');

// ── App setup ────────────────────────────────────────────────────────────────
const app = express();

// Parse incoming JSON request bodies automatically.
app.use(express.json());

// ── In-memory data store ─────────────────────────────────────────────────────
// Each entry: { id, amount, currency, description, timestamp }
// In a real deployment this would be replaced by a database (e.g. PostgreSQL).
const transactions = [];

// ── Health check ──────────────────────────────────────────────────────────────
// Used by Kubernetes liveness / readiness probes.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── POST /transactions ────────────────────────────────────────────────────────
// Record a new financial transaction.
//
// Request body (JSON):
//   amount      {number}  — transaction amount (required, must be > 0)
//   currency    {string}  — ISO 4217 code, e.g. "USD" (required)
//   description {string}  — human-readable note (optional)
//
// Response 201: the created transaction object.
// Response 400: validation error details.
app.post('/transactions', (req, res) => {
  const { amount, currency, description } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: '"amount" is required' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: '"amount" must be a positive number' });
  }
  if (!currency || typeof currency !== 'string') {
    return res.status(400).json({ error: '"currency" is required and must be a string' });
  }

  // ── Build record ────────────────────────────────────────────────────────────
  const transaction = {
    id: uuidv4(),                        // unique identifier
    amount,
    currency: currency.toUpperCase(),    // normalise to uppercase
    description: description || '',
    timestamp: new Date().toISOString(), // ISO 8601 UTC timestamp
  };

  transactions.push(transaction);

  // Return 201 Created with the new transaction object.
  return res.status(201).json(transaction);
});

// ── GET /transactions ─────────────────────────────────────────────────────────
// Retrieve all recorded transactions.
//
// Query params (all optional):
//   currency {string} — filter by currency code (case-insensitive)
//   limit    {number} — max number of results (default: 100)
//   offset   {number} — skip N results for pagination (default: 0)
//
// Response 200: { total, limit, offset, data: [...] }
app.get('/transactions', (req, res) => {
  let result = [...transactions];

  // ── Optional currency filter ─────────────────────────────────────────────────
  if (req.query.currency) {
    const filter = req.query.currency.toUpperCase();
    result = result.filter((t) => t.currency === filter);
  }

  // ── Pagination ───────────────────────────────────────────────────────────────
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500); // cap at 500
  const offset = parseInt(req.query.offset, 10) || 0;
  const page = result.slice(offset, offset + limit);

  return res.json({
    total: result.length,
    limit,
    offset,
    data: page,
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
// PORT defaults to 3000; can be overridden via environment variable.
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Only start listening when this file is the entry point (not during tests).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SecureFin API listening on port ${PORT}`);
  });
}

// Export app so supertest can load it without starting the HTTP server.
module.exports = app;
