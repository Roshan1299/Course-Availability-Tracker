import asyncio
from datetime import datetime

from playwright.async_api import async_playwright, TimeoutError

from seat_monitor.config import (
    URL,
    COURSE_CODE,
    SECTION_LABEL,
    CHECK_EVERY_SECONDS,
    STATE_FILE,
)
from seat_monitor.scraper import fetch_seat_value
from seat_monitor.state import load_last_seen, save_last_seen
from seat_monitor.notifier import send_email


async def main_loop():
    last_seen = load_last_seen(STATE_FILE)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        while True:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            try:
                value = await fetch_seat_value(
                    page, URL, COURSE_CODE, SECTION_LABEL
                )
                print(f"[{now}] seatText = {value}")

                if value is None:
                    await asyncio.sleep(CHECK_EVERY_SECONDS)
                    continue

                if last_seen is None:
                    last_seen = value
                    save_last_seen(STATE_FILE, value)
                    print(f"[{now}] Initialized last_seen = {value}")
                    await asyncio.sleep(CHECK_EVERY_SECONDS)
                    continue

                if value != last_seen:
                    subject = (
                        f"Seat change: {COURSE_CODE} "
                        f"{SECTION_LABEL} → {value}"
                    )
                    body = (
                        f"Seat count changed\n\n"
                        f"Course: {COURSE_CODE}\n"
                        f"Section: {SECTION_LABEL}\n\n"
                        f"Previous: {last_seen}\n"
                        f"Current:  {value}\n\n"
                        f"Time: {now}\n"
                        f"URL: {URL}\n"
                    )

                    send_email(subject, body)
                    print(f"[{now}] EMAIL SENT")

                    last_seen = value
                    save_last_seen(STATE_FILE, value)

            except TimeoutError as e:
                print(f"[{now}] Timeout: {e}")
            except Exception as e:
                print(f"[{now}] Error: {e}")

            await asyncio.sleep(CHECK_EVERY_SECONDS)


if __name__ == "__main__":
    asyncio.run(main_loop())
