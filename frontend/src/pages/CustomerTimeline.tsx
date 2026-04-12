import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  User, Mail, Calendar, ShieldCheck, AlertCircle, 
  TrendingDown, TrendingUp, Zap, Clock, ChevronLeft,
  ArrowRight, ShieldAlert, Award
} from 'lucide-react';
import { useTenant } from '../lib/TenantContext';

const Lock = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

const MOCK_EVENTS = [
  { type: 'login_success', desc: 'Secure login from known device', time: '2h ago', severity: 'LOW', icon: ShieldCheck },
  { type: 'feature_paywall_hit', desc: 'Attempted to access Pro export feature', time: '4h ago', severity: 'WARNING', icon: AlertCircle },
  { type: 'sync_error', desc: 'Background data synchronization failed', time: '5h ago', severity: 'WARNING', icon: Zap },
  { type: 'renewal_price_shock', desc: 'Customer viewed renewal pricing page 3 times', time: '1d ago', severity: 'CRITICAL', icon: ShieldAlert },
  { type: 'support_ticket_open', desc: 'Inquiry regarding billing limits', time: '2d ago', severity: 'WARNING', icon: Clock },
  { type: 'workspace_locked', desc: 'Temporary lock due to seat limit breach', time: '3d ago', severity: 'CRITICAL', icon: Lock },
  { type: 'export_success', desc: 'Successfully exported workspace data', time: '4d ago', severity: 'LOW', icon: Award },
];

const SURVIVAL_DATA = [
  { day: 0, prob: 100 },
  { day: 5, prob: 98 },
  { day: 10, prob: 95 },
  { day: 15, prob: 88 },
  { day: 20, prob: 75 },
  { day: 25, prob: 62 },
  { day: 30, prob: 45 },
];

export default function CustomerTimeline() {
  const { userId } = useParams<{ userId: string }>();
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  const [risk] = useState(74);

  const getRiskColor = (r: number) => {
    if (r > 70) return 'text-rose-500';
    if (r > 40) return 'text-amber-500';
    return 'text-teal-500';
  };

  const getSeverityBg = (s: string) => {
    if (s === 'CRITICAL') return 'bg-rose-500';
    if (s === 'WARNING') return 'bg-amber-500';
    return 'bg-teal-500';
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-vigil-content transition-colors duration-300">
      <button 
        onClick={() => navigate('/customers')}
        className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-vigil-base transition mb-6 font-medium text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Customers
      </button>

      {/* Header / Profile */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="flex-1 bg-vigil-card rounded-card border border-vigil-border shadow-sm p-8 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center text-3xl font-bold transition-colors">
                    JD
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-vigil-base mb-1">John Doe</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> john.doe@example.com
                    </p>
                    <div className="flex gap-3">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider">Enterprise Plan</span>
                        <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 412 Days Tenure
                        </span>
                    </div>
                </div>
            </div>

            <div className="text-right px-8 border-l border-vigil-border hidden md:block transition-colors">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Churn Risk Index</p>
                <div className={`text-6xl font-black tracking-tighter ${getRiskColor(risk)}`}>
                    {risk}%
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Status: High Churn Vulnerability</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Timeline Section */}
        <div className="xl:col-span-2 space-y-8">
            <div className="bg-vigil-card border border-vigil-border rounded-card p-8 transition-colors duration-300">
                <h3 className="font-bold text-xl text-vigil-base mb-10 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-teal-600" />
                    Behavioral Timeline
                </h3>
                
                <div className="relative pl-12 border-l-2 border-vigil-border space-y-12 pb-4">
                    {MOCK_EVENTS.map((evt, idx) => (
                        <div key={idx} className="relative">
                            <div className={`absolute -left-[61px] w-10 h-10 rounded-full border-4 border-vigil-card flex items-center justify-center text-white shadow-sm transition-colors duration-300 ${getSeverityBg(evt.severity)}`}>
                                <evt.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-vigil-base text-lg leading-none mb-1">{evt.type.toUpperCase()}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{evt.desc}</p>
                                </div>
                                <div className="text-sm font-mono text-slate-400 bg-vigil-content px-3 py-1 rounded-md border border-vigil-border uppercase transition-colors duration-300">
                                    {evt.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Analytics & Actions Sidebar */}
        <div className="space-y-8">
            {/* Survival Chart */}
            <div className="bg-vigil-card border border-vigil-border rounded-card p-6 shadow-sm transition-colors duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-vigil-base">Survival Curve (30d)</h3>
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
                <div className="h-48 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={SURVIVAL_DATA}>
                            <defs>
                                <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#0F6E56" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" hide />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelFormatter={(v) => `Stayed ${v} Days`}
                                formatter={(v) => [`${v}%`, 'Probability']}
                            />
                            <Area type="monotone" dataKey="prob" stroke="#0F6E56" strokeWidth={3} fillOpacity={1} fill="url(#colorProb)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-vigil-content p-4 rounded-md text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Time to Potential Churn</p>
                    <p className="text-4xl font-black text-teal-400 font-mono tracking-tighter">18 DAYS</p>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-vigil-card border border-vigil-border rounded-card p-6 shadow-sm transition-colors duration-300">
                <h3 className="font-bold text-vigil-base mb-6">Smart Interventions</h3>
                <div className="space-y-4">
                    <div className="p-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/20 rounded-lg group hover:bg-teal-100 dark:hover:bg-teal-900/20 transition shadow-sm border-l-4 border-l-teal-600">
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-teal-900 dark:text-teal-400 line-clamp-1">Custom Fee Waiver</h4>
                             <span className="text-[10px] bg-vigil-card px-2 py-0.5 rounded text-teal-700 dark:text-teal-500 font-black">+18% Impact</span>
                        </div>
                        <p className="text-xs text-teal-800/80 dark:text-teal-400/80 mb-3">Address billing inquiry with a credit to reset sentiment.</p>
                        <button className="w-full bg-teal-600 text-white py-2 rounded font-bold text-sm transform active:scale-95 transition">Apply Now</button>
                    </div>

                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-lg group hover:bg-rose-100 dark:hover:bg-rose-900/20 transition shadow-sm border-l-4 border-l-rose-600">
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-rose-900 dark:text-rose-400 line-clamp-1">Retention Concierge</h4>
                             <span className="text-[10px] bg-vigil-card px-2 py-0.5 rounded text-rose-700 dark:text-rose-500 font-black">+42% Impact</span>
                        </div>
                        <p className="text-xs text-rose-800/80 dark:text-rose-400/80 mb-3">Escalate to VIP specialist due to price shock.</p>
                        <button className="w-full bg-rose-600 text-white py-2 rounded font-bold text-sm transform active:scale-95 transition">Escalate Ticket</button>
                    </div>

                    <div className="p-4 bg-vigil-content border border-vigil-border rounded-lg group hover:opacity-80 transition shadow-sm border-l-4 border-l-slate-600">
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-vigil-base line-clamp-1">Capacity Unlock</h4>
                             <span className="text-[10px] bg-vigil-card px-2 py-0.5 rounded text-slate-700 dark:text-slate-400 font-black">+12% Impact</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Grant a 24-hour limit override to solve friction.</p>
                        <button className="w-full bg-slate-900 dark:bg-slate-700 text-white py-2 rounded font-bold text-sm transform active:scale-95 transition text-center flex items-center justify-center">Grant Access</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
