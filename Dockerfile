# Official Playwright image with browsers preinstalled
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# App directory
WORKDIR /app

# Install Python dependencies
COPY pyproject.toml poetry.lock* requirements.txt* ./

# Support both poetry or requirements.txt
RUN if [ -f poetry.lock ]; then \
        pip install poetry && poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi; \
    elif [ -f requirements.txt ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    fi

# Copy application code
COPY src ./src
COPY data ./data
COPY ui ./ui

# Expose API port
EXPOSE 8000

# Default environment variables (safe defaults)
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=465

# Start FastAPI
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
