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
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-100/90 text-rose-800 border border-rose-300 uppercase font-bold">
              Incident Response & Triage
            </span>
            <span className="text-xs font-mono text-[#36546D]">{stationState.metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-[#0F2740] tracking-tight mt-1">
            Station Alarms, Inter-Domain Dependencies & Advisories
          </h1>
          <p className="text-xs text-[#36546D] font-mono">
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
                  severityFilter === sev ? 'bg-cyan-500 text-polar-950 font-bold' : 'text-slate-300 hover:text-white font-medium'
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
                  domainFilter === dom ? 'bg-cyan-500 text-polar-950 font-bold' : 'text-slate-300 hover:text-white font-medium'
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
          <div className="polar-card p-12 text-center rounded-2xl font-mono text-xs text-[#36546D] space-y-3">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-[#0F2740]">No Matching Station Alerts</h3>
            <p className="max-w-md mx-auto text-[#36546D]">
              There are currently no active warnings or critical events matching your filter criteria. Trigger an event from the top controller bar to test triage.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'critical';

            return (
              <div
                key={alert.alertId}
                className={`p-5 rounded-2xl border-2 font-mono text-xs space-y-4 transition-all shadow-md ${
                  isCrit
                    ? 'bg-rose-50/95 border-rose-300'
                    : 'bg-amber-50/95 border-amber-300'
                }`}
              >
                {/* Alert Header */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                  isCrit ? 'border-rose-200/80' : 'border-amber-200/80'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg border ${
                      isCrit ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#0F2740]">{alert.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          isCrit ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#36546D]">
                        Domain: <strong className={`uppercase ${isCrit ? 'text-rose-900' : 'text-amber-900'}`}>{alert.domain}</strong> • ID: <span className="text-[#08243A] font-semibold">{alert.alertId}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#36546D]" />
                    <span className="text-[#36546D] font-medium">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Causal Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3.5 rounded-xl border space-y-2 bg-white/95 ${
                    isCrit ? 'border-rose-200/80' : 'border-amber-200/80'
                  }`}>
                    <span className={`text-[11px] uppercase font-bold block ${
                      isCrit ? 'text-rose-950' : 'text-amber-950'
                    }`}>
                      Root Causes & Telemetry Triggers:
                    </span>
                    <div className="space-y-1.5 text-[#08243A] text-[11px] font-medium">
                      {alert.cause.map((c, i) => (
                        <p key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className={`shrink-0 font-bold ${isCrit ? 'text-rose-600' : 'text-amber-600'}`}>›</span> {c}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-300 space-y-2">
                    <span className="text-[11px] text-sky-950 uppercase font-bold block">
                      Recommended Response Playbook:
                    </span>
                    <div className="space-y-1.5 text-[#08243A] text-[11px] font-medium">
                      {alert.recommendations.map((r, i) => (
                        <p key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5" /> {r}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer / Acknowledgement */}
                <div className={`flex items-center justify-between pt-3 border-t text-[11px] ${
                  isCrit ? 'border-rose-200/80' : 'border-amber-200/80'
                }`}>
                  <div className="text-[#36546D] font-medium">
                    Affected Assets: <strong className="text-[#08243A]">{alert.affectedAssets.join(', ') || 'Station Wide'}</strong>
                  </div>

                  <div>
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.alertId)}
                        className={`px-4 py-1.5 rounded-lg font-bold transition-all shadow-sm ${
                          isCrit
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        Acknowledge Alarm
                      </button>
                    ) : (
                      <span className="text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-md flex items-center gap-1.5 font-bold shadow-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        Acknowledged by {alert.acknowledgedBy} ({new Date(alert.acknowledgedAt || '').toLocaleTimeString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
