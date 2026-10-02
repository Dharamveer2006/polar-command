'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  CheckCircle2, 
  Filter, 
  Activity, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { RiskSeverity } from '@/types';

export default function AlertsPage() {
  const { stationState, acknowledgeAlert, currentStationId, allStationsState } = useStation();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | RiskSeverity>('ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  const alerts = stationState.activeAlerts;

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (domainFilter !== 'ALL' && a.domain !== domainFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30 uppercase">
              Incident Response & Triage
            </span>
            <span className="text-xs font-mono text-slate-400">{stationState.metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Station Alarms, Inter-Domain Dependencies & Advisories
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Explainable telemetry violations classified into Nominal, Warning, and Critical states with operator sign-offs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['ALL', 'critical', 'warning'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded uppercase text-[11px] transition-colors ${
                  severityFilter === sev ? 'bg-polar-700 text-polar-ice font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['ALL', 'environment', 'energy', 'infrastructure', 'logistics', 'cross-domain'] as const).map(dom => (
              <button
                key={dom}
                onClick={() => setDomainFilter(dom)}
                className={`px-2 py-1 rounded uppercase text-[10px] transition-colors ${
                  domainFilter === dom ? 'bg-polar-700 text-polar-ice font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="polar-card p-12 text-center rounded-2xl font-mono text-xs text-slate-400 space-y-3">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Matching Station Alerts</h3>
            <p className="max-w-md mx-auto text-slate-400">
              There are currently no active warnings or critical events matching your filter criteria. Trigger an event from the top controller bar to test triage.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.alertId}
              className={`p-5 rounded-2xl border font-mono text-xs space-y-4 transition-all ${
                alert.severity === 'critical'
                  ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/20'
                  : 'bg-amber-950/30 border-amber-500/40'
              }`}
            >
              {/* Alert Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{alert.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        alert.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-polar-950'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Domain: <strong className="text-sky-300 uppercase">{alert.domain}</strong> • ID: {alert.alertId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Causal Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                    Root Causes & Telemetry Triggers:
                  </span>
                  <div className="space-y-1 text-slate-200">
                    {alert.cause.map((c, i) => (
                      <p key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 shrink-0">›</span> {c}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 space-y-2">
                  <span className="text-[11px] text-sky-400 uppercase font-semibold block">
                    Recommended Response Playbook:
                  </span>
                  <div className="space-y-1 text-sky-200">
                    {alert.recommendations.map((r, i) => (
                      <p key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" /> {r}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer / Acknowledgement */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                <div className="text-slate-400">
                  Affected Assets: {alert.affectedAssets.join(', ') || 'Station Wide'}
                </div>

                <div>
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.alertId)}
                      className="px-4 py-1.5 rounded-lg bg-polar-accent hover:bg-sky-400 text-polar-950 font-bold transition-all shadow-md"
                    >
                      Acknowledge Alarm
                    </button>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Acknowledged by {alert.acknowledgedBy} ({new Date(alert.acknowledgedAt || '').toLocaleTimeString()})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
