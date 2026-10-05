'use client';

import React from 'react';
import { DataProvenance } from '@/types';
import { Database, Cpu, Sparkles, Calculator } from 'lucide-react';

interface ProvenanceBadgeProps {
  source: DataProvenance | string;
  className?: string;
  compact?: boolean;
}

export default function ProvenanceBadge({ source, className = '', compact = false }: ProvenanceBadgeProps) {
  const getBadgeStyle = () => {
    switch (source) {
      case 'Public Observation':
        return {
          icon: <Database className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400" />,
          classes: 'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950/60 dark:border-cyan-800/60 dark:text-cyan-300',
        };
      case 'Synthetic Telemetry':
        return {
          icon: <Cpu className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />,
          classes: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800/60 dark:text-amber-300',
        };
      case 'Prototype Forecast':
        return {
          icon: <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />,
          classes: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/60 dark:border-purple-800/60 dark:text-purple-300',
        };
      case 'Derived Calculation':
      default:
        return {
          icon: <Calculator className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />,
          classes: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800/60 dark:text-emerald-300',
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded-md border transition-all duration-200 shadow-2xs hover:scale-105 ${style.classes} ${className}`}
      title={`Data Provenance: ${source}`}
    >
      {style.icon}
      <span className="font-medium">{source}</span>
    </span>
  );
}
