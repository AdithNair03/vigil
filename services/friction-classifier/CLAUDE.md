# Friction Classifier

## Single Responsibility
The Friction Classifier is an **online ML service** using River that classifies friction events in real-time. It receives an event + user context via gRPC, runs it through industry-specific adapters (streaming, food delivery, banking, SaaS), and returns a `value_gap_score` (0–10), severity level, churn probability, and feature importance — all within 15ms. The model learns incrementally from every event (no batch retraining).

## Ports
- **HTTP** (health only): 8004
- **gRPC**: 50051

## Kafka Topics
- **Consumes**: `vigil.{tenant_id}.events.validated` (for incremental model updates)
- **Produces**: `vigil.{tenant_id}.events.scored` (classified events with friction scores)

## gRPC Contracts (Server)
- `FrictionClassifierService.ClassifyEvent` — classifies a single event (<15ms)
- `FrictionClassifierService.BatchClassify` — batch classification for backfill

## Database
- **In-memory** — River model weights held in memory
- Model snapshots persisted to MLflow via Model Registry service
- Per-tenant model weights (models are tenant-scoped)

## Latency Budget
- ClassifyEvent must complete in **<15ms**
- Model inference is CPU-bound; feature extraction must be pre-computed by User Context
- Industry adapters add feature engineering but must not exceed budget
