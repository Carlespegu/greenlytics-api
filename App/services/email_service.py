import smtplib
from email.message import EmailMessage

from App.core.config import settings


class EmailDeliveryError(Exception):
    pass


def send_email(*, to_email: str, subject: str, body: str):
    if not settings.SMTP_HOST:
        raise EmailDeliveryError("SMTP_HOST is not configured")
    if not settings.SMTP_FROM_EMAIL:
        raise EmailDeliveryError("SMTP_FROM_EMAIL is not configured")

    message = EmailMessage()
    from_label = settings.SMTP_FROM_NAME or "Greenlytics"
    message["Subject"] = subject
    message["From"] = f"{from_label} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD or "")
            server.send_message(message)
    except Exception as exc:
        raise EmailDeliveryError(str(exc)) from exc
