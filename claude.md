# VIGIL — Universal Real-Time Friction Intelligence Platform
## Owner: Adith Nair (Admin + Lead Developer)
## Status: Sprint 1 — Active Build

---

## WHAT IS VIGIL

Vigil is a real-time friction intelligence SDK + platform. Any subscription-based business (streaming, food delivery, banking, SaaS, telecom, e-commerce) drops the Vigil SDK into their app and gets:
- Real-time friction event detection (ad on paid tier, paywall hit, late delivery, hidden fee)
- value_gap_score computed per user per event (0–10, lower = more friction)
- Automated intervention delivery back to the SDK within 800ms
- Company intelligence dashboard showing friction patterns, intervention ROI, product recommendations
- Weekly AI-generated product health reports

The core insight: churn is decided in micro-moments (the 3 seconds when an ad plays on a paid subscription, when a food order is late and nobody tells you). Vigil catches those moments live and acts before the user decides to leave.

---

## ADMIN / USER ROLES

### Adith Nair — SUPER ADMIN
- Access to ALL tenant data across ALL companies using Vigil
- System health dashboard: Kafka lag, Flink job status, Redis memory, ClickHouse query perf
- Model registry: deploy/rollback friction classifier models and bandit policies
- Tenant management: onboard/offboard companies, generate SDK keys, set billing
- Cross-tenant analytics: aggregated friction patterns across all industries
- Full database access, all environment variables, all secrets
- Can impersonate any tenant for debugging

### Company User (e.g. Amazon Prime product manager)
- Sees ONLY their own tenant's data
- Live friction feed for their app
- Intervention performance and ROI
- Product issue recommendations
- Weekly intelligence reports
- Cannot see other tenants, cannot access system internals

---

## ARCHITECTURE — 12 MICROSERVICES

All services live in /services/{service-name}/
Each service has its own: main.py, Dockerfile, requirements.txt, tests/, CLAUDE.md

### Service map:
1. sdk-gateway          — FastAPI :8000, receives SDK events, JWT auth, Kafka producer, WebSocket
2. event-ingestion      — Kafka consumer, Avro schema validation, tenant routing, DLQ
3. user-context         — Redis :6379, rolling 30-event window per user, gRPC :50050
4. friction-classifier  — River online ML, industry adapters, gRPC :50051, value_gap_score
5. intervention-engine  — Vowpal Wabbit contextual bandit, LinUCB, gRPC :50052
6. intervention-delivery— Multi-channel delivery, Celery worker, dedup/retry logic
7. outcome-tracker      — A/B holdout tracking, reward computation, feeds back to classifier
8. company-intel        — ClickHouse queries, FastAPI :8080, REST API for dashboards
9. tenant-management    — Postgres, SDK key gen, Stripe billing, FastAPI :8001
10. notification-service— Slack, SendGrid, PagerDuty, Celery beat scheduler
11. model-registry      — MLflow :5000, model versioning, champion/challenger A/B
12. stream-processor    — Apache Flink :8081, windowed aggregations, CEP patterns

### ADMIN service (additional):
13. admin-panel         — FastAPI :9000, Adith-only, cross-tenant view, system health

---

## TECH STACK — NON-NEGOTIABLE DECISIONS

### Backend
- Python 3.12
- FastAPI (all HTTP services)
- gRPC + Protobuf (inter-service sync calls on critical path)
- Celery + Redis (async task queue)

### Streaming & Processing
- Apache Kafka (event backbone, tenant-scoped topics: vigil.{tenant_id}.events)
- Apache Flink (stream processing, CEP, windowed aggregations)
- Avro + Schema Registry (event schema validation)

### ML
- River (online machine learning, no batch retraining)
- Vowpal Wabbit (contextual bandit, intervention selection)
- MLflow (model registry, experiment tracking)
- Vertex AI (offline base model training, import weights to River)

### Storage
- PostgreSQL (operational: tenants, interventions, outcomes)
- Redis (user context cache, Celery broker, intervention dedup)
- ClickHouse (OLAP: aggregated friction metrics, intervention ROI)
- S3 / GCS (model artifacts, batch exports)

### Frontend
- React 18 + TypeScript
- Tailwind CSS (design tokens from Figma exported via Style Dictionary)
- Observable Plot (analytical charts)
- D3 (friction radar, survival curves)
- Framer Motion (animations — state changes only, never decorative)
- Fontsource Inter + JetBrains Mono

