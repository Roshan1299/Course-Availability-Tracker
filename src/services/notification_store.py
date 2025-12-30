import json
import os
import tempfile
from typing import List, Dict, Any
from uuid import uuid4
from datetime import datetime

DATA_DIR = "data"
FILE_PATH = os.path.join(DATA_DIR, "notifications.json")


def _ensure_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def load_notifications() -> List[Dict[str, Any]]:
    _ensure_dir()
    if not os.path.exists(FILE_PATH):
        return []

    with open(FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_notifications(events: List[Dict[str, Any]]) -> None:
    _ensure_dir()

    with tempfile.NamedTemporaryFile("w", dir=DATA_DIR, delete=False) as tmp:
        json.dump(events, tmp, indent=2)
        temp_name = tmp.name

    os.replace(temp_name, FILE_PATH)


def log_notification(
    *,
    monitor_id: str,
    course_code: str,
    section_label: str,
    old_value: str,
    new_value: str,
):
    events = load_notifications()

    events.append({
        "id": str(uuid4()),
        "monitor_id": monitor_id,
        "course_code": course_code,
        "section_label": section_label,
        "old_value": old_value,
        "new_value": new_value,
        "timestamp": datetime.now().isoformat(),
    })

    save_notifications(events)
