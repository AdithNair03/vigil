import React, { useState, useEffect } from 'react';
import { 
  Bell, Plus, ShieldAlert, Hash, Mail, 
  Trash2, Play, CheckCircle2, AlertTriangle, 
  Info, X, ChevronRight, BellOff
} from 'lucide-react';
import { useTenant } from '../lib/TenantContext';

interface AlertRule {
  id: string;
  name: string;
  threshold: number;
  minUsers: number;
  window: string;
  channel: 'Slack' | 'Email';
  channelValue: string;
  severity: 'Critical' | 'Warning' | 'Info';
  status: 'active' | 'disabled';
  lastTriggered?: string;
}

const DEFAULT_ALERTS: AlertRule[] = [
  {
    id: 'alt_1',
    name: 'Value Gap Crisis',
    threshold: 3.5,
    minUsers: 100,
    window: '15min',
    channel: 'Slack',
    channelValue: 'https://hooks.slack.com/services/VIGIL/B0...',
    severity: 'Critical',
    status: 'active',
    lastTriggered: '2h ago'
  },
  {
    id: 'alt_2',
    name: 'Churn Risk Spike',
    threshold: 5.0,
    minUsers: 50,
    window: '30min',
    channel: 'Email',
    channelValue: 'ops-alerts@company.com',
    severity: 'Warning',
    status: 'active',
    lastTriggered: '1d ago'
  },
  {
    id: 'alt_3',
    name: 'High Friction Pulse',
    threshold: 4.2,
    minUsers: 250,
    window: '1hr',
    channel: 'Slack',
    channelValue: 'https://hooks.slack.com/services/VIGIL/B1...',
    severity: 'Info',
    status: 'disabled'
  }
];