### Infrastructure
- Docker + Docker Compose (local dev — one command: docker compose up)
- Kubernetes GKE (production)
- GitHub Actions (CI: lint → test → build → deploy)
- Nx monorepo (all 12 services + frontend in one repo)

### AI Integration
- Anthropic Claude API (intervention message generation, weekly reports)
- Google Gemini API (root cause analysis, alternative message generation)
- Both run ASYNC — never on critical latency path

---

## INTER-SERVICE COMMUNICATION RULES

### Sync (gRPC) — latency-critical path only:
sdk-gateway → user-context (get rolling state)
sdk-gateway → friction-classifier (score event)
friction-classifier → intervention-engine (select intervention)
intervention-engine → sdk-gateway (return action payload)
Total round trip: <50ms

### Async (Kafka) — everything else:
All events flow through Kafka topics
Services NEVER share a database — each owns its own data store
This is non-negotiable

---

## CODING CONVENTIONS

- Every service has a CLAUDE.md inside it describing that service's specific contracts
- All Protobuf definitions live in /proto/vigil.proto
- Tests: pytest, minimum 80% coverage before any service is considered complete
- Never hardcode secrets — all via environment variables
- All async FastAPI routes (async def everywhere)
- Pydantic v2 for all data validation
- Ruff for linting (pre-commit hook)
- Every Kafka message has: tenant_id, user_id, event_type, timestamp, payload, schema_version
- tenant_id is the first-class citizen — every query, every model, every cache key includes it

---

## FRICTION SIGNAL DICTIONARY (per industry)

### Streaming / OTT:
- ad_impression_paid_tier (severity: critical, weight: 0.9)
- rental_paywall_hit (severity: warning, weight: 0.6)
- content_search_zero_results (severity: medium, weight: 0.4)
- cancel_flow_opened (severity: critical, weight: 0.95)
- buffering_loop_3x (severity: warning, weight: 0.5)

### Food delivery:
- delivery_late_no_update (severity: critical, weight: 0.85)
- wrong_item_delivered (severity: critical, weight: 0.9)
- refund_flow_4_plus_steps (severity: warning, weight: 0.55)
- surge_price_shock (severity: warning, weight: 0.5)

### Banking / Fintech:
- hidden_fee_surfaced (severity: warning, weight: 0.65)
- transfer_declined_no_reason (severity: critical, weight: 0.8)
- support_loop_3rd_contact (severity: warning, weight: 0.6)

### SaaS:
- feature_paywall_hit (severity: warning, weight: 0.55)
- export_limit_reached (severity: warning, weight: 0.5)
- renewal_price_shock (severity: critical, weight: 0.85)

---

## DESIGN SYSTEM

Typography: Inter (headings 700, body 400, 16px, 1.6 line-height) + JetBrains Mono (code, metrics)
Primary accent: #0F6E56 (deep teal — trust, intelligence)
Grid: 4px base unit (spacing: 4,8,12,16,20,24,32,40,48,64)
Corners: 8px (components), 12px (cards), 16px (modals)
Motion: Framer Motion, spring physics, 200–300ms, state changes only
Charts: Observable Plot (analytics), D3 (custom: radar, survival curves)
No pie charts anywhere in Vigil

---

## BUILD ORDER (current sprint)

Sprint 1–2 (NOW): Infrastructure + contracts
- Docker Compose with all 12 services + Kafka + Flink + ClickHouse + Redis + PostgreSQL
- /proto/vigil.proto — all Protobuf definitions
- Nx monorepo structure
- CLAUDE.md per service
- GitHub repo + Actions CI skeleton

Sprint 3–4: SDK Gateway + Event Ingestion + User Context
Sprint 5–6: Friction Classifier (streaming industry first)
Sprint 7–8: Intervention Engine + Delivery
Sprint 9–10: Company Intelligence + Dashboard
Sprint 11–12: Tenant Management + Admin Panel + Production deploy

---

## ENVIRONMENT (LOCAL DEV)

All services run via: docker compose up
Kafka UI: localhost:8082
Flink UI: localhost:8081
MLflow: localhost:5000
PostgreSQL: localhost:5432
Redis: localhost:6379
ClickHouse: localhost:8123
SDK Gateway: localhost:8000
Company Intel API: localhost:8080
Admin Panel: localhost:9000