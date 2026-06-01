from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Inventory Order API"
    database_url: str = "postgresql+psycopg2://inventory_user:change_this_password@db:5432/inventory_db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return origins or ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
