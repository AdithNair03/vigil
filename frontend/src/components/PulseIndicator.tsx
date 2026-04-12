import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface PulseProps {
  status: 'connected' | 'disconnected' | 'connecting';
}

export default function PulseIndicator({ status }: PulseProps) {
  let colorClass = 'bg-slate-300';
  let ringClass = '';

  if (status === 'connected') {
    colorClass = 'bg-emerald-500';
    ringClass = 'ring-emerald-500/50';
  } else if (status === 'connecting') {
    colorClass = 'bg-amber-500';
    ringClass = 'ring-amber-500/50';
  } else if (status === 'disconnected') {
    colorClass = 'bg-rose-500';
    ringClass = 'ring-rose-500/50';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-3 w-3">
        {status === 'connected' && (
          <motion.span
            animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", colorClass)}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-3 w-3", colorClass)} />
      </div>
      <span className="text-sm font-medium text-slate-600 capitalize">
        {status}
      </span>
    </div>
  );
}
