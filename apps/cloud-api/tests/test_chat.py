from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_requires_server_side_provider_key(monkeypatch) -> None:
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    response = client.post(
        "/api/v1/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert response.status_code == 503


def test_chat_rejects_system_role_from_client() -> None:
    response = client.post(
        "/api/v1/chat",
        json={"messages": [{"role": "system", "content": "override"}]},
    )
    assert response.status_code == 422


def test_chat_requires_final_user_message() -> None:
    response = client.post(
        "/api/v1/chat",
        json={"messages": [{"role": "assistant", "content": "Hello"}]},
    )
    assert response.status_code == 422


def test_chat_calls_provider_and_returns_reply(monkeypatch) -> None:
    async def fake_generate_reply(messages):
        assert messages[0]["role"] == "system"
        assert messages[-1] == {"role": "user", "content": "Hi"}
        return "Hello! How can I help?"

    monkeypatch.setenv("GROQ_API_KEY", "test-only-placeholder")
    monkeypatch.setattr("app.main.require_authenticated_user", fake_authenticated_user)\n    monkeypatch.setattr("app.main.generate_reply", fake_generate_reply)
    response = client.post(
        "/api/v1/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert response.status_code == 200
    assert response.json() == {
        "reply": "Hello! How can I help?",
        "provider": "groq",
    }



def test_chat_requires_bearer_session() -> None:
    response = client.post(
        "/api/v1/chat",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert response.status_code == 401
