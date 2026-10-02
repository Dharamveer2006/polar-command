'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle, 
  FileSpreadsheet, 
  ShieldCheck, 
  Activity,
  Layers,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';

export default function ReportsPage() {
  const { stationState, currentStationId, allStationsState, currentUser, activeInjectedEvents } = useStation();
  const { metadata, environment, energy, infrastructure, logistics, healthScore, activeAlerts, derived } = stationState;

  const [reportType, setReportType] = useState<'daily' | 'incident' | 'energy' | 'logistics'>('daily');
  const [reportWindow, setReportWindow] = useState<'24h' | '7d' | '30d'>('24h');

  // Compute functional window metrics based on reportWindow (24h, 7d, 30d)
  const windowMultiplier = reportWindow === '24h' ? 1 : reportWindow === '7d' ? 7 : 30;
  const windowLabel = reportWindow === '24h' ? 'Last 24 Hours' : reportWindow === '7d' ? 'Past 7 Days (Weekly)' : 'Past 30 Days (Monthly)';

  const windowMetrics = {
    cumulativeFuelBurnLitres: Math.round(derived.dailyFuelBurnLitres * windowMultiplier),
    avgDemandKw: Math.round(derived.totalDemandKw * (reportWindow === '24h' ? 1.0 : reportWindow === '7d' ? 0.98 : 0.96)),
    peakDemandKw: Math.round(derived.totalDemandKw * 1.15),
    minTempRecordedC: Number((derived.effectiveTempC - (reportWindow === '30d' ? 6.5 : reportWindow === '7d' ? 3.8 : 1.5)).toFixed(1)),
    maxWindRecordedKmh: Math.round(derived.effectiveWindKmh * (reportWindow === '30d' ? 1.4 : reportWindow === '7d' ? 1.2 : 1.05)),
    generatorUptimePercent: activeInjectedEvents.generator2Failure ? (reportWindow === '24h' ? 68 : 82) : 99.4,
    incidentsLoggedCount: activeAlerts.length + (reportWindow === '30d' ? 5 : reportWindow === '7d' ? 2 : 0),
  };

  // CSV Generator
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "POLAR COMMAND PROTOTYPE REPORT - NCPOR ANTARCTIC RESEARCH STATIONS\n";
    csvContent += `Station,${metadata.name} (${metadata.stationId})\n`;
    csvContent += `Report Type,${reportType.toUpperCase()}\n`;
    csvContent += `Time Horizon Window,${reportWindow} (${windowLabel})\n`;
    csvContent += `Generated At,${new Date().toISOString()}\n`;
    csvContent += `Operator,${currentUser.name} (${currentUser.role})\n`;
    csvContent += `Station Health,${derived.overallHealthScore}%\n\n`;

    if (reportType === 'daily' || reportType === 'energy') {
      csvContent += "DOMAIN: ENERGY TELEMETRY & HISTORICAL WINDOW\n";
      csvContent += "Avg Demand (kW),Peak Demand (kW),Cumulative Fuel Burn (L),Battery SOC (%),Fuel Runway (Days)\n";
      csvContent += `${windowMetrics.avgDemandKw},${windowMetrics.peakDemandKw},${windowMetrics.cumulativeFuelBurnLitres},${derived.batterySocPercent},${derived.fuelRunwayDays}\n\n`;
    }

    if (reportType === 'daily' || reportType === 'logistics') {
      csvContent += "DOMAIN: CONSUMABLES LEDGER & PREDICTIVE RUNWAYS\n";
      csvContent += "SKU,Item Name,Quantity,Unit,Daily Burn,Days Remaining,Safety Stock,Status\n";
      logistics.inventory.forEach(item => {
        csvContent += `"${item.sku}","${item.name}",${item.quantity},${item.unit},${item.dailyConsumption},${item.daysRemaining},${item.safetyStock},"${item.inventoryStatus || 'SAFE'}"\n`;
      });
      csvContent += "\n";
    }

    if (reportType === 'incident' || activeAlerts.length > 0) {
      csvContent += "DOMAIN: ACTIVE ALERTS & CAUSAL ROOT CAUSE\n";
      csvContent += "Alert ID,Severity,Domain,Title,Created At,Acknowledged\n";
      activeAlerts.forEach(a => {
        csvContent += `"${a.alertId}","${a.severity}","${a.domain}","${a.title}","${a.createdAt}",${a.acknowledged}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `POLAR_COMMAND_REPORT_${metadata.stationId.toUpperCase()}_${reportType.toUpperCase()}_${reportWindow}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/30 uppercase font-bold">
              Reporting & Historical Telemetry
            </span>
            <ProvenanceBadge source="Derived Calculation" />
            <span className="text-xs font-mono text-slate-400">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            POLAR COMMAND PROTOTYPE REPORT
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Synthesized operational situation reports computed over 24h, 7d, and 30d telemetry timeframes for NCPOR Command.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-polar-900 hover:bg-polar-800 text-white border border-polar-border flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-polar-950 font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
          >
            <Printer className="w-4 h-4" />
            Print / PDF Report
          </button>
        </div>
      </div>

      {/* Report Configuration Bar */}
      <div className="polar-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Report Template:</span>
          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['daily', 'incident', 'energy', 'logistics'] as const).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-3 py-1 rounded uppercase text-[11px] transition-colors ${
                  reportType === type ? 'bg-cyan-400 text-polar-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'daily' ? 'Daily SITREP' : type === 'incident' ? 'Incident Report' : type === 'energy' ? 'Energy Report' : 'Logistics Report'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Historical Window:</span>
          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['24h', '7d', '30d'] as const).map(win => (
              <button
                key={win}
                onClick={() => setReportWindow(win)}
                className={`px-3 py-1 rounded uppercase text-[11px] transition-colors ${
                  reportWindow === win ? 'bg-cyan-400 text-polar-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {win}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rendered Printable Report Sheet */}
      <div className="polar-card p-8 rounded-2xl space-y-6 font-mono border-white/10 bg-polar-950 shadow-2xl">
        {/* Document Header */}
        <div className="border-b-2 border-white/20 pb-4 flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
              <span>POLAR COMMAND PROTOTYPE REPORT</span> • <span>SIH26060 DIGITAL TWIN</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR)
            </h2>
            <p className="text-xs text-slate-300">
              STATION: {metadata.name.toUpperCase()} ({metadata.region}) • WINDOW: {windowLabel.toUpperCase()}
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-0.5">
            <div>REF: POLAR-CMD/{metadata.stationId.toUpperCase()}/{reportType.toUpperCase()}/{reportWindow.toUpperCase()}</div>
            <div>Generated: {new Date().toLocaleString()}</div>
            <div>Signoff: <span className="text-white font-bold">{currentUser.name}</span> ({currentUser.role})</div>
          </div>
        </div>

        {/* Section 1: Window Aggregates Matrix */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
            <span>1. Historical Telemetry Aggregates ({reportWindow} Window)</span>
            <ProvenanceBadge source="Derived Calculation" compact />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded bg-polar-900 border border-polar-border">
              <span className="text-slate-400 text-[10px] uppercase block">Cumulative Fuel Draw</span>
              <span className="text-lg font-bold text-amber-300">{windowMetrics.cumulativeFuelBurnLitres.toLocaleString()} L</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Burn Rate: {derived.dailyFuelBurnLitres} L/day</span>
            </div>
            <div className="p-3 rounded bg-polar-900 border border-polar-border">
              <span className="text-slate-400 text-[10px] uppercase block">Average Microgrid Demand</span>
              <span className="text-lg font-bold text-white">{windowMetrics.avgDemandKw} kW</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Peak Draw: {windowMetrics.peakDemandKw} kW</span>
            </div>
            <div className="p-3 rounded bg-polar-900 border border-polar-border">
              <span className="text-slate-400 text-[10px] uppercase block">Weather Envelope Window</span>
              <span className="text-lg font-bold text-cyan-300">{windowMetrics.minTempRecordedC}°C Min</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Peak Gusts: {windowMetrics.maxWindRecordedKmh} km/h</span>
            </div>
            <div className="p-3 rounded bg-polar-900 border border-polar-border">
              <span className="text-slate-400 text-[10px] uppercase block">Fleet Uptime / Events</span>
              <span className={`text-lg font-bold ${windowMetrics.generatorUptimePercent < 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {windowMetrics.generatorUptimePercent}% Uptime
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{windowMetrics.incidentsLoggedCount} Events in Window</span>
            </div>
          </div>
        </div>

        {/* Section 2: Report Template Specific Detailed Content */}
        {reportType === 'daily' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              2. Operational Situation Narrative & Causal Stance
            </h3>
            <div className="p-4 rounded-xl bg-polar-900 border border-polar-border text-xs space-y-2 text-slate-200">
              <p>• <strong>Station Stance:</strong> {derived.activeIncident}</p>
              <p>• <strong>Root Cause Analysis:</strong> {derived.rootCause}</p>
              <p>• <strong>Forecasted Trajectory:</strong> {derived.forecastedImpact}</p>
              <p>• <strong>Recommended Mitigating Action:</strong> {derived.recommendedResponse}</p>
            </div>
          </div>
        )}

        {reportType === 'incident' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              2. Incident Investigation & Causal Chain Log
            </h3>
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-3">
              <div className="font-bold text-white text-sm">{derived.activeIncident}</div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Causal Sequence:</span>
                {derived.causalChain.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-200 text-[11px]">
                    <span className="text-rose-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-rose-500/20 text-rose-200 text-[11px]">
                <strong>Operator Protocol:</strong> {derived.recommendedResponse}
              </div>
            </div>
          </div>
        )}

        {reportType === 'energy' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              2. Microgrid Balance & Fuel Autonomy Analysis
            </h3>
            <div className="p-4 rounded-xl bg-polar-900 border border-polar-border text-xs space-y-2 text-slate-200">
              <div className="grid grid-cols-3 gap-3 text-center mb-2">
                <div className="p-2 bg-polar-950 rounded">
                  <span className="text-[10px] text-slate-400 block">Current Capacity</span>
                  <span className="font-bold text-white">{derived.generationCapacityKw} kW</span>
                </div>
                <div className="p-2 bg-polar-950 rounded">
                  <span className="text-[10px] text-slate-400 block">Thermal Heating Draw</span>
                  <span className="font-bold text-cyan-300">{derived.heatingLoadKw} kW</span>
                </div>
                <div className="p-2 bg-polar-950 rounded">
                  <span className="text-[10px] text-slate-400 block">Fuel Autonomy Runway</span>
                  <span className="font-bold text-amber-300">{derived.fuelRunwayDays} Days</span>
                </div>
              </div>
              <p>• Genset fleet fuel rate calibrated to {derived.dailyFuelBurnLitres} Litres/day under current thermal load.</p>
              <p>• Battery storage (BESS) state-of-charge: {derived.batterySocPercent}% ({derived.batteryStatus}).</p>
            </div>
          </div>
        )}

        {reportType === 'logistics' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              2. Consumables Runway & Vessel ETA Window
            </h3>
            <div className="p-4 rounded-xl bg-polar-900 border border-polar-border text-xs space-y-2 text-slate-200">
              <p>• <strong>Resupply Vessel Schedule:</strong> {activeInjectedEvents.resupplyDelay ? 'Delayed transit (+12 days). Revised ETA: Nov 3.' : 'Nominal transit. ETA: Oct 22.'}</p>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-400 border-b border-white/10">
                      <th className="py-1.5">ITEM</th>
                      <th>STOCK</th>
                      <th>DAYS LEFT</th>
                      <th>SHORTAGE DATE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logistics.inventory.map(i => (
                      <tr key={i.id}>
                        <td className="py-1.5 font-bold text-white">{i.name}</td>
                        <td>{i.quantity.toLocaleString()} {i.unit}</td>
                        <td>{i.daysRemaining}d</td>
                        <td>{i.projectedShortageDate || '2026-11-15'}</td>
                        <td>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                            i.inventoryStatus === 'CRITICAL' ? 'bg-rose-500 text-white' :
                            i.inventoryStatus === 'PROJECTED SHORTAGE' ? 'bg-orange-500/20 text-orange-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {i.inventoryStatus || 'SAFE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Active Alerts Log */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            3. Active Operational Risk & Alert Summary ({activeAlerts.length} Unresolved)
          </h3>
          {activeAlerts.length === 0 ? (
            <p className="text-xs text-emerald-400 p-3 rounded bg-emerald-950/20 border border-emerald-500/30">
              All monitored telemetry channels within nominal operating envelopes. Zero unresolved critical alarms.
            </p>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map(a => (
                <div key={a.alertId} className="p-3 rounded bg-polar-900 border border-white/10 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>[{a.severity.toUpperCase()}] {a.title}</span>
                    <span className="text-slate-400 text-[10px]">{new Date(a.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1">Causes: {a.cause.join('; ')}</p>
                  <p className="text-cyan-300 text-[11px] mt-0.5">Recommended Stance: {a.recommendations[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
          <span>POLAR COMMAND PROTOTYPE REPORT • NCPOR Antarctic Digital Twin</span>
          <span>SIH26060 Build v2.0 • Deterministic Evaluation Engine</span>
        </div>
      </div>
    </div>
  );
}
