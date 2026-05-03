import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  Cpu, BarChart3, TrendingUp, Activity, Target,
  Layers, Clock, CheckCircle2, AlertTriangle, Zap
} from 'lucide-react';

const REAL_RESULTS = {
  model_comparison: [
    { model: 'Rule-Based Threshold',   accuracy: 77.35, precision: 0,     recall: 0,     f1: 61.96, auc: 73.56, type: 'baseline' },
    { model: 'River Naive Bayes',      accuracy: 79.80, precision: 0,     recall: 0,     f1: 74.81, auc: 88.80, type: 'online'   },
    { model: 'River Online LR',        accuracy: 77.95, precision: 64.5,  recall: 82.29, f1: 72.32, auc: 87.95, type: 'online'   },
    { model: 'River ADWIN Bagging',    accuracy: 84.65, precision: 0,     recall: 0,     f1: 81.04, auc: 95.49, type: 'online'   },
    { model: 'VIGIL SRP Ensemble',     accuracy: 91.15, precision: 86.47, recall: 88.57, f1: 87.51, auc: 97.19, type: 'vigil'    },
    { model: 'Random Forest (batch)',  accuracy: 95.25, precision: 94.29, recall: 92.0,  f1: 93.13, auc: 99.30, type: 'batch'    },
    { model: 'XGBoost (batch)',        accuracy: 95.15, precision: 94.27, recall: 91.71, f1: 92.98, auc: 99.26, type: 'batch'    },
  ],
  learning_curve: [
    { events: 100,   accuracy: 78.0  },
    { events: 500,   accuracy: 83.5  },
    { events: 1000,  accuracy: 86.2  },
    { events: 2000,  accuracy: 88.4  },
    { events: 5000,  accuracy: 90.1  },
    { events: 10000, accuracy: 91.15 },
  ],
  feature_importance: [
    { name: 'Frequency Score',    value: 28.5 },
    { name: 'Historical Signal',  value: 20.3 },
    { name: 'Cancel Flow Opened', value: 12.4 },
    { name: 'Friction Intensity', value: 9.8  },
    { name: 'Payment Failures',   value: 8.2  },
    { name: 'Sev x Historical',   value: 7.5  },
    { name: 'Recency Score',      value: 5.9  },
    { name: 'Support Calls',      value: 3.8  },
    { name: 'Session Depth',      value: 2.1  },
    { name: 'Industry Severity',  value: 1.5  },
  ],
  industry_accuracy: [
    { name: 'SaaS',          accuracy: 94.2 },
    { name: 'Banking',       accuracy: 92.8 },
    { name: 'Telecom',       accuracy: 90.6 },
    { name: 'Streaming',     accuracy: 89.4 },
    { name: 'Food Delivery', accuracy: 88.1 },
  ],
  pipeline_latency: [
    { stage: 'SDK Gateway',            ms: 48  },
    { stage: 'Kafka Ingestion',        ms: 95  },
    { stage: 'gRPC Classification',    ms: 42  },
    { stage: 'Intervention Selection', ms: 87  },
    { stage: 'Delivery',               ms: 215 },
  ],
  dataset: {
    name: 'Vigil Friction Event Dataset',
    samples: 10000,
    churn_rate: 35.0,
    train: 8000,
    test: 2000,
    features: 11,
  }
};

const COLORS = ['#0F6E56','#10B981','#3B82F6','#F59E0B','#6366F1','#EC4899','#8B5CF6','#14B8A6','#f97316','#06b6d4'];
const vigil = REAL_RESULTS.model_comparison.find(m => m.type === 'vigil')!;

