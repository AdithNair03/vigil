# Company Intelligence

## Single Responsibility
The Company Intelligence service provides the **REST API for company dashboards**. It queries ClickHouse for aggregated friction metrics, intervention ROI, product issue patterns, and generates weekly intelligence reports. This is the primary data source for the React frontend that company users (e.g. Amazon Prime product managers) interact with.

## Ports
- **HTTP**: 8080

## Kafka Topics
- **Consumes**: `vigil.{tenant_id}.events.scored`, `vigil.{tenant_id}.outcomes.processed` (for real-time materialized views)
- **Produces**: `vigil.{tenant_id}.reports.generated`

## gRPC Contracts
- None (REST API only — no latency-critical path)

## Database
- **ClickHouse** — owns all OLAP tables:
  - `friction_events` — windowed aggregations of friction scores
  - `intervention_performance` — ROI metrics per intervention type
  - `product_issues` — detected product friction patterns
  - `tenant_metrics` — per-tenant health summary

## Key Behaviors
- Time-series queries for friction trends (hourly, daily, weekly)
- Intervention ROI computation (cost vs churn prevented)
- AI-powered weekly reports (Claude API, async only)
- Product issue detection via friction pattern clustering
- All queries are tenant-scoped — users only see their own data
