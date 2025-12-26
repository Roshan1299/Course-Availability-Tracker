import asyncio
import os
import ssl
import smtplib
from datetime import datetime
from email.message import EmailMessage

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError


# ---------------------------
# CONFIG (edit these)
# ---------------------------

URL = "https://register.beartracks.ualberta.ca/criteria.jsp?access=0&lang=en&tip=2&page=results&scratch=0&advice=0&legend=1&term=1940&sort=none&filters=iiiiiiiiii&bbs=&ds=&cams=UOFABiOFF_UOFABiMAIN&locs=any&isrts=any&ses=any&pl=&pac=1&course_0_0=CMPUT-495&va_0_0=4641&sa_0_0=&cs_0_0=UOFAB--1940_82665--&cpn_0_0=&csn_0_0=&ca_0_0=&dropdown_0_0=us_UOFAB--1940_82665--&ig_0_0=0&rq_0_0=&bg_0_0=0&cr_0_0=&ss_0_0=0&sbc_0_0=0&course_1_0=CMPUT-365&va_1_0=44c4&sa_1_0=&cs_1_0=UOFAB--1940_84561--&cpn_1_0=&csn_1_0=&ca_1_0=&dropdown_1_0=us_UOFAB--1940_84561--&ig_1_0=0&rq_1_0=&bg_1_0=0&cr_1_0=&ss_1_0=0&sbc_1_0=0&course_2_0=SPH-200&va_2_0=4d75&sa_2_0=&cs_2_0=UOFAB--1940_85754--&cpn_2_0=&csn_2_0=&ca_2_0=&dropdown_2_0=us_UOFAB--1940_85754--&ig_2_0=0&rq_2_0=&bg_2_0=0&cr_2_0=&ss_2_0=0&sbc_2_0=0&course_3_0=CMPUT-467&va_3_0=adc7&sa_3_0=&cs_3_0=&cpn_3_0=&csn_3_0=&ca_3_0=&dropdown_3_0=us_UOFAB--1940_86766--&ig_3_0=1&rq_3_0=&bg_3_0=0&cr_3_0=&ss_3_0=0&sbc_3_0=0&course_4_0=CMPUT-331&va_4_0=5692&sa_4_0=&cs_4_0=UOFAB--1940_86472--&cpn_4_0=&csn_4_0=&ca_4_0=&dropdown_4_0=us_UOFAB--1940_86472--&ig_4_0=0&rq_4_0=&bg_4_0=0&cr_4_0=&ss_4_0=0&sbc_4_0=0&course_5_0=NS-115&va_5_0=2b29&sa_5_0=&cs_5_0=UOFAB--1940_89387--&cpn_5_0=&csn_5_0=&ca_5_0=&dropdown_5_0=us_UOFAB--1940_89387--&ig_5_0=0&rq_5_0=&bg_5_0=0&cr_5_0=&ss_5_0=0&sbc_5_0=0&course_6_0=CMPUT-402&va_6_0=6921&sa_6_0=&cs_6_0=UOFAB--1940_80739-80740-&cpn_6_0=&csn_6_0=&ca_6_0=&dropdown_6_0=al&ig_6_0=0&rq_6_0=&bg_6_0=0&cr_6_0=&ss_6_0=0&sbc_6_0=0&course_7_0=CMPUT-366&va_7_0=d3be&sa_7_0=&cs_7_0=UOFAB--1940_80678-80679-&cpn_7_0=&csn_7_0=&ca_7_0=&dropdown_7_0=al&ig_7_0=0&rq_7_0=&bg_7_0=0&cr_7_0=&ss_7_0=0&sbc_7_0=0"

COURSE_CODE = "CMPUT 402"
SECTION_LABEL = "LEC B1"          # change to "LAB H01" if you want lab instead
FULL_VALUE = "80/80"              # trigger alert when value != this

CHECK_EVERY_SECONDS = 90          # 60-120 seconds is reasonable

