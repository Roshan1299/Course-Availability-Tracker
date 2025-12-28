#!/usr/bin/env bash
set -e

echo "▶ Activating virtual environment..."
source venv/bin/activate

echo "▶ Starting Course Seat Monitor..."
python -m seat_monitor.main
