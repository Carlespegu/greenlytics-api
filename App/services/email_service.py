import smtplib
import json
from urllib import error, request
from email.message import EmailMessage

from App.core.config import settings


class EmailDeliveryError(Exception):
    pass


def _send_via_resend(*, to_email: str, subject: str, body: str):
    if not settings.RESEND_API_KEY:
        raise EmailDeliveryError("RESEND_API_KEY is not configured")
    if not settings.SMTP_FROM_EMAIL:
        raise EmailDeliveryError("SMTP_FROM_EMAIL is not configured")

    from_label = settings.SMTP_FROM_NAME or "Greenlytics"
    payload = json.dumps(
        {
            "from": f"{from_label} <{settings.SMTP_FROM_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "text": body,
        }
    ).encode("utf-8")

    resend_request = request.Request(
        settings.RESEND_API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(resend_request, timeout=30) as response:
            if response.status >= 400:
                raise EmailDeliveryError(
                    f"Resend request failed with status {response.status}"
                )
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise EmailDeliveryError(
            f"Resend request failed with status {exc.code}: {details}"
        ) from exc
    except Exception as exc:
        raise EmailDeliveryError(str(exc)) from exc


def _send_via_smtp(*, to_email: str, subject: str, body: str):
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


def send_email(*, to_email: str, subject: str, body: str):
    provider = settings.EMAIL_PROVIDER

    if provider == "resend":
        _send_via_resend(to_email=to_email, subject=subject, body=body)
        return

    if provider != "smtp":
        raise EmailDeliveryError(f"Unsupported EMAIL_PROVIDER '{provider}'")

    _send_via_smtp(to_email=to_email, subject=subject, body=body)
