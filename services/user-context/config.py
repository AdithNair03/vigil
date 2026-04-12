"""User Context — Configuration."""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    vigil_env: str = Field(default="development", alias="VIGIL_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # --- HTTP & gRPC ---
    http_port: int = Field(default=8003)
    grpc_port: int = Field(default=50050)

    # --- Redis ---
    redis_host: str = Field(default="localhost", alias="REDIS_HOST")
    redis_port: int = Field(default=6379, alias="REDIS_PORT")
    redis_password: str = Field(default="", alias="REDIS_PASSWORD")
    redis_socket_timeout: float = Field(default=1.0)
    
    # 30 days of inactivity TTL for user context
    context_ttl_seconds: int = Field(default=30 * 24 * 60 * 60)

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
