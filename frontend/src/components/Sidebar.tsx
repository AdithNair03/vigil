import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Shield, Settings as SettingsIcon, FileTerminal, ChevronDown, Users, LogIn, UserPlus, Sun, Moon, Bell, TrendingUp } from 'lucide-react';
import { useTenant, DEMO_TENANTS } from '../lib/TenantContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar() {
  const { currentTenant, setTenant, userToken, companyName, isDemoMode, logout } = useTenant();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const links = [
    { to: '/', label: 'Live Feed', icon: Activity },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/admin', label: 'Admin Panel', icon: Shield },
    { to: '/model-performance', label: 'ML Metrics', icon: TrendingUp },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
    { to: '/docs', label: 'Integration', icon: FileTerminal },
  ];

  return (
    <div className="w-64 bg-slate-950 text-white flex flex-col h-screen fixed top-0 left-0 border-r border-slate-900 transition-colors duration-300">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tighter text-teal-400 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            VIGIL
            {isDemoMode && (
              <span className="text-[8px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded font-black tracking-widest ml-1 animate-pulse">
                DEMO
              </span>
            )}
          </h1>
          <button 
            onClick={toggleTheme}
            className="p-2 bg-slate-900 border border-slate-800 rounded-md text-slate-400 hover:text-white transition active:scale-95"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        {/* Tenant Switcher - Only in Demo Mode */}
        {isDemoMode && (
          <div className="mt-6 relative group">
            <select 
              value={currentTenant.id}
              onChange={(e) => setTenant(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-md py-2.5 pl-3 pr-10 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
            >
              {DEMO_TENANTS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="mt-1.5 px-3 flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${currentTenant.logoColor}`} />
               <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{currentTenant.industry}</span>
            </div>
          </div>
        )}

        {!isDemoMode && companyName && (
          <div className="mt-6 p-4 bg-slate-900/50 border border-slate-900 rounded-lg">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active workspace</p>
             <p className="text-sm font-bold text-slate-200 truncate">{companyName}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                isActive
                  ? 'bg-teal-600/10 text-teal-400 border-l-4 border-teal-500 font-bold'
                  : 'text-slate-400 hover:bg-slate-900/50 border-l-4 border-transparent hover:text-slate-200'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 space-y-2 border-t border-slate-900">
        {!userToken ? (
          <>
            <NavLink 
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md text-sm transition font-medium"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </NavLink>
            <NavLink 
              to="/register"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-sm transition font-bold shadow-lg shadow-teal-900/20"
            >
              <UserPlus className="w-4 h-4" />
              Join Vigil
            </NavLink>
          </>
        ) : (
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-rose-900/20 hover:text-rose-400 text-slate-400 rounded-md text-sm transition font-bold"
          >
            Sign Out
          </button>
        )}
        <div className="pt-2 flex items-center justify-center">
           <p className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">Environment: Stable v0.1</p>
        </div>
      </div>
    </div>
  );
}
