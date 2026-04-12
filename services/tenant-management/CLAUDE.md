# Tenant Management

## Single Responsibility
The Tenant Management service handles **tenant lifecycle operations**: onboarding new companies, generating SDK keys, managing subscription plans and billing (Stripe integration), and providing tenant validation for SDK authentication. It is the source of truth for all tenant metadata.

## Ports
- **HTTP**: 8001

## Kafka Topics
- **Consumes**: None directly
- **Produces**: `vigil.system.tenants.created`, `vigil.system.tenants.updated`

## gRPC Contracts (Server)
- `TenantManagementService.CreateTenant` — onboard a new company
- `TenantManagementService.GetTenant` — retrieve tenant info
- `TenantManagementService.ValidateSDKKey` — validate SDK key and return tenant (called by SDK Gateway, cached)
- `TenantManagementService.ListTenants` — list all tenants (admin only)
- `TenantManagementService.GenerateSDKKey` — generate new SDK key for a tenant

## Database
- **PostgreSQL** — owns the `tenants`, `sdk_keys`, and `billing` tables
- SDK keys are hashed (SHA-256) before storage
- Tenant settings stored as JSONB

## Key Behaviors
- SDK key format: `vgl_{tenant_id_prefix}_{random_32_chars}`
- Key validation results cached in Redis by SDK Gateway (TTL 5 min)
- Supports plan tiers: starter, growth, enterprise
- Publishes tenant lifecycle events to Kafka for other services to react
