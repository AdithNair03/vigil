import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { useTenant } from '../lib/TenantContext';
import { Loader2, TrendingUp, DollarSign, Activity, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import DateRangePicker from '../components/DateRangePicker';
import { useTheme } from '../context/ThemeContext';

export default function Analytics() {
  const { currentTenant } = useTenant();
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'Today' | '7D' | '30D' | '90D'>('7D');
  const [compare, setCompare] = useState(false);

  const getMockData = (tid: string, dateRange: string) => {
    const industryProfiles: Record<string, any> = {
      't1': { name: 'Prime Video', health: 8.5, trendRange: [6, 8], issues: [{ category: 'Monetization', affected_users: 450 }, { category: 'Quality', affected_users: 280 }], roi: [{ intervention_type: 'IN_APP_DISCOUNT', success_rate: 0.85, estimated_arr_saved: 22000 }] },
      't2': { name: 'Swiggy', health: 7.2, trendRange: [5, 7], issues: [{ category: 'Late Delivery', affected_users: 620 }, { category: 'Refund Flow', affected_users: 180 }], roi: [{ intervention_type: 'FREE_DELIVERY', success_rate: 0.78, estimated_arr_saved: 15300 }] },
      't3': { name: 'HDFC Bank', health: 6.8, trendRange: [5, 6], issues: [{ category: 'Fees', affected_users: 850 }, { category: 'Support', affected_users: 330 }], roi: [{ intervention_type: 'FEE_WAIVER', success_rate: 0.92, estimated_arr_saved: 45000 }] },
      't4': { name: 'Notion', health: 9.1, trendRange: [7, 9], issues: [{ category: 'Limits', affected_users: 210 }, { category: 'Pricing', affected_users: 95 }], roi: [{ intervention_type: 'TRIAL_EXTENSION', success_rate: 0.88, estimated_arr_saved: 12400 }] }
    };

    const profile = industryProfiles[tid] || industryProfiles['t1'];
    let points = 7;
    if (dateRange === 'Today') points = 24;
    else if (dateRange === '30D') points = 30;
    else if (dateRange === '90D') points = 45;

    const trends = Array.from({ length: points }, (_, i) => {
      const min = profile.trendRange[0];
      const max = profile.trendRange[1];
      const score = min + (Math.random() * (max - min));
      return {
        timestamp: dateRange === 'Today' ? `${i}:00` : `Day ${i + 1}`,
        avg_score: parseFloat(score.toFixed(1))
      };
    });

    const outcomes = [
      { type: 'Discount Pulse', fired: 240, success: 82, riskBefore: 88, riskAfter: 22, revenue: 12400 },
      { type: 'Feature Unlock', fired: 110, success: 65, riskBefore: 72, riskAfter: 35, revenue: 8200 },
      { type: 'Onboarding Help', fired: 450, success: 91, riskBefore: 45, riskAfter: 12, revenue: 21000 },
      { type: 'Price Lock', fired: 85, success: 74, riskBefore: 94, riskAfter: 42, revenue: 15500 }
    ];

    return { health_score: profile.health, trends, roi: profile.roi, top_issues: profile.issues, outcomes };
  };

  useEffect(() => {
    const tenantId = currentTenant.id;
    setData(null);
    setLoading(true);
    const fetchData = async () => {
      try {
        throw new Error('Use mock');
      } catch {
        setData(getMockData(tenantId, range));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentTenant.id, range]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[400px] bg-vigil-content transition-colors duration-300">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Computing historical friction...</p>
      </div>
    );
  }

  const dashboardData = data || getMockData(currentTenant.id, range);
  const totalArrSaved = dashboardData.roi?.reduce((a: number, b: any) => a + (b.estimated_arr_saved || 0), 0) || 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(20, 184, 166);
    doc.setFontSize(24);
    doc.text("VIGIL INTELLIGENCE REPORT", 20, 25);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`TENANT: ${currentTenant.name.toUpperCase()}`, 140, 20);
    doc.text(`DATE: ${date}`, 140, 28);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text("Executive Summary", 20, 55);
    doc.setFontSize(10);
    doc.text(`Overall Health Score: ${dashboardData.health_score.toFixed(1)}/10`, 20, 65);
    doc.text(`ARR Protected: $${totalArrSaved.toLocaleString()}`, 20, 72);
    doc.text(`Friction Intensity: ${(10 - dashboardData.health_score).toFixed(1)}/10`, 20, 79);
    doc.setFontSize(14);
    doc.text("Top Friction Patterns", 20, 95);
    let y = 105;
    dashboardData.top_issues.forEach((issue: any) => {
      doc.setFontSize(10);
      doc.text(`• ${issue.category}: ${issue.affected_users} users affected`, 25, y);
      y += 7;
    });
    doc.setFontSize(14);
    doc.text("AI Strategic Recommendations", 20, 140);
    doc.setFontSize(10);
    const recommendation = `Based on the ${range} data, we recommend intensifying ${dashboardData.top_issues[0]?.category} monitoring. Current health score of ${dashboardData.health_score.toFixed(1)} suggests a moderate retention risk.`;
    const lines = doc.splitTextToSize(recommendation, 170);
    doc.text(lines, 20, 150);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text("CONFIDENTIAL | Generated by Vigil Intelligence Platform | vigil.ai", 105, 285, { align: 'center' });
    doc.save(`vigil-report-${currentTenant.id.toLowerCase()}-${range.toLowerCase()}.pdf`);
  };

  return (
    <div className="p-8 w-full h-full overflow-y-auto bg-vigil-content transition-colors duration-300">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-vigil-base tracking-tight">Company Analytics</h1>
          <p className="text-slate-500 mt-1">Tenant Intelligence Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker
            currentRange={range}
            onRangeChange={setRange}
            compareMode={compare}
            onCompareToggle={() => setCompare(!compare)}
          />
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-sm font-bold shadow-lg transition active:scale-95 whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Overall Health Score" value={dashboardData.health_score?.toFixed(1) || "0.0"} suffix="/10" trend={4.2} isGoodTrendUp={true} />
        <MetricCard title="ARR Protected (30d)" value={"$" + totalArrSaved.toLocaleString()} trend={12.5} isGoodTrendUp={true} />
        <MetricCard title="Avg Friction Intensity" value={(10 - dashboardData.health_score).toFixed(1)} trend={-8.4} isGoodTrendUp={false} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <div className="bg-vigil-card rounded-card border border-vigil-border shadow-sm p-6 flex flex-col h-[400px] transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-vigil-base">Value Gap Score Trend</h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 12 }} minTickGap={30} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff' }} />
                <Line type="monotone" dataKey="avg_score" stroke="#0F6E56" strokeWidth={3} dot={{ r: 4, fill: '#0F6E56', strokeWidth: 2, stroke: theme === 'dark' ? '#1e293b' : '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-vigil-card rounded-card border border-vigil-border shadow-sm p-6 flex flex-col h-[400px] transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-vigil-base">Top Friction Categories</h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.top_issues} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 12, fontWeight: 500 }} width={120} />
                <Tooltip cursor={{ fill: theme === 'dark' ? '#334155' : '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff' }} />
                <Bar dataKey="affected_users" fill="#0F6E56" radius={[0, 4, 4, 0]} barSize={32}>
                  {dashboardData.top_issues?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0F6E56' : '#149172'} opacity={1 - (index * 0.2)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-vigil-card rounded-card border border-vigil-border shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-vigil-border flex items-center gap-2 transition-colors">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-vigil-base">Intervention Performance (ROI)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs text-slate-400 uppercase tracking-wider font-mono">
                <th className="px-6 py-4 font-semibold uppercase">Intervention Type</th>
                <th className="px-6 py-4 font-semibold uppercase">Success Rate</th>
                <th className="px-6 py-4 font-semibold uppercase text-right">Estimated ARR Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dashboardData.roi?.map((r: any) => (
                <tr key={r.intervention_type} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-vigil-base">
                    <div className="font-mono text-sm">{r.intervention_type.replace(/_/g, " ")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[100px] h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(r.success_rate || 0) * 100}%` }} />
                      </div>
                      <span className="font-mono text-sm font-bold">{(r.success_rate * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                    ${(r.estimated_arr_saved || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!dashboardData.roi || dashboardData.roi.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                    No intervention data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-vigil-base tracking-tight">Closed Loop Performance</h2>
            <p className="text-sm text-slate-500">Measuring the actual impact of surgical interventions</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Global Success Rate</div>
              <div className="text-2xl font-black text-teal-600">84.2%</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Churn Reduction</div>
              <div className="text-2xl font-black text-emerald-600">-62%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-vigil-card rounded-card border border-vigil-border shadow-sm overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-vigil-border flex items-center justify-between">
              <h3 className="font-bold text-vigil-base text-sm uppercase tracking-wider">Intervention Outcome Matrix</h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black">LIVE TRACKING</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-vigil-border text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Intervention</th>
                    <th className="px-6 py-4 text-center">Fired</th>
                    <th className="px-6 py-4">Risk Reduction</th>
                    <th className="px-6 py-4 text-right">Revenue Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dashboardData.outcomes?.map((o: any) => (
                    <tr key={o.type} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-vigil-base">{o.type}</div>
                        <div className="text-xs text-teal-600 font-bold">{o.success}% success</div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-sm text-slate-500">{o.fired}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] font-bold text-rose-500">{o.riskBefore}%</div>
                          <div className="flex-1 w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-rose-500" style={{ width: `${o.riskAfter}%` }} />
                            <div className="h-full bg-emerald-500" style={{ width: `${o.riskBefore - o.riskAfter}%` }} />
                          </div>
                          <div className="text-[10px] font-bold text-emerald-500">{o.riskAfter}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 text-sm">
                        +${o.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-vigil-card rounded-card border border-vigil-border shadow-sm p-6 flex flex-col h-[400px] transition-colors">
            <div className="mb-6">
              <h3 className="font-bold text-vigil-base text-sm uppercase tracking-wider mb-1">Risk Delta Visualization</h3>
              <p className="text-xs text-slate-500">Before vs After intervention churn risk</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.outcomes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="type" hide />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff' }} />
                  <Bar dataKey="riskBefore" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="riskAfter" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-sm" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Pre-Intervention</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Post-Intervention</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}