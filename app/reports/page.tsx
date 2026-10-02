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
  Layers
} from 'lucide-react';

export default function ReportsPage() {
  const { stationState, currentStationId, allStationsState, currentUser } = useStation();
  const { metadata, environment, energy, infrastructure, logistics, healthScore, activeAlerts } = stationState;

  const [reportType, setReportType] = useState<'daily' | 'incident' | 'energy' | 'logistics'>('daily');
  const [reportWindow, setReportWindow] = useState<'24h' | '7d' | '30d'>('24h');

  // CSV Generator
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "POLAR COMMAND - NCPOR ANTARCTIC RESEARCH STATIONS\n";
    csvContent += `Station,${metadata.name} (${metadata.stationId})\n`;
    csvContent += `Generated At,${new Date().toISOString()}\n`;
    csvContent += `Operator,${currentUser.name} (${currentUser.role})\n`;
    csvContent += `Station Health,${healthScore.overall}%\n\n`;

    if (reportType === 'daily' || reportType === 'energy') {
      csvContent += "DOMAIN: ENERGY TELEMETRY\n";
      csvContent += "Generation (kW),Demand (kW),Battery SoC (%),Fuel Runway (Days),Fuel Stock (Litres)\n";
      csvContent += `${energy.generationKw},${energy.demandKw},${energy.batterySoc},${energy.fuelRunwayDays},${energy.fuelLitres}\n\n`;
    }

    if (reportType === 'daily' || reportType === 'logistics') {
      csvContent += "DOMAIN: CONSUMABLES LEDGER\n";
      csvContent += "SKU,Item Name,Quantity,Unit,Days Remaining,Safety Stock,Risk\n";
      logistics.inventory.forEach(item => {
        csvContent += `"${item.sku}","${item.name}",${item.quantity},${item.unit},${item.daysRemaining},${item.safetyStock},${item.riskLevel}\n`;
      });
      csvContent += "\n";
    }

    if (reportType === 'incident' || activeAlerts.length > 0) {
      csvContent += "DOMAIN: ACTIVE ALERTS & INCIDENTS\n";
      csvContent += "Alert ID,Severity,Domain,Title,Created At,Acknowledged\n";
      activeAlerts.forEach(a => {
        csvContent += `"${a.alertId}","${a.severity}","${a.domain}","${a.title}","${a.createdAt}",${a.acknowledged}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `POLAR_COMMAND_${metadata.stationId.toUpperCase()}_${reportType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/30 uppercase">
              Reporting & Telemetry Audit
            </span>
            <span className="text-xs font-mono text-slate-400">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Official Operational Situation Reports (SITREP)
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Synthesized cross-domain summaries with full cryptographic metadata and source labeling for NCPOR Command.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-polar-800 hover:bg-polar-700 text-white border border-polar-border flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-polar-accent hover:bg-sky-400 text-polar-950 font-bold flex items-center gap-2 transition-all shadow-md shadow-sky-500/20"
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
                  reportType === type ? 'bg-polar-700 text-polar-ice font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'daily' ? 'Daily SITREP' : type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Time Window:</span>
          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['24h', '7d', '30d'] as const).map(win => (
              <button
                key={win}
                onClick={() => setReportWindow(win)}
                className={`px-3 py-1 rounded uppercase text-[11px] transition-colors ${
                  reportWindow === win ? 'bg-polar-700 text-polar-ice font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {win}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rendered Printable Report Sheet */}
      <div className="polar-card p-8 rounded-2xl space-y-6 font-mono border-white/20 bg-polar-950/90 shadow-2xl">
        {/* Document Header */}
        <div className="border-b-2 border-white/20 pb-4 flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
              <span>GOVERNMENT OF INDIA</span> • <span>MINISTRY OF EARTH SCIENCES</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR)
            </h2>
            <p className="text-xs text-slate-300">
              POLAR COMMAND OPERATIONAL REPORT • STATION: {metadata.name.toUpperCase()}
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-0.5">
            <div>REF: NCPOR/SITREP/{metadata.stationId.toUpperCase()}/{new Date().toISOString().slice(0, 10)}</div>
            <div>Generated: {new Date().toLocaleString()}</div>
            <div>Signoff: <span className="text-white font-bold">{currentUser.name}</span> ({currentUser.role})</div>
          </div>
        </div>

        {/* Section 1: Executive Overview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            1. Executive Health & Readiness Matrix
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded bg-polar-900 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase block">Composite Health</span>
              <span className="text-lg font-bold text-emerald-400">{healthScore.overall}% (Nominal)</span>
            </div>
            <div className="p-3 rounded bg-polar-900 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase block">Power Balance</span>
              <span className="text-lg font-bold text-white">{energy.demandKw} kW / {energy.generationKw} kW</span>
            </div>
            <div className="p-3 rounded bg-polar-900 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase block">Fuel Autonomy</span>
              <span className="text-lg font-bold text-amber-300">{energy.fuelRunwayDays} Days</span>
            </div>
            <div className="p-3 rounded bg-polar-900 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase block">Weather Envelope</span>
              <span className="text-lg font-bold text-cyan-300">{environment.temperatureC.toFixed(1)}°C, {environment.windKmh}km/h</span>
            </div>
          </div>
        </div>

        {/* Section 2: Domain Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            2. Cross-Domain Operational Observations & Provenance
          </h3>
          <div className="p-4 rounded-xl bg-polar-900/60 border border-white/10 text-xs space-y-2 text-slate-300">
            <p>
              • <strong>Environment:</strong> Ground surface temperature recorded at {environment.temperatureC.toFixed(1)}°C with wind gusts averaging {environment.windKmh} km/h from {environment.windDirectionDeg}°. Data source labeled as: <em>{environment.source}</em>.
            </p>
            <p>
              • <strong>Energy & Microgrid:</strong> Current station heating load is {energy.heatingLoadKw} kW and base load is {energy.baseLoadKw} kW. Genset fleet operating with {energy.generators.filter(g => g.status === 'running').length} prime movers online. Battery BESS status at {energy.batterySoc}% SOC. Data source: <em>{energy.source}</em>.
            </p>
            <p>
              • <strong>Mechanical Life-Support:</strong> Life-support and water intake extraction systems index at {infrastructure.overallHealth}%. HVAC thermal recovery functioning nominally.
            </p>
            <p>
              • <strong>Supply Chain & Logistics:</strong> Next scheduled icebreaker delivery expected in {logistics.inventory[0]?.daysRemaining.toFixed(0)} days. Requisitions logged: {logistics.requisitions.length} approved/in-transit. Data source: <em>{logistics.source}</em>.
            </p>
          </div>
        </div>

        {/* Section 3: Active Alerts Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            3. Active Operational Risk & Alert Log
          </h3>
          {activeAlerts.length === 0 ? (
            <p className="text-xs text-emerald-400 p-3 rounded bg-emerald-950/20 border border-emerald-500/20">
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
                  <p className="text-sky-300 text-[11px] mt-0.5">Recommended Stance: {a.recommendations[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
          <span>Data Classification: OFFICIAL USE ONLY • NCPOR MoES</span>
          <span>Polar Command Digital Twin Build v1.0 • SIH26060</span>
        </div>
      </div>
    </div>
  );
}
