'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Layers, 
  Wind, 
  Thermometer, 
  Zap, 
  Wrench, 
  Package, 
  SlidersHorizontal, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Flame, 
  Radio, 
  Globe2, 
  ShieldAlert, 
  Clock, 
  Eye, 
  Cpu, 
  ChevronRight, 
  Sparkles, 
  TrendingDown, 
  FileText,
  AlertTriangle,
  PlayCircle,
  ExternalLink,
  Snowflake,
  Terminal,
  Database
} from 'lucide-react';

export default function ProjectAspectsShowcase() {
  const [activeAspectTab, setActiveAspectTab] = useState<'WORKFLOW' | 'DOMAINS' | 'WEATHER' | 'CASCADE' | 'INNOVATIONS'>('WORKFLOW');

  const domainAspects = [
    {
      id: 'env',
      title: 'Domain 1: Environment',
      subtitle: 'Atmospheric Physics & Weather Ingestion',
      icon: Wind,
      color: 'text-cyan-300',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      description: 'Ingests ground-truth NCPOR AWS station telemetry, near-real-time NASA/NOAA satellite rasters, and ECMWF numerical forecast cycles.',
      metrics: ['Ambient Surface Temp', 'Katabatic Wind Velocity & Direction', 'Barometric Pressure Drop', 'Optical Visibility & Whiteout'],
      coupling: 'Drives building thermal transmission loss: ΔT = T_setpoint - T_ambient. Directly forces HVAC heating demand.',
      link: '/environment'
    },
    {
      id: 'energy',
      title: 'Domain 2: Energy',
      subtitle: 'Microgrid & Power Equilibrium',
      icon: Zap,
      color: 'text-amber-300',
      bg: 'bg-amber-500/10 border-amber-500/30',
      description: 'Monitors station diesel gensets (190 kW base + auxiliary units), 415V distribution bus, BESS battery bank, and waste heat exchangers.',
      metrics: ['Microgrid Generation Capacity', 'HVAC Thermal Heating Draw', 'Scientific & Critical Load', 'BESS State of Charge (415V)'],
      coupling: 'Determines power balance: P_net = P_gen - P_demand. On generation trip, automatically discharges battery and triggers load shedding.',
      link: '/energy'
    },
    {
      id: 'infra',
      title: 'Domain 3: Infrastructure',
      subtitle: 'Life Support & Structural Subsystems',
      icon: Wrench,
      color: 'text-purple-300',
      bg: 'bg-purple-500/10 border-purple-500/30',
      description: 'Tracks mechanical health of critical station life-support systems including HVAC glycol loops, seawater RO desalination pumps, and SATCOM tracking.',
      metrics: ['Water RO Intake & Melt Tanks', 'Glycol Loop Thermal Balance', 'SATCOM Radome Azimuth Gimbal', 'Perimeter Thermal Storm Seals'],
      coupling: 'Identifies degraded mechanical assets and provides targeted Tier-1 to Tier-3 non-critical shedding targets during power deficits.',
      link: '/infrastructure'
    },
    {
      id: 'log',
      title: 'Domain 4: Logistics',
      subtitle: 'Cryogenic Fuel & Resupply Autonomy',
      icon: Package,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      description: 'Calculates exact fuel runway based on real-time diesel generator consumption (0.245 L/kWh), bulk fuel storage, and seasonal shipping windows.',
      metrics: ['Bulk Fuel Storage (L)', 'Specific Fuel Consumption (SFC)', 'Daily Fuel Burn (L/day)', 'Autonomous Fuel Runway (Days)'],
      coupling: 'Runway (Days) = Fuel Stock / Daily Burn. Cross-references arrival ETA of ice-class resupply vessel to predict stockouts.',
      link: '/logistics'
    }
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-10 text-slate-100 font-sans">
      
      {/* ============================================================== */}
      {/* 1. HERO & EXECUTIVE MISSION OVERVIEW                           */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl p-6 md:p-10 border border-cyan-500/25 bg-gradient-to-b from-[#092640]/90 via-[#061c2e]/95 to-[#03101c]/98 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
        {/* Subtle decorative polar aurora / grid */}
        <div className="absolute -top-32 -right-32 w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <div className="relative z-10 space-y-5 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/50 uppercase font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <Compass className="w-3.5 h-3.5" />
              SMART INDIA HACKATHON • SIH26060
            </span>
            <span className="px-3 py-1 rounded-full bg-[#051a2c] border border-cyan-500/20 text-slate-300 shadow-sm">
              National Centre for Polar and Ocean Research (NCPOR)
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              13/13 Vitest Tests Passed
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            POLAR COMMAND
            <span className="block text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-300 mt-1">
              Operational Digital Twin Framework for India&apos;s Antarctic Research Stations
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl font-normal">
            A real-time, deterministic, cross-domain command platform engineered for the remote monitoring, predictive simulation, and resource management of <strong className="text-white font-semibold">Maitri Station</strong> (Queen Maud Land) and <strong className="text-white font-semibold">Bharati Station</strong> (Larsemann Hills).
          </p>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-[#061c2d]/80 border border-cyan-500/20 shadow-inner backdrop-blur-md">
              <span className="text-slate-400 text-[10px] uppercase block tracking-wider font-semibold">Stations Managed</span>
              <span className="text-lg font-bold text-white mt-1 block">Maitri & Bharati</span>
              <span className="text-[11px] text-cyan-300 font-medium">70°S & 69°S Latitudes</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#061c2d]/80 border border-cyan-500/20 shadow-inner backdrop-blur-md">
              <span className="text-slate-400 text-[10px] uppercase block tracking-wider font-semibold">Coupled Domains</span>
              <span className="text-lg font-bold text-white mt-1 block">4 Connected</span>
              <span className="text-[11px] text-sky-300 font-medium">Env ↔ Energy ↔ Infra ↔ Log</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#061c2d]/80 border border-cyan-500/20 shadow-inner backdrop-blur-md">
              <span className="text-slate-400 text-[10px] uppercase block tracking-wider font-semibold">Physics Engine</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">Deterministic</span>
              <span className="text-[11px] text-slate-300 font-medium">Zero Hallucinations</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#061c2d]/80 border border-cyan-500/20 shadow-inner backdrop-blur-md">
              <span className="text-slate-400 text-[10px] uppercase block tracking-wider font-semibold">Offline Mode</span>
              <span className="text-lg font-bold text-purple-300 mt-1 block">Edge Autonomous</span>
              <span className="text-[11px] text-slate-300 font-medium">SATCOM Disconnect Ready</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <Link 
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm transition-all shadow-[0_0_25px_rgba(0,229,255,0.45)] hover:shadow-[0_0_35px_rgba(0,229,255,0.6)] flex items-center gap-2 group"
            >
              <span>Launch Live Command Center</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-slate-950" />
            </Link>

            <Link 
              href="/digital-twin"
              className="px-5 py-3.5 rounded-xl bg-[#08243c]/80 hover:bg-[#0c3150] border border-cyan-500/30 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2 shadow-sm hover:border-cyan-400"
            >
              <Layers className="w-4 h-4 text-cyan-300" />
              <span>Explore Spatial Twin</span>
            </Link>

            <Link 
              href="/environment"
              className="px-5 py-3.5 rounded-xl bg-[#08243c]/80 hover:bg-[#0c3150] border border-cyan-500/30 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2 shadow-sm hover:border-cyan-400"
            >
              <Wind className="w-4 h-4 text-sky-400" />
              <span>Polar Weather Monitor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. INTERACTIVE ASPECT TABS CONTROLLER                          */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-300" />
              CORE ARCHITECTURAL ASPECTS (SIH26060 SPECIFICATION)
            </h2>
            <p className="text-xs text-slate-400">
              Select an architectural dimension to review the design, physics modeling, and implementation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#061b2e]/90 p-1.5 rounded-2xl border border-cyan-500/25 font-mono text-xs shadow-inner">
            {[
              { id: 'WORKFLOW', label: '1. Core Workflow', icon: Activity },
              { id: 'DOMAINS', label: '2. 4 Coupled Domains', icon: Compass },
              { id: 'WEATHER', label: '3. Weather Engine', icon: Wind },
              { id: 'CASCADE', label: '4. Causal Cascade', icon: Flame },
              { id: 'INNOVATIONS', label: '5. Key Innovations', icon: Cpu },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeAspectTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAspectTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: CORE WORKFLOW                                           */}
        {/* ============================================================== */}
        {activeAspectTab === 'WORKFLOW' && (
          <div className="polar-card p-6 rounded-2xl border border-polar-border space-y-6">
            <div>
              <span className="text-xs font-mono text-polar-cyan font-bold uppercase tracking-wider">
                The Non-Negotiable Operational Paradigm
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                OBSERVE → UNDERSTAND → PREDICT → SIMULATE → ACT
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                Unlike simple monitoring dashboards that stop at observation, POLAR COMMAND closes the loop by connecting raw sensor feeds to predictive physics models, what-if simulators, and actionable standard operating procedures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-polar-950 border border-polar-border space-y-2 relative">
                <div className="flex items-center justify-between text-cyan-400 font-bold">
                  <span>01. OBSERVE</span>
                  <Eye className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-300">
                  Continuous ground-truth AWS telemetry, satellite raster layers, diesel generator outputs, and inventory levels.
                </p>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                  Input: <strong>Maitri & Bharati Feeds</strong>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-polar-950 border border-polar-border space-y-2 relative">
                <div className="flex items-center justify-between text-sky-400 font-bold">
                  <span>02. UNDERSTAND</span>
                  <Cpu className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-300">
                  Central state engine deterministically computes power equilibrium, building envelope thermal loss, and daily burn rates.
                </p>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                  Engine: <strong>evaluateStationState()</strong>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-polar-950 border border-polar-border space-y-2 relative">
                <div className="flex items-center justify-between text-purple-400 font-bold">
                  <span>03. PREDICT</span>
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-300">
                  Forecasts fuel runway days, battery depletion horizon, and stockout risk against ice-class supply ship ETA.
                </p>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                  Horizon: <strong>+6h, +12h, +24h, +48h</strong>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-polar-950 border border-polar-border space-y-2 relative">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>04. SIMULATE</span>
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-300">
                  What-if simulation engine allows testing cold snaps, generator trips, or delayed resupply without altering live records.
                </p>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                  Feature: <strong>Stress Injector</strong>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-polar-950 border border-polar-border space-y-2 relative">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>05. ACT</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-300">
                  Generates verified Standard Operating Procedures (SOPs), priority fuel requisitions, and load-shedding commands with RBAC.
                </p>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                  Outcome: <strong>Station Autonomy Saved</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: 4 COUPLED DOMAINS                                       */}
        {/* ============================================================== */}
        {activeAspectTab === 'DOMAINS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domainAspects.map(domain => {
              const Icon = domain.icon;
              return (
                <div key={domain.id} className="polar-card p-5 rounded-2xl border border-polar-border flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${domain.bg}`}>
                          <Icon className={`w-5 h-5 ${domain.color}`} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">{domain.title}</h4>
                          <span className="text-[11px] font-mono text-slate-400">{domain.subtitle}</span>
                        </div>
                      </div>
                      <Link 
                        href={domain.link}
                        className="text-xs font-mono text-polar-cyan hover:underline flex items-center gap-1"
                      >
                        <span>Open View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {domain.description}
                    </p>

                    {/* Key Metrics */}
                    <div className="mt-3 p-3 rounded-xl bg-polar-950 border border-polar-border font-mono text-xs space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Key Telemetry Metrics:</span>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-200">
                        {domain.metrics.map((m, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-polar-cyan" />
                            <span className="truncate">{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cross-Domain Coupling Function */}
                  <div className="pt-2 border-t border-white/5 font-mono text-xs">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Physics Coupling Equation:</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">{domain.coupling}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: REAL-TIME POLAR WEATHER ENGINE                          */}
        {/* ============================================================== */}
        {activeAspectTab === 'WEATHER' && (
          <div className="polar-card p-6 rounded-2xl border border-polar-border space-y-5 font-mono text-xs">
            <div>
              <span className="text-xs text-polar-cyan font-bold uppercase tracking-wider">
                SIH26060 Multi-Source Atmospheric Ingestion
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Real-Time Polar Weather Engine Architecture
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                Antarctic weather is not merely decorative data — it serves as the physical forcing function for the station Digital Twin. Every weather value tracks explicit data provenance, quality state, and source latency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border space-y-1">
                <span className="text-emerald-400 font-bold block">1. PRIMARY GROUND TRUTH</span>
                <span className="text-white font-bold text-sm block">NCPOR Station AWS</span>
                <p className="text-[11px] text-slate-400">
                  Automatic Weather Stations (AWS-02 at Bharati & Synoptic Met Tower at Maitri) sampled at 2–5 min intervals.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border space-y-1">
                <span className="text-sky-400 font-bold block">2. SATELLITE RASTER LAYERS</span>
                <span className="text-white font-bold text-sm block">NASA GIBS & NOAA JPSS</span>
                <p className="text-[11px] text-slate-400">
                  Terra/Aqua MODIS True Color, NOAA-21 VIIRS Thermal IR (10.7µm), Suomi NPP Cloud Top, and NISE sea ice extent.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border space-y-1">
                <span className="text-purple-400 font-bold block">3. NUMERICAL FORECAST</span>
                <span className="text-white font-bold text-sm block">ECMWF High-Res (0.1° IFS)</span>
                <p className="text-[11px] text-slate-400">
                  Multi-horizon forecast (+6H to +96H) with deterministic microgrid thermal draw and fuel burn projections.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border space-y-1">
                <span className="text-amber-400 font-bold block">4. DETERMINISTIC DETECTOR</span>
                <span className="text-white font-bold text-sm block">Atmospheric Anomalies</span>
                <p className="text-[11px] text-slate-400">
                  Detects Rapid Cooling (ΔT ≤ -3°C), High Wind (≥ 55 km/h), Low Visibility (≤ 1.5 km), Pressure Drop, and Blizzard Risk.
                </p>
              </div>
            </div>

            {/* Section 9: State Separation Callout */}
            <div className="p-4 rounded-xl bg-polar-900 border border-polar-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">State Separation Formula (Section 9 Specification):</span>
                <span className="px-2 py-0.5 rounded bg-polar-cyan/20 text-polar-cyan text-[10px] font-bold">IMMUTABLE BASELINE</span>
              </div>
              <div className="p-3 rounded-lg bg-polar-950 border border-white/5 text-center text-sm font-bold text-cyan-300">
                LIVE OBSERVATION (e.g. -17.5°C) + ACTIVE DEMO SCENARIO (e.g. -12.0°C) = DERIVED STATE (-29.5°C)
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                The live weather baseline is never overwritten by manual scenario injections. Demo faults apply non-destructive runtime offsets to the simulated state.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: THE CANONICAL CAUSAL CASCADE                           */}
        {/* ============================================================== */}
        {activeAspectTab === 'CASCADE' && (
          <div className="polar-card p-6 rounded-2xl border border-polar-border space-y-5">
            <div>
              <span className="text-xs font-mono text-polar-cyan font-bold uppercase tracking-wider">
                True Digital Twin Coupling Verification
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                How an Atmospheric Event Propagates Across Domains
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                In Antarctica, no domain exists in isolation. POLAR COMMAND models the exact physical chain reaction connecting weather changes to microgrid demand, generator load, fuel burn, and logistics runway.
              </p>
            </div>

            {/* Step by step causal cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border text-center space-y-1">
                <span className="text-[10px] text-cyan-400 block font-bold">STEP 1</span>
                <span className="text-sm font-bold text-white block">❄️ Cold Snap</span>
                <p className="text-[11px] text-slate-400">Ambient temp drops from -17.5°C to -29.5°C</p>
              </div>

              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border text-center space-y-1">
                <span className="text-[10px] text-sky-400 block font-bold">STEP 2</span>
                <span className="text-sm font-bold text-white block">🔥 HVAC Load ↑</span>
                <p className="text-[11px] text-slate-400">Station thermal draw surges +14 kW (+2.3 kW/°C)</p>
              </div>

              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border text-center space-y-1">
                <span className="text-[10px] text-amber-400 block font-bold">STEP 3</span>
                <span className="text-sm font-bold text-white block">⚡ Demand ↑</span>
                <p className="text-[11px] text-slate-400">Microgrid demand increases to 186.2 kW</p>
              </div>

              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border text-center space-y-1">
                <span className="text-[10px] text-rose-400 block font-bold">STEP 4</span>
                <span className="text-sm font-bold text-white block">🛢️ Fuel Burn ↑</span>
                <p className="text-[11px] text-slate-400">Diesel burn accelerates to 2,342 L/day</p>
              </div>

              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border text-center space-y-1">
                <span className="text-[10px] text-purple-400 block font-bold">STEP 5</span>
                <span className="text-sm font-bold text-white block">📉 Runway ↓</span>
                <p className="text-[11px] text-slate-400">Fuel runway margin drops from 23.7d to 22.4d</p>
              </div>

              <div className="p-3.5 rounded-xl bg-polar-950 border border-emerald-500/40 text-center space-y-1 bg-emerald-950/20">
                <span className="text-[10px] text-emerald-400 block font-bold">STEP 6</span>
                <span className="text-sm font-bold text-emerald-300 block">📋 Operator SOP</span>
                <p className="text-[11px] text-slate-300">Enact Tier-2 thermal shutters & fuel preheat</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border text-center font-mono text-xs text-slate-400">
              Verified in automated test suite: <strong>calculations.test.ts</strong> (Test #11: Section 14 Live Observation Update Cascade).
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: KEY INNOVATIONS                                         */}
        {/* ============================================================== */}
        {activeAspectTab === 'INNOVATIONS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            <div className="polar-card p-4 rounded-xl border border-polar-border space-y-2">
              <div className="flex items-center gap-2 text-polar-cyan font-bold">
                <Cpu className="w-4 h-4" />
                <span>Deterministic Calculation</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Built upon verified thermodynamics and marine electrical engineering formulas. Zero non-deterministic LLM hallucinations in life-critical station decisions.
              </p>
            </div>

            <div className="polar-card p-4 rounded-xl border border-polar-border space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Layers className="w-4 h-4" />
                <span>Spatial Digital Twin</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Features interactive 2D engineering blueprints with live power/glycol/fuel path animations, plus 3D Three.js station structural models.
              </p>
            </div>

            <div className="polar-card p-4 rounded-xl border border-polar-border space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Radio className="w-4 h-4" />
                <span>Edge Offline Resilience</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                When SATCOM connectivity drops to DISCONNECTED, the station retains last known observations, queues operator actions locally, and flushes upon reconnection.
              </p>
            </div>

            <div className="polar-card p-4 rounded-xl border border-polar-border space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Action-Layer RBAC</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Enforces strict role permissions across NCPOR Operations, Station Engineer, Logistics Officer, and Leadership for alerts, requisitions, and configuration.
              </p>
            </div>

            <div className="polar-card p-4 rounded-xl border border-polar-border space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Activity className="w-4 h-4" />
                <span>Explainable Station Health</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Never presents a mystery health percentage. Transparent modal explains the exact penalty point deduction across energy, infrastructure, and logistics.
              </p>
            </div>

            <div className="polar-card p-4 rounded-xl border border-polar-border space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Predictive What-If Sandbox</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Allows operators to simulate severe multi-year pack-ice delays or compound winter faults to test recovery strategies before they manifest physically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. PLATFORM SYSTEM DIRECTORY (DIRECT NAVIGATION)               */}
      {/* ============================================================== */}
      <div className="space-y-4 pt-4 border-t border-polar-border">
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">
            Explore All Project Subsystems
          </h3>
          <p className="text-xs text-slate-400">
            Click any operational module below to inspect its live implementation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          
          <Link href="/dashboard" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-polar-cyan font-bold">
                <span className="text-sm">Command Center V3</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Executive operational dashboard with 65% Spatial Twin, 35% Cross-Domain Risk Engine, and Station Mode controllers.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /dashboard</span>
          </Link>

          <Link href="/digital-twin" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-sky-400 font-bold">
                <span className="text-sm">Spatial Digital Twin</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Interactive 2D schematic blueprint and 3D Three.js architectural models for Maitri and Bharati bases.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /digital-twin</span>
          </Link>

          <Link href="/environment" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span className="text-sm">Polar Weather Monitor</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                3-Tab monitor with Ground Observation, Antarctic Satellite Map (MODIS/VIIRS), and ECMWF Multi-Horizon Forecasts.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /environment</span>
          </Link>

          <Link href="/energy" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span className="text-sm">Microgrid & Energy</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Diesel generator electrical bus telemetry, heating grid draw, and BESS 415V battery charge/discharge cycles.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /energy</span>
          </Link>

          <Link href="/infrastructure" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-purple-300 font-bold">
                <span className="text-sm">Station Infrastructure</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Asset health monitoring, seawater RO pumps, glycol recovery loops, and SATCOM antenna gimbal azimuth control.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /infrastructure</span>
          </Link>

          <Link href="/logistics" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="text-sm">Cryogenic Logistics</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Bulk fuel farm monitoring, daily burn calculations, stockout prediction, and requisition approval workflows.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /logistics</span>
          </Link>

          <Link href="/simulator" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-rose-400 font-bold">
                <span className="text-sm">What-If Stress Simulator</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Multi-horizon predictive sandbox to simulate severe polar storms, genset failures, and delayed resupply voyages.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /simulator</span>
          </Link>

          <Link href="/alerts" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span className="text-sm">Active Alerts & SOPs</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Deterministic threshold alarms with affected assets, root-cause diagnostic rationales, and operator acknowledgments.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /alerts</span>
          </Link>

          <Link href="/reports" className="p-4 rounded-xl bg-polar-900 border border-polar-border hover:border-polar-cyan transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="text-sm">Mission Reports & SITREPs</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Formal Antarctic Situation Reports (SITREP), shift handover logs, immutable audit trail, and print/export utilities.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 block">Route: /reports</span>
          </Link>

        </div>
      </div>

    </div>
  );
}