STATE_FILE = "last_seen.txt"

# Email (Gmail SMTP)
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465  # SSL

SENDER_EMAIL = "banisettirosh@gmail.com"
SENDER_APP_PASSWORD = "akob hjtz wazk gqyo"   # Gmail App Password (NOT your normal password)
RECIPIENT_EMAIL = "banisett@ualberta.ca"


# ---------------------------
# EMAIL UTILS
# ---------------------------

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


def load_last_seen() -> str | None:
    if not os.path.exists(STATE_FILE):
        return None
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return f.read().strip() or None


def save_last_seen(value: str) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        f.write(value)


# ---------------------------
# SCRAPING LOGIC
# ---------------------------

async def fetch_seat_value(page) -> str | None:
    """
    Loads the page and extracts the seatText for:
      COURSE_CODE (e.g. CMPUT 402)
      SECTION_LABEL (e.g. LEC B1)
    Returns something like "80/80" or None if not found.
    """
    await page.goto(URL, wait_until="domcontentloaded")
    # Give JS time to render dynamic content
    await page.wait_for_timeout(1500)

    # Wait for the general structure to exist
    await page.wait_for_selector(".course_box", timeout=20000)

    # Evaluate in the browser context for reliability/speed
    seat_value = await page.evaluate(
        """([courseCode, sectionLabel]) => {
            const boxes = document.querySelectorAll(".course_box");
            for (const box of boxes) {
                const title = box.querySelector(".course_title");
                if (!title) continue;
                if (!title.textContent.includes(courseCode)) continue;

                // Find the section label (LEC B1 / LAB H01)
                const blocks = box.querySelectorAll("strong.type_block");
                let target = null;
                for (const b of blocks) {
                    if (b.textContent.includes(sectionLabel)) { target = b; break; }
                }
                if (!target) return null;

                // The seatText lives within the same td block
                const td = target.closest("td");
                if (!td) return null;

                const seat = td.querySelector(".seatText");
                return seat ? seat.textContent.trim() : null;
            }
            return null;
        }""",
        [COURSE_CODE, SECTION_LABEL],
    )

    return seat_value


async def main_loop() -> None:
    last_seen = load_last_seen()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        page = await context.new_page()

        while True:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            try:
                value = await fetch_seat_value(page)
                print(f"[{now}] seatText = {value!r}")

                if value is None:
                    # Don't spam email; just keep trying.
                    # If this happens a lot, it usually means the site changed or needs more wait time.
                    await asyncio.sleep(CHECK_EVERY_SECONDS)
                    continue

                # Initialize state file if first run
                if last_seen is None:
                    last_seen = value
                    save_last_seen(value)
                    print(f"[{now}] Initialized last_seen = {value}")
                    await asyncio.sleep(CHECK_EVERY_SECONDS)
                    continue

                # Alert when it changes (especially when it becomes not FULL_VALUE)
                if value != last_seen:
                    subject = f"Seat monitor change: {COURSE_CODE} {SECTION_LABEL} is now {value}"
                    body = (
                        f"Detected a change for {COURSE_CODE} {SECTION_LABEL}\n\n"
                        f"Previous: {last_seen}\n"
                        f"Current:  {value}\n\n"
                        f"Time: {now}\n"
                        f"URL: {URL}\n"
                    )

                    # Only email when it opens (value != FULL_VALUE)
                    if value != FULL_VALUE:
                        send_email(subject, body)
                        print(f"[{now}] EMAIL SENT ✅")

                    last_seen = value
                    save_last_seen(value)

            except PlaywrightTimeoutError as e:
                print(f"[{now}] Timeout waiting for content: {e}")
            except Exception as e:
                print(f"[{now}] Unexpected error: {e}")

            await asyncio.sleep(CHECK_EVERY_SECONDS)


if __name__ == "__main__":
    asyncio.run(main_loop())
