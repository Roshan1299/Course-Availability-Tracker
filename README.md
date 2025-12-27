# Course Seat Monitor

A backend-style Python service that monitors dynamically rendered university
course registration pages and sends email notifications when seat availability
changes.

This project is designed to reliably track seat counts on JavaScript-heavy
web pages that traditional browser extensions and simple scrapers struggle
to handle.

---

## ✨ Features

- Monitors **dynamically loaded** course pages using a headless browser
- Periodically refreshes the page to fetch **live seat data**
- Detects **state changes** (seat count up or down)
- Sends **email notifications** on changes
- Uses persistent state to avoid duplicate alerts
- Modular, production-oriented code structure

---

## 🧠 Motivation

Most existing solutions (browser extensions, DOM polling, Tampermonkey scripts)
are unreliable for modern, JavaScript-heavy websites:

- They depend on open tabs
- They break when the DOM is re-rendered
- They are throttled by browsers
- They cannot run reliably in the background

This project solves those issues by using a **headless browser worker**
that reloads the page on a fixed schedule and extracts seat data after
client-side rendering completes.

---

## 🏗️ Architecture Overview

- **Scheduler** periodically reloads the target page
- **Scraper** extracts seat data after dynamic content loads
- **State manager** tracks previously seen values
- **Notifier** sends alerts when changes are detected

For a detailed breakdown, see  
[`docs/architecture.md`](docs/architecture.md)

---

## 🧰 Tech Stack

- **Python 3.10+**
- **Playwright** (Chromium)
- **AsyncIO**
- **SMTP (Gmail)**
- **python-dotenv**

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/course-seat-monitor.git
cd course-seat-monitor
```

### 2. Create and activate a virtual environment

```bash
# Linux/macOS
python -m venv venv
source venv/bin/activate

# Windows
venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install .
```

### 4. Install Playwright browser (required)

```bash
playwright install chromium
```

### 5. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and provide:
- `SENDER_EMAIL`: Gmail address
- `GMAIL_APP_PASSWORD`: Gmail App Password
- `RECIPIENT_EMAIL`: Recipient email address

### 6. Run the monitor

```bash
python -m seat_monitor.main
```

---

## 📬 Notification Behavior

- The monitor checks seat availability at a configurable interval
- An email is sent whenever the seat count changes
- State is persisted across runs to prevent duplicate alerts

---

## ⚠️ Runtime Notes

- The service must remain running to monitor changes
- The machine must not be sleeping
- The browser UI does not need to be open
- For long local runs on macOS:
  ```bash
  caffeinate -i
  ```

---

## 🔒 Security Notes

- Secrets are stored in environment variables
- `.env` files are excluded from version control
- Gmail App Passwords should be rotated if compromised

---

## 📈 Future Improvements

- Multi-course and multi-user support
- Web dashboard for managing monitored courses
- Notification channels (SMS, Discord, Push)
- Deployment as a cloud-based service

---

## 📄 License

This project is for educational and personal use.
Please respect the terms of service of the monitored websites.