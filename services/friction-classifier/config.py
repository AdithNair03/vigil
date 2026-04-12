"""Friction Classifier — Configuration."""

from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    vigil_env: str = Field(default="development", alias="VIGIL_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    http_port: int = Field(default=8002)
    grpc_port: int = Field(default=50051)

    kafka_bootstrap_servers: str = Field(default="localhost:9092", alias="KAFKA_BOOTSTRAP_SERVERS")
    
    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
