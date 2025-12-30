# 🎓 Course Availability Tracker

A production-style monitoring system that tracks university course seat availability
on JavaScript-heavy registration pages and notifies users when seats change.

Built as a **backend worker + API + dashboard UI**, not a browser extension, to ensure
reliability on dynamically rendered pages.

---

## ✨ Features

- ✅ Reliable scraping using a headless browser (Playwright)
- 🔁 Periodic monitoring with configurable intervals
- ⏸ Pause / ▶ Resume / ⛔ Stop monitors
- 🧠 Clear separation between **user intent** and **system health**
- 📬 Email notifications on seat changes
- 📜 Persistent notification history per monitor
- 💾 Disk-backed persistence (monitors survive restarts)
- 📊 Live dashboard with timestamps and status indicators

---

## 🧠 Key Concepts

### User Intent vs System State

This system intentionally separates **what the user wants** from **what the system observes**:

| Category | Meaning |
|-------|--------|
| **Mode** | User intent: `active`, `paused`, `stopped` |
| **Health** | System state: `healthy`, `stale`, `error` |

This distinction makes the UI easier to understand and avoids ambiguous "status" labels.

---

## 🚀 How It Works

1. User builds a schedule in BearTracks
2. User copies the resulting URL
3. Tracker loads the page in a headless browser
4. JavaScript executes fully
5. Seat values are extracted from the DOM
6. Changes are detected and persisted
7. Notifications are sent (if enabled)

---

## 🖥️ Dashboard UI

The web UI allows users to:

- Add monitors using BearTracks URLs
- See current seat counts
- View **last checked** and **last changed** timestamps
- Pause / resume monitors without losing state
- View notification history in a modal
- Understand system health at a glance

---

## 📦 Tech Stack

- **Backend**: FastAPI, asyncio
- **Scraping**: Playwright (Chromium)
- **Frontend**: Vanilla HTML/CSS/JS
- **Persistence**: Atomic JSON file storage
- **Notifications**: SMTP (Gmail App Password)

---

## 🏃 Running Locally

```bash
# create virtual env
python -m venv venv
source venv/bin/activate

# install deps
pip install .
playwright install

# run server
scripts/run_local.sh
```

Open: http://localhost:8000

---

⚠️ **Disclaimer**

This project is for educational and personal use.
Always respect your institution's terms of service.

---

## 📈 Roadmap

- Multi-user support
- Auth + per-user email settings
- Database-backed persistence
- Rate limiting & backoff
- Deployment-ready worker model

---

## 🧑‍💻 Author

Built by Roshan as a backend-focused system demonstrating:

- async workers
- stateful monitoring
- UI ↔ API coordination
- real-world scraping challenges