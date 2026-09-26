"""
Central app configuration. All secrets/config come from environment
variables (see .env.example) — nothing is hardcoded here.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database ---
    database_url: str = "sqlite:///./app.db"
    db_pool_size: int = 5
    # Below the Supabase pooler's idle timeout, so a pooled connection is
    # retired before the server can drop it out from under us.
    db_pool_recycle_seconds: int = 1800
    # Connections unused for longer than this are pinged on checkout.
    db_ping_after_idle_seconds: int = 60

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

    # --- Gamification: Redis cache ---
    # 127.0.0.1, not localhost — on Windows, async DNS resolution can
    # prefer localhost's IPv6 (::1) record while Redis-compatible servers
    # (Memurai included) typically only listen on IPv4, causing every
    # connection from redis.asyncio to silently fail and fall back to the
    # degraded (DB-only) path even when the server is genuinely running.
    redis_url: str = "redis://127.0.0.1:6379/0"
    xp_cache_ttl_seconds: int = 172800  # 48h
    streak_cache_ttl_seconds: int = 172800  # 48h

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
