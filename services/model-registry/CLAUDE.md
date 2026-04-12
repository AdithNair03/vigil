# Model Registry

## Single Responsibility
The Model Registry wraps **MLflow** and provides a gRPC + REST API for model lifecycle management. It handles model versioning, champion/challenger deployments, A/B traffic splitting between model versions, and rollback capabilities. Both the Friction Classifier and Intervention Engine use this service to fetch their active model weights and persist snapshots.

## Ports
- **HTTP**: 5001 (wrapper API — MLflow itself runs on 5000)

## Kafka Topics
- **Consumes**: None
- **Produces**: `vigil.system.models.deployed`, `vigil.system.models.rolledback`

## gRPC Contracts (Server)
- `ModelRegistryService.GetActiveModel` — get the champion model for a given type
- `ModelRegistryService.DeployModel` — promote a model version to champion/challenger
- `ModelRegistryService.RollbackModel` — revert to a previous model version
- `ModelRegistryService.ListModels` — list all model versions with metrics

## Database
- **MLflow** (backed by PostgreSQL) — model metadata, experiment tracking, artifact references
- Model artifacts stored in local filesystem (dev) or GCS (prod)

## Key Behaviors
- Model types: `friction_classifier` (River), `intervention_bandit` (VW)
- Supports A/B deployment: champion gets (1-x)% traffic, challenger gets x%
- Rollback is instant — just updates the pointer to the previous champion
- Tracks experiment metrics: accuracy, precision, recall, reward, latency
