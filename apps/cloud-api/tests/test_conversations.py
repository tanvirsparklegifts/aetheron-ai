from uuid import UUID

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
CONVERSATION_ID = "f9b6a7f2-59bd-4b51-91e9-75a3f1c9b2b1"


async def fake_user(request):
    return {"id": "user-a", "aud": "authenticated"}


def test_list_conversations_is_authenticated_and_returns_rows(monkeypatch):
    monkeypatch.setattr("app.main.require_authenticated_user", fake_user)

    async def fake_rest(request, method, resource, **kwargs):
        assert method == "GET"
        assert resource == "conversations"
        assert kwargs["params"]["limit"] == "50"
        return [{"id": CONVERSATION_ID, "title": "Saved thread"}]

    monkeypatch.setattr("app.main.supabase_rest", fake_rest)
    response = client.get("/api/v1/conversations", headers={"Authorization": "Bearer test"})
    assert response.status_code == 200
    assert response.json()[0]["title"] == "Saved thread"


def test_create_conversation_uses_authenticated_user_id(monkeypatch):
    monkeypatch.setattr("app.main.require_authenticated_user", fake_user)
    captured = {}

    async def fake_rest(request, method, resource, **kwargs):
        captured.update({"method": method, "resource": resource, **kwargs})
        return [{"id": CONVERSATION_ID, "title": kwargs["body"]["title"]}]

    monkeypatch.setattr("app.main.supabase_rest", fake_rest)
    response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": "Bearer test"},
        json={"title": "My private project"},
    )
    assert response.status_code == 200
    assert captured["body"]["user_id"] == "user-a"
    assert response.json()["title"] == "My private project"


def test_messages_require_conversation_ownership(monkeypatch):
    monkeypatch.setattr("app.main.require_authenticated_user", fake_user)

    async def fake_rest(request, method, resource, **kwargs):
        if resource == "conversations":
            return []
        raise AssertionError("Messages must not be queried for an unowned conversation")

    monkeypatch.setattr("app.main.supabase_rest", fake_rest)
    response = client.get(
        f"/api/v1/conversations/{CONVERSATION_ID}/messages",
        headers={"Authorization": "Bearer test"},
    )
    assert response.status_code == 404


def test_message_history_is_returned_only_after_ownership_check(monkeypatch):
    monkeypatch.setattr("app.main.require_authenticated_user", fake_user)
    calls = []

    async def fake_rest(request, method, resource, **kwargs):
        calls.append(resource)
        if resource == "conversations":
            return [{"id": CONVERSATION_ID}]
        return [{"id": "m1", "role": "user", "content": "Hello"}]

    monkeypatch.setattr("app.main.supabase_rest", fake_rest)
    response = client.get(
        f"/api/v1/conversations/{CONVERSATION_ID}/messages",
        headers={"Authorization": "Bearer test"},
    )
    assert response.status_code == 200
    assert calls == ["conversations", "messages"]
    assert response.json()[0]["content"] == "Hello"


def test_chat_persists_user_and_assistant_messages(monkeypatch):
    monkeypatch.setattr("app.main.require_authenticated_user", fake_user)
    monkeypatch.setenv("GROQ_API_KEY", "test-only-placeholder")
    writes = []

    async def fake_rest(request, method, resource, **kwargs):
        if method == "GET" and resource == "conversations":
            return [{"id": CONVERSATION_ID}]
        if method == "POST" and resource == "messages":
            writes.append(kwargs["body"])
            return []
        return []

    async def fake_generate_reply(messages):
        return "Welcome to AETHERON."

    monkeypatch.setattr("app.main.supabase_rest", fake_rest)
    monkeypatch.setattr("app.main.generate_reply", fake_generate_reply)
    response = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer test"},
        json={
            "conversation_id": CONVERSATION_ID,
            "messages": [{"role": "user", "content": "Hello"}],
        },
    )
    assert response.status_code == 200
    assert response.json()["reply"] == "Welcome to AETHERON."
    assert [item["role"] for item in writes] == ["user", "assistant"]
    assert all(item["user_id"] == "user-a" for item in writes)
    assert all(item["conversation_id"] == CONVERSATION_ID for item in writes)


def test_chat_rejects_malformed_conversation_id():
    response = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer test"},
        json={
            "conversation_id": "not-a-uuid",
            "messages": [{"role": "user", "content": "Hello"}],
        },
    )
    assert response.status_code == 422
