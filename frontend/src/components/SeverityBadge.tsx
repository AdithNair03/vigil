import React from 'react';
import { cn } from '../lib/utils';

export default function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toLowerCase();
  
  let colors = 'bg-slate-100 text-slate-700'; // Default low
  if (s === 'critical') colors = 'bg-rose-100 text-rose-700 border-rose-200';
  else if (s === 'warning') colors = 'bg-amber-100 text-amber-700 border-amber-200';
  else if (s === 'medium') colors = 'bg-blue-100 text-blue-700 border-blue-200';
  else if (s === 'low') colors = 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border", colors)}>
      {s}
    </span>
  );
}
