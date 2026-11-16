from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/weathergpt"
    open_meteo_timeout_seconds: float = 12.0
    imd_api_base_url: str = "https://mausam.imd.gov.in"
    ndma_sachet_cap_url: str = "https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
