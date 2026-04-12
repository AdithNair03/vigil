# Admin Panel

## Single Responsibility
The Admin Panel is the **super admin dashboard API** (Adith-only). It provides cross-tenant visibility, system health monitoring (Kafka lag, Flink jobs, Redis memory, ClickHouse query performance), model registry control, tenant management, and the ability to impersonate any tenant for debugging. This service reads from other services — it does not own domain data.

## Ports
- **HTTP**: 9000

## Kafka Topics
- **Consumes**: `vigil.system.alerts`, `vigil.system.models.deployed`
- **Produces**: None (read-only aggregation service)

## gRPC Contracts (Client)
- Calls `TenantManagementService.*` — tenant CRUD
- Calls `ModelRegistryService.*` — model deployment/rollback
- Reads Kafka consumer group lag via admin API
- Reads Redis INFO and ClickHouse system tables directly

## Database
- **None** — aggregates data from other services' stores (admin privilege)
- May read directly from PostgreSQL, Redis, ClickHouse for system health metrics

## Key Behaviors
- Authentication: admin-only JWT with `role=super_admin`
- Cross-tenant search and filtering
- System health: Kafka consumer group lag, Flink job status, Redis memory, ClickHouse slow queries
- Tenant impersonation: temporarily assume a tenant's view for debugging
- Audit logging: all admin actions logged to PostgreSQL
