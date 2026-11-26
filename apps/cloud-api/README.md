# AETHERON Cloud API

FastAPI service with an early server-side Groq chat adapter.

## Run locally

    cd apps/cloud-api
    python -m venv .venv
    source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
    pip install -r requirements.txt
    cp .env.example .env
    # Set GROQ_API_KEY in your shell or local .env (never commit .env).
    uvicorn app.main:app --reload

Health: http://localhost:8000/health  
OpenAPI docs: http://localhost:8000/docs  
Chat: POST http://localhost:8000/api/v1/chat

## Required server environment

- `GROQ_API_KEY`: secret from Groq Console; server-side only.
- `AETHERON_LLM_BASE_URL`: defaults to Groq's OpenAI-compatible API.
- `AETHERON_MODEL`: defaults to `openai/gpt-oss-20b`.
- `AETHERON_ALLOWED_ORIGINS`: comma-separated exact browser origins.

The web frontend separately needs the public API origin in `NEXT_PUBLIC_AETHERON_API_URL`. This is a public URL, never a secret.

## Render deployment

This repository includes a `render.yaml` blueprint. In Render, create a Blueprint from this GitHub repository, then add `GROQ_API_KEY` as a secret environment variable in the service settings. Do not put the key in GitHub, the frontend, or a committed file.

After deployment, copy the service URL and set the GitHub Actions repository variable `NEXT_PUBLIC_AETHERON_API_URL` to that URL, then rerun the Pages workflow.

## Current security and product limits

This is an early chat preview, not a production multi-user agent. It has request validation and a best-effort in-memory per-process rate limit, but no user authentication, tenant isolation, persistent conversation storage, Redis-backed global rate limiting, audit trail, or tool execution. Do not send sensitive personal, financial, identity, or business-confidential information. Add those controls and complete a security review before public production use.
