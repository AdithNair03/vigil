# Outcome Tracker

## Single Responsibility
The Outcome Tracker consumes intervention outcome events from Kafka (delivered, seen, clicked, converted, dismissed, expired), computes reward signals for the contextual bandit, maintains A/B holdout group statistics, and feeds outcomes back to the Friction Classifier and Intervention Engine for model updates.

## Ports
- **HTTP** (health only): 8007
- No gRPC server (uses gRPC client to push rewards to Intervention Engine)

## Kafka Topics
- **Consumes**: `vigil.{tenant_id}.outcomes.raw`
- **Produces**: `vigil.{tenant_id}.outcomes.processed`, `vigil.{tenant_id}.rewards`

## gRPC Contracts (Server)
- `OutcomeTrackerService.RecordOutcome` — records an outcome event
- `OutcomeTrackerService.GetInterventionStats` — returns aggregated stats for an intervention

## Database
- **PostgreSQL** — owns the `outcomes` and `intervention_stats` tables
- Stores: outcome events, computed rewards, A/B group assignments, holdout results

## Key Behaviors
- Computes reward signals: conversion=1.0, clicked=0.5, seen=0.2, dismissed=-0.3, expired=-0.1
- Tracks holdout groups: treatment vs control, with statistical significance testing
- Publishes computed rewards to Kafka for Intervention Engine policy updates
