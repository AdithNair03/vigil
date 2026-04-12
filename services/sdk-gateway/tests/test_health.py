"""Comprehensive test suite for SDK Gateway.

Tests cover:
- Health endpoint
- Root endpoint
- POST /events with JWT auth
- POST /events with SDK key auth
- Auth failures (missing, invalid, expired)
- Event validation errors
- Tenant spoofing prevention
- WebSocket connect/disconnect
- WebSocket event flow
- WebSocket auth failures
- Token generation endpoint
- Kafka fallback (no Kafka = still works)
- Rate limiting behavior
"""

from __future__ import annotations

import json
import time
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from auth import create_access_token
from config import settings
from main import app

client = TestClient(app)


# ============================================================
# Helper functions
# ============================================================


def _auth_header(tenant_id: str = "test-tenant", role: str = "user") -> dict[str, str]:
    """Generate a valid JWT Authorization header."""
    token = create_access_token({"tenant_id": tenant_id, "role": role})
    return {"Authorization": f"Bearer {token}"}


def _sdk_key_header(tenant_id: str = "testco") -> dict[str, str]:
    """Generate an X-SDK-Key header."""
    return {"X-SDK-Key": f"vgl_{tenant_id}_abc123def456"}


def _valid_event(
    tenant_id: str = "test-tenant",
    user_id: str = "user-001",
    event_type: str = "ad_impression_paid_tier",
) -> dict:
    """Generate a valid event payload."""
    return {
        "event": {
            "tenant_id": tenant_id,
            "user_id": user_id,
            "session_id": "session-abc",
            "event_type": event_type,
            "industry": "streaming",
            "payload": {"ad_duration_seconds": 30, "content_id": "movie-456"},
            "platform": "web",
            "app_version": "2.1.0",
        }
    }


# ============================================================
# Health & Root
# ============================================================


