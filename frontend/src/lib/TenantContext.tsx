import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  logoColor: string;
  accentColor: string;
  events: string[];
}

export const DEMO_TENANTS: Tenant[] = [
  { 
    id: 't1', 
    name: 'Prime Video', 
    industry: 'Streaming', 
    logoColor: 'bg-teal-500', 
    accentColor: 'text-teal-400',
    events: ["ad_impression_paid_tier", "delivery_late", "feature_paywall_hit", "hidden_fee", "buffering_start", "login_failure"]
  },
  { 
    id: 't2', 
    name: 'Swiggy', 
    industry: 'Food Delivery', 
    logoColor: 'bg-orange-500', 
    accentColor: 'text-orange-400',
    events: ["delivery_slow", "order_cancelled", "checkout_lag", "payment_failed", "support_chat_started"]
  },
  { 
    id: 't3', 
    name: 'HDFC Bank', 
    industry: 'Banking', 
    logoColor: 'bg-blue-600', 
    accentColor: 'text-blue-400',
    events: ["otp_delay", "transfer_failed", "kyc_retry", "session_timeout", "fraud_alert_shown"]
  },
  { 
    id: 't4', 
    name: 'Notion', 
    industry: 'SaaS', 
    logoColor: 'bg-slate-900', 
    accentColor: 'text-slate-400',
    events: ["sync_error", "workspace_locked", "import_failed", "billing_grace_period", "collaboration_lag"]
  }
];

interface TenantContextType {
  currentTenant: Tenant;
  setTenant: (id: string) => void;
  userToken: string | null;
  companyName: string | null;
  isDemoMode: boolean;
  login: (token: string, companyName: string, isDemo: boolean) => void;
  logout: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant>(DEMO_TENANTS[0]);
  const [userToken, setUserToken] = useState<string | null>(localStorage.getItem('vigil_user_token'));
  const [companyName, setCompanyName] = useState<string | null>(localStorage.getItem('vigil_company_name'));
  const [isDemoMode, setIsDemoMode] = useState<boolean>(localStorage.getItem('vigil_is_demo') === 'true');

  const setTenant = (id: string) => {
    const found = DEMO_TENANTS.find(t => t.id === id);
    if (found) setCurrentTenant(found);
  };

  const login = (token: string, company: string, isDemo: boolean) => {
    localStorage.setItem('vigil_user_token', token);
    localStorage.setItem('vigil_company_name', company);
    localStorage.setItem('vigil_is_demo', String(isDemo));
    setUserToken(token);
    setCompanyName(company);
    setIsDemoMode(isDemo);
  };

  const logout = () => {
    localStorage.removeItem('vigil_user_token');
    localStorage.removeItem('vigil_company_name');
    localStorage.removeItem('vigil_is_demo');
    setUserToken(null);
    setCompanyName(null);
    setIsDemoMode(false);
  };

  return (
    <TenantContext.Provider value={{ 
      currentTenant, 
      setTenant, 
      userToken, 
      companyName, 
      isDemoMode, 
      login, 
      logout 
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
