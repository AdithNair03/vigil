import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, ShieldAlert, AlertTriangle, CheckCircle, Zap, Send, 
  Bell, Info, Pause, Play, Volume2, VolumeX, Filter
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useTenant } from '../lib/TenantContext';
import SeverityBadge from '../components/SeverityBadge';

interface FrictionEvent {
  id: string;
  type: string;
  userId: string;
  severity: 'CRITICAL' | 'WARNING' | 'LOW';
  score: number;
  timestamp: string;
  industry: string;
}

const INDUSTRY_EVENTS: Record<string, string[]> = {
  'Streaming': ['ad_impression_paid_tier', 'rental_paywall_hit', 'cancel_flow_opened', 'content_buffering_loop', 'search_zero_results'],
  'Food Delivery': ['delivery_late_no_update', 'wrong_item_delivered', 'refund_flow_abandoned', 'surge_price_shock', 'restaurant_unavailable'],
  'Banking': ['hidden_fee_surfaced', 'transfer_declined', 'support_loop_3rd_contact', 'app_crash_at_payment', 'otp_timeout'],
  'SaaS': ['feature_paywall_hit', 'export_limit_reached', 'sync_error', 'workspace_locked', 'renewal_price_shock']
};

export default function LiveFeed() {
  const { currentTenant } = useTenant();
  const [events, setEvents] = useState<FrictionEvent[]>([]);
  const [activeCritical, setActiveCritical] = useState<FrictionEvent | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'LOW'>('ALL');
  
  // KPI Stats
  const [stats, setStats] = useState({ total: 0, critical: 0, interventions: 0 });
  const [sparklineData, setSparklineData] = useState<{v: number}[]>(Array(20).fill({v: 0}));

  const audioCtx = useRef<AudioContext | null>(null);

  const playAlert = () => {
    if (isMuted) return;
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.current.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.current.currentTime + 0.1);
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(async () => {
      const types = INDUSTRY_EVENTS[currentTenant.industry] || ['system_generic_event'];
      const type = types[Math.floor(Math.random() * types.length)];
      const userId = `usr_${Math.random().toString(16).substr(2, 4)}`;

      // Prepare request for real SDK Gateway
      const eventPayload = {
        event: {
          user_id: userId,
          session_id: `ses_${Math.random().toString(36).substr(2, 6)}`,
          event_type: type,
          tenant_id: currentTenant.id, // Will be overwritten by backend but good for schema
          industry: currentTenant.industry.toLowerCase().replace(" ", "_"),
          payload: { ui_interaction: true }
        }
      };

      try {
        const response = await fetch('http://localhost:8000/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer vk_live_123456789'
          },
          body: JSON.stringify(eventPayload)
        });

        if (!response.ok) throw new Error('Gateway unreachable');
        
        const data = await response.json();
        const score = data.value_gap_score || 5.0;
        const severity = score >= 8.5 ? 'CRITICAL' : score >= 6.0 ? 'WARNING' : 'LOW';
        
        const newEvent: FrictionEvent = {
          id: data.event_id || `evt_${Math.random().toString(36).substr(2, 9)}`,
          type,
          userId,
          severity,
          score,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          industry: currentTenant.industry
        };

        setEvents(prev => [newEvent, ...prev].slice(0, 25));
        setStats(prev => ({
          total: prev.total + 1,
          critical: severity === 'CRITICAL' ? prev.critical + 1 : prev.critical,
          interventions: prev.interventions
        }));
        setSparklineData(prev => [...prev.slice(1), { v: Math.floor(score) }]);

        if (severity === 'CRITICAL') {
          setActiveCritical(newEvent);
          playAlert();
        }
      } catch (err) {
        console.error('Failed to ingest event:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentTenant, isPaused, isMuted]);

  const filteredEvents = useMemo(() => {
    if (filter === 'ALL') return events;
    return events.filter(e => e.severity === filter);
  }, [events, filter]);

  const fireIntervention = () => {
    setShowToast(true);
    setStats(prev => ({ ...prev, interventions: prev.interventions + 1 }));
    setActiveCritical(null);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getInterventionText = (type: string) => {
    if (type.includes('paywall') || type.includes('price')) return "Offer Loyalty Discount (15%)";
    if (type.includes('late') || type.includes('error') || type.includes('crash')) return "Dispatch High-Priority Apology Mail";
    if (type.includes('cancel') || type.includes('buffering')) return "Trigger Immediate Retention Webhook";
    return "Automated Friction Mitigation";
  };

  return (
    <div className="p-8 h-full flex gap-8 overflow-hidden bg-vigil-content transition-colors duration-300">
      {/* Main Feed Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Activity className="w-8 h-8 text-teal-600" />
              <h1 className="text-3xl font-bold text-vigil-base tracking-tight">Live Friction Feed</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">Real-time signal ingestion for <span className="font-bold text-vigil-base">{currentTenant.name}</span></p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-vigil-card border border-vigil-border rounded-lg p-1 shadow-sm transition-colors">
               <button 
                 onClick={() => setIsPaused(!isPaused)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${isPaused ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 {isPaused ? <><Play className="w-3 h-3" /> RESUME</> : <><Pause className="w-3 h-3" /> PAUSE</>}
               </button>
               <button 
                 onClick={() => setIsMuted(!isMuted)}
                 className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
               >
                 {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
               </button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30 rounded-full">
               <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-teal-500 animate-ping'}`} />
               <span className={`text-[10px] font-black uppercase tracking-widest ${isPaused ? 'text-amber-600' : 'text-teal-700 dark:text-teal-400'}`}>
                 {isPaused ? 'Stream Inactive' : 'Ingestion Active'}
               </span>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
           <div className="bg-vigil-card p-4 rounded-xl border border-vigil-border shadow-sm transition-colors">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Events</p>
              <p className="text-2xl font-mono font-bold text-vigil-base">{stats.total.toLocaleString()}</p>
           </div>
           <div className="bg-vigil-card p-4 rounded-xl border border-vigil-border shadow-sm transition-colors">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Alarms</p>
              <p className="text-2xl font-mono font-bold text-rose-500">{stats.critical.toLocaleString()}</p>
           </div>
           <div className="bg-vigil-card p-4 rounded-xl border border-vigil-border shadow-sm transition-colors">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Interventions</p>
              <p className="text-2xl font-mono font-bold text-teal-500">{stats.interventions.toLocaleString()}</p>
           </div>
           <div className="bg-vigil-card p-4 rounded-xl border border-vigil-border shadow-sm flex flex-col justify-between transition-colors">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signals / Min</p>
              <div className="h-8 w-full mt-auto">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                       <Line type="monotone" dataKey="v" stroke="#0F6E56" strokeWidth={2} dot={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
           <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg flex gap-1">
              {(['ALL', 'CRITICAL', 'WARNING', 'LOW'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-[10px] font-black tracking-widest transition ${
                    filter === f 
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
           </div>
           <div className="h-px flex-1 bg-slate-100 dark:bg-slate-900" />
           <Filter className="w-4 h-4 text-slate-300" />
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {filteredEvents.map((evt) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-vigil-card rounded-xl border-l-4 p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all ${
                  evt.severity === 'CRITICAL' ? 'border-rose-500' : evt.severity === 'WARNING' ? 'border-amber-500' : 'border-teal-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    evt.severity === 'CRITICAL' 
                    ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' 
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {evt.severity === 'CRITICAL' ? <ShieldAlert className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-vigil-base truncate max-w-[240px] tracking-tight">{evt.type.replace(/_/g, " ")}</div>
                    <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 flex items-center gap-2 uppercase">
                      <span className="text-teal-600 dark:text-teal-500">{evt.userId}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>{evt.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                     <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Impact</div>
                     <div className={`text-lg font-mono font-bold ${evt.severity === 'CRITICAL' ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{evt.score}</div>
                  </div>
                  <div className="w-24 flex justify-end">
                    <SeverityBadge severity={evt.severity.toLowerCase() as any} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredEvents.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
               <Bell className="w-12 h-12 mb-4 opacity-10" />
               <p className="font-medium">Waiting for incoming signals...</p>
            </div>
          )}
        </div>
      </div>

      {/* Intervention Side Panel */}
      <div className="w-96 flex flex-col gap-6 ">
        <div className="bg-slate-950 dark:bg-slate-900 rounded-card p-6 text-white shadow-2xl relative overflow-hidden border border-white/5">
           <div className="absolute top-0 right-0 p-8 bg-rose-500/10 blur-3xl rounded-full -mr-8 -mt-8" />
           
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Critical Overrides
           </h3>
           
           <AnimatePresence mode="wait">
             {activeCritical ? (
                <motion.div 
                  key={activeCritical.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-6 relative z-10"
                >
                  <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl">
                     <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-1">Active Signal</p>
                     <p className="text-sm font-bold text-white leading-tight">{activeCritical.type.toUpperCase()}</p>
                     <p className="text-xs text-slate-400 mt-1">Detected at {activeCritical.timestamp}</p>
                  </div>
                  
                  <div className="space-y-3">
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">AI Action Strategy</p>
                     <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-teal-400 font-bold text-sm flex items-center gap-3">
                        <Zap className="w-5 h-5 shrink-0 text-teal-400 animate-pulse" />
                        {getInterventionText(activeCritical.type)}
                     </div>
                  </div>

                  <button 
                    onClick={fireIntervention}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-xl shadow-teal-500/20 uppercase tracking-widest text-xs"
                  >
                    <Send className="w-4 h-4" />
                    Deploy Mitigation
                  </button>
                </motion.div>
             ) : (
                <div className="py-20 text-center text-slate-600 space-y-4 relative z-10">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 opacity-20" />
                   </div>
                   <p className="text-sm font-medium">Platform stable. No signals require manual override.</p>
                </div>
             )}
           </AnimatePresence>

           {/* Toast Notification */}
           <AnimatePresence>
             {showToast && (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-6 left-6 right-6 bg-emerald-500 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest"
                >
                   <CheckCircle className="w-5 h-5 shadow-sm" />
                   Override Published
                </motion.div>
             )}
           </AnimatePresence>
        </div>

          <div className="flex-1 bg-vigil-card rounded-card border border-vigil-border p-6 flex flex-col group transition-colors duration-300">
           <h3 className="font-bold text-vigil-base mb-6 flex items-center gap-2">
             <Info className="w-4 h-4 text-teal-600" />
             Pipeline Health
           </h3>
            <div className="space-y-4 flex-1">
              <div className="p-4 bg-vigil-content rounded-xl border border-vigil-border text-xs transition-colors duration-300">
                 <span className="font-black text-slate-400 uppercase tracking-widest block mb-2">Ingestion Latency</span>
                 <div className="flex justify-between items-end">
                    <span className="text-xl font-mono font-bold text-vigil-base">14ms</span>
                    <span className="text-teal-500 font-bold">Stable</span>
                 </div>
              </div>
              <div className="p-4 bg-vigil-content rounded-xl border border-vigil-border text-xs transition-colors duration-300">
                 <span className="font-black text-slate-400 uppercase tracking-widest block mb-2">Cluster Load</span>
                 <div className="w-full h-1.5 bg-vigil-border rounded-full mt-1 overflow-hidden">
                    <div className="w-[42%] h-full bg-teal-500 rounded-full" />
                 </div>
                 <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">42% • Optimized</p>
              </div>
           </div>
                      <div className="mt-auto pt-6 border-t border-vigil-border">
               <div className="flex items-center gap-3">
                  <img src="https://ui-avatars.com/api/?name=Adith+Nair&background=0F6E56&color=fff" className="w-8 h-8 rounded-full" />
                  <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Super Admin On Call</p>
                     <p className="text-xs font-bold text-vigil-base">Adith Nair</p>
                  </div>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
}
