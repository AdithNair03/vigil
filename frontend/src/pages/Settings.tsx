import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Trash2, Mail, 
  Settings as SettingsIcon, Bell, Globe, 
  Clock, CheckCircle2, XCircle, ChevronRight, X
} from 'lucide-react';
import { useTenant } from '../lib/TenantContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Analyst' | 'Viewer';
  status: 'Active' | 'Pending';
  avatar: string;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  { id: 'tm_1', name: 'Adith Nair', email: 'adith@vigil.ai', role: 'Admin', status: 'Active', avatar: 'AN' },
  { id: 'tm_2', name: 'Sarah Chen', email: 'sarah.c@company.com', role: 'Analyst', status: 'Active', avatar: 'SC' },
  { id: 'tm_3', name: 'Michael Ross', email: 'm.ross@company.com', role: 'Viewer', status: 'Pending', avatar: 'MR' }
];

export default function Settings() {
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<'team' | 'preferences'>('team');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Form State
  const [inviteData, setInviteData] = useState({ email: '', role: 'Analyst' as TeamMember['role'] });

  // Preference State
  const [prefs, setPrefs] = useState({
    emailNotif: true,
    slackNotif: true,
    weeklyReport: false,
    defaultRange: '7D',
    timezone: 'UTC'
  });

  useEffect(() => {
    const savedMembers = localStorage.getItem(`vigil_team_${currentTenant.id}`);
    const savedPrefs = localStorage.getItem(`vigil_prefs_${currentTenant.id}`);
    
    if (savedMembers) setMembers(JSON.parse(savedMembers));
    else setMembers(DEFAULT_MEMBERS);

    if (savedPrefs) setPrefs(JSON.parse(savedPrefs));
  }, [currentTenant.id]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: TeamMember = {
      id: `tm_${Date.now()}`,
      name: inviteData.email.split('@')[0],
      email: inviteData.email,
      role: inviteData.role,
      status: 'Pending',
      avatar: inviteData.email.charAt(0).toUpperCase()
    };
    const newMembers = [...members, newMember];
    setMembers(newMembers);
    localStorage.setItem(`vigil_team_${currentTenant.id}`, JSON.stringify(newMembers));
    setIsInviteModalOpen(false);
    showToast(`Invite sent to ${inviteData.email}`);
    setInviteData({ email: '', role: 'Analyst' });
  };

  const removeMember = (id: string) => {
    const newMembers = members.filter(m => m.id !== id);
    setMembers(newMembers);
    localStorage.setItem(`vigil_team_${currentTenant.id}`, JSON.stringify(newMembers));
    showToast("Team member removed");
  };

  const savePrefs = () => {
    localStorage.setItem(`vigil_prefs_${currentTenant.id}`, JSON.stringify(prefs));
    showToast("Preferences updated successfully");
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-vigil-content transition-colors duration-300 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl animate-in font-sans ${
          toast.type === 'success' ? 'bg-teal-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-vigil-base tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-slate-500" />
          Settings & Governance
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Tenant: <span className="font-bold text-vigil-base">{currentTenant.name}</span></p>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-vigil-border mb-8">
        <button 
          onClick={() => setActiveTab('team')}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'team' ? 'text-teal-500 border-teal-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
        >
          Team Management
        </button>
        <button 
          onClick={() => setActiveTab('preferences')}
          className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'preferences' ? 'text-teal-500 border-teal-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
        >
          App Preferences
        </button>
      </div>

      {activeTab === 'team' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex justify-between items-center">
              <div>
                 <h2 className="text-xl font-bold text-vigil-base">Access Control</h2>
                 <p className="text-sm text-slate-500">Manage who can view and edit your tenant intelligence</p>
              </div>
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-sm font-bold shadow-lg shadow-teal-900/20 transition active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
           </div>

           <div className="bg-vigil-card rounded-card border border-vigil-border shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-vigil-border text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-vigil-border">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold border border-vigil-border">
                            {m.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-vigil-base">{m.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Shield className={`w-4 h-4 ${m.role === 'Admin' ? 'text-teal-500' : m.role === 'Analyst' ? 'text-blue-500' : 'text-slate-400'}`} />
                           <span className="text-sm font-medium text-vigil-base">{m.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          m.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeMember(m.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {[
                { r: 'Admin', desc: 'Full access to all settings, billing, and team management.' },
                { r: 'Analyst', desc: 'Can create alerts, views timelines, and export all reports.' },
                { r: 'Viewer', desc: 'Read-only access to dashboards and customer metrics.' }
              ].map(role => (
                <div key={role.r} className="p-5 rounded-card border border-vigil-border bg-vigil-card transition-colors">
                   <div className="font-bold text-vigil-base mb-2 flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${role.r === 'Admin' ? 'text-teal-500' : role.r === 'Analyst' ? 'text-blue-500' : 'text-slate-400'}`} />
                      {role.r}
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">{role.desc}</p>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="bg-vigil-card rounded-card border border-vigil-border shadow-sm p-8 space-y-8 transition-colors">
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-vigil-base flex items-center gap-2 border-b border-vigil-border pb-4">
                  <Bell className="w-5 h-5 text-teal-500" />
                  Notifications
                </h3>
                <div className="space-y-4">
                   {[
                     { id: 'emailNotif', label: 'Email Alerts', desc: 'Get critical alerts in your inbox' },
                     { id: 'slackNotif', label: 'Slack Webhooks', desc: 'Stream events to your engineering channels' },
                     { id: 'weeklyReport', label: 'Weekly Summary', desc: 'Automated ROI report exported on Sundays' }
                   ].map(n => (
                     <div key={n.id} className="flex items-center justify-between group">
                        <div>
                           <div className="font-bold text-vigil-base text-sm">{n.label}</div>
                           <div className="text-xs text-slate-500">{n.desc}</div>
                        </div>
                        <button 
                          onClick={() => setPrefs({...prefs, [n.id]: !prefs[n.id as keyof typeof prefs]})}
                          className={`relative w-12 h-6 rounded-full transition-colors ${prefs[n.id as keyof typeof prefs] ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                           <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${prefs[n.id as keyof typeof prefs] ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                     </div>
                   ))}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                 <div className="space-y-4">
                    <h3 className="text-lg font-bold text-vigil-base flex items-center gap-2">
                      <Globe className="w-5 h-5 text-teal-500" />
                      Localization
                    </h3>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Timezone</label>
                       <select 
                         className="w-full px-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base outline-none transition appearance-none"
                         value={prefs.timezone}
                         onChange={e => setPrefs({...prefs, timezone: e.target.value})}
                       >
                          <option>UTC</option>
                          <option>IST (Asia/Kolkata)</option>
                          <option>EST (New York)</option>
                          <option>PST (Los Angeles)</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-lg font-bold text-vigil-base flex items-center gap-2">
                      <Clock className="w-5 h-5 text-teal-500" />
                      Visual Defaults
                    </h3>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Default Analytics Range</label>
                       <select 
                         className="w-full px-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base outline-none transition appearance-none"
                         value={prefs.defaultRange}
                         onChange={e => setPrefs({...prefs, defaultRange: e.target.value})}
                       >
                          <option value="Today">Today</option>
                          <option value="7D">Last 7 Days</option>
                          <option value="30D">Last 30 Days</option>
                          <option value="90D">Last 90 Days</option>
                       </select>
                    </div>
                 </div>
              </section>

              <div className="pt-8 border-t border-vigil-border">
                 <button 
                   onClick={savePrefs}
                   className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md shadow-lg shadow-teal-900/20 transition active:scale-95"
                 >
                   Save Preferences
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-vigil-card rounded-card border border-vigil-border shadow-2xl overflow-hidden transition-colors">
             <div className="p-8 border-b border-vigil-border flex justify-between items-center">
                <h2 className="text-xl font-bold text-vigil-base flex items-center gap-2">
                   <UserPlus className="w-5 h-5 text-teal-500" />
                   Invite Team Member
                </h2>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-vigil-base">
                   <X className="w-6 h-6" />
                </button>
             </div>
             <form onSubmit={handleInvite} className="p-8 space-y-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Work Email</label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                         <input 
                           type="email" required placeholder="name@company.com"
                           className="w-full pl-10 pr-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base focus:ring-2 focus:ring-teal-500 outline-none transition"
                           value={inviteData.email}
                           onChange={e => setInviteData({...inviteData, email: e.target.value})}
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assigned Role</label>
                      <select 
                        className="w-full px-4 py-3 bg-vigil-content border border-vigil-border rounded-md text-sm text-vigil-base focus:ring-2 focus:ring-teal-500 outline-none transition appearance-none"
                        value={inviteData.role}
                        onChange={e => setInviteData({...inviteData, role: e.target.value as any})}
                      >
                         <option value="Admin">Admin</option>
                         <option value="Analyst">Analyst</option>
                         <option value="Viewer">Viewer</option>
                      </select>
                   </div>
                </div>
                <button type="submit" className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md shadow-xl transition active:scale-95">
                   Send Secure Invite
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
