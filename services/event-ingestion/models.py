"""Event Ingestion — Pydantic Validation Models."""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, ValidationInfo, field_validator


class IndustryEnum(str, Enum):
    STREAMING = "streaming"
    FOOD_DELIVERY = "food_delivery"
    BANKING = "banking"
    SAAS = "saas"
    TELECOM = "telecom"
    ECOMMERCE = "ecommerce"


class PlatformEnum(str, Enum):
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"
    SERVER = "server"


class FrictionEvent(BaseModel):
    """Strict structured FrictionEvent to be validated against raw ingests."""

    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = Field(..., min_length=1, max_length=128)
    user_id: str = Field(..., min_length=1, max_length=256)
    session_id: str = Field(..., min_length=1, max_length=256)
    event_type: str = Field(..., min_length=1)
    
    industry: IndustryEnum = IndustryEnum.STREAMING
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payload: dict[str, Any] = Field(default_factory=dict)
    
    schema_version: str = "1.0.0"
    sdk_version: str = "0.0.0"
    platform: PlatformEnum = PlatformEnum.WEB
    app_version: str = "0.0.0"

    # Attached explicitly during processing context:
    _processing_metadata: dict = {}

    @field_validator("timestamp", mode="before")
    def parse_datetime(cls, value: Any, info: ValidationInfo) -> datetime:
        if isinstance(value, str):
            try:
                # Basic ISO format check fallback
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                raise ValueError("Invalid timestamp format")
        return value
