"""SDK Gateway — JWT authentication and SDK key validation."""

from __future__ import annotations

import logging
import time
from typing import Any

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings

logger = logging.getLogger("vigil.sdk-gateway.auth")

# HTTPBearer with auto_error=False so we can provide custom error messages
_bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(
    data: dict[str, Any],
    expires_minutes: int | None = None,
) -> str:
    """Create a JWT access token.

    Args:
        data: Claims to encode in the token. Must include 'tenant_id'.
        expires_minutes: Token lifetime. Defaults to settings value.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire_min = expires_minutes or settings.jwt_access_token_expire_minutes
    to_encode["exp"] = int(time.time()) + (expire_min * 60)
    to_encode["iat"] = int(time.time())

    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token.

    Args:
        token: The JWT string.

    Returns:
        Decoded claims dictionary.

    Raises:
        HTTPException: If the token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_current_tenant(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """Extract and validate tenant identity from the request.

    Checks in order:
    1. Authorization: Bearer <JWT> header
    2. X-SDK-Key header (for simple SDK key auth)

    Args:
        request: The incoming request.
        credentials: Bearer token from Authorization header.

    Returns:
        Dict with at least 'tenant_id' and 'auth_method'.

    Raises:
        HTTPException: 401 if no valid auth is provided.
    """
    # Method 1: Bearer JWT token or SDK key passed as Bearer
    if credentials and credentials.credentials:
        token = credentials.credentials
        if token.startswith("vgl_") or token.startswith("vk_"):
            tenant_info = _validate_sdk_key(token)
            return {
                "tenant_id": tenant_info["tenant_id"],
                "auth_method": "sdk_key_bearer",
                "sdk_key": token,
            }
            
        payload = decode_access_token(token)
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(
                status_code=401,
                detail="Token missing tenant_id claim",
            )
        return {
            "tenant_id": tenant_id,
            "auth_method": "jwt",
            "claims": payload,
        }

    # Method 2: X-SDK-Key header
    sdk_key = request.headers.get("X-SDK-Key")
    if sdk_key:
        # In production, this calls TenantManagement.ValidateSDKKey via gRPC
        # and caches the result in Redis. For now, extract tenant from key format.
        tenant_info = _validate_sdk_key(sdk_key)
        return {
            "tenant_id": tenant_info["tenant_id"],
            "auth_method": "sdk_key",
            "sdk_key": sdk_key,
        }

    raise HTTPException(
        status_code=401,
        detail="Missing authentication. Provide Bearer token or X-SDK-Key header.",
    )


def _validate_sdk_key(sdk_key: str) -> dict[str, Any]:
    """Validate an SDK key and return tenant info.

    In Sprint 1, this does format validation only.
    Sprint 3+ will add gRPC call to TenantManagement + Redis cache.

    Expected format: vgl_{tenant_prefix}_{random}
    """
    if not (sdk_key.startswith("vgl_") or sdk_key.startswith("vk_")):
        raise HTTPException(
            status_code=401,
            detail="Invalid SDK key format. Expected: vgl_{tenant}_{key} or vk_{tenant}_{key}",
        )

    parts = sdk_key.split("_", 2)
    if len(parts) < 3:
        raise HTTPException(
            status_code=401,
            detail="Invalid SDK key format. Expected: vgl_{tenant}_{key}",
        )

    tenant_id = parts[1]
    if not tenant_id:
        raise HTTPException(
            status_code=401,
            detail="SDK key missing tenant identifier",
        )

    return {"tenant_id": tenant_id, "sdk_key": sdk_key}
