from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


async def fake_authenticated_user(request):
    return {"id": "test-user", "aud": "authenticated"}


def test_research_requires_authenticated_session() -> None:
    response = client.post("/api/v1/research/search", json={"query": "AETHERON AI"})
    assert response.status_code == 401


def test_research_requires_provider_key(monkeypatch) -> None:
    monkeypatch.setattr("app.main.require_authenticated_user", fake_authenticated_user)
    monkeypatch.delenv("TAVILY_API_KEY", raising=False)
    response = client.post(
        "/api/v1/research/search",
        headers={"Authorization": "Bearer test-session"},
        json={"query": "AETHERON AI architecture"},
    )
    assert response.status_code == 503
    assert "1,000 credits per month" in response.json()["detail"]


def test_research_rejects_short_queries() -> None:
    response = client.post(
        "/api/v1/research/search",
        headers={"Authorization": "Bearer test-session"},
        json={"query": "AI"},
    )
    assert response.status_code == 422
