from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_service_status() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "aetheron-cloud-api",
        "version": "0.2.0",
    }


def test_api_root_discloses_foundation_state() -> None:
    response = client.get("/api/v1")
    assert response.status_code == 200
    assert response.json()["status"] == "foundation"
