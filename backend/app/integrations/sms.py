"""
SMS integration. Keep send_sms()'s signature stable — swapping the
underlying provider (Twilio -> AWS SNS, etc.) should only touch this file.
"""
from app.config import settings


def send_sms(to: str, body: str) -> None:
    if settings.sms_provider == "twilio":
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(to=to, from_=settings.twilio_from_number, body=body)
    else:
        print(f"[MOCK SMS] to={to} body={body!r}")


def send_otp_sms(to: str, code: str) -> None:
    send_sms(to, f"Your verification code is {code}. It expires in a few minutes.")
