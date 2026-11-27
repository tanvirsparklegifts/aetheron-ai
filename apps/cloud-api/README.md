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
- `TAVILY_API_KEY`: optional server-side key for the Research workspace. Tavily currently lists 1,000 free API credits per month with no credit card required. When the free quota is exhausted, search requests stop until the next reset or an explicit paid upgrade. Never put this key in the frontend or GitHub.
- `AETHERON_ALLOWED_ORIGINS`: comma-separated exact browser origins.

The web frontend separately needs the public API origin in `NEXT_PUBLIC_AETHERON_API_URL`. This is a public URL, never a secret.

## Render deployment

This repository includes a `render.yaml` blueprint. In Render, create a Blueprint from this GitHub repository, then add `GROQ_API_KEY` as a secret environment variable in the service settings. Do not put the key in GitHub, the frontend, or a committed file.

After deployment, copy the service URL and set the GitHub Actions repository variable `NEXT_PUBLIC_AETHERON_API_URL` to that URL, then rerun the Pages workflow.

## Current security and product limits

This is an early preview, not a production multi-user agent. Supabase bearer-token authentication, account-scoped data access via RLS, persistent chat history, saved memory, private knowledge retrieval, and authenticated web research are implemented. The current rate limiter is still best-effort and per process; Redis-backed global rate limiting, comprehensive audit trail, deeper security review, backups, and public-production hardening remain outstanding. Do not send sensitive personal, financial, identity, or business-confidential information until those controls are complete.
