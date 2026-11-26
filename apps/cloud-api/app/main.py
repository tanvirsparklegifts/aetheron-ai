import os
from collections import defaultdict, deque
from time import monotonic

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from app.providers import generate_reply

app = FastAPI(
    title="AETHERON Cloud API",
    version="0.2.0",
    description="AETHERON API foundation with a server-side AI chat adapter.",
    docs_url="/docs",
    redoc_url=None,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "AETHERON_ALLOWED_ORIGINS",
        "http://localhost:3000,https://tanvirsparklegifts.github.io",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)


class ChatMessage(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in {"user", "assistant"}:
            raise ValueError("Only user and assistant messages are accepted")
        return value


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=12)

    @field_validator("messages")
    @classmethod
    def validate_conversation(cls, value: list[ChatMessage]) -> list[ChatMessage]:
        if value[-1].role != "user":
            raise ValueError("The final message must be from the user")
        if sum(len(message.content) for message in value) > 12000:
            raise ValueError("Conversation is too long")
        return value


# Best-effort per-process guard for the early single-instance preview.
# Production deployments need a shared Redis-backed limiter and user auth.
_request_times: dict[str, deque[float]] = defaultdict(deque)
RATE_LIMIT_REQUESTS = int(os.getenv("AETHERON_CHAT_RPM_PER_IP", "10"))
RATE_LIMIT_WINDOW = 60.0


def enforce_preview_rate_limit(client_key: str) -> None:
    now = monotonic()
    bucket = _request_times[client_key]
    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(status_code=429, detail="Chat limit reached. Please wait a minute.")
    bucket.append(now)


@app.get("/health", tags=["operations"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "aetheron-cloud-api", "version": "0.2.0"}


@app.get("/api/v1", tags=["meta"])
async def api_root() -> dict[str, str]:
    return {
        "name": "AETHERON",
        "status": "chat-preview",
        "message": "AI chat is available when a server-side provider key is configured.",
    }


@app.post("/api/v1/chat", tags=["intelligence"])
async def chat(payload: ChatRequest, request: Request) -> dict[str, str]:
    client_key = request.client.host if request.client else "unknown"
    enforce_preview_rate_limit(client_key)

    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="AI provider is not configured on the server yet.",
        )

    conversation = [
        {
            "role": "system",
            "content": (
                "You are AETHERON, a helpful, honest, privacy-conscious personal "
                "intelligence assistant created by EliteAxis Global. Be warm and "
                "clear. Reply in the language the user uses, including Bangla or "
                "Bangla transliteration. Do not claim to remember information that "
                "is not in this conversation. Do not claim to have performed actions, "
                "accessed accounts, browsed the web, or changed files unless a tool "
                "actually did so. You have no tools or persistent memory in this "
                "preview. Never ask users to reveal passwords, API keys, private "
                "keys, recovery phrases, or identity documents."
            ),
        },
        *[message.model_dump() for message in payload.messages],
    ]

    try:
        answer = await generate_reply(conversation)
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="The AI provider timed out. Please try again.") from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status == 429:
            raise HTTPException(status_code=503, detail="The AI provider is busy or its free quota is exhausted.") from exc
        raise HTTPException(status_code=502, detail="The AI provider could not complete the request.") from exc
    except (httpx.HTTPError, RuntimeError) as exc:
        raise HTTPException(status_code=502, detail="The AI provider is temporarily unavailable.") from exc

    return {"reply": answer, "provider": "groq"}
