'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface TelemetryPoint {
  time: string;
  [key: string]: any;
}

interface TelemetryChartProps {
  title: string;
  data: TelemetryPoint[];
  series: {
    key: string;
    label: string;
    color: string;
    unit?: string;
  }[];
  height?: number;
  type?: 'area' | 'line';
}

export default function TelemetryChart({
  title,
  data,
  series,
  height = 240,
  type = 'area',
}: TelemetryChartProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-mono text-slate-300">
        <span className="font-bold text-white uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-slate-500">24-Hour Telemetry Horizon</span>
      </div>

      <div style={{ width: '100%', height }} className="bg-polar-950/60 p-2 rounded-xl border border-polar-border/40">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b132b',
                  borderColor: 'rgba(114, 221, 247, 0.3)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '6px' }} />
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#grad-${s.key})`}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b132b',
                  borderColor: 'rgba(114, 221, 247, 0.3)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '6px' }} />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
