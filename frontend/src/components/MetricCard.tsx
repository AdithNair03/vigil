import React from 'react';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number; // positive or negative percentage
  isGoodTrendUp?: boolean; // if true, up is green. if false, up is red (e.g. churn)
  className?: string;
  suffix?: string;
}

export default function MetricCard({ title, value, trend, isGoodTrendUp = true, className, suffix }: MetricCardProps) {
  let trendColor = "text-slate-400";
  let TrendIcon = TrendingUp;

  if (trend !== undefined) {
    if (trend > 0) {
      trendColor = isGoodTrendUp ? "text-emerald-500" : "text-rose-500";
      TrendIcon = TrendingUp;
    } else if (trend < 0) {
      trendColor = isGoodTrendUp ? "text-rose-500" : "text-emerald-500";
      TrendIcon = TrendingDown;
    }
  }

  return (
    <div className={cn("bg-vigil-card p-6 rounded-card border border-vigil-border shadow-sm flex flex-col transition-colors duration-300", className)}>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{title}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-bold text-vigil-base">{value}{suffix}</span>
      </div>
      
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", trendColor)}>
          <TrendIcon className="w-4 h-4" />
          <span>{Math.abs(trend)}%</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
}
