import React from 'react';

export default function IntegrationDocs() {
  const code = `
// 1. Initialize Vigil SDK
import { Vigil } from '@vigil/browser';

const vigil = new Vigil({
  tenantId: 't1',
  sdkKey: 'vk_live_123456789'
});

// 2. Track Friction Events natively in your app
vigil.track('feature_paywall_hit', {
  user_id: 'usr-8899-xyz123',
  industry: 'saas'
});
  `.trim();

  return (
    <div className="p-8 w-full max-w-4xl h-full overflow-y-auto bg-vigil-content transition-colors duration-300">
      <h1 className="text-3xl font-bold text-vigil-base mb-4">SDK Integration Guide</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
         Drop the Vigil SDK into your frontend or backend applications to instantly connect into the real-time friction evaluation pipeline mapping live scores and bounding interventions directly within 800ms frames.
      </p>

      <div className="bg-slate-950 rounded-card p-6 shadow-xl overflow-hidden mb-8 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500 font-mono ml-2">vigil-setup.ts</span>
        </div>
        <pre className="text-emerald-400 font-mono text-sm overflow-x-auto">
           {code}
        </pre>
      </div>
      
      <h3 className="font-semibold text-lg mb-4 text-vigil-base">Manual REST Sandbox testing</h3>
      <div className="bg-vigil-card border border-vigil-border rounded-card p-6 shadow-sm transition-colors">
         <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">You can manually route boundaries testing endpoints locally simulating the SDK gateway.</p>
         <code className="block bg-vigil-content p-4 rounded text-sm font-mono text-vigil-base break-all border border-vigil-border">
            curl -X POST http://localhost:8000/events \<br/>
            &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
            &nbsp;&nbsp;-H "Authorization: Bearer vk_live_123456789" \<br/>
            &nbsp;&nbsp;-d '&#123;"tenant_id": "t1", "user_id": "u1", "event_type": "ad_impression_paid_tier", "industry": "streaming"&#125;'
         </code>
      </div>
    </div>
  );
}
