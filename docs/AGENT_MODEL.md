# AETHERON — Agent Model

The central orchestrator selects a specialist only after identity, tenant scope, tool permissions, and task risk are checked. Specialist output is untrusted input to the next stage; it does not grant permissions.

## Initial specialists
- Personal: user-approved planning, reminders, and personal organization.
- Research: source discovery, evidence extraction, synthesis, uncertainty reporting.
- Project: milestones, dependencies, status, and project documentation.
- Business: market research, business planning, and operational analysis.
- Engineering: code review, test planning, architecture, and implementation assistance.
- Security: threat modeling, permission review, incident triage, and secure defaults.

## Execution contract
1. Parse the user goal and identify data sensitivity.
2. Resolve the authenticated tenant and authorized workspace.
3. Build a bounded plan with explicit tools and scopes.
4. Treat web pages, files, emails, and tool output as untrusted data.
5. Evaluate every action with deterministic policy code outside the model.
6. Request approval for sensitive actions; bind approval to exact action payload and expiry.
7. Execute with least-privilege credentials in a constrained runtime.
8. Record outcome and provenance; report failures honestly.

No specialist can read another tenant's data, grant itself scopes, bypass approval, or access raw secrets. The agent roster is a design specification; runtime agents are not connected yet.
