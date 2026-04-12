import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, Download, ChevronLeft, ChevronRight, 
  ArrowUpDown, ExternalLink, MoreHorizontal, User, Mail
} from 'lucide-react';
import { useTenant } from '../lib/TenantContext';

interface Customer {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  tenure: number;
  risk: number;
  lastEvent: string;
  daysToChurn: number;
}

const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 25 }, (_, i) => ({
  id: `usr_${1000 + i}`,
  name: [
    'Alex Rivera', 'Sarah Chen', 'Michael Ross', 'Elena Gilbert', 'David Park',
    'Jessica Wong', 'Kevin Hart', 'Rachel Bloom', 'Thomas Wright', 'Maria Garcia',
    'James Bond', 'Emma Watson', 'Tony Stark', 'Steve Rogers', 'Natasha Romanoff',
    'Bruce Wayne', 'Clark Kent', 'Diana Prince', 'Barry Allen', 'Arthur Curry',
    'Victor Stone', 'Hal Jordan', 'Oliver Queen', 'Dinah Lance', 'John Diggle'
  ][i],
  email: `user${i + 1}@example.com`,
  plan: i % 5 === 0 ? 'Enterprise' : i % 3 === 0 ? 'Pro' : 'Free',
  tenure: Math.floor(Math.random() * 500) + 10,
  risk: Math.floor(Math.random() * 100),
  lastEvent: ['sync_error', 'feature_paywall', 'login_success', 'price_shock', 'export_limit'][Math.floor(Math.random() * 5)],
  daysToChurn: Math.floor(Math.random() * 30) + 1
}));

export default function CustomerList() {
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortKey, setSortKey] = useState<keyof Customer>('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.email.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = riskFilter === 'all' || 
                         (riskFilter === 'high' && c.risk > 70) ||
                         (riskFilter === 'medium' && c.risk > 30 && c.risk <= 70) ||
                         (riskFilter === 'low' && c.risk <= 30);
      const matchesPlan = planFilter === 'all' || c.plan.toLowerCase() === planFilter.toLowerCase();
      return matchesSearch && matchesRisk && matchesPlan;
    }).sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [search, riskFilter, planFilter, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleSort = (key: keyof Customer) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Plan', 'Tenure', 'Risk %', 'Last Event', 'Days to Churn'];
    const rows = filteredCustomers.map(c => [c.id, c.name, c.email, c.plan, c.tenure, c.risk, c.lastEvent, c.daysToChurn]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vigil_customers_${currentTenant.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-vigil-content transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-vigil-base flex items-center gap-3 tracking-tight">
            <Users className="w-8 h-8 text-teal-600" />
            Customer Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Managing {filteredCustomers.length} active monitors for <span className="font-bold text-vigil-base">{currentTenant.name}</span></p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-vigil-card border border-vigil-border rounded-md text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:opacity-80 transition active:scale-95"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-vigil-card p-4 rounded-card border border-vigil-border mb-6 flex flex-wrap gap-4 items-center transition-colors">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search name or email..."
            className="w-full pl-10 pr-4 py-2 bg-vigil-content border border-vigil-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-vigil-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter className="w-4 h-4 text-slate-400" />
           <select 
             className="bg-vigil-content border border-vigil-border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-vigil-base transition-colors"
             value={riskFilter}
             onChange={(e) => setRiskFilter(e.target.value)}
           >
              <option value="all">All Risk Levels</option>
               <option value="high">High Risk (70%+)</option>
               <option value="medium">Medium Risk (30-70%)</option>
               <option value="low">Low Risk (30%-)</option>
           </select>
           <select 
             className="bg-vigil-content border border-vigil-border rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-vigil-base transition-colors"
             value={planFilter}
             onChange={(e) => setPlanFilter(e.target.value)}
           >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
           </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-vigil-card rounded-card border border-vigil-border shadow-sm overflow-hidden mb-6 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-vigil-border text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest transition-colors">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 cursor-pointer hover:text-teal-600 transition" onClick={() => toggleSort('plan')}>
                  <div className="flex items-center gap-1">Plan <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-teal-600 transition" onClick={() => toggleSort('tenure')}>
                  <div className="flex items-center gap-1">Tenure <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-teal-600 transition" onClick={() => toggleSort('risk')}>
                  <div className="flex items-center gap-1">Churn Risk <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4">Last Event</th>
                <th className="px-6 py-4 cursor-pointer hover:text-teal-600 transition" onClick={() => toggleSort('daysToChurn')}>
                  <div className="flex items-center gap-1">Days to Churn <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-vigil-border transition-colors">
              {paginatedCustomers.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/customer/${c.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold transition-colors">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-vigil-base group-hover:text-teal-600 transition">{c.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      c.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      c.plan === 'Pro' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">{c.tenure}d</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${c.risk > 70 ? 'bg-rose-500' : c.risk > 30 ? 'bg-amber-500' : 'bg-teal-500'}`} 
                          style={{ width: `${c.risk}%` }} 
                        />
                      </div>
                      <span className={`text-xs font-bold font-mono ${c.risk > 70 ? 'text-rose-500' : c.risk > 30 ? 'text-amber-500' : 'text-teal-500'}`}>
                        {c.risk}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                    {c.lastEvent.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`font-black font-mono text-lg ${c.daysToChurn < 7 ? 'text-rose-500' : 'text-vigil-base'}`}>
                        {c.daysToChurn}d
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-slate-400 dark:text-slate-500">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           navigate(`/customer/${c.id}`);
                         }}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-[10px] font-black uppercase tracking-widest transition shadow-sm active:scale-95"
                       >
                          View Timeline
                          <ExternalLink className="w-3 h-3" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-vigil-content border-t border-vigil-border flex justify-between items-center transition-colors">
           <p className="text-xs text-slate-500">
             Showing <span className="font-bold text-vigil-base">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-vigil-base">{Math.min(page * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-bold text-vigil-base">{filteredCustomers.length}</span> results
           </p>
           <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-vigil-border rounded bg-vigil-card disabled:opacity-30 transition hover:bg-vigil-content"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-vigil-border rounded bg-vigil-card disabled:opacity-30 transition hover:bg-vigil-content"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
