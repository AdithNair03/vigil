from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    vigil_env: str = Field(default="development", alias="VIGIL_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    http_port: int = Field(default=9000)
    
    admin_secret_key: str = Field(default="super_secret_admin_key", alias="ADMIN_SECRET_KEY")

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