export default function Alerts() {
  const { currentTenant } = useTenant();
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<AlertRule, 'id' | 'status' | 'lastTriggered'>>({
    name: '',
    threshold: 4.0,
    minUsers: 10,
    window: '15min',
    channel: 'Slack',
    channelValue: '',
    severity: 'Warning'
  });

  useEffect(() => {
    const saved = localStorage.getItem(`vigil_alerts_${currentTenant.id}`);
    if (saved) {
      setAlerts(JSON.parse(saved));
    } else {
      setAlerts(DEFAULT_ALERTS);
    }
  }, [currentTenant.id]);

  const saveAlerts = (newAlerts: AlertRule[]) => {
    setAlerts(newAlerts);
    localStorage.setItem(`vigil_alerts_${currentTenant.id}`, JSON.stringify(newAlerts));
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = (id: string) => {
    const newAlerts: AlertRule[] = alerts.map(a => 
      a.id === id ? { ...a, status: (a.status === 'active' ? 'disabled' : 'active') as AlertRule['status'] } : a
    );
    saveAlerts(newAlerts);
    showToast(`Alert "${alerts.find(a => a.id === id)?.name}" ${newAlerts.find(a => a.id === id)?.status === 'active' ? 'enabled' : 'disabled'}`);
  };

  const handleDelete = (id: string) => {
    const newAlerts = alerts.filter(a => a.id !== id);
    saveAlerts(newAlerts);
    showToast("Alert rule deleted successfully");
  };

  const handleTest = (name: string) => {
    showToast(`Test payload sent to ${name} channel`, 'success');
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: AlertRule = {
      ...formData,
      id: `alt_${Date.now()}`,
      status: 'active' as AlertRule['status']
    };
    const newAlerts = [...alerts, newAlert];
    saveAlerts(newAlerts);
    setIsModalOpen(false);
    showToast("Alert rule created successfully");
    // Reset form
    setFormData({
        name: '',
        threshold: 4.0,
        minUsers: 10,
        window: '15min',
        channel: 'Slack',
        channelValue: '',
        severity: 'Warning'
    });
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-vigil-content transition-colors duration-300 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-vigil-base flex items-center gap-3 tracking-tight">
            <Bell className="w-8 h-8 text-rose-600" />
            Alert Infrastructure
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure real-time friction triggers for <span className="font-bold text-vigil-base">{currentTenant.name}</span></p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-sm font-bold shadow-lg shadow-rose-900/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Alert Rule
        </button>
      </div>

      <div className="bg-vigil-card rounded-card border border-vigil-border shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-vigil-border text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest transition-colors">
                <th className="px-6 py-4">Alert Rule</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Triggered</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-vigil-border transition-colors">
              {alerts.map((alert) => (
                <tr key={alert.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${alert.status === 'disabled' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        alert.severity === 'Critical' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' :
                        alert.severity === 'Warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                      }`}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-vigil-base">{alert.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {alert.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col font-mono text-xs">
                       <span className="text-slate-400">Score &lt; <span className="text-vigil-base font-bold">{alert.threshold}</span></span>
                       <span className="text-slate-400">Affected: <span className="text-vigil-base font-bold">{alert.minUsers}+</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {alert.channel === 'Slack' ? <Hash className="w-4 h-4 text-slate-500" /> : <Mail className="w-4 h-4 text-slate-500" />}
                       <span className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title={alert.channelValue}>
                        {alert.channelValue || 'Not configured'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                       alert.severity === 'Critical' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950 border border-rose-500/20' :
                       alert.severity === 'Warning' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950 border border-amber-500/20' :
                       'text-blue-600 bg-blue-50 dark:bg-blue-950 border border-blue-500/20'
                     }`}>
                       {alert.severity}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(alert.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${alert.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${alert.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {alert.lastTriggered || 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleTest(alert.channel)} className="p-2 text-slate-400 hover:text-emerald-500 transition" title="Test Pulse">
                          <Play className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(alert.id)} className="p-2 text-slate-400 hover:text-rose-500 transition">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium italic">No alert rules configured for this tenant</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 blur-backdrop select-none">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-vigil-card rounded-card border border-vigil-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden transition-colors">
            <div className="px-8 py-6 border-b border-vigil-border flex justify-between items-center">
               <h2 className="text-xl font-bold text-vigil-base flex items-center gap-2">
                 <Plus className="w-5 h-5 text-rose-600" />
                 Create Alert Rule
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-vigil-base transition">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <form onSubmit={handleCreateAlert} className="p-8 space-y-6">
               <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Rule Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Session Crash Spike"
                      className="w-full px-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base focus:ring-2 focus:ring-rose-500 outline-none transition"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Threshold (Score &lt;)</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" min="0" max="10" step="0.1"
                            className="flex-1 accent-rose-500"
                            value={formData.threshold}
                            onChange={e => setFormData({...formData, threshold: parseFloat(e.target.value)})}
                          />
                          <span className="font-mono font-bold text-rose-600 w-8">{formData.threshold}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Min Users Affected</label>
                        <input 
                          type="number" required
                          className="w-full px-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base focus:ring-2 focus:ring-rose-500 outline-none transition"
                          value={formData.minUsers}
                          onChange={e => setFormData({...formData, minUsers: parseInt(e.target.value)})}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Time Window</label>
                        <select 
                          className="w-full px-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base focus:ring-2 focus:ring-rose-500 outline-none transition appearance-none"
                          value={formData.window}
                          onChange={e => setFormData({...formData, window: e.target.value})}
                        >
                           <option value="5min">5 Minutes</option>
                           <option value="15min">15 Minutes</option>
                           <option value="30min">30 Minutes</option>
                           <option value="1hr">1 Hour</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Severity</label>
                        <select 
                          className="w-full px-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base focus:ring-2 focus:ring-rose-500 outline-none transition appearance-none"
                          value={formData.severity}
                          onChange={e => setFormData({...formData, severity: e.target.value as any})}
                        >
                           <option value="Critical">Critical</option>
                           <option value="Warning">Warning</option>
                           <option value="Info">Info</option>
                        </select>
                    </div>
                 </div>

                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-vigil-border space-y-4">
                   <div className="flex gap-4">
                      {['Slack', 'Email'].map(ch => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setFormData({...formData, channel: ch as any})}
                          className={`flex-1 py-2 rounded border font-bold text-xs flex items-center justify-center gap-2 transition ${
                            formData.channel === ch 
                              ? 'bg-rose-600 text-white border-rose-600 shadow-md' 
                              : 'bg-vigil-card text-slate-500 border-vigil-border hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {ch === 'Slack' ? <Hash className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                          {ch}
                        </button>
                      ))}
                   </div>
                   <input 
                      type={formData.channel === 'Slack' ? 'url' : 'email'} 
                      required
                      placeholder={formData.channel === 'Slack' ? 'Webhook URL' : 'Ops Email Address'}
                      className="w-full px-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base focus:border-rose-500 outline-none transition"
                      value={formData.channelValue}
                      onChange={e => setFormData({...formData, channelValue: e.target.value})}
                    />
                 </div>
               </div>

               <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-md shadow-lg shadow-rose-900/20 active:scale-95 transition"
                  >
                    Protect Infrastructure
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
