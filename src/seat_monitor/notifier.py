import ssl
import smtplib
from email.message import EmailMessage
from seat_monitor.config import (
    SMTP_HOST,
    SMTP_PORT,
    SENDER_EMAIL,
    SENDER_APP_PASSWORD,
    RECIPIENT_EMAIL,
)

def send_email(subject: str, body: str, recipient_email: str = None) -> None:
    # Use the provided recipient email, or fall back to the default from config
    recipient = recipient_email if recipient_email else RECIPIENT_EMAIL

    msg = EmailMessage()
    msg["From"] = SENDER_EMAIL
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
        server.send_message(msg)
