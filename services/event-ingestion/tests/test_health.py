"""Tests for Event Ingestion health endpoint."""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_check():
    """Test that health endpoint returns ok status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "event-ingestion"


def test_root():
    """Test that root endpoint returns service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "event-ingestion"
    assert "version" in data
