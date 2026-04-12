# VIGIL — Architecture Overview

## System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│  Mobile/Web  │────▶│  SDK Gateway  │────▶│  Friction Classifier│────▶│  Intervention Engine │
│    SDK       │◀────│  (FastAPI)    │◀────│  (River ML)         │◀────│  (Vowpal Wabbit)     │
└─────────────┘     └──────┬───────┘     └────────────────────┘     └─────────────────────┘
                           │                         ▲
                           │                         │
                    ┌──────▼───────┐          ┌──────┴───────┐
                    │    Kafka     │          │ User Context  │
                    │  (Event Bus) │          │   (Redis)     │
                    └──────┬───────┘          └──────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌────────────┐ ┌────────────────┐
     │  Event     │ │  Stream    │ │  Outcome       │
     │  Ingestion │ │  Processor │ │  Tracker       │
     └─────┬──────┘ │  (Flink)   │ └────────┬───────┘
           │        └─────┬──────┘          │
           ▼              ▼                 ▼
     ┌─────────────────────────────────────────┐
     │              ClickHouse (OLAP)          │
     └─────────────────────┬───────────────────┘
                           │
                    ┌──────▼───────┐
                    │ Company Intel │
                    │  (Dashboard)  │
                    └──────────────┘
```

## Critical Latency Path (< 50ms total)

```
SDK → Gateway → User Context (Redis, <5ms)
             → Friction Classifier (River, <15ms)
             → Intervention Engine (VW, <20ms)
             → Gateway → SDK
             Network hops (gRPC): <10ms
```

## Service Communication

- **Sync (gRPC)**: Critical path only — Gateway ↔ UserContext ↔ Classifier ↔ InterventionEngine
- **Async (Kafka)**: Everything else — event fan-out, outcome tracking, analytics, notifications

## Data Ownership (Services NEVER share a database)

| Service | Data Store | Purpose |
|---------|-----------|---------|
| sdk-gateway | — | Stateless relay |
| event-ingestion | Kafka | Event validation & routing |
| user-context | Redis | Rolling 30-event window per user |
| friction-classifier | In-memory (River) | Online ML model weights |
| intervention-engine | In-memory (VW) | Bandit policy weights |
| intervention-delivery | Redis (Celery) | Task queue, dedup cache |
| outcome-tracker | PostgreSQL | Outcome events, A/B results |
| company-intel | ClickHouse | Aggregated analytics |
| tenant-management | PostgreSQL | Tenant records, SDK keys, billing |
| notification-service | Redis (Celery) | Task scheduling |
| model-registry | MLflow (PostgreSQL) | Model versions, experiments |
| stream-processor | Flink state | Windowed aggregations |
| admin-panel | — | Reads across services (admin only) |
