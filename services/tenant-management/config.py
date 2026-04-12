from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    vigil_env: str = Field(default="development", alias="VIGIL_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    http_port: int = Field(default=8001)
    
    # Not using actual Postges locally to mock graceful degradation
    db_json_path: str = Field(default="local_db.json")

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
