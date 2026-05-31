"""
Application settings via pydantic-settings.
Reads from .env file automatically.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""

    # AI
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    huggingface_token: str = ""
    gemini_api_key: str = ""


    # Whisper
    whisper_mode: str = "api"           # "local" | "api"
    whisper_model_size: str = "large-v3"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"

    # App
    app_env: str = "development"
    secret_key: str = "change-me"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    max_file_size_bytes: int = 10 * 1024 * 1024 * 1024  # 10GB

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()
