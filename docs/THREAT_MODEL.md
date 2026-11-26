# AETHERON — Initial Threat Model

This is a starting threat model, not a security certification or completed audit.

## Assets
Account identity, sessions, device credentials, conversations, profile, memory, files, connector tokens, business plans, source code, audit records, and tool permissions.

## Adversaries
External account attackers; malicious websites/files/emails and prompt injections; compromised integrations/dependencies; cross-tenant access attempts; insider misuse; abusive users seeking fraud or data exfiltration.

## Threats and controls
| Threat | Required control |
|---|---|
| Cross-tenant exposure | Tenant-bound authorization, database RLS, isolation tests |
| Prompt injection | Treat retrieved content as untrusted; tool allowlists; policy checks outside model |
| Secret leakage | Secret manager, redaction, scoped execution, log scrubbing |
| Unauthorized high-impact action | Explicit approval, action preview, short-lived authorization |
| Session/device compromise | MFA, device revocation, short-lived tokens, risk-based re-auth |
| Malicious tool execution | Sandboxing, capability allowlists, egress controls, timeouts |
| Admin overreach | Just-in-time access, least privilege, reason codes, immutable audit |
| Data loss | Encrypted backups, restore drills, retention policy |
| Supply-chain compromise | Dependency pinning, automated scanning, signed releases where feasible |

## Mandatory rules
Never request or store seed phrases, private keys, or passwords in chat memory. Never put secrets in prompts, analytics, error messages, or client bundles. Every tool call is authorized by a policy engine independent of model output. A model-generated approval statement is not user approval. Approval binds to a specific action payload and expires. Public-facing agents disclose AI identity. Device automation is opt-in, visible, scoped, and revocable. Emergency pause disables automation and revokes relevant sessions.

## Validation before beta
Cross-tenant tests; prompt-injection red team; secret canaries in prompts/logs/traces/crash reports; approval bypass/replay tests; device revocation tests; backup restoration; independent penetration test before high-risk integrations.
