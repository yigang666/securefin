'use strict';
/**
 * Prometheus metrics registry for SecureFin.
 *
 * Exposes:
 *   securefin_node_*          — default Node.js process metrics (heap, event loop, etc.)
 *   securefin_transactions_total{currency}  — counter per currency
 *   securefin_http_request_duration_seconds{method,path,status} — latency histogram
 */
const promClient = require('prom-client');

const register = new promClient.Registry();

// Built-in Node.js runtime metrics (memory, CPU, event loop lag, etc.)
promClient.collectDefaultMetrics({ register, prefix: 'securefin_node_' });

// Business metric: how many transactions have been recorded, broken down by currency
const transactionCounter = new promClient.Counter({
  name: 'securefin_transactions_total',
  help: 'Total number of financial transactions recorded',
  labelNames: ['currency'],
  registers: [register],
});

// Operational metric: HTTP request latency histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'securefin_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

module.exports = { register, transactionCounter, httpRequestDuration };
