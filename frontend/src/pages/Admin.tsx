import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type APIError } from '../api/client';
import { 
  AlertCircle, Loader2, PlayCircle, CheckCircle, RefreshCcw, 
  ShieldCheck, Users, Activity, Zap, Server, Database, 
  Trash2, Eye, Download, Bell, FileText, LogOut, Cpu, TrendingUp
} from 'lucide-react';

export default function Admin() {
  const [healthData, setHealthData] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [token] = useState<string | null>(localStorage.getItem('vigil_admin_token'));
  const [firing, setFiring] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('vigil_admin_token');
    navigate('/admin/login');
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [health, tenantList] = await Promise.all([
        api.admin.getSystemHealth(token),
        api.admin.getTenants(token)
      ]);
      setHealthData(health);
      setTenants(tenantList);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleTestEvent = async () => {
    if (!token || tenants.length === 0) return;
    setFiring(true);
    try {
      await api.admin.sendTestEvent(token, {
        tenant_id: tenants[0].tenant_id,
        event_type: "ad_impression_paid_tier",
        industry: tenants[0].industry
      });
      alert("Test event fired to SDK Gateway!");
    } catch (err: any) {
      alert("Failed to fire event: " + err.message);
    } finally {
      setFiring(false);
    }
  };

  const handleRetrain = () => {
    setRetraining(true);
    setTimeout(() => {
      setRetraining(false);
      alert("Platform Model Retrained: Accuracy improved to 94.2%");
    }, 2500);
  };

  const handleRevoke = async (tid: string) => {
    if (!token) return;
    if (confirm("Are you sure you want to revoke access? Records will be kept but the SDK key will be deactivated.")) {
        try {
            await api.admin.revokeTenant(token, tid);
            fetchData();
        } catch (err: any) {
            alert("Revoke failed: " + err.message);
        }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full bg-vigil-content transition-colors duration-300">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium font-mono uppercase tracking-widest text-xs">Accessing System Core...</p>
      </div>
    );
  }

  return (
    <div className="p-8 w-full h-full overflow-y-auto bg-vigil-content transition-colors duration-300">
      <header className="mb-10 flex items-end justify-between">
           <div>
               <div className="flex items-center gap-2 mb-2">
                 <ShieldCheck className="w-5 h-5 text-rose-600" />
                 <span className="text-xs font-black text-rose-600 uppercase tracking-[0.2em]">Restricted Dashboard</span>
               </div>
               <h1 className="text-4xl font-extrabold text-vigil-base tracking-tight">System Oversight</h1>
               <p className="text-slate-500 dark:text-slate-400 mt-1">Super Admin Context: <span className="font-bold text-vigil-base">Adith Nair</span></p>
           </div>
           
           <div className="flex gap-3">
             <button onClick={fetchData} className="p-3 bg-vigil-card border border-vigil-border text-slate-400 dark:text-slate-500 hover:text-vigil-base hover:border-slate-400 dark:hover:border-slate-700 rounded-md transition shadow-sm">
                <RefreshCcw className="w-5 h-5" />
             </button>
             <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-md font-bold text-sm shadow-lg shadow-rose-200/50 hover:bg-rose-500 transition">
                <LogOut className="w-4 h-4" />
                Terminal Logout
             </button>
           </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
          <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-card border border-slate-800 shadow-xl overflow-hidden relative transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                  <Activity className="w-8 h-8 text-teal-400 opacity-20" />
                  <span className="text-[10px] text-teal-400 font-black uppercase tracking-widest">Real-time</span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Events Ingested</p>
              <h2 className="text-3xl font-black text-white font-mono tracking-tighter">1,248,392</h2>
              <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <TrendingUp className="w-3 h-3" /> +12.5% vs yesterday
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-teal-500/10 blur-2xl rounded-full" />
          </div>

          <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-card border border-slate-800 shadow-xl overflow-hidden relative transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                  <Zap className="w-8 h-8 text-amber-400 opacity-20" />
                  <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Active Ops</span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Interventions Fired</p>
              <h2 className="text-3xl font-black text-white font-mono tracking-tighter">42,910</h2>
              <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-3 h-3" /> 88.4% Efficiency
              </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-card border border-slate-800 shadow-xl overflow-hidden relative transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                  <Server className="w-8 h-8 text-blue-400 opacity-20" />
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Global Status</span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Cluster Uptime</p>
              <h2 className="text-3xl font-black text-white font-mono tracking-tighter">99.98%</h2>
              <div className="mt-4 flex items-center gap-2 text-blue-400 text-xs font-bold">
                  <Database className="w-3 h-3" /> No Latency Spill
              </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-card border border-slate-800 shadow-xl overflow-hidden relative transition-colors duration-300">
              <div className="flex justify-between items-start mb-4">
                  <Users className="w-8 h-8 text-teal-400 opacity-20" />
                  <span className="text-[10px] text-teal-400 font-black uppercase tracking-widest">Growth</span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Tenants</p>
              <h2 className="text-3xl font-black text-white font-mono tracking-tighter">{tenants.length}</h2>
              <div className="mt-4 flex items-center gap-2 text-teal-400 text-xs font-bold">
                  <TrendingUp className="w-3 h-3" /> +3 this week
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
            <div className="bg-vigil-card border border-vigil-border rounded-card shadow-sm p-8 transition-colors duration-300">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-vigil-base">
                    <Server className="w-5 h-5 text-teal-600" />
                    Infrastructure Orchestration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {healthData?.services.map((s: any) => (
                        <div key={s.name} className="bg-vigil-content p-4 rounded-md border border-vigil-border flex items-center justify-between group hover:opacity-80 transition-colors">
                            <div>
                                <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{s.name}</div>
                                <div className="text-sm font-mono text-vigil-base">:{s.port}</div>
                            </div>
                            <div className={`w-3 h-3 rounded-full shadow-inner ${s.status === 'healthy' ? 'bg-emerald-500 shadow-emerald-500/50' : s.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse shadow-rose-500/50'}`}></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-vigil-card border border-vigil-border rounded-card shadow-sm overflow-hidden transition-colors duration-300">
                <div className="p-8 border-b border-vigil-border flex justify-between items-center transition-colors">
                    <h3 className="font-bold text-xl flex items-center gap-2 text-vigil-base">
                        <Users className="w-5 h-5 text-teal-600" />
                        Registered Enterprise Tenants
                    </h3>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-slate-500 dark:text-slate-400 uppercase tracking-widest">{tenants.length} Systems Active</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-vigil-content text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] border-b border-vigil-border transition-colors">
                                <th className="px-8 py-4">Company & Industry</th>
                                <th className="px-8 py-4">SDK Priority Key</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Operational Oversight</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-vigil-border transition-colors">
                            {tenants.map((t: any) => (
                                <tr key={t.tenant_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-vigil-base">{t.company_name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t.industry}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="bg-vigil-content text-slate-500 font-mono text-xs px-2 py-1 rounded inline-block border border-vigil-border transition-colors">
                                            {t.sdk_key || "vk_live_****"}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${t.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button className="p-2 text-slate-400 dark:text-slate-600 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded transition">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleRevoke(t.tenant_id)} className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="space-y-8">
            <div className="bg-vigil-card border border-vigil-border rounded-card shadow-sm p-8 transition-colors duration-300">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-vigil-base">
                    <Cpu className="w-5 h-5 text-teal-600" />
                    B.O.U.N.D. Model Registry
                </h3>
                <div className="space-y-6">
                    <div className="flex justify-between pb-4 border-b border-vigil-border transition-colors">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Current Version</span>
                        <span className="text-sm font-mono font-bold text-vigil-base italic">v2.4.92-stable</span>
                    </div>
                    <div className="flex justify-between pb-4 border-b border-vigil-border transition-colors">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Last Training</span>
                        <span className="text-sm font-bold text-vigil-base">4h ago</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Core Accuracy</span>
                        <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">92.8%</span>
                    </div>
                    
                    <button 
                        onClick={handleRetrain}
                        disabled={retraining}
                        className="w-full bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-bold py-4 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-teal-900/20 disabled:opacity-50"
                    >
                        {retraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        {retraining ? 'Retraining Neural Engine...' : 'Force System Retrain'}
                    </button>
                </div>
            </div>

            {/* Quick Actions Section */}
            <div className="bg-slate-950 dark:bg-slate-900/80 rounded-card shadow-2xl p-8 text-white group overflow-hidden relative border border-white/5 transition-colors duration-300">
                <h3 className="font-bold text-lg mb-6 relative z-10 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-teal-400" />
                    Quick Deployment
                </h3>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <button onClick={handleTestEvent} className="p-4 bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-slate-800 rounded hover:border-teal-500 transition-colors flex flex-col gap-2 items-center text-center">
                        <PlayCircle className="w-6 h-6 text-teal-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Mock Event</span>
                    </button>
                    <button className="p-4 bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-slate-800 rounded hover:border-teal-500 transition-colors flex flex-col gap-2 items-center text-center">
                        <Download className="w-6 h-6 text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Export Core</span>
                    </button>
                    <button className="p-4 bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-slate-800 rounded hover:border-teal-500 transition-colors flex flex-col gap-2 items-center text-center">
                        <Bell className="w-6 h-6 text-amber-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Broadcast</span>
                    </button>
                    <button className="p-4 bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-slate-800 rounded hover:border-teal-500 transition-colors flex flex-col gap-2 items-center text-center">
                        <FileText className="w-6 h-6 text-indigo-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Audit Logs</span>
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12 group-hover:bg-teal-500/20 transition-all duration-700" />
            </div>
        </div>
      </div>
    </div>
  );
}
