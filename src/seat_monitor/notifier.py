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

def send_email(subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = SENDER_EMAIL
    msg["To"] = RECIPIENT_EMAIL
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
        server.send_message(msg)
