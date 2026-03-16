# ADR 001 — In-Memory Transaction Store

**Date:** 2026-03-17
**Status:** Accepted

## Context

SecureFin needs to persist financial transactions. The MVP needs to be deployable quickly without external dependencies.

## Decision

Use a Node.js in-process array (`const transactions = []`) as the data store for the initial version.

## Consequences

**Positive:**
- Zero external dependencies — can run anywhere with just Node.js
- No database setup, migrations, or connection pooling required
- Trivially testable (no mocking needed)

**Negative:**
- Data is lost on every pod restart
- Cannot scale horizontally (each pod has its own copy of data)
- Not suitable for production financial data

## Migration Path

When persistent storage is needed, replace the `transactions` array with a PostgreSQL client. The API interface (endpoints, request/response shape) remains unchanged — only `server.js` internals change. A `db/` module can be introduced following the repository pattern.
