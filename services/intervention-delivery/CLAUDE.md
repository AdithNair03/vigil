# Intervention Delivery

## Single Responsibility
The Intervention Delivery service is a **Celery worker** that handles the actual delivery of interventions across multiple channels (in-app, push notification, email, SMS). It consumes selected interventions from Kafka, deduplicates them (prevents same user getting multiple interventions within a cooldown window), handles retries with exponential backoff, and tracks delivery status.

## Ports
- **HTTP** (health only): 8006
- No gRPC

## Kafka Topics
- **Consumes**: `vigil.{tenant_id}.interventions.selected`
- **Produces**: `vigil.{tenant_id}.interventions.delivered`, `vigil.{tenant_id}.interventions.failed`

## gRPC Contracts
- None (async delivery only)

## Database
- **Redis** — Celery broker + deduplication cache
- Dedup key: `vigil:{tenant_id}:user:{user_id}:intervention:dedup` with TTL
- Delivery status tracking in Redis with 24h TTL

## Key Behaviors
- Multi-channel delivery: in-app (WebSocket push to SDK Gateway), push (APNs/FCM), email (SendGrid), SMS
- Deduplication: max 1 intervention per user per cooldown window (configurable, default 30min)
- Retry: exponential backoff with max 3 retries
- TTL enforcement: interventions expire if not delivered within ttl_seconds
