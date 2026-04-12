# Notification Service

## Single Responsibility
The Notification Service handles **external notifications** for both operational alerts (PagerDuty) and business communications (Slack, email via SendGrid). It uses Celery Beat for scheduled tasks (weekly reports, daily digests) and Celery workers for async notification delivery.

## Ports
- **HTTP** (health only): 8008
- No gRPC

## Kafka Topics
- **Consumes**: `vigil.{tenant_id}.reports.generated`, `vigil.system.alerts`
- **Produces**: `vigil.{tenant_id}.notifications.sent`

## gRPC Contracts
- None (async notification delivery only)

## Database
- **Redis** — Celery broker + beat scheduler state
- Notification history and dedup state in Redis with TTL

## Key Behaviors
- Channels: Slack webhooks, SendGrid email, PagerDuty incidents
- Celery Beat schedules: weekly intelligence reports, daily friction digests
- Rate limiting per tenant per channel
- Template rendering for notification content
- Deduplication to prevent notification storms
