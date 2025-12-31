# Official Playwright image with browsers preinstalled
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy project metadata
COPY pyproject.toml ./

# Install Python dependencies (THIS is the missing step)
RUN pip install --no-cache-dir .

# Copy application code
COPY src ./src
COPY data ./data
COPY docs ./docs

EXPOSE 8000

# Default runtime envs (safe defaults)
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=465

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
