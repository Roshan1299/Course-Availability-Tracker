# Setup Guide

This guide provides detailed instructions for setting up the Course Availability Tracker.

## 🐳 Running with Docker (Recommended)

### Prerequisites
- Docker (Install from [Docker Desktop](https://www.docker.com/products/docker-desktop/) or via command line)
- Docker Compose (usually included with Docker Desktop)

### Installing Docker
**For macOS:**
```bash
# Using Homebrew
brew install --cask docker
```

**For Ubuntu/Debian:**
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install docker.io docker-compose

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

**For Windows:**
- Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

After installation, start Docker Desktop and wait for it to be ready.

### Setup
1. Clone the repository
2. Create `.env` file with your email settings:
```bash
cp .env.example .env
# Edit .env with your email credentials
```

### Run the Application

**Option 1: Using Docker Compose (Recommended)**
```bash
# Normal startup (may use cached layers)
docker-compose up --build

# If you encounter ContainerConfig issues or want a fresh build:
# Build without cache first
docker-compose build --no-cache

# Then start the container
docker-compose up

# Or run in background
docker-compose up -d
```

**Option 2: Using Docker Commands**
```bash
# Build the image
docker build -t course-availability-tracker .

# Run the container (with data persistence)
docker run -p 8000:8000 --env-file .env -v ./data:/app/data course-availability-tracker

# Or run in background
docker run -d -p 8000:8000 --env-file .env -v ./data:/app/data course-availability-tracker
```

Open: http://localhost:8000

### Stopping the Application

**For Docker Compose:**
```bash
# Stop the container
docker-compose down
```

**For Docker Run:**
```bash
# Stop the container (find container ID first)
docker ps
docker stop <container_id>

# Or if running in background, stop by name
docker stop $(docker ps -q --filter ancestor=course-availability-tracker)
```

## 🏃 Running Locally (Alternative)

If you prefer to run locally without Docker (requires Python setup):

```bash
# create virtual env
python -m venv venv
source venv/bin/activate

# install deps
pip install .
playwright install

# run server
bash scripts/run_local.sh
```

Open: http://localhost:8000