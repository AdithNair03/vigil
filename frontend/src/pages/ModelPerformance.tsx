import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  Cpu, BarChart3, TrendingUp, Activity, Target,
  Layers, Clock, CheckCircle2, AlertTriangle, Zap
} from 'lucide-react';

// ── Real evaluation results from 10,000-sample Vigil Friction Dataset ──
const REAL_RESULTS = {
  model_comparison: [
    { model: 'Logistic Regression', accuracy: 80.2, precision: 75.08, recall: 65.0, f1: 69.68, auc: 87.12, type: 'batch' },
    { model: 'Random Forest', accuracy: 93.35, precision: 92.12, recall: 88.57, f1: 90.31, auc: 98.65, type: 'batch' },
    { model: 'Gradient Boosting', accuracy: 92.65, precision: 90.84, recall: 87.86, f1: 89.32, auc: 98.58, type: 'batch' },
    { model: 'XGBoost', accuracy: 92.85, precision: 91.51, recall: 87.71, f1: 89.57, auc: 98.61, type: 'batch' },
    { model: 'River Online LR (Vigil)', accuracy: 79.4, precision: 74.74, recall: 62.14, f1: 67.86, auc: 86.7, type: 'online' },
  ],
  learning_curve: [
    { events: 100, accuracy: 65.0 },
    { events: 500, accuracy: 76.6 },
    { events: 1000, accuracy: 77.8 },
    { events: 2000, accuracy: 79.05 },
    { events: 5000, accuracy: 80.0 },
    { events: 8000, accuracy: 79.69 },
    { events: 10000, accuracy: 79.68 },
  ],
  feature_importance: [
    { name: 'Frequency Score', value: 38.03 },
    { name: 'Historical Signal', value: 25.05 },
    { name: 'Recency Score', value: 7.91 },
    { name: 'Friction Intensity', value: 7.81 },
    { name: 'Severity × Historical', value: 7.17 },
    { name: 'Industry Severity', value: 5.58 },
    { name: 'Recency × Frequency', value: 4.69 },
    { name: 'Session Depth', value: 3.78 },
  ],
  industry_accuracy: [
    { name: 'SaaS', accuracy: 82.41 },
    { name: 'Banking', accuracy: 80.96 },
    { name: 'Telecom', accuracy: 78.91 },
    { name: 'Streaming', accuracy: 77.06 },
    { name: 'Food Delivery', accuracy: 75.72 },
  ],
  pipeline_latency: [
    { stage: 'SDK Gateway', ms: 48 },
    { stage: 'Kafka Ingestion', ms: 95 },
    { stage: 'gRPC Classification', ms: 42 },
    { stage: 'Intervention Selection', ms: 87 },
    { stage: 'Delivery', ms: 215 },
  ],
  dataset: {
    name: 'Vigil Friction Event Dataset',
    samples: 10000,
    churn_rate: 35.0,
    train: 8000,
    test: 2000,
    features: 8,
  }
};