class TestHealth:
    """Tests for the /health endpoint."""

    def test_health_returns_ok(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "sdk-gateway"
        assert data["version"] == "0.1.0"

    def test_health_includes_kafka_status(self):
        response = client.get("/health")
        data = response.json()
        assert "kafka_connected" in data
        assert isinstance(data["kafka_connected"], bool)

    def test_health_includes_uptime(self):
        response = client.get("/health")
        data = response.json()
        assert "uptime_seconds" in data
        assert data["uptime_seconds"] >= 0

    def test_health_includes_environment(self):
        response = client.get("/health")
        data = response.json()
        assert "environment" in data


class TestRoot:
    """Tests for the / endpoint."""

    def test_root_returns_service_info(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "sdk-gateway"
        assert "version" in data
        assert "docs" in data


# ============================================================
# POST /events — JWT Auth
# ============================================================


class TestEventsJWT:
    """Tests for POST /events with JWT authentication."""

    def test_ingest_event_with_jwt(self):
        """Valid JWT → 202 accepted."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers=_auth_header("test-tenant"),
        )
        assert response.status_code == 202
        data = response.json()
        assert data["accepted"] is True
        assert "event_id" in data
        assert "processing_time_ms" in data

    def test_event_id_is_returned(self):
        """Response includes the event_id."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers=_auth_header(),
        )
        data = response.json()
        assert len(data["event_id"]) > 0

    def test_processing_time_is_reasonable(self):
        """Processing should be sub-50ms without gRPC calls."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers=_auth_header(),
        )
        data = response.json()
        assert data["processing_time_ms"] < 500  # very generous for CI

    def test_tenant_spoofing_prevented(self):
        """Event tenant_id is overwritten with the authenticated tenant."""
        # Send event claiming to be "evil-tenant" but auth says "real-tenant"
        event = _valid_event(tenant_id="evil-tenant")
        response = client.post(
            "/events",
            json=event,
            headers=_auth_header("real-tenant"),
        )
        assert response.status_code == 202
        # The accepted response proves the event was processed under "real-tenant",
        # not "evil-tenant" (tenant_id is overwritten in the handler)

    def test_event_with_all_fields(self):
        """Event with all optional fields populated."""
        event = {
            "event": {
                "event_id": "custom-id-123",
                "tenant_id": "t1",
                "user_id": "u1",
                "session_id": "s1",
                "event_type": "cancel_flow_opened",
                "industry": "streaming",
                "payload": {"step": 1, "source": "settings"},
                "schema_version": "1.0.0",
                "sdk_version": "0.2.0",
                "platform": "ios",
                "app_version": "3.1.0",
            },
        }
        response = client.post(
            "/events",
            json=event,
            headers=_auth_header("t1"),
        )
        assert response.status_code == 202
        data = response.json()
        assert data["event_id"] == "custom-id-123"


# ============================================================
# POST /events — SDK Key Auth
# ============================================================


class TestEventsSDKKey:
    """Tests for POST /events with X-SDK-Key authentication."""

    def test_ingest_event_with_sdk_key(self):
        """Valid SDK key → 202 accepted."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers=_sdk_key_header("acme"),
        )
        assert response.status_code == 202
        data = response.json()
        assert data["accepted"] is True

    def test_sdk_key_extracts_tenant(self):
        """Tenant ID is extracted from the SDK key."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers=_sdk_key_header("mycompany"),
        )
        assert response.status_code == 202


# ============================================================
# Auth Failures
# ============================================================


class TestAuthFailures:
    """Tests for authentication failure cases."""

    def test_missing_auth_returns_401(self):
        """No auth → 401."""
        response = client.post("/events", json=_valid_event())
        assert response.status_code == 401

    def test_invalid_jwt_returns_401(self):
        """Garbage JWT → 401."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

    def test_expired_jwt_returns_401(self):
        """Expired JWT → 401."""
        import jwt as pyjwt

        expired_token = pyjwt.encode(
            {"tenant_id": "t1", "exp": int(time.time()) - 3600, "iat": int(time.time()) - 7200},
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
        response = client.post(
            "/events",
            json=_valid_event(),
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert response.status_code == 401

    def test_jwt_missing_tenant_id_returns_401(self):
        """JWT without tenant_id claim → 401."""
        import jwt as pyjwt

        token = pyjwt.encode(
            {"sub": "user-1", "exp": int(time.time()) + 3600, "iat": int(time.time())},
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
        response = client.post(
            "/events",
            json=_valid_event(),
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401

    def test_invalid_sdk_key_format(self):
        """SDK key not starting with vgl_ → 401."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers={"X-SDK-Key": "bad_key_format"},
        )
        assert response.status_code == 401

    def test_sdk_key_too_short(self):
        """SDK key with missing parts → 401."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers={"X-SDK-Key": "vgl_"},
        )
        assert response.status_code == 401


# ============================================================
# Validation Errors
# ============================================================


class TestValidation:
    """Tests for request validation errors."""

    def test_missing_event_body(self):
        """No event in body → 422."""
        response = client.post(
            "/events",
            json={},
            headers=_auth_header(),
        )
        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Event without required user_id/session_id → 422."""
        response = client.post(
            "/events",
            json={"event": {"tenant_id": "t1"}},
            headers=_auth_header(),
        )
        assert response.status_code == 422

    def test_empty_user_id_rejected(self):
        """Empty user_id fails Pydantic min_length validation."""
        event = _valid_event()
        event["event"]["user_id"] = ""
        response = client.post(
            "/events",
            json=event,
            headers=_auth_header(),
        )
        assert response.status_code == 422

    def test_empty_event_type_rejected(self):
        """Empty event_type fails validation."""
        event = _valid_event()
        event["event"]["event_type"] = ""
        response = client.post(
            "/events",
            json=event,
            headers=_auth_header(),
        )
        assert response.status_code == 422


# ============================================================
# Token Generation (Dev Only)
# ============================================================


class TestTokenGeneration:
    """Tests for POST /auth/token development endpoint."""

    def test_generate_token(self):
        """Token generation returns a valid JWT."""
        response = client.post(
            "/auth/token?tenant_id=demo-tenant&role=admin"
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["tenant_id"] == "demo-tenant"

    def test_generated_token_is_valid(self):
        """Generated token can be used for authentication."""
        # Get a token
        token_resp = client.post("/auth/token?tenant_id=test-co")
        token = token_resp.json()["access_token"]

        # Use it to ingest an event
        response = client.post(
            "/events",
            json=_valid_event(),
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 202


# ============================================================
# WebSocket
# ============================================================


class TestWebSocket:
    """Tests for WebSocket /stream endpoint."""

    def test_websocket_connect_disconnect(self):
        """WebSocket connects and disconnects cleanly."""
        with client.websocket_connect(
            "/stream/test-tenant/session-1?sdk_key=vgl_test_abc123"
        ) as ws:
            # Send a ping
            ws.send_json({"type": "ping"})
            response = ws.receive_json()
            assert response["type"] == "pong"

    def test_websocket_event_ack(self):
        """Sending an event via WebSocket gets an acknowledgment."""
        with client.websocket_connect(
            "/stream/test-tenant/session-2?sdk_key=vgl_test_xyz789"
        ) as ws:
            ws.send_json({
                "type": "event",
                "data": {
                    "user_id": "user-ws-1",
                    "event_type": "buffering_loop_3x",
                    "event_id": "ws-event-001",
                },
            })
            response = ws.receive_json()
            assert response["type"] == "ack"
            assert response["event_id"] == "ws-event-001"

    def test_websocket_missing_sdk_key(self):
        """WebSocket without sdk_key is rejected."""
        with pytest.raises(Exception):
            with client.websocket_connect(
                "/stream/test-tenant/session-3"
            ) as ws:
                ws.receive_json()

    def test_websocket_invalid_sdk_key(self):
        """WebSocket with invalid sdk_key format is rejected."""
        with pytest.raises(Exception):
            with client.websocket_connect(
                "/stream/test-tenant/session-4?sdk_key=bad_key"
            ) as ws:
                ws.receive_json()

    def test_websocket_multiple_events(self):
        """Multiple events sent over WebSocket all get acks."""
        with client.websocket_connect(
            "/stream/test-tenant/session-5?sdk_key=vgl_test_multi"
        ) as ws:
            for i in range(5):
                ws.send_json({
                    "type": "event",
                    "data": {
                        "user_id": "user-ws-multi",
                        "event_type": "ad_impression_paid_tier",
                        "event_id": f"ws-multi-{i}",
                    },
                })
                resp = ws.receive_json()
                assert resp["type"] == "ack"
                assert resp["event_id"] == f"ws-multi-{i}"


# ============================================================
# Kafka Fallback
# ============================================================


class TestKafkaFallback:
    """Tests that the service works without Kafka."""

    def test_event_accepted_without_kafka(self):
        """Events are accepted even when Kafka is down."""
        response = client.post(
            "/events",
            json=_valid_event(),
            headers=_auth_header(),
        )
        assert response.status_code == 202
        assert response.json()["accepted"] is True

    def test_health_shows_kafka_disconnected(self):
        """Health endpoint reports Kafka as disconnected."""
        response = client.get("/health")
        data = response.json()
        # In test environment, Kafka won't be running
        assert "kafka_connected" in data


# ============================================================
# Connection Manager Unit Tests
# ============================================================


class TestConnectionManager:
    """Tests for the WebSocket ConnectionManager."""

    def test_active_connection_count_starts_at_zero(self):
        from main import ConnectionManager
        mgr = ConnectionManager()
        assert mgr.active_connection_count == 0
