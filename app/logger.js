'use strict';
/**
 * Structured JSON logger using pino.
 * In non-production environments, enables pino-pretty for human-readable output.
 * All log lines include service name, version, and environment.
 */
const pino = require('pino');

module.exports = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'securefin',
    version: process.env.npm_package_version || '1.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  // Use pretty-printing only outside production (pino-pretty is a devDependency)
  ...(process.env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});
