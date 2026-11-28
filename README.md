# AETHERON

**THE AUTONOMOUS INTELLIGENCE**  
**YOUR WORLD. YOUR INTELLIGENCE.**  
*Powered by EliteAxis Global*

AETHERON is a privacy-first personal executive intelligence platform with a shared cloud intelligence layer and planned Web, Windows, and Android experiences.

> **Current status (2026-11-28):** The GitHub Pages web preview is published and the FastAPI Cloud API is deployed on Render. Render's `/health` endpoint has returned HTTP 200. The application remains an early preview: authenticated user journeys, cross-user isolation, chat persistence, memory/knowledge retrieval, and file workflows require end-to-end verification. Do not use it for sensitive or business-critical data.

## Planned surfaces
- Web Dashboard: primary product and account control center.
- Windows Companion: explicitly approved local browser, file, and desktop workflows.
- Android Companion: voice, notifications, share-sheet handoff, and approved mobile workflows.
- Cloud Brain: model routing, memory, task planning, policy enforcement, and audit events.

## Principles
1. Private by default; strict tenant isolation.
2. Least privilege and explicit consent for integrations.
3. Secrets live in a dedicated secret manager, never ordinary model context or chat memory.
4. Sensitive external actions require confirmation.
5. Evidence-backed research and visible task status.
6. AI identity is disclosed in public interactions; no deceptive impersonation.
7. Safety, legality, and user control take priority over autonomy.

## Repository layout
- apps/web: Next.js dashboard and chat interface
- apps/cloud-api: FastAPI service and model-provider adapter
- apps/windows-companion: planned desktop client
- apps/android-companion: planned Android client
- core: intelligence, orchestration, memory, security, permissions
- agents: specialized agent specifications
- integrations: connector boundaries
- docs: product, architecture, threat model, API and data design

## Run locally
Web:
    cd apps/web
    npm install
    npm run dev

Cloud API:
    cd apps/cloud-api
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload

See [Cloud API setup](apps/cloud-api/README.md) for Groq environment configuration.

## GitHub Pages preview
https://tanvirsparklegifts.github.io/aetheron-ai/

GitHub Pages hosts only the static web frontend. The FastAPI Cloud API must be deployed separately. Set the GitHub Actions repository variable `NEXT_PUBLIC_AETHERON_API_URL` to the deployed API origin before rebuilding Pages.

## Roadmap
- [x] Product direction and platform scope
- [x] Initial architecture and threat-model documentation
- [x] Premium dashboard visual prototype
- [x] First server-side Groq chat adapter and chat endpoint
- [x] Dashboard chat client integration
- [x] Deploy Cloud API to Render and verify the `/health` endpoint
- [ ] Independently verify authenticated chat, conversation save/restore, memory retrieval, and knowledge retrieval in a real browser session
- [ ] Complete two-account tenant-isolation and RLS tests
- [ ] Verify private file upload/download/delete and isolation before enabling the intake UI
- [ ] Redis-backed global rate limiting, audit trail, backup verification, and security hardening
- [ ] Read-only integrations and approval-gated agent workflows
- [ ] Windows and Android companions

## Security
Never commit API keys, passwords, private keys, recovery phrases, identity documents, or customer data. Use server-side environment variables and a managed secret store. The current chat preview is not designed for sensitive data or public production use.

## Legal and intellectual property

- [Proprietary software license](LICENSE) — original AETHERON materials are All Rights Reserved unless a separate written license says otherwise.
- [Trademark and brand usage policy](TRADEMARK_POLICY.md) — rules for use of the AETHERON name, logo, and brand assets.
- [Copyright and attribution notice](NOTICE) — project ownership notice and third-party license reminder.

The AETHERON name and brand are identified with ™ as a claimed mark; this repository does not claim that a trademark registration has been granted. Third-party components remain under their own licenses.

## Brand
- Name: AETHERON
- Descriptor: THE AUTONOMOUS INTELLIGENCE
- Tagline: YOUR WORLD. YOUR INTELLIGENCE.
- Powered by: EliteAxis Global
