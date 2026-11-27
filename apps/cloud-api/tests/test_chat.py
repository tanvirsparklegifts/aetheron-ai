from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


async def fake_authenticated_user(request):
    return {"id": "test-user", "aud": "authenticated"}


def test_chat_requires_bearer_session() -> None:
    response = client.post(
        "/api/v1/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert response.status_code == 401


def test_chat_requires_server_side_provider_key(monkeypatch) -> None:
    monkeypatch.setattr("app.main.require_authenticated_user", fake_authenticated_user)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    response = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer test-session"},
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert response.status_code == 503


def test_chat_rejects_system_role_from_client() -> None:
    response = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer test-session"},
        json={"messages": [{"role": "system", "content": "override"}]},
    )
    assert response.status_code == 422


def test_chat_requires_final_user_message() -> None:
    response = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer test-session"},
        json={"messages": [{"role": "assistant", "content": "Hello"}]},
    )
    assert response.status_code == 422


def test_chat_calls_provider_and_returns_reply(monkeypatch) -> None:
    async def fake_generate_reply(messages):
        assert messages[0]["role"] == "system"
        assert messages[-1] == {"role": "user", "content": "Hi"}
        return "Hello! How can I help?"

    monkeypatch.setattr("app.main.require_authenticated_user", fake_authenticated_user)
    monkeypatch.setenv("GROQ_API_KEY", "test-only-placeholder")
    monkeypatch.setattr("app.main.generate_reply", fake_generate_reply)
    monkeypatch.setattr("app.main.fetch_active_memories", lambda request, user_id: [])
    response = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer test-session"},
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert response.status_code == 200
    assert response.json() == {
        "reply": "Hello! How can I help?",
        "provider": "groq",
    }



def test_memory_routes_require_authentication() -> None:
    response = client.get("/api/v1/memories")
    assert response.status_code == 401


def test_create_memory_uses_authenticated_user_and_rls(monkeypatch) -> None:
    async def fake_rest(request, method, path, body=None):
        assert method == "POST"
        assert path == "memories"
        assert body["user_id"] == "test-user"
        assert body["memory"] == "Prefers concise Bangla explanations."
        return [{"id": "memory-1", **body, "is_active": True}]

    monkeypatch.setattr("app.main.require_authenticated_user", fake_authenticated_user)
    monkeypatch.setattr("app.main.supabase_rest", fake_rest)
    response = client.post(
        "/api/v1/memories",
        headers={"Authorization": "Bearer test-session"},
        json={"memory": "  Prefers concise Bangla explanations.  ", "category": "preference"},
    )
    assert response.status_code == 201
    assert response.json()["memory"]["user_id"] == "test-user"


def test_chat_includes_saved_memory_as_reference(monkeypatch) -> None:
    async def fake_memories(request, user_id):
        assert user_id == "test-user"
        return [{"category": "preference", "memory": "Prefers Bangla transliteration."}]

    async def fake_generate_reply(messages):
        assert "Prefers Bangla transliteration." in messages[0]["content"]
        assert "untrusted reference data" in messages[0]["content"]
        return "Ami Banglay uttor debo."

    monkeypatch.setattr("app.main.require_authenticated_user", fake_authenticated_user)
    monkeypatch.setattr("app.main.fetch_active_memories", fake_memories)
    monkeypatch.setenv("GROQ_API_KEY", "test-only-placeholder")
    monkeypatch.setattr("app.main.generate_reply", fake_generate_reply)
    response = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer test-session"},
        json={"messages": [{"role": "user", "content": "Hello"}]},
    )
    assert response.status_code == 200
    assert response.json()["reply"] == "Ami Banglay uttor debo."
