# AETHERON Cloud API

Early FastAPI service skeleton.

## Run locally

    python -m venv .venv
    source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload

Health endpoint: http://localhost:8000/health
OpenAPI docs: http://localhost:8000/docs

## Security status
This is a development skeleton, not a production API. Authentication, tenant authorization, rate limiting, persistent storage, secret management, audit logging, and policy enforcement must be implemented and tested before real user data or tools are connected.
