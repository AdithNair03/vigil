# User Context

## Single Responsibility
The User Context service maintains a **rolling 30-event window per user** in Redis. It provides sub-5ms lookups of user state (recent events, computed features, subscription tier, churn risk segment) to the critical path via gRPC. Every time a new event arrives, it updates the user's rolling window and recomputes derived features.

## Ports
- **HTTP** (health only): 8003
- **gRPC**: 50050

## Kafka Topics
- **Consumes**: `vigil.{tenant_id}.events.validated` (updates user context on each event)
- **Produces**: None

## gRPC Contracts (Server)
- `UserContextService.GetUserContext` — returns rolling user state (<5ms)
- `UserContextService.UpdateUserContext` — updates user state with new event

## Database
- **Redis** — each user's context stored as `vigil:{tenant_id}:user:{user_id}:context`
- Rolling window of last 30 events as a Redis list
- Precomputed feature vector as a Redis hash
- TTL: 30 days of inactivity

## Latency Budget
- GetUserContext must complete in **<5ms** including Redis round-trip
- This is the tightest budget of any service on the critical path
