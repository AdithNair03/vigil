"""SDK Gateway — Configuration via environment variables."""

import os

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Service ---
    vigil_env: str = Field(default="development", alias="VIGIL_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # --- JWT Auth ---
    jwt_secret_key: str = Field(
        default="dev-secret-key-change-in-production-256bit",
        alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=30, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # --- Kafka ---
    kafka_bootstrap_servers: str = Field(
        default="localhost:9092", alias="KAFKA_BOOTSTRAP_SERVERS"
    )
    kafka_producer_timeout_ms: int = Field(default=5000)
    kafka_retry_backoff_ms: int = Field(default=100)

    # --- Redis ---
    redis_host: str = Field(default="localhost", alias="REDIS_HOST")
    redis_port: int = Field(default=6379, alias="REDIS_PORT")
    redis_password: str = Field(default="", alias="REDIS_PASSWORD")

    # --- gRPC endpoints ---
    user_context_grpc_host: str = Field(
        default="localhost", alias="USER_CONTEXT_GRPC_HOST"
    )
    user_context_grpc_port: int = Field(default=50050, alias="USER_CONTEXT_GRPC_PORT")
    friction_classifier_grpc_host: str = Field(
        default="localhost", alias="FRICTION_CLASSIFIER_GRPC_HOST"
    )
    friction_classifier_grpc_port: int = Field(
        default=50051, alias="FRICTION_CLASSIFIER_GRPC_PORT"
    )
    intervention_engine_grpc_host: str = Field(
        default="localhost", alias="INTERVENTION_ENGINE_GRPC_HOST"
    )
    intervention_engine_grpc_port: int = Field(
        default=50052, alias="INTERVENTION_ENGINE_GRPC_PORT"
    )

    # --- Rate Limiting ---
    rate_limit_per_minute: int = Field(default=600)

    model_config = {"env_file": ".env", "extra": "ignore"}


# Singleton — import this everywhere
settings = Settings()
