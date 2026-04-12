"""Event Ingestion — Configuration."""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    vigil_env: str = Field(default="development", alias="VIGIL_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # --- HTTP ---
    http_port: int = Field(default=8004)

    # --- Kafka ---
    kafka_bootstrap_servers: str = Field(
        default="localhost:9092", alias="KAFKA_BOOTSTRAP_SERVERS"
    )
    kafka_schema_registry_url: str = Field(
        default="http://localhost:8085", alias="KAFKA_SCHEMA_REGISTRY_URL"
    )
    kafka_consumer_group: str = Field(default="vigil-event-ingestion-group")
    
    kafka_raw_topic_pattern: str = Field(default="^vigil\\..*\\.events\\.raw$")
    kafka_dlq_topic: str = Field(default="vigil.events.dlq")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
