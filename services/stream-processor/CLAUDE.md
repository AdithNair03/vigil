# Stream Processor

## Single Responsibility
The Stream Processor runs **Apache Flink jobs** for windowed aggregations and Complex Event Processing (CEP) on the friction event stream. It detects multi-event friction patterns (e.g. "3 buffering events in 5 minutes"), computes sliding window metrics (hourly/daily friction rates), and materializes results to ClickHouse for the Company Intelligence service.

## Ports
- **HTTP** (health only): 8009
- Flink UI is accessed directly at 8081 (separate container)

## Kafka Topics
- **Consumes**: `vigil.{tenant_id}.events.scored`
- **Produces**: `vigil.{tenant_id}.aggregations`, `vigil.{tenant_id}.patterns.detected`

## gRPC Contracts
- None (Flink jobs are autonomous stream processors)

## Database
- **Flink state** — managed by Flink's RocksDB state backend
- Results materialized to **ClickHouse** via Kafka sink

## Key Behaviors
- Sliding window aggregations: 1min, 5min, 1hr, 1day friction rates per tenant
- CEP patterns: buffering_loop_3x, repeated_paywall_hits, cancel_flow_abandon
- Tumbling window session analysis: per-session friction summary
- Late event handling: watermarks with 30s allowed lateness
- Exactly-once semantics via Flink checkpointing
