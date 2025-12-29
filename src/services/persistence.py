import json
import os
import tempfile
from typing import Dict, Any

DATA_DIR = "data"
STATE_FILE = os.path.join(DATA_DIR, "monitors.json")


def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def load_state() -> Dict[str, Any]:
    """Load persisted monitors from disk."""
    ensure_data_dir()

    if not os.path.exists(STATE_FILE):
        return {}

    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state: Dict[str, Any]) -> None:
    """Atomically save monitor state to disk."""
    ensure_data_dir()

    with tempfile.NamedTemporaryFile(
        "w",
        dir=DATA_DIR,
        delete=False,
        encoding="utf-8",
    ) as tmp:
        json.dump(state, tmp, indent=2)
        temp_name = tmp.name

    os.replace(temp_name, STATE_FILE)
