from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    vigil_env: str = Field(default="development", alias="VIGIL_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    http_port: int = Field(default=8181)
    
    clickhouse_host: str = Field(default="localhost", alias="CLICKHOUSE_HOST")
    
    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
