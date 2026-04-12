"""Notification Service — Slack, email, PagerDuty notifications via Celery."""

from fastapi import FastAPI

app = FastAPI(
    title="Vigil Notification Service",
    description="Delivers notifications via Slack, SendGrid, and PagerDuty with Celery scheduling.",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "notification-service"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"service": "notification-service", "version": "0.1.0"}
