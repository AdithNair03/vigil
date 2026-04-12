# Intervention Engine

## Single Responsibility
The Intervention Engine uses a **Vowpal Wabbit contextual bandit (LinUCB)** to select the optimal intervention for a friction event. Given a friction score, user context, and available intervention actions, it picks the action with the highest expected reward — within 20ms. It supports A/B holdout groups (control vs treatment) and updates its policy based on outcome rewards.

## Ports
- **HTTP** (health only): 8005
- **gRPC**: 50052

## Kafka Topics
- **Consumes**: `vigil.{tenant_id}.outcomes` (reward signals for bandit policy updates)
- **Produces**: `vigil.{tenant_id}.interventions.selected`

## gRPC Contracts (Server)
- `InterventionEngineService.SelectIntervention` — selects best intervention (<20ms)
- `InterventionEngineService.RecordOutcome` — records outcome reward for policy update

## Database
- **In-memory** — Vowpal Wabbit model weights held in memory
- Policy snapshots persisted to MLflow via Model Registry service
- Per-tenant bandit policies (policies are tenant-scoped)

## Latency Budget
- SelectIntervention must complete in **<20ms**
- Bandit inference is CPU-bound with small action spaces (~10-50 actions)
- Holdout group assignment is deterministic (hash-based) and adds <1ms
