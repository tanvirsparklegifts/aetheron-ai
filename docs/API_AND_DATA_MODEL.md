# AETHERON — API and Data Model Draft

## API conventions
Base path: /api/v1. JSON bodies. TLS required outside local development. Short-lived access tokens, refresh-token rotation, device binding. Mutations use idempotency keys where retries could duplicate effects. Stable machine-readable errors; never expose secrets or stack traces.

## Initial endpoints
| Method | Path | Purpose |
|---|---|---|
| POST | /auth/session | Start authenticated session |
| POST | /auth/refresh | Rotate refresh token |
| POST | /devices/register | Register trusted device |
| GET | /me | Read current profile |
| GET | /workspaces | List workspaces |
| POST | /conversations | Create conversation |
| POST | /conversations/{id}/messages | Submit user message |
| GET | /tasks | List visible tasks |
| POST | /tasks | Create task plan |
| POST | /tasks/{id}/approve | Approve exact pending action |
| POST | /tasks/{id}/cancel | Cancel task |
| GET | /audit-events | Read permitted audit events |
| GET | /memory | Inspect user-visible memory |
| DELETE | /memory/{id} | Delete memory item |

## Core entities
Tenant, User, Device, Workspace, Conversation, MemoryItem, Integration, Task, Approval, AuditEvent.

## Data safeguards
Tenant ID comes from authenticated claims, never arbitrary request JSON. Encrypt sensitive columns and object storage. Rotate keys through KMS. Keep credential references separate from credential values. Retain audit events without copying sensitive payloads unnecessarily. Define deletion propagation for database, vector index, cache, and object storage.
