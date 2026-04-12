import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Key, User, Loader2, AlertCircle, Activity } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    if (username === 'adith' && password === 'vigil@admin2024') {
      localStorage.setItem('vigil_admin_token', 'mock_god_token_adith_nair');
      navigate('/admin');
    } else {
      setError("Invalid Super Admin credentials. Access Denied.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vigil-content p-4 font-sansSelection transition-colors duration-300">
      <div className="w-full max-w-md bg-vigil-card rounded-card border border-vigil-border shadow-2xl overflow-hidden transition-colors">
        <div className="p-10 pb-0 text-center">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-rose-500/10 flex items-center justify-center rounded-2xl text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5">
                <ShieldAlert className="w-10 h-10" />
             </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-6 h-6 text-teal-400" />
            <span className="text-xl font-bold text-vigil-base tracking-tighter">VIGIL</span>
          </div>
          <h1 className="text-2xl font-bold text-vigil-base tracking-tight">Super Admin Login</h1>
          <p className="text-rose-500 text-xs font-bold uppercase tracking-widest mt-2 transition-colors">Restricted Access Level: 5</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-md flex items-center gap-3 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                 <input 
                   type="text" 
                   required
                   className="w-full pl-12 pr-4 py-4 rounded-md bg-vigil-content border border-vigil-border text-vigil-base placeholder:text-slate-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                   placeholder="Username"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                 />
            </div>
            <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                 <input 
                   type="password" 
                   required
                   className="w-full pl-12 pr-4 py-4 rounded-md bg-vigil-content border border-vigil-border text-vigil-base placeholder:text-slate-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                   placeholder="Password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center">
                God-mode session will be logged to system history
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-4 rounded-md transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Root Access'}
          </button>
        </form>
      </div>
    </div>
  );
}
