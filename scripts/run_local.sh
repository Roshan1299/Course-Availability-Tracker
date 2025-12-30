#!/usr/bin/env bash
set -e

echo "▶ Activating virtual environment..."
source venv/bin/activate

echo "▶ Starting Course Availability Tracker API Server..."
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