const COLORS = ['#0F6E56', '#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];
const vigil = REAL_RESULTS.model_comparison.find(m => m.type === 'online')!;

export default function ModelPerformance() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'learning' | 'features' | 'latency'>('comparison');

  const tabs = [
    { id: 'comparison', label: 'Model Comparison' },
    { id: 'learning', label: 'Learning Curve' },
    { id: 'features', label: 'Feature Importance' },
    { id: 'latency', label: 'Pipeline Latency' },
  ] as const;

  return (
    <div className="p-8 w-full h-full overflow-y-auto bg-vigil-content transition-colors duration-300">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-vigil-base tracking-tight">ML Model Performance</h1>
          <p className="text-slate-500 mt-1">
            Evaluated on Vigil Friction Event Dataset · {REAL_RESULTS.dataset.samples.toLocaleString()} samples · {REAL_RESULTS.dataset.churn_rate}% churn rate
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Model Registry Online</span>
        </div>
      </div>

      {/* Vigil Model KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Accuracy', value: vigil.accuracy, icon: Target, color: 'text-teal-600' },
          { label: 'Precision', value: vigil.precision, icon: Activity, color: 'text-blue-600' },
          { label: 'Recall', value: vigil.recall, icon: Layers, color: 'text-purple-600' },
          { label: 'F1-Score', value: vigil.f1, icon: Zap, color: 'text-amber-600' },
          { label: 'AUC-ROC', value: vigil.auc, icon: TrendingUp, color: 'text-emerald-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-vigil-card border border-vigil-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">River Online LR</span>
            </div>
            <p className={`text-3xl font-black font-mono ${kpi.color}`}>{kpi.value}%</p>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Online Learning Note */}
      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Why River's accuracy is lower than batch models</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
            River processes each event sequentially in real-time without access to the full dataset. Batch models (Random Forest, XGBoost)
            train on the complete dataset simultaneously — an inherently unfair comparison. River's key advantage is <strong>sub-800ms
              model updates</strong> with zero retraining overhead, enabling real-time churn prevention impossible with batch approaches.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-vigil-card border border-vigil-border rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.id
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Model Comparison */}
      {activeTab === 'comparison' && (
        <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-vigil-border flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-vigil-base">Model Comparison — Vigil Friction Dataset</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-vigil-border text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <th className="px-6 py-4">Model</th>
                  <th className="px-6 py-4 text-center">Type</th>
                  <th className="px-6 py-4 text-center">Accuracy</th>
                  <th className="px-6 py-4 text-center">Precision</th>
                  <th className="px-6 py-4 text-center">Recall</th>
                  <th className="px-6 py-4 text-center">F1-Score</th>
                  <th className="px-6 py-4 text-center">AUC-ROC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vigil-border">
                {REAL_RESULTS.model_comparison.map((m, i) => (
                  <tr key={i} className={`transition-colors ${m.type === 'online' ? 'bg-teal-50/50 dark:bg-teal-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-vigil-base">{m.model}</span>
                        {m.type === 'online' && (
                          <span className="text-[9px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-2 py-0.5 rounded-full font-black">VIGIL ★</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.type === 'online'
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                        {m.type === 'online' ? 'Online' : 'Batch'}
                      </span>
                    </td>
                    {[m.accuracy, m.precision, m.recall, m.f1, m.auc].map((val, j) => (
                      <td key={j} className="px-6 py-4 text-center">
                        <span className={`font-mono font-bold text-sm ${m.type === 'online' ? 'text-teal-600' :
                          val >= 90 ? 'text-emerald-600' : 'text-vigil-base'
                          }`}>
                          {val}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-vigil-border bg-slate-50/50 dark:bg-slate-900/30">
            <p className="text-[10px] text-slate-400">
              ★ Vigil uses River online learning — model updates in real-time without retraining.
              Dataset: {REAL_RESULTS.dataset.samples.toLocaleString()} samples, 70/30 split, {REAL_RESULTS.dataset.churn_rate}% churn rate.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Learning Curve */}
      {activeTab === 'learning' && (
        <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-vigil-base">River Online Learning Curve</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Shows how River's accuracy improves as it processes more events — starting from zero knowledge,
            no offline training required. Reaches 76.6% after just 500 events.
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REAL_RESULTS.learning_curve}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="events" tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                  label={{ value: 'Events Processed', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[55, 85]} unit="%" />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Accuracy']}
                  labelFormatter={(l) => `Events: ${l.toLocaleString()}`} />
                <Line type="monotone" dataKey="accuracy" stroke="#0F6E56" strokeWidth={3}
                  dot={{ r: 5, fill: '#0F6E56' }} activeDot={{ r: 7 }} name="River Accuracy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: 'At 100 events', value: '65.0%', note: 'Cold start' },
              { label: 'At 500 events', value: '76.6%', note: '+11.6% gain' },
              { label: 'At 5000 events', value: '80.0%', note: 'Converged' },
            ].map((item, i) => (
              <div key={i} className="bg-vigil-content border border-vigil-border rounded-lg p-4 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-2xl font-black font-mono text-teal-600">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Feature Importance */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-vigil-base">Feature Importance (Random Forest)</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={REAL_RESULTS.feature_importance}>
                  <XAxis type="number" unit="%" />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Importance']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {REAL_RESULTS.feature_importance.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-vigil-base">Per-Industry Accuracy (River)</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REAL_RESULTS.industry_accuracy}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[70, 90]} unit="%" />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Accuracy']} />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} barSize={45}>
                    {REAL_RESULTS.industry_accuracy.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pipeline Latency */}
      {activeTab === 'latency' && (
        <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-vigil-base">End-to-End Pipeline Latency</h3>
            </div>
            <div className="px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
              <span className="text-sm font-black text-teal-700 dark:text-teal-400">Total: 487ms &lt; 800ms SLA ✓</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {REAL_RESULTS.pipeline_latency.map((stage, i) => {
              const total = REAL_RESULTS.pipeline_latency.reduce((a, b) => a + b.ms, 0);
              const pct = (stage.ms / total) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-vigil-base">{stage.stage}</span>
                    <span className="font-mono text-sm font-bold text-teal-600">{stage.ms}ms</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-vigil-border">
            {[
              { label: 'End-to-End', value: '487ms', note: 'vs 800ms SLA', ok: true },
              { label: 'ML Critical Path', value: '42ms', note: 'gRPC classification', ok: true },
              { label: 'SLA Compliance', value: '100%', note: 'All events &lt;800ms', ok: true },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-2xl font-black font-mono text-emerald-600">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Dataset Info */}
      <div className="mt-6 p-4 bg-slate-900 rounded-xl text-white grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Dataset', value: 'Vigil Friction Events' },
          { label: 'Total Samples', value: '10,000' },
          { label: 'Train / Test Split', value: '80% / 20%' },
          { label: 'Algorithm', value: 'River LogisticRegression' },
        ].map((item, i) => (
          <div key={i}>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-sm font-bold text-white font-mono">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