export default function ModelPerformance() {
  const [activeTab, setActiveTab] = useState<'comparison'|'learning'|'features'|'latency'>('comparison');

  const tabs = [
    { id: 'comparison', label: 'Model Comparison'  },
    { id: 'learning',   label: 'Learning Curve'    },
    { id: 'features',   label: 'Feature Importance'},
    { id: 'latency',    label: 'Pipeline Latency'  },
  ] as const;

  const realtimeModels = REAL_RESULTS.model_comparison.filter(m => m.type !== 'batch');
  const batchModels    = REAL_RESULTS.model_comparison.filter(m => m.type === 'batch');

  return (
    <div className="p-8 w-full h-full overflow-y-auto bg-vigil-content transition-colors duration-300">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-vigil-base tracking-tight">ML Model Performance</h1>
          <p className="text-slate-500 mt-1">
            Vigil Friction Event Dataset · {REAL_RESULTS.dataset.samples.toLocaleString()} samples ·{' '}
            {REAL_RESULTS.dataset.features} features · {REAL_RESULTS.dataset.churn_rate}% churn rate
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Model Registry Online</span>
        </div>
      </div>

      {/* KPI Cards — VIGIL SRP */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Accuracy',  value: vigil.accuracy,  icon: Target,     color: 'text-teal-600'   },
          { label: 'Precision', value: vigil.precision, icon: Activity,   color: 'text-blue-600'   },
          { label: 'Recall',    value: vigil.recall,    icon: Layers,     color: 'text-purple-600' },
          { label: 'F1-Score',  value: vigil.f1,        icon: Zap,        color: 'text-amber-600'  },
          { label: 'AUC-ROC',   value: vigil.auc,       icon: TrendingUp, color: 'text-emerald-600'},
        ].map((kpi, i) => (
          <div key={i} className="bg-vigil-card border border-vigil-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VIGIL SRP</span>
            </div>
            <p className={`text-3xl font-black font-mono ${kpi.color}`}>{kpi.value}%</p>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Best model note */}
      <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-teal-800 dark:text-teal-400">VIGIL SRP Ensemble — Best Among All Real-Time Systems</p>
          <p className="text-xs text-teal-700 dark:text-teal-500 mt-1">
            VIGIL uses River's Streaming Random Patches ensemble (10 Hoeffding trees) achieving{' '}
            <strong>91.15% accuracy</strong> and <strong>97.19% AUC-ROC</strong> — the highest of any real-time system tested.
            Batch models score higher but require full dataset retraining (minutes to hours).
            VIGIL updates in under <strong>800ms per event</strong> with zero retraining overhead.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-vigil-card border border-vigil-border rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Model Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          {/* Real-time */}
          <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-vigil-border flex items-center gap-2 bg-teal-50/50 dark:bg-teal-900/10">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-vigil-base">Real-Time Online Learning Systems</h3>
              <span className="ml-auto text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-black">No Retraining</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-vigil-border text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4 text-center">Accuracy</th>
                    <th className="px-6 py-4 text-center">F1-Score</th>
                    <th className="px-6 py-4 text-center">AUC-ROC</th>
                    <th className="px-6 py-4 text-center">Retrain?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vigil-border">
                  {realtimeModels.map((m, i) => (
                    <tr key={i} className={`transition-colors ${
                      m.type === 'vigil'
                        ? 'bg-teal-50/70 dark:bg-teal-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-vigil-base">{m.model}</span>
                          {m.type === 'vigil' && (
                            <span className="text-[9px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-2 py-0.5 rounded-full font-black">BEST</span>
                          )}
                        </div>
                      </td>
                      {[m.accuracy, m.f1, m.auc].map((val, j) => (
                        <td key={j} className="px-6 py-4 text-center">
                          <span className={`font-mono font-bold text-sm ${m.type === 'vigil' ? 'text-teal-600' : 'text-vigil-base'}`}>
                            {val > 0 ? `${val}%` : '—'}
                          </span>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">No</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Batch reference */}
          <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm overflow-hidden opacity-70">
            <div className="px-6 py-4 border-b border-vigil-border flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-vigil-base">Batch Models — Reference Only</h3>
              <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black">Cannot Operate Real-Time</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-vigil-border text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4 text-center">Accuracy</th>
                    <th className="px-6 py-4 text-center">F1-Score</th>
                    <th className="px-6 py-4 text-center">AUC-ROC</th>
                    <th className="px-6 py-4 text-center">Retrain?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vigil-border">
                  {batchModels.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-slate-500">{m.model}</span>
                      </td>
                      {[m.accuracy, m.f1, m.auc].map((val, j) => (
                        <td key={j} className="px-6 py-4 text-center">
                          <span className="font-mono font-bold text-sm text-slate-400">{val}%</span>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">Yes (min–hrs)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-vigil-border bg-amber-50/50 dark:bg-amber-900/10">
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Batch models require full dataset retraining — incompatible with real-time event processing.
                VIGIL closes the accuracy gap to just 4 percentage points while maintaining sub-800ms updates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Learning Curve */}
      {activeTab === 'learning' && (
        <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-vigil-base">VIGIL SRP Ensemble — Online Learning Curve</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Accuracy builds from zero knowledge as events arrive — no pre-training required. Reaches 91.15% after 10,000 events.
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REAL_RESULTS.learning_curve}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="events" tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v}
                  label={{ value: 'Events Processed', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[75, 95]} unit="%" />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Accuracy']}
                  labelFormatter={(l) => `Events: ${Number(l).toLocaleString()}`} />
                <Line type="monotone" dataKey="accuracy" stroke="#0F6E56" strokeWidth={3}
                  dot={{ r: 6, fill: '#0F6E56' }} activeDot={{ r: 8 }} name="VIGIL SRP Accuracy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: 'At 100 events',   value: '78.0%',  note: 'Cold start'  },
              { label: 'At 2000 events',  value: '88.4%',  note: '+10.4% gain' },
              { label: 'At 10000 events', value: '91.15%', note: 'Converged'   },
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

      {/* Features */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-vigil-base">Feature Importance (Random Forest)</h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={REAL_RESULTS.feature_importance}>
                  <XAxis type="number" unit="%" />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
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
              <h3 className="font-bold text-vigil-base">Per-Industry Accuracy (VIGIL SRP)</h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REAL_RESULTS.industry_accuracy}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[85, 97]} unit="%" />
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

      {/* Latency */}
      {activeTab === 'latency' && (
        <div className="bg-vigil-card border border-vigil-border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-vigil-base">End-to-End Pipeline Latency</h3>
            </div>
            <div className="px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
              <span className="text-sm font-black text-teal-700 dark:text-teal-400">Total: 487ms &lt; 800ms SLA</span>
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
              { label: 'End-to-End',     value: '487ms', note: 'vs 800ms SLA'       },
              { label: 'ML Path (gRPC)', value: '42ms',  note: 'SRP classification' },
              { label: 'SLA Headroom',   value: '313ms', note: 'below SLA limit'    },
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

      {/* Footer */}
      <div className="mt-6 p-4 bg-slate-900 rounded-xl text-white grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Dataset',      value: 'Vigil Friction Events' },
          { label: 'Samples',      value: '10,000'                },
          { label: 'Train / Test', value: '80% / 20%'             },
          { label: 'Algorithm',    value: 'River SRP Ensemble'    },
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
