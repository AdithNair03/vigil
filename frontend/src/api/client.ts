/**
 * Vigil API Clients
 * Centralized configuration for all microservice endpoints
 */

const SDK_GATEWAY_URL = 'https://vigil-sdk-gateway.onrender.com';
const COMPANY_INTEL_URL = 'https://vigil-company-intel.onrender.com';
const ADMIN_PANEL_URL = 'https://vigil-admin-panel.onrender.com';
const TENANT_MGMT_URL = 'http://localhost:8001';
const FRICTION_CLASSIFIER_URL = 'http://localhost:8002';
const USER_CONTEXT_URL = 'http://localhost:8003';

export interface APIError {
  message: string;
  status?: number;
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.detail || 'An unexpected error occurred',
      status: response.status,
    };
  }
  return response.json();
}

export const api = {
  // SDK Gateway
  events: {
    ingest: (data: any) =>
      fetch(`${SDK_GATEWAY_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    stream: () => new WebSocket(`${SDK_GATEWAY_URL.replace('http', 'ws')}/stream`),
  },

  // Company Intelligence
  analytics: {
    getDashboard: (tenantId: string) =>
      fetch(`${COMPANY_INTEL_URL}/api/v1/tenants/${tenantId}/dashboard`).then(handleResponse),

    generateReport: (tenantId: string) =>
      fetch(`${COMPANY_INTEL_URL}/api/v1/tenants/${tenantId}/reports/generate`, {
        method: 'POST',
      }).then(handleResponse),
  },

  // Admin Panel
  admin: {
    login: (credentials: FormData) =>
      fetch(`${ADMIN_PANEL_URL}/token`, {
        method: 'POST',
        body: credentials,
      }).then(handleResponse),

    getSystemHealth: (token: string) =>
      fetch(`${ADMIN_PANEL_URL}/system/health`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(handleResponse),

    getTenants: (token: string) =>
      fetch(`${ADMIN_PANEL_URL}/admin/tenants`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(handleResponse),

    sendTestEvent: (token: string, data: any) =>
      fetch(`${ADMIN_PANEL_URL}/admin/events/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      }).then(handleResponse),

    revokeTenant: (token: string, tenantId: string) =>
      fetch(`${ADMIN_PANEL_URL}/admin/tenants/${tenantId}/revoke`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(handleResponse),
  },

  // Tenant Management (mostly used internal or by admin proxy)
  tenants: {
    register: (data: any) =>
      fetch(`${TENANT_MGMT_URL}/tenants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    getById: (id: string) =>
      fetch(`${TENANT_MGMT_URL}/tenants/${id}`).then(handleResponse),
  },

  // User Context
  userContext: {
    get: (userId: string) =>
      fetch(`${USER_CONTEXT_URL}/context/${userId}`).then(handleResponse),
  },

  // Friction Classifier Metrics
  metrics: {
    getEvaluation: () =>
      fetch(`${FRICTION_CLASSIFIER_URL}/metrics/evaluation`).then(handleResponse),
  }
};
