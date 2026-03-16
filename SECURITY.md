# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (main branch) | ✅ |
| < 1.0 | ❌ |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues by emailing **security@your-org.com**.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a patch within 14 days for critical issues.

## Security Controls

| Layer | Control |
|---|---|
| Source | gitleaks secret scanning in CI and pre-commit hooks |
| Dependencies | Dependabot + `actions/dependency-review-action` on PRs |
| Container image | Trivy CVE scanning in CI; blocks on CRITICAL/HIGH |
| Dockerfile | hadolint linting enforces best practices |
| Container runtime | Non-root user, read-only filesystem, no privilege escalation, all capabilities dropped |
| Kubernetes | NetworkPolicy (default-deny), Pod Security Standards (restricted) |
| Supply chain | cosign keyless image signing; SBOM (SPDX) generated per release |
| Secrets | Never stored in Git; injected via GitHub Secrets / External Secrets Operator |
