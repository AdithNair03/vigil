import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Loader2, AlertCircle, Rocket, User, Lock, ChevronRight, Copy, Check, Activity } from 'lucide-react';
import { api } from '../api/client';
import { useTenant } from '../lib/TenantContext';

export default function Register() {
  const { login } = useTenant();
  const [formData, setFormData] = useState({
    company_name: '',
    your_name: '',
    email: '',
    password: '',
    industry: 'Streaming',
    company_size: '11-50'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.tenants.register(formData);
      setSuccessData(response);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    if (successData?.sdk_key) {
      navigator.clipboard.writeText(successData.sdk_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vigil-content p-6 transition-colors duration-300">
        <div className="w-full max-w-xl bg-vigil-card rounded-card border border-vigil-border shadow-2xl p-10 text-center animate-in fade-in zoom-in duration-500 transition-colors">
           <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner transition-colors">
              <Rocket className="w-12 h-12" />
           </div>
           <h1 className="text-3xl font-bold text-vigil-base mb-2 tracking-tight transition-colors">Welcome to Vigil, {successData.company_name}</h1>
           <p className="text-slate-500 dark:text-slate-400 mb-8 transition-colors">Your enterprise friction engine is ready for deployment.</p>
           
           <div className="bg-vigil-content rounded-lg p-6 mb-4 relative group overflow-hidden border border-vigil-border transition-colors">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-500 font-bold">Your Production SDK Key</span>
                 {copied ? (
                   <span className="text-teal-400 text-xs flex items-center gap-1 font-bold animate-pulse"><Check className="w-3 h-3"/> Copied</span>
                 ) : (
                   <button onClick={copyKey} className="text-slate-400 hover:text-white transition transform active:scale-95">
                     <Copy className="w-4 h-4" />
                   </button>
                 )}
              </div>
              <code className="block text-teal-400 font-mono text-lg break-all select-all pt-2">{successData.sdk_key}</code>
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-3xl rounded-full -translate-y-12 translate-x-12" />
           </div>
           
           <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 text-amber-800 dark:text-amber-400 p-4 rounded-md text-sm mb-8 flex items-start gap-3 text-left transition-colors">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
              <p>
                <span className="font-bold">CRITICAL:</span> Save this key securely. Due to our zero-knowledge architecture, it will <span className="underline decoration-wavy decoration-amber-500">never</span> be shown again in the dashboard.
              </p>
           </div>

           <button 
             onClick={() => {
               login('reg_token_' + Math.random(), successData.company_name, false);
               navigate('/');
             }}
             className="w-full bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-bold py-4 rounded-md transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 dark:shadow-teal-900/20 active:scale-95"
           >
             Go to Dashboard
             <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>
    );
  }

   return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#08090a] p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="w-full max-w-[960px] min-h-[640px] bg-white dark:bg-[#0f1115] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row transition-all duration-500 z-10">
        
        {/* Branding Side */}
        <div className="bg-slate-950 p-[48px] text-white flex flex-col justify-between md:w-[35%] relative overflow-hidden transition-colors">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10 text-teal-400">
                    <Activity className="w-8 h-8" />
                    <span className="text-2xl font-black tracking-tighter">VIGIL</span>
                </div>
                <h1 className="text-[36px] font-bold leading-[1.1] mb-6 tracking-tight">Onboard your <br/>Company.</h1>
                <p className="text-slate-400 text-[16px] leading-relaxed max-w-[280px]">Join the world's most advanced friction detection platform and secure your roadmap.</p>
            </div>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full -translate-y-12 translate-x-12" />
        </div>

        <div className="flex-1 bg-white dark:bg-[#0f1115] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-[48px] grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-full mb-2">
              <h2 className="text-[28px] font-bold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">Create Workspace</h2>
              <p className="text-[15px] text-slate-500 dark:text-slate-400 transition-colors">Start your journey with enterprise friction intelligence</p>
            </div>

            {error && (
              <div className="col-span-full bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 p-4 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-400 text-[13px] transition-colors animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
              </div>
            )}

            <div className="space-y-2.5">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest transition-colors">Company Name</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input id="company_name" type="text" required value={formData.company_name} onChange={handleChange}
                  className="w-full h-[52px] pl-11 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-[15px] focus:bg-white dark:focus:bg-transparent focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  placeholder="e.g. Acme Corp" />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest transition-colors">Your Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input id="your_name" type="text" required value={formData.your_name} onChange={handleChange}
                  className="w-full h-[52px] pl-11 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-[15px] focus:bg-white dark:focus:bg-transparent focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  placeholder="John Doe" />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest transition-colors">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input id="email" type="email" required value={formData.email} onChange={handleChange}
                  className="w-full h-[52px] pl-11 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-[15px] focus:bg-white dark:focus:bg-transparent focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  placeholder="name@company.com" />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest transition-colors">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input id="password" type="password" required value={formData.password} onChange={handleChange}
                  className="w-full h-[52px] pl-11 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-[15px] focus:bg-white dark:focus:bg-transparent focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200"
                  placeholder="••••••••" />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Industry Segment</label>
              <select id="industry" value={formData.industry} onChange={handleChange}
                className="w-full h-[52px] px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-[15px] focus:bg-white dark:focus:bg-transparent focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition appearance-none">
                 <option>Streaming</option>
                 <option>Food Delivery</option>
                 <option>Banking</option>
                 <option>SaaS</option>
                 <option>Telecom</option>
                 <option>E-commerce</option>
                 <option>Healthcare</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <label className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Company Size</label>
              <select id="company_size" value={formData.company_size} onChange={handleChange}
                className="w-full h-[52px] px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-[15px] focus:bg-white dark:focus:bg-transparent focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition appearance-none">
                 <option>1-10</option>
                 <option>11-50</option>
                 <option>51-200</option>
                 <option>200-1000</option>
                 <option>1000+</option>
              </select>
            </div>

            <div className="col-span-full pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white font-bold text-[16px] rounded-xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-teal-500/10 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Vigil Account'}
                {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
              
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 text-center flex flex-col gap-4">
                 <p className="text-[14px] text-slate-500 dark:text-slate-400 transition-colors">
                   Already have an account? <Link to="/login" className="text-teal-600 dark:text-teal-500 font-bold hover:underline decoration-2 underline-offset-4 transition">Sign In Instead</Link>
                 </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
