# SDK Gateway

## Single Responsibility
The SDK Gateway is the **sole entry point** for all client SDK traffic. It receives friction events from mobile/web SDKs via REST and WebSocket, authenticates requests using SDK keys (JWT), orchestrates the real-time critical path (User Context → Friction Classifier → Intervention Engine via gRPC), and returns interventions to the SDK — all within the 50ms latency budget. It also produces raw events to Kafka for async downstream processing.

## Ports
- **HTTP/WebSocket**: 8000
- No gRPC server (it is a gRPC *client* calling other services)

## Kafka Topics
- **Produces**: `vigil.{tenant_id}.events.raw`, `vigil.{tenant_id}.events.classified`
- **Consumes**: None

## gRPC Contracts (Client)
- Calls `UserContextService.GetUserContext` (user-context:50050) — <5ms
- Calls `FrictionClassifierService.ClassifyEvent` (friction-classifier:50051) — <15ms
- Calls `InterventionEngineService.SelectIntervention` (intervention-engine:50052) — <20ms
- Calls `TenantManagementService.ValidateSDKKey` (tenant-management, cached in Redis)

## Database
- **None** — stateless relay. Uses Redis only for SDK key validation cache.

## Latency Budget
- This service owns the total 50ms end-to-end budget.
- SDK key validation is cached in Redis (<1ms).
- gRPC fan-out to three services must complete within 50ms total.
