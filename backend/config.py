from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    mongo_url: str
    db_name: str
    jwt_secret: str
    admin_email: str = "admin@eduquest.com"
    admin_password: str
    cors_origins: str = "http://localhost:3000"
    gemini_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
