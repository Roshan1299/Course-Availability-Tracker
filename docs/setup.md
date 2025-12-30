# Setup Guide

This guide provides detailed instructions for setting up the Course Availability Tracker.

## 🐳 Running with Docker 

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
```bash
# Build and start the container
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

Open: http://localhost:8000

### Stopping the Application
```bash
# Stop the container
docker-compose down
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