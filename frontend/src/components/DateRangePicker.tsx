import React from 'react';

type Range = 'Today' | '7D' | '30D' | '90D';

interface DateRangePickerProps {
  currentRange: Range;
  onRangeChange: (range: Range) => void;
  compareMode: boolean;
  onCompareToggle: () => void;
}

export default function DateRangePicker({ currentRange, onRangeChange, compareMode, onCompareToggle }: DateRangePickerProps) {
  const ranges: Range[] = ['Today', '7D', '30D', '90D'];

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={`px-4 py-1.5 rounded-md text-xs font-black tracking-widest transition-all ${
              currentRange === r
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
      
      <button 
        onClick={onCompareToggle}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
          compareMode 
            ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400' 
            : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${compareMode ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
        Compare to Previous
      </button>
    </div>
  );
}
