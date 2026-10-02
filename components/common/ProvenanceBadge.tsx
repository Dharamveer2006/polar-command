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
          icon: <Database className="w-2.5 h-2.5 text-cyan-400" />,
          classes: 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300',
        };
      case 'Synthetic Telemetry':
        return {
          icon: <Cpu className="w-2.5 h-2.5 text-amber-400" />,
          classes: 'bg-amber-950/60 border-amber-800/60 text-amber-300',
        };
      case 'Prototype Forecast':
        return {
          icon: <Sparkles className="w-2.5 h-2.5 text-purple-400" />,
          classes: 'bg-purple-950/60 border-purple-800/60 text-purple-300',
        };
      case 'Derived Calculation':
      default:
        return {
          icon: <Calculator className="w-2.5 h-2.5 text-emerald-400" />,
          classes: 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300',
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded border transition-colors ${style.classes} ${className}`}
      title={`Data Provenance: ${source}`}
    >
      {style.icon}
      <span>{source}</span>
    </span>
  );
}
