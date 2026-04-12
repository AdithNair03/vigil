"""Model Registry — MLflow wrapper for model versioning and deployment."""

from fastapi import FastAPI

app = FastAPI(
    title="Vigil Model Registry",
    description="Wraps MLflow for model versioning, champion/challenger deployment, and rollback.",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "model-registry"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"service": "model-registry", "version": "0.1.0"}
