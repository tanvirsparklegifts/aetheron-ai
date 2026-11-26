import os
from collections import defaultdict, deque
from datetime import datetime, timezone
from time import monotonic
from uuid import UUID

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from app.providers import generate_reply

app = FastAPI(
    title="AETHERON Cloud API",
    version="0.4.0",
    description="AETHERON API with Supabase-authenticated, persistent AI chat.",
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
    conversation_id: UUID | None = None

    @field_validator("messages")
    @classmethod
    def validate_conversation(cls, value: list[ChatMessage]) -> list[ChatMessage]:
        if value[-1].role != "user":
            raise ValueError("The final message must be from the user")
        if sum(len(message.content) for message in value) > 12000:
            raise ValueError("Conversation is too long")
        return value


class ConversationCreate(BaseModel):
    title: str = Field(default="New conversation", min_length=1, max_length=120)


async def require_authenticated_user(request: Request) -> dict:
    """Validate the caller's Supabase access token with Supabase Auth."""
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="A valid sign-in session is required.")

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
    if not supabase_url or not supabase_anon_key:
        raise HTTPException(status_code=503, detail="Authentication is not configured on the server.")

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={"apikey": supabase_anon_key, "Authorization": authorization},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Authentication service is temporarily unavailable.") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Your sign-in session is invalid or expired.")

    user = response.json()
    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(status_code=401, detail="The authentication service returned an invalid user.")
    return user


async def supabase_rest(
    request: Request,
    method: str,
    resource: str,
    *,
    params: dict | None = None,
    body: dict | list | None = None,
    prefer: str | None = None,
) -> list | dict:
    """Call Supabase PostgREST with the caller's JWT so RLS remains authoritative."""
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    authorization = request.headers.get("Authorization", "")
    if not supabase_url or not anon_key:
        raise HTTPException(status_code=503, detail="Database access is not configured on the server.")

    headers = {"apikey": anon_key, "Authorization": authorization}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if prefer:
        headers["Prefer"] = prefer

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=5.0)) as client:
            response = await client.request(
                method,
                f"{supabase_url}/rest/v1/{resource}",
                headers=headers,
                params=params,
                json=body,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="The database service is temporarily unavailable.") from exc

    if response.status_code >= 400:
        if response.status_code in {401, 403}:
            raise HTTPException(status_code=403, detail="Database access was denied by the account security policy.")
        raise HTTPException(status_code=502, detail="The database could not complete this request.")
    if not response.content:
        return []
    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="The database returned an invalid response.") from exc
    return payload


async def require_owned_conversation(request: Request, conversation_id: UUID) -> None:
    rows = await supabase_rest(
        request,
        "GET",
        "conversations",
        params={"select": "id", "id": f"eq.{conversation_id}", "limit": "1"},
    )
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=404, detail="Conversation not found.")


# Best-effort per-process guard for the early single-instance preview.
# Production deployments need a shared Redis-backed limiter.
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
    return {"status": "ok", "service": "aetheron-cloud-api", "version": "0.4.0"}


@app.get("/api/v1", tags=["meta"])
async def api_root() -> dict[str, str]:
    return {
        "name": "AETHERON",
        "status": "authenticated-persistent-chat-preview",
        "message": "AI chat and conversation history require a valid session and configured Supabase and provider services.",
    }


@app.get("/api/v1/conversations", tags=["conversations"])
async def list_conversations(request: Request) -> list:
    await require_authenticated_user(request)
    rows = await supabase_rest(
        request,
        "GET",
        "conversations",
        params={
            "select": "id,title,archived,created_at,updated_at",
            "archived": "eq.false",
            "order": "updated_at.desc",
            "limit": "50",
        },
    )
    return rows if isinstance(rows, list) else []


@app.post("/api/v1/conversations", tags=["conversations"])
async def create_conversation(payload: ConversationCreate, request: Request) -> dict:
    user = await require_authenticated_user(request)
    rows = await supabase_rest(
        request,
        "POST",
        "conversations",
        body={"user_id": user["id"], "title": payload.title.strip() or "New conversation"},
        prefer="return=representation",
    )
    if not isinstance(rows, list) or not rows:
        raise HTTPException(status_code=502, detail="The conversation could not be created.")
    return rows[0]


@app.get("/api/v1/conversations/{conversation_id}/messages", tags=["conversations"])
async def list_messages(conversation_id: UUID, request: Request) -> list:
    await require_authenticated_user(request)
    await require_owned_conversation(request, conversation_id)
    rows = await supabase_rest(
        request,
        "GET",
        "messages",
        params={
            "select": "id,role,content,created_at",
            "conversation_id": f"eq.{conversation_id}",
            "order": "created_at.asc",
            "limit": "200",
        },
    )
    return rows if isinstance(rows, list) else []


@app.get("/api/v1/health", include_in_schema=False)
async def api_health_alias() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/chat", tags=["intelligence"])
async def chat(payload: ChatRequest, request: Request) -> dict[str, str]:
    user = await require_authenticated_user(request)
    if payload.conversation_id:
        await require_owned_conversation(request, payload.conversation_id)

    client_key = request.client.host if request.client else "unknown"
    enforce_preview_rate_limit(client_key)

    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=503, detail="AI provider is not configured on the server yet.")

    latest_user_message = payload.messages[-1].content
    if payload.conversation_id:
        await supabase_rest(
            request,
            "POST",
            "messages",
            body={
                "conversation_id": str(payload.conversation_id),
                "user_id": user["id"],
                "role": "user",
                "content": latest_user_message,
            },
            prefer="return=minimal",
        )
        await supabase_rest(
            request,
            "PATCH",
            "conversations",
            params={"id": f"eq.{payload.conversation_id}", "user_id": f"eq.{user['id']}"},
            body={"updated_at": datetime.now(timezone.utc).isoformat()},
            prefer="return=minimal",
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
        if exc.response.status_code == 429:
            raise HTTPException(status_code=503, detail="The AI provider is busy or its free quota is exhausted.") from exc
        raise HTTPException(status_code=502, detail="The AI provider could not complete the request.") from exc
    except (httpx.HTTPError, RuntimeError) as exc:
        raise HTTPException(status_code=502, detail="The AI provider is temporarily unavailable.") from exc

    if payload.conversation_id:
        await supabase_rest(
            request,
            "POST",
            "messages",
            body={
                "conversation_id": str(payload.conversation_id),
                "user_id": user["id"],
                "role": "assistant",
                "content": answer,
            },
            prefer="return=minimal",
        )

    return {
        "reply": answer,
        "provider": "groq",
        "conversation_id": str(payload.conversation_id) if payload.conversation_id else "",
    }
