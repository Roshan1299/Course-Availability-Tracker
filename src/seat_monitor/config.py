import os
from dotenv import load_dotenv

load_dotenv()

URL = "https://register.beartracks.ualberta.ca/criteria.jsp?access=0&lang=en&tip=2&page=results&scratch=0&advice=0&legend=1&term=1940&sort=none&filters=iiiiiiiiii&bbs=&ds=&cams=UOFABiOFF_UOFABiMAIN&locs=any&isrts=any&ses=any&pl=&pac=1&course_0_0=CMPUT-402&va_0_0=6921&sa_0_0=&cs_0_0=UOFAB--1940_80739-80740-&cpn_0_0=&csn_0_0=&ca_0_0=&dropdown_0_0=al&ig_0_0=0&rq_0_0=&bg_0_0=0&cr_0_0=&ss_0_0=0&sbc_0_0=0&course_1_0=PSYCH-104&va_1_0=bf1d&sa_1_0=&cs_1_0=UOFAB--1940_82704-82705-&cpn_1_0=&csn_1_0=&ca_1_0=&dropdown_1_0=al&ig_1_0=0&rq_1_0=&bg_1_0=0&cr_1_0=&ss_1_0=0&sbc_1_0=0"

COURSE_CODE = "PSYCH 104"
SECTION_LABEL = "LEC B1"

CHECK_EVERY_SECONDS = 90

STATE_FILE = "data/last_seen.txt"

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465

SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL")

if not all([SENDER_EMAIL, SENDER_APP_PASSWORD, RECIPIENT_EMAIL]):
    raise RuntimeError("Missing email environment variables")
