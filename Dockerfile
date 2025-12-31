# Official Playwright image with browsers preinstalled
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
# Force Python to flush stdout and stderr
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy all project files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir .

# Install Playwright browsers
RUN playwright install chromium

EXPOSE 8000

# Default runtime envs (safe defaults)
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=465

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]