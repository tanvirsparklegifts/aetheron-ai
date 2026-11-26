# AETHERON — System Architecture (Phase 0)

## High-level topology

    Web / Windows / Android clients
                 |
             API Gateway
                 |
       Identity + Device Registry
                 |
       Policy / Permission Engine
                 |
       Task Orchestrator ---- Audit Events
          |            |
          |       Approval Service
          |
       Agent Runtime / Model Router
          |                 |
       Retrieval          Tool Adapters
          |
       Tenant-scoped Memory
          |
       PostgreSQL + pgvector / Object Storage
                 |
       Secret Manager (separate trust boundary)

## Implementation strategy
Start as a modular monolith. Split services only when scale, isolation, or operational ownership requires it.

## Proposed stack
API: Python 3.12+, FastAPI, Pydantic. Web: Next.js, React, TypeScript. Data: PostgreSQL, pgvector; Redis for queues/cache when needed. Background worker with idempotent tasks. Desktop: Tauri 2 with least-privilege local agent. Android: Kotlin, Jetpack Compose, WorkManager, Android Keystore. Observability: structured logs, metrics, traces, redaction, alerting. Deployment: Docker with managed database and object storage.

## Trust boundaries
1. Client to cloud: TLS, registered device identity, short-lived tokens.
2. API to orchestration: authenticated service identity and scoped claims.
3. Orchestrator to model: minimize context; redact secrets and unnecessary personal data.
4. Tool runtime to external system: per-connector credentials and explicit scopes.
5. Secret manager: secrets fetched only by authorized execution components; raw values never enter prompts or memory.

## Tenant isolation
Every user-owned record carries a tenant identifier. Enforce tenant scope in service authorization and database access. Add row-level security as defense in depth. Never trust a client-supplied tenant ID without binding it to authenticated identity.

## Task lifecycle
created -> policy_check -> awaiting_approval (if needed) -> queued -> running -> succeeded | failed | cancelled

Tasks require idempotency keys, deadlines, cancellation semantics, and immutable audit events for material transitions.

## Memory lifecycle
Explicit profile/preferences are distinct from inferred memory. Users can inspect, correct, export, and delete memory. Retention and provenance must be visible. Sensitive data is excluded from model memory by default.
