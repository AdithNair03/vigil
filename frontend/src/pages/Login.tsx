import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, Lock, Activity, ChevronRight } from 'lucide-react';
import { useTenant } from '../lib/TenantContext';

export default function Login() {
  const { login } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTimeout(() => {
      if (email === 'demo@vigil.ai' && password === 'vigil2024') {
        login('demo_token_12345', 'Vigil Demo Corp', true);
        navigate('/');
      } else if (password === 'vigil2024') {
        const company = email.split('@')[1].split('.')[0].toUpperCase();
        login('real_token_' + Math.random(), company, false);
        navigate('/');
      } else {
        setError('Invalid credentials. Try demo@vigil.ai / vigil2024');
        setLoading(false);
      }
    }, 1200);
  };

  const handleForgotPassword = () => {
    alert("Password reset is handled by your account manager.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />
      <div className="w-full max-w-[1000px] min-h-[580px] bg-[#0f1115] rounded-[32px] border border-white/5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row z-10">

        {/* Left branding panel */}
        <div className="bg-[#1a1b1f] p-16 text-white flex flex-col justify-between md:w-[45%] relative overflow-hidden border-r border-white/5">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-20 text-teal-400">
              <Activity className="w-10 h-10" />
              <span className="text-3xl font-black tracking-tighter">VIGIL</span>
            </div>
            <div className="space-y-8">
              <h2 className="text-[40px] font-bold leading-[1.1] tracking-tight">
                Welcome back <br />to the core.
              </h2>
              <p className="text-slate-400 text-[16px] leading-relaxed max-w-[320px]">
                Your gateway to precision friction intelligence and multi-tenant observability at scale.
              </p>
            </div>
            <div className="mt-auto">
              <p className="text-[12px] text-slate-500 uppercase tracking-[0.3em] font-bold">
                Secured by Vigil-Guard Tier-1
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Right form panel */}
        <div className="p-16 flex-1 bg-[#0f1115] flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-10 max-w-[420px] mx-auto w-full">
            <div>
              <h1 className="text-[32px] font-bold text-white mb-3 tracking-tight">Sign In</h1>
              <p className="text-[16px] text-slate-400">Enter your workspace credentials</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 text-[14px]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Workspace Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[56px] pl-14 pr-5 rounded-2xl border border-white/10 bg-white/[0.02] text-white text-[16px] focus:bg-white/[0.04] focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-300"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[12px] text-teal-400 font-bold hover:text-teal-300 transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[56px] pl-14 pr-5 rounded-2xl border border-white/10 bg-white/[0.02] text-white text-[16px] focus:bg-white/[0.04] focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[60px] bg-teal-600 hover:bg-teal-500 text-white font-bold text-[18px] rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-teal-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Enter Dashboard
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <p className="text-[15px] text-slate-500">
              New to Vigil?{' '}
              <Link
                to="/register"
                className="text-teal-400 font-bold hover:text-teal-300 transition-colors"
              >
                Create a Tenant
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}