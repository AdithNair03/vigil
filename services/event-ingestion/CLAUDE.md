# Event Ingestion

## Single Responsibility
The Event Ingestion service is a **Kafka consumer** that reads raw friction events from `vigil.{tenant_id}.events.raw`, validates them against Avro schemas (via Schema Registry), routes them to tenant-specific processing topics, and sends malformed events to a dead letter queue (DLQ). It acts as the quality gate for all incoming event data.

## Ports
- **HTTP** (health only): 8002
- No gRPC server

## Kafka Topics
- **Consumes**: `vigil.*.events.raw` (wildcard across tenants)
- **Produces**: `vigil.{tenant_id}.events.validated`, `vigil.events.dlq`

## gRPC Contracts
- None (pure Kafka consumer/producer)

## Database
- **None** — stateless processor. Schema definitions cached from Schema Registry.

## Key Behaviors
- Validates every event against the registered Avro schema
- Adds processing metadata (ingestion_timestamp, validation_status)
- Routes to DLQ with error details if validation fails
- Supports backpressure via Kafka consumer group rebalancing
