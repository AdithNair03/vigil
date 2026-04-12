# ============================================================
# VIGIL — Base Dockerfile for all Python microservices
# Build context: repo root
# Usage: docker build -f docker/service.Dockerfile --build-arg SERVICE_NAME=sdk-gateway .
# ============================================================

FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 vigil && \
    useradd --uid 1000 --gid vigil --shell /bin/bash --create-home vigil

WORKDIR /app

# --- Dependency stage ---
FROM base AS dependencies

ARG SERVICE_NAME
COPY services/${SERVICE_NAME}/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Application stage ---
FROM dependencies AS application

ARG SERVICE_NAME
COPY services/${SERVICE_NAME}/ ./
COPY proto/ /app/proto/

# Switch to non-root user
USER vigil

# Health check (override per service if needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Default command (override per service)
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
