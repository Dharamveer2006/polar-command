'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  ShieldCheck,
  Cpu,
  Flame,
  Droplets,
  Radio,
  Package,
  ArrowRight,
  TrendingDown,
  UserCheck
} from 'lucide-react';
import { RiskSeverity, Alert } from '@/types';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';

function AlertsContent() {
  const searchParams = useSearchParams();
  const severityParam = searchParams.get('severity');

  const { 
    stationState, 
    effectiveStationState,
    acknowledgeAlert, 
    resolveAlert,
    currentStationId, 
    allStationsState, 
    currentUser 
  } = useStation();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | RiskSeverity>(() => {
    if (severityParam === 'warning' || severityParam === 'critical') {
      return severityParam;
    }
    return 'ALL';
  });
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'acknowledged' | 'resolved'>('ALL');

  useEffect(() => {
    if (severityParam === 'warning' || severityParam === 'critical') {
      setSeverityFilter(severityParam);
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          const el = document.getElementById('warning-alerts');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    } else if (severityParam === 'ALL') {
      setSeverityFilter('ALL');
    }
  }, [severityParam]);

  const activeAlerts = stationState.activeAlerts;
  const resolvedAlerts = stationState.resolvedAlerts || [];
  const allAlertsCombined: Alert[] = [...activeAlerts, ...resolvedAlerts];

  const filteredAlerts = allAlertsCombined.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (domainFilter !== 'ALL' && a.domain !== domainFilter) return false;
    const currentStatus = a.status || (a.acknowledged ? 'acknowledged' : 'active');
    if (statusFilter !== 'ALL' && currentStatus !== statusFilter) return false;
    return true;
  });

  const totalActiveCount = activeAlerts.length;
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;
  const unackedCount = activeAlerts.filter(a => !a.acknowledged && a.status !== 'acknowledged').length;
  const ackedCount = activeAlerts.filter(a => a.acknowledged || a.status === 'acknowledged').length;
  const resolvedCount = resolvedAlerts.length;

  const affectedSystems = [
    { name: 'Genset Microgrid #2', domain: 'energy', status: activeAlerts.some(a => a.affectedAssets.some(x => x.includes('gen'))) ? 'TRIPPED / DEFICIT' : 'NOMINAL', icon: <Cpu className="w-3.5 h-3.5 text-amber-500" /> },
    { name: 'HVAC Thermal Loop', domain: 'infrastructure', status: activeAlerts.some(a => a.affectedAssets.some(x => x.includes('hvac'))) ? 'ELEVATED DRAW' : 'STABLE', icon: <Flame className="w-3.5 h-3.5 text-sky-500" /> },
    { name: 'Lake Intake Pump #1', domain: 'infrastructure', status: activeAlerts.some(a => a.affectedAssets.some(x => x.includes('pump'))) ? 'PROTOTYPE ADVISORY' : 'NOMINAL', icon: <Droplets className="w-3.5 h-3.5 text-cyan-500" /> },
    { name: 'Satcom Tracking Dish', domain: 'infrastructure', status: activeAlerts.some(a => a.affectedAssets.some(x => x.includes('sat'))) ? 'WIND-PARKED' : 'ONLINE', icon: <Radio className="w-3.5 h-3.5 text-emerald-500" /> },
    { name: 'Fuel Resupply Vessel', domain: 'logistics', status: activeAlerts.some(a => a.affectedAssets.some(x => x.includes('fuel'))) ? 'DELAYED (+12d)' : 'ON SCHEDULE', icon: <Package className="w-3.5 h-3.5 text-purple-500" /> },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full font-mono text-xs text-[#0F2740]">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-100/90 text-rose-800 border border-rose-300 uppercase font-bold">
              Incident Response & Triage
            </span>
            <ProvenanceBadge source="Derived Calculation" />
            <span className="text-xs font-mono text-[#36546D]">{stationState.metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-[#0F2740] tracking-tight mt-1">
            Station Alarms, Inter-Domain Dependencies & Advisories
          </h1>
          <p className="text-xs text-[#36546D] font-mono">
            Active workflow: <span className="text-rose-700 font-bold">ACTIVE</span> → <span className="text-amber-700 font-bold">ACKNOWLEDGED</span> → <span className="text-emerald-700 font-bold">RESOLVED</span> with role-based sign-offs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Status Filter */}
          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['ALL', 'active', 'acknowledged', 'resolved'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded uppercase text-[10px] transition-colors ${
                  statusFilter === st ? 'bg-cyan-500 text-polar-950 font-bold' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['ALL', 'critical', 'warning'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-1 rounded uppercase text-[10px] transition-colors ${
                  severityFilter === sev ? 'bg-cyan-500 text-polar-950 font-bold' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Domain Filter */}
          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['ALL', 'environment', 'energy', 'infrastructure', 'logistics', 'cross-domain'] as const).map(dom => (
              <button
                key={dom}
                onClick={() => setDomainFilter(dom)}
                className={`px-2 py-1 rounded uppercase text-[10px] transition-colors ${
                  domainFilter === dom ? 'bg-cyan-500 text-polar-950 font-bold' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                {dom === 'cross-domain' ? 'CROSS' : dom.slice(0, 5)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Alert Feed, Right = Incident Summary & Affected Systems Panels (Requirement 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Alert Feed */}
        <div className="lg:col-span-2 space-y-4" id="warning-alerts">
          {severityFilter === 'warning' && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 font-mono shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
                <span className="font-bold uppercase tracking-wider text-amber-900">Station Warning Section:</span>
                <span className="text-[#36546D]">Displaying {filteredAlerts.length} Active Operational Warning Advisories</span>
              </div>
              <button
                onClick={() => setSeverityFilter('ALL')}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold text-[10px] hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
              >
                Clear Filter (View All)
              </button>
            </div>
          )}
          {filteredAlerts.length === 0 ? (
            <div className="polar-card p-12 text-center rounded-2xl font-mono text-xs text-[#36546D] space-y-3">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-[#0F2740]">No Matching Station Alerts</h3>
              <p className="max-w-md mx-auto text-[#36546D]">
                There are currently no events matching the active filter criteria. All primary subsystems operating inside configured polar baselines.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const currentStatus = alert.status || (alert.acknowledged ? 'acknowledged' : 'active');
              const isResolved = currentStatus === 'resolved';
              const isAcked = currentStatus === 'acknowledged';

              return (
                <div
                  key={alert.alertId}
                  className={`p-5 rounded-2xl border-2 font-mono text-xs space-y-4 transition-all shadow-md ${
                    isResolved
                      ? 'bg-emerald-50/90 border-emerald-300 opacity-90'
                      : isCrit
                      ? 'bg-rose-50/95 border-rose-300'
                      : 'bg-amber-50/95 border-amber-300'
                  }`}
                >
                  {/* Alert Header */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                    isResolved ? 'border-emerald-200/80' : isCrit ? 'border-rose-200/80' : 'border-amber-200/80'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg border ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isCrit 
                          ? 'bg-rose-100 text-rose-700 border-rose-300' 
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {isResolved ? <ShieldCheck className="w-5 h-5 text-emerald-700" /> : <AlertTriangle className="w-5 h-5" />}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-[#0F2740]">{alert.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            isResolved
                              ? 'bg-emerald-600 text-white'
                              : isCrit 
                              ? 'bg-rose-600 text-white' 
                              : 'bg-amber-500 text-slate-950'
                          }`}>
                            {alert.severity}
                          </span>
                          {/* Workflow State Pill */}
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isAcked
                              ? 'bg-amber-100 text-amber-900 border-amber-400'
                              : 'bg-rose-100 text-rose-900 border-rose-400 animate-pulse'
                          }`}>
                            ● {currentStatus.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#36546D]">
                          Domain: <strong className={`uppercase ${isResolved ? 'text-emerald-900' : isCrit ? 'text-rose-900' : 'text-amber-900'}`}>{alert.domain}</strong> • ID: <span className="text-[#08243A] font-semibold">{alert.alertId}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#36546D]" />
                      <span className="text-[#36546D] font-medium">{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Causal Analysis & Response Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-3.5 rounded-xl border space-y-2 bg-white/95 ${
                      isResolved ? 'border-emerald-200/80' : isCrit ? 'border-rose-200/80' : 'border-amber-200/80'
                    }`}>
                      <span className={`text-[11px] uppercase font-bold block ${
                        isResolved ? 'text-emerald-950' : isCrit ? 'text-rose-950' : 'text-amber-950'
                      }`}>
                        Root Causes & Telemetry Triggers:
                      </span>
                      <div className="space-y-1.5 text-[#08243A] text-[11px] font-medium">
                        {alert.cause.map((c, i) => (
                          <p key={i} className="flex items-start gap-1.5 leading-relaxed">
                            <span className={`shrink-0 font-bold ${isResolved ? 'text-emerald-600' : isCrit ? 'text-rose-600' : 'text-amber-600'}`}>›</span> {c}
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

                  {/* Footer / Workflow Action Bar (Requirement 4: ACTIVE -> ACKNOWLEDGED -> RESOLVED) */}
                  <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-[11px] ${
                    isResolved ? 'border-emerald-200/80' : isCrit ? 'border-rose-200/80' : 'border-amber-200/80'
                  }`}>
                    <div className="text-[#36546D] font-medium">
                      Affected Assets: <strong className="text-[#08243A]">{alert.affectedAssets.join(', ') || 'Station Wide'}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Step 1: Active -> Acknowledge */}
                      {!alert.acknowledged && !isAcked && !isResolved && (
                        <button
                          onClick={() => acknowledgeAlert(alert.alertId)}
                          className={`px-4 py-1.5 rounded-lg font-bold transition-all shadow-sm ${
                            isCrit
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                          title="Acknowledge alarm as duty operator"
                        >
                          Acknowledge Alarm
                        </button>
                      )}

                      {/* Step 2: Acknowledged Indicator */}
                      {(alert.acknowledged || isAcked) && !isResolved && (
                        <span className="text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-md flex items-center gap-1.5 font-bold shadow-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                          Acked by {alert.acknowledgedBy || currentUser.name} ({alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleTimeString() : 'Recent'})
                        </span>
                      )}

                      {/* Step 3: Resolve Alert Action */}
                      {!isResolved && (
                        <button
                          onClick={() => resolveAlert(alert.alertId)}
                          className="px-4 py-1.5 rounded-lg font-bold transition-all shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
                          title="Resolve and close incident in station log"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Resolve Alert
                        </button>
                      )}

                      {/* Resolved Status */}
                      {isResolved && (
                        <span className="text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-md flex items-center gap-1.5 font-bold shadow-sm">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          Incident Closed & Resolved by {alert.acknowledgedBy || currentUser.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (1 col): System Integrity & Triage Analytics (Requirement 13) */}
        <div className="space-y-5">
          {/* Panel 1: Incident Summary */}
          <div className="polar-card p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-300/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-[#0F2740] uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-cyan-600" />
                Incident Summary
              </span>
              <span className="text-[10px] text-[#36546D]">{totalActiveCount} Active Total</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-[10px] uppercase block text-rose-800 font-semibold">Critical Alarms</span>
                <span className="text-xl font-bold text-rose-900">{criticalCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-[10px] uppercase block text-amber-800 font-semibold">Advisories</span>
                <span className="text-xl font-bold text-amber-900">{warningCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200">
                <span className="text-[10px] uppercase block text-sky-800 font-semibold">Unacknowledged</span>
                <span className="text-xl font-bold text-sky-900">{unackedCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] uppercase block text-emerald-800 font-semibold">Resolved</span>
                <span className="text-xl font-bold text-emerald-900">{resolvedCount}</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Resolution State Workflow Tracker */}
          <div className="polar-card p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-300/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-[#0F2740] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Resolution State Pipeline
              </span>
              <span className="text-[10px] text-[#36546D]">RBAC Enforced</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  <span className="font-bold text-[#0F2740]">1. ACTIVE</span>
                </div>
                <span className="font-bold text-rose-700">{unackedCount} awaiting triage</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold text-[#0F2740]">2. ACKNOWLEDGED</span>
                </div>
                <span className="font-bold text-amber-700">{ackedCount} in mitigation</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="font-bold text-[#0F2740]">3. RESOLVED</span>
                </div>
                <span className="font-bold text-emerald-700">{resolvedCount} closed</span>
              </div>
            </div>
          </div>

          {/* Panel 3: Affected Systems Matrix */}
          <div className="polar-card p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-300/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-[#0F2740] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" />
                Affected Systems Matrix
              </span>
              <span className="text-[10px] text-[#36546D]">Live Status</span>
            </div>

            <div className="space-y-1.5">
              {affectedSystems.map((sys, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-200/80 text-[11px]">
                  <div className="flex items-center gap-2">
                    {sys.icon}
                    <span className="font-semibold text-[#0F2740]">{sys.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    sys.status === 'NOMINAL' || sys.status === 'ONLINE' || sys.status === 'STABLE' || sys.status === 'ON SCHEDULE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sys.status.includes('PROTOTYPE')
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {sys.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 4: Operational Impact */}
          <div className="polar-card p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-300/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-[#0F2740] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                Operational Impact
              </span>
              <span className="text-[10px] text-[#36546D]">Physical Twin</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center text-[#08243A]">
                <span>Health Score Delta:</span>
                <span className="font-bold text-rose-700">
                  {stationState.healthScore.overall < 85 ? `-${85 - stationState.healthScore.overall} pts (${stationState.healthScore.overall}%)` : 'Nominal (100%)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#08243A]">
                <span>Microgrid Balance:</span>
                <span className={`font-bold ${stationState.derived.powerBalanceKw < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {stationState.derived.powerBalanceKw >= 0 ? `+${stationState.derived.powerBalanceKw} kW` : `${stationState.derived.powerBalanceKw} kW Deficit`}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#08243A]">
                <span>Fuel Autonomy Runway:</span>
                <span className="font-bold text-amber-700">{effectiveStationState?.fuel?.runwayDays ?? stationState.derived.fuelRunwayDays} Days</span>
              </div>
              <div className="flex justify-between items-center text-[#08243A]">
                <span>Outdoor Traverses:</span>
                <span className={`font-bold ${stationState.environment.windKmh >= 55 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {stationState.environment.windKmh >= 55 ? 'STRICT LOCKDOWN' : 'AUTHORIZED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-6 flex items-center justify-center font-mono text-xs text-[#36546D]">
          Loading Incident Triage & Advisories...
        </div>
      }
    >
      <AlertsContent />
    </Suspense>
  );
}
