'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GlobalStationStatusRail from '@/components/layout/GlobalStationStatusRail';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  CheckCircle2, 
  Filter, 
  Activity, 
  Clock, 
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Play
} from 'lucide-react';
import { RiskSeverity } from '@/types';

export default function AlertsPage() {
  const router = useRouter();
  const { stationState, acknowledgeAlert, currentStationId, allStationsState } = useStation();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | RiskSeverity>('ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  const alerts = stationState.activeAlerts;
  const assets = stationState.infrastructure.assets;

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (domainFilter !== 'ALL' && a.domain !== domainFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Global Shared Station Status Rail */}
      <GlobalStationStatusRail />

      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30 uppercase font-bold">
              Incident Response & Triage
            </span>
            <span className="text-xs font-mono text-slate-400">{stationState.metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Station Alarms, Inter-Domain Dependencies & Advisories
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Explainable telemetry violations classified into Nominal, Warning, and Critical states with operational impact cascades.
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
          filteredAlerts.map((alert) => {
            // Find corresponding asset for navigation & dependency impact
            const matchedAsset = assets.find(a => 
              alert.affectedAssets.some(aff => 
                a.name.toLowerCase().includes(aff.toLowerCase()) || 
                aff.toLowerCase().includes(a.name.toLowerCase()) ||
                a.assetId.toLowerCase().includes(aff.toLowerCase())
              )
            ) || assets[0];

            const assetIdToOpen = matchedAsset ? matchedAsset.assetId : 'gen-02';
            const subsystemName = matchedAsset ? matchedAsset.type.replace('_', ' ').toUpperCase() : alert.domain.toUpperCase();
            const impactDescription = matchedAsset?.operationalImpact || 
              (alert.domain === 'energy' ? 'Power generation shortfall; battery discharge covers critical life support.' :
               alert.domain === 'logistics' ? 'Winter reserve buffer depleted; accelerated fuel conservation required.' :
               'Thermal equilibrium or subsystem reliability degraded.');

            return (
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

                {/* Operational Impact Cascade (Section 5 Requirement) */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Operational Impact Cascade:
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-polar-900 border border-white/20 text-white font-bold">
                      {matchedAsset?.name || 'Primary Plant Asset'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="px-2 py-1 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300 font-semibold">
                      {subsystemName} Subsystem
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="px-2 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-200 font-semibold flex-1 min-w-[200px]">
                      {impactDescription}
                    </span>
                  </div>
                </div>

                {/* Causal Analysis & Response */}
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

                {/* Footer: Affected Assets & Navigation Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5 text-[11px]">
                  <div className="text-slate-400">
                    Affected Assets: <strong className="text-slate-200">{alert.affectedAssets.join(', ') || 'Station Wide'}</strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* OPEN ASSET button (Requirement 5) */}
                    <Link
                      href={`/infrastructure?assetId=${assetIdToOpen}`}
                      className="px-3 py-1.5 rounded-lg bg-polar-900 hover:bg-polar-800 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      OPEN ASSET
                    </Link>

                    {/* SIMULATE IMPACT button (Requirement 5) */}
                    <Link
                      href="/simulator"
                      className="px-3 py-1.5 rounded-lg bg-polar-900 hover:bg-polar-800 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      SIMULATE IMPACT
                    </Link>

                    {/* Acknowledge Button */}
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.alertId)}
                        className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-polar-950 font-bold transition-all shadow-md shadow-cyan-500/20"
                      >
                        Acknowledge Alarm
                      </button>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold px-2 py-1 bg-emerald-950/40 rounded border border-emerald-500/30">
                        <CheckCircle className="w-4 h-4" />
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
