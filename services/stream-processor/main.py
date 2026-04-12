"""Stream Processor — Flink job management and health monitoring."""

from fastapi import FastAPI

app = FastAPI(
    title="Vigil Stream Processor",
    description="Manages Flink jobs for windowed aggregations and CEP pattern detection.",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "stream-processor"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"service": "stream-processor", "version": "0.1.0"}
