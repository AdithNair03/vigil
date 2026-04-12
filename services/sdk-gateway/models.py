"""SDK Gateway — Pydantic v2 models mirroring protobuf message types."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


# ============================================================
# Enums
# ============================================================


class Platform(StrEnum):
    """Client SDK platforms."""

    IOS = "ios"
    ANDROID = "android"
    WEB = "web"


class Industry(StrEnum):
    """Supported industry verticals."""

    STREAMING = "streaming"
    FOOD_DELIVERY = "food_delivery"
    BANKING = "banking"
    SAAS = "saas"
    TELECOM = "telecom"
    ECOMMERCE = "ecommerce"


class Severity(StrEnum):
    """Friction severity levels."""

    LOW = "low"
    MEDIUM = "medium"
    WARNING = "warning"
    CRITICAL = "critical"


class InterventionType(StrEnum):
    """Types of interventions."""

    MESSAGE = "message"
    DISCOUNT = "discount"
    FEATURE_UNLOCK = "feature_unlock"
    SUPPORT_ESCALATION = "support_escalation"


class Channel(StrEnum):
    """Intervention delivery channels."""

    IN_APP = "in_app"
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"


# ============================================================
# Request / Response models
# ============================================================


class FrictionEventPayload(BaseModel):
    """Friction event sent by the SDK."""

    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = Field(..., min_length=1, max_length=128)
    user_id: str = Field(..., min_length=1, max_length=256)
    session_id: str = Field(..., min_length=1, max_length=256)
    event_type: str = Field(..., min_length=1, max_length=256)
    industry: str = Field(default="streaming", max_length=64)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payload: dict[str, Any] = Field(default_factory=dict)
    schema_version: str = Field(default="1.0.0")
    sdk_version: str = Field(default="0.1.0")
    platform: str = Field(default="web")
    app_version: str = Field(default="0.0.0")


class IngestEventRequest(BaseModel):
    """POST /events request body."""

    event: FrictionEventPayload
    sdk_key: str | None = Field(
        default=None,
        description="SDK key for tenant auth. Can also be passed via Authorization header.",
    )


class InterventionPayload(BaseModel):
    """Intervention returned to the SDK."""

    intervention_id: str
    tenant_id: str
    user_id: str
    intervention_type: str
    channel: str
    content: str
    template_id: str = ""
    parameters: dict[str, str] = Field(default_factory=dict)
    expected_reward: float = 0.0
    policy_version: str = ""
    priority: int = 1
    ttl_seconds: int = 300
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    holdout_group: str = "treatment"


class IngestEventResponse(BaseModel):
    """POST /events response body."""

    accepted: bool
    event_id: str
    intervention: InterventionPayload | None = None
    processing_time_ms: float
    value_gap_score: float | None = None


class HealthResponse(BaseModel):
    """GET /health response."""

    status: str = "ok"
    service: str = "sdk-gateway"
    version: str = "0.1.0"
    kafka_connected: bool = False
    environment: str = "development"
    uptime_seconds: float = 0.0


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
    detail: str = ""
    status_code: int = 400


class WebSocketMessage(BaseModel):
    """Message sent/received over WebSocket."""

    type: str  # "event", "intervention", "error", "ping", "pong"
    data: dict[str, Any] = Field(default_factory=dict)
    tenant_id: str = ""
    session_id: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
