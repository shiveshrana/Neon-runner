"""
Application configuration.

All values are read from environment variables so the same image can be
deployed unchanged across environments (local, staging, Kubernetes).
Nothing here is a secret - secrets belong in a Kubernetes Secret / .env
file that is never committed to source control.
"""
import os


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # Comma separated list of origins allowed to call this API.
    # In production this should be set to the real frontend origin(s).
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]


settings = Settings()
