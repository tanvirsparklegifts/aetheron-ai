"""OpenAI-compatible model provider adapter.

The API key is read only by the server process and is never returned to clients.
"""
import os

import httpx


async def generate_reply(messages: list[dict[str, str]]) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    base_url = os.getenv(
        "AETHERON_LLM_BASE_URL",
        "https://api.groq.com/openai/v1",
    ).rstrip("/")
    model = os.getenv("AETHERON_MODEL", "openai/gpt-oss-20b")

    async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0)) as client:
        response = await client.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.6,
                "max_completion_tokens": 700,
            },
        )
        response.raise_for_status()
        payload = response.json()

    choices = payload.get("choices") or []
    if not choices:
        raise RuntimeError("The model provider returned no choices")
    content = (choices[0].get("message") or {}).get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("The model provider returned an empty response")
    return content.strip()
