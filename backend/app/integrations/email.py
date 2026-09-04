"""
Email integration. Keep send_email()'s signature stable — swapping the
underlying provider (SendGrid -> AWS SES, etc.) should only touch this file.
"""
from config import settings


def send_email(to: str, subject: str, body: str) -> None:
    if settings.email_provider == "sendgrid":
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=settings.sendgrid_from_email,
            to_emails=to,
            subject=subject,
            plain_text_content=body,
        )
        client = SendGridAPIClient(settings.sendgrid_api_key)
        client.send(message)
    else:
        print(f"[MOCK EMAIL] to={to} subject={subject!r} body={body!r}")


def send_otp_email(to: str, code: str) -> None:
    send_email(
        to,
        subject="Your verification code",
        body=f"Your verification code is {code}. It expires in a few minutes.",
    )
