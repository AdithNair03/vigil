from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    vigil_env: str = Field(default="development", alias="VIGIL_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    http_port: int = Field(default=8007)
    intervention_grpc_url: str = Field(default="localhost:50052")
    
    # Postgres
    db_host: str = Field(default="localhost")
    
    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
