"""
Central app configuration. All secrets/config come from environment
variables (see .env.example) — nothing is hardcoded here.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database ---
    database_url: str = "sqlite:///./app.db"

    # --- OTP behavior ---
    otp_length: int = 6
    otp_ttl_seconds: int = 300
    otp_max_attempts: int = 5
    otp_resend_cooldown_seconds: int = 60

    # --- JWT / sessions ---
    jwt_secret_key: str = "change-me-in-.env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # --- SMS provider ---
    sms_provider: str = "mock"  # "mock" or "twilio"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""

    # --- Email provider ---
    email_provider: str = "mock"  # "mock" or "sendgrid"
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
