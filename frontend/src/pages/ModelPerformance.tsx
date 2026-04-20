import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Loader2, ShieldAlert, Cpu, BarChart3, TrendingUp, 
  Activity, Target, PieChart, Layers, Clock, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, Legend, LineChart, Line
} from 'recharts';

export default function ModelPerformance() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const result = await api.metrics.getEvaluation();
        if (result.error) {
          setError(result.error);
        } else {
          setData(result);
        }
      } catch (err: any) {
        setError("Failed to connect to Friction Classifier. Ensure service is running on :8002");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full bg-vigil-content">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium font-mono uppercase tracking-widest text-xs">Computing Model Evaluation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full bg-vigil-content">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <p className="text-slate-700 font-bold mb-2">Metrics Unavailable</p>
        <p className="text-slate-500 text-center max-w-md">{error}</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Accuracy', value: data.accuracy, icon: Target },
    { label: 'Precision', value: data.precision, icon: Activity },
    { label: 'Recall', value: data.recall, icon: RefreshCcw },
    { label: 'F1-Score', value: data.f1_score, icon: Layers },
  ];

  const industryData = Object.entries(data.per_industry_accuracy).map(([name, value]: any) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    accuracy: value * 100
  }));

  const featureImportanceData = Object.entries(data.feature_importance)
    .map(([name, value]: any) => ({
      name: name.replace(/_/g, ' '),
      importance: Math.abs(value)
    }))
    .sort((a, b) => b.importance - a.importance);

  const confusionMatrix = data.confusion_matrix;
  const categories = ["CRITICAL", "WARNING", "LOW"];

  const COLORS = ['#0F6E56', '#10B981', '#3B82F6', '#F59E0B', '#6366F1'];

  return (
    <div className="p-8 w-full h-full overflow-y-auto bg-vigil-content transition-colors duration-300">
      <header className="mb-10 flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-extrabold text-vigil-base tracking-tight mb-2">ML Model Performance</h1>
                <p className="text-slate-500 dark:text-slate-400">Offline validation and quality metrics for Friction Classifier v2.4.92</p>
            </div>
            <div className="flex items-center gap-4 bg-vigil-card p-4 rounded-lg border border-vigil-border shadow-sm">
                 <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Model Registry Status</p>
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3 h-3" /> ONLINE / STABLE
                    </p>
                 </div>
                 <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center">
                    <Cpu className="w-6 h-6" />
                 </div>
            </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-vigil-card p-6 rounded-card border border-vigil-border shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 group-hover:text-teal-600 transition-colors">
                 <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${kpi.value > 0.8 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {kpi.value > 0.8 ? 'HIGH' : 'STABLE'}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{kpi.label}</p>
            <h2 className={`text-4xl font-black font-mono tracking-tighter ${kpi.value > 0.8 ? 'text-teal-600' : 'text-vigil-base'}`}>
              {(kpi.value * 100).toFixed(1)}%
            </h2>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-500/5 blur-xl rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* AUC-ROC Card */}
        <div className="bg-vigil-card p-8 rounded-card border border-vigil-border shadow-sm flex flex-col justify-center items-center text-center">
           <div className="w-24 h-24 rounded-full border-4 border-teal-500/20 flex items-center justify-center mb-4 relative">
              <TrendingUp className="w-10 h-10 text-teal-600" />
              <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-[spin_3s_linear_infinite]" />
           </div>
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">AUC-ROC Coverage</h3>
           <p className="text-5xl font-black text-vigil-base font-mono tracking-tighter mb-4">{data.auc_roc.toFixed(3)}</p>
           <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500">
              Discriminative Power: <span className="text-teal-600 uppercase">Strong</span>
           </div>
        </div>

        {/* Feature Importance */}
        <div className="lg:col-span-2 bg-vigil-card p-8 rounded-card border border-vigil-border shadow-sm">
           <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-600" />
              Feature Importance Weights
           </h3>
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={featureImportanceData}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#2dd4bf' }}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {featureImportanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Industry Accuracy */}
        <div className="bg-vigil-card p-8 rounded-card border border-vigil-border shadow-sm">
           <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Per-Industry Model Precision
           </h3>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="accuracy" barSize={40} radius={[4, 4, 0, 0]}>
                    {industryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-vigil-card p-8 rounded-card border border-vigil-border shadow-sm">
           <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              Classification Confusion Matrix
           </h3>
           <div className="grid grid-cols-4 gap-2">
              <div className="col-start-2 text-center text-[10px] font-black uppercase text-slate-400">Low</div>
              <div className="text-center text-[10px] font-black uppercase text-slate-400">Warning</div>
              <div className="text-center text-[10px] font-black uppercase text-slate-400">Critical</div>
              
              {categories.map((actual) => (
                <React.Fragment key={actual}>
                  <div className="flex items-center text-[10px] font-black uppercase text-slate-400 pr-2">{actual}</div>
                  {categories.map((pred) => {
                    const value = confusionMatrix[actual][pred];
                    const total = Object.values(confusionMatrix[actual]).reduce((a: any, b: any) => a + b, 0) as number;
                    const percentage = (value / total) * 100;
                    const opacity = percentage / 100;
                    
                    return (
                      <div 
                        key={pred} 
                        className="aspect-square flex flex-col items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 transition-all hover:scale-105"
                        style={{ backgroundColor: actual === pred ? `rgba(15, 110, 86, ${opacity})` : `rgba(244, 63, 94, ${opacity * 0.2})` }}
                      >
                        <span className="text-lg font-black text-vigil-base">{value}</span>
                        <span className="text-[8px] font-bold text-slate-500">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
           </div>
           <div className="mt-8 pt-6 border-t border-vigil-border flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Rows: Actual Category</span>
              <span>Cols: Predicted Category</span>
           </div>
        </div>
      </div>

      {/* Model Metadata */}
      <div className="bg-slate-900 rounded-card p-8 text-white relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                      <Cpu className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Inference Engine</p>
                      <p className="text-lg font-bold">{data.model_info.algorithm}</p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Last Validation</p>
                      <p className="text-lg font-bold">{data.model_info.last_updated}</p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Total Dataset</p>
                      <p className="text-lg font-bold">{(data.model_info.total_events_processed).toLocaleString()} Samples</p>
                  </div>
              </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-3xl rounded-full" />
      </div>
    </div>
  );
}

// Fixed import for some missing lucide icons if they were miscalled
const RefreshCcw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>
  </svg>
);

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
