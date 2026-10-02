'use client';

import React, { useState } from 'react';
import { StationAsset, StationId } from '@/types';
import { 
  Zap, 
  Wind, 
  Droplets, 
  Radio, 
  Fuel, 
  Compass, 
  Crosshair,
  AlertOctagon,
  BatteryCharging,
  ArrowRight,
  TrendingDown,
  Layers,
  Thermometer
} from 'lucide-react';
import { useStation } from '@/context/StationContext';

interface StationTwin2DProps {
  stationId: StationId;
  assets: StationAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  showThermalFlow?: boolean;
  showEnergyFlow?: boolean;
  focusIncidentMode?: boolean;
}

// Coordinate layout mapping for 2D schematic blueprint (percentages in SVG viewbox 820x490)
const ASSET_SCHEMATIC_POSITIONS: Record<string, { x: number; y: number; zone: string }> = {
  // Bharati Assets
  'bhr-gen-1': { x: 570, y: 155, zone: 'Power Generation Module' },
  'bhr-gen-2': { x: 675, y: 155, zone: 'Power Generation Module' },
  'bhr-hvac-1': { x: 400, y: 175, zone: 'Central HVAC & Air Scrubbers' },
  'bhr-water-1': { x: 210, y: 215, zone: 'Water RO & Desalination Facility' },
  'bhr-comms-1': { x: 400, y: 70, zone: 'SATCOM Radome & Deep-Space Array' },
  'bhr-fuel-1': { x: 630, y: 340, zone: 'Cryo Fuel Tanks & Pump Station' },

  // Maitri Assets
  'mtr-gen-1': { x: 570, y: 155, zone: 'Main Power House' },
  'mtr-gen-2': { x: 675, y: 155, zone: 'Auxiliary Power Unit' },
  'mtr-hvac-1': { x: 400, y: 175, zone: 'Station Thermal & Ventilation' },
  'mtr-water-1': { x: 210, y: 215, zone: 'Priyadarshini Lake Water Intake' },
  'mtr-comms-1': { x: 400, y: 70, zone: 'HF/VHF & Satellite Uplink' },
  'mtr-fuel-1': { x: 630, y: 340, zone: 'Bulk Fuel Storage & Manifold' },
};

export default function StationTwin2D({
  stationId,
  assets,
  selectedAssetId,
  onSelectAsset,
  showThermalFlow = true,
  showEnergyFlow = true,
  focusIncidentMode = false,
}: StationTwin2DProps) {
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);
  const { stationState, activeInjectedEvents } = useStation();
  const { derived, activeAlerts } = stationState;

  const isBharati = stationId === 'bharati';
  const stationTitle = isBharati ? 'BHARATI' : 'MAITRI';
  const stationRegion = isBharati ? 'Larsemann Hills (69.4°S, 76.2°E)' : 'Schirmacher Oasis (70.8°S, 11.7°E)';

  const isPowerDeficit = derived.powerSurplusDeficitKw < 0;
  const isGen2Failed = activeInjectedEvents.generator2Failure;
  const isColdSnap = activeInjectedEvents.extremeCold;
  const isHighWind = activeInjectedEvents.highWind;
  const isResupplyDelayed = activeInjectedEvents.resupplyDelay;
  const isAutonomyConstrained = derived.fuelRunwayDays < 14 || isResupplyDelayed;

  // Selected asset check
  const selectedAsset = assets.find(a => a.assetId === selectedAssetId) || assets[0];
  const isSelectedGen2 = selectedAssetId?.includes('gen-2') || selectedAssetId?.includes('gen-02');

  // Dependency Graph Tracing (Section 8 & 9 Requirements)
  const isUpstream = (asset: StationAsset) => {
    if (!selectedAsset || asset.assetId === selectedAsset.assetId) return false;
    return selectedAsset.upstreamDependencies?.some(dep => 
      asset.name.toLowerCase().includes(dep.toLowerCase()) || 
      dep.toLowerCase().includes(asset.name.toLowerCase()) ||
      dep.toLowerCase().includes(asset.type.replace('_', ' '))
    ) || false;
  };

  const isDownstream = (asset: StationAsset) => {
    if (!selectedAsset || asset.assetId === selectedAsset.assetId) return false;
    return selectedAsset.downstreamDependencies?.some(dep => 
      asset.name.toLowerCase().includes(dep.toLowerCase()) || 
      dep.toLowerCase().includes(asset.name.toLowerCase()) ||
      dep.toLowerCase().includes(asset.type.replace('_', ' '))
    ) || false;
  };

  const isDimmedInFocus = (asset: StationAsset) => {
    if (!focusIncidentMode) return false;
    if (asset.assetId === selectedAssetId) return false;
    return !isUpstream(asset) && !isDownstream(asset);
  };

  return (
    <div className="relative bg-polar-950 rounded-xl border border-polar-border overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
      
      {/* 2D Blueprint Header Toolbar */}
      <div className="px-4 py-2.5 bg-polar-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-polar-cyan/20 text-polar-cyan border border-polar-cyan/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider font-sans">{stationTitle}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-polar-navy border border-polar-cyan/40 text-polar-cyan font-bold">
                OPERATIONAL SPATIAL TWIN
              </span>
            </div>
            <span className="text-[11px] text-slate-400">{stationRegion}</span>
          </div>
        </div>

        {/* Directional Flow Guide Legend */}
        <div className="flex items-center gap-4 text-[11px] hidden sm:flex">
          <div className="flex items-center gap-1.5 text-polar-cyan font-semibold">
            <span className="w-2 h-2 rounded-full bg-polar-cyan animate-pulse" />
            <span>Directional Coupling: Env → HVAC → Grid → Gen → BESS → Fuel → Logistics</span>
          </div>
          <span className="text-slate-400 font-mono">1:250 CAD Scale</span>
        </div>
      </div>

      {/* Main 2D Interactive Blueprint SVG Canvas */}
      <div className="relative w-full h-[420px] md:h-[480px] bg-[#030d17] overflow-hidden select-none">
        
        {/* Subtle CAD Blueprint Grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cad-small-grid-v4" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0e2a47" strokeWidth="0.8" />
            </pattern>
            <pattern id="cad-large-grid-v4" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#cad-small-grid-v4)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#163e66" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cad-large-grid-v4)" />
        </svg>

        {/* SVG Drawing Canvas */}
        <svg
          viewBox="0 0 820 490"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Arrowhead Markers for Directional Coupling Flow */}
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#00B8E6" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#E53935" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#F59E0B" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10B981" />
            </marker>

            {/* Linear Gradients for Active Modules */}
            <linearGradient id="grad-core" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#08243A" />
              <stop offset="100%" stopColor="#041424" />
            </linearGradient>
            <linearGradient id="grad-power" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1c23" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Compass Rose */}
          <g transform="translate(60, 55)" className="text-slate-400">
            <circle cx="0" cy="0" r="26" fill="none" stroke="#1d4b75" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="-26" x2="0" y2="26" stroke="#1d4b75" strokeWidth="1.5" />
            <line x1="-26" y1="0" x2="26" y2="0" stroke="#1d4b75" strokeWidth="1.5" />
            <text x="0" y="-30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#00B8E6" fontFamily="monospace">N</text>
            <text x="0" y="38" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">S</text>
            <text x="34" y="3" textAnchor="start" fontSize="9" fill="#64748b" fontFamily="monospace">E</text>
            <text x="-34" y="3" textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">W</text>
          </g>

          {/* Exterior Environment Vector Node (Top-Left) */}
          <g transform="translate(50, 115)">
            <rect x="0" y="0" width="130" height="54" rx="8" fill="#041624" stroke={isColdSnap || isHighWind ? "#E53935" : "#00B8E6"} strokeWidth="1.5" />
            <text x="65" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#00B8E6" fontFamily="monospace">
              EXTERNAL WEATHER
            </text>
            <text x="65" y="32" textAnchor="middle" fontSize="11" fontWeight="bold" fill={isColdSnap ? "#E53935" : "#ffffff"} fontFamily="monospace">
              {derived.effectiveTempC.toFixed(1)}°C · {derived.effectiveWindKmh} km/h
            </text>
            <text x="65" y="46" textAnchor="middle" fontSize="8.5" fill={isColdSnap ? "#F59E0B" : "#94a3b8"} fontFamily="monospace">
              {isColdSnap ? 'COLD SNAP (-12°C)' : 'Stable Polar Inversion'}
            </text>
          </g>

          {/* ============================================================== */}
          {/* DIRECTIONAL COUPLING PATHWAYS (PIPELINES)                      */}
          {/* 1. Environment -> HVAC                                         */}
          {/* 2. HVAC -> Microgrid Bus                                       */}
          {/* 3. Microgrid Bus -> Generators (Gen 1 & Gen 2)                 */}
          {/* 4. Microgrid Bus -> Battery (BESS)                             */}
          {/* 5. Generators -> Fuel Storage                                  */}
          {/* 6. Fuel Storage -> Logistics Arrival / Autonomy                */}
          {/* ============================================================== */}

          {/* Conduits (Base lines) */}
          {/* Path 1: Env -> HVAC */}
          <path
            d="M 180 142 L 320 180"
            fill="none"
            stroke="#1d4b75"
            strokeWidth="3"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-cyan)"
          />

          {/* Path 2: HVAC -> Microgrid Bus */}
          <path
            d="M 470 180 L 530 180"
            fill="none"
            stroke={isPowerDeficit ? "#E53935" : "#00B8E6"}
            strokeWidth={isPowerDeficit ? "4" : "3"}
            markerEnd={isPowerDeficit ? "url(#arrow-red)" : "url(#arrow-cyan)"}
          />

          {/* Path 3: Microgrid Bus <-> Generators */}
          <path
            d="M 590 180 L 570 190 M 640 180 L 675 190"
            fill="none"
            stroke="#1d4b75"
            strokeWidth="2.5"
          />

          {/* Path 4: Microgrid Bus <-> Battery (BESS) */}
          <path
            d="M 400 250 L 400 295"
            fill="none"
            stroke={isPowerDeficit ? "#E53935" : "#10B981"}
            strokeWidth={isPowerDeficit ? "4" : "2.5"}
            markerEnd={isPowerDeficit ? "url(#arrow-red)" : "url(#arrow-green)"}
          />

          {/* Path 5: Generators -> Fuel Depot */}
          <path
            d="M 640 230 L 640 280"
            fill="none"
            stroke={isAutonomyConstrained ? "#F59E0B" : "#00B8E6"}
            strokeWidth="3"
            markerEnd={isAutonomyConstrained ? "url(#arrow-amber)" : "url(#arrow-cyan)"}
          />

          {/* Path 6: Fuel Depot -> Logistics Assessment (Bottom) */}
          <path
            d="M 640 380 L 640 415"
            fill="none"
            stroke={isAutonomyConstrained ? "#E53935" : "#10B981"}
            strokeWidth="3"
            markerEnd={isAutonomyConstrained ? "url(#arrow-red)" : "url(#arrow-green)"}
          />

          {/* Lateral Inter-Module Conduits: West Wing (Water) & North (Comms) */}
          <path
            d="M 280 215 L 320 215"
            fill="none"
            stroke="#00B8E6"
            strokeWidth="2.5"
            markerEnd="url(#arrow-cyan)"
          />
          <path
            d="M 400 110 L 400 135"
            fill="none"
            stroke="#00B8E6"
            strokeWidth="2"
            markerEnd="url(#arrow-cyan)"
          />

          {/* ============================================================== */}
          {/* ACTIVE HIGHLIGHTED CASCADE PATHWAY (WHEN GEN 2 OR RISK TRIPPED)*/}
          {/* Generator #2 OFFLINE -> Microgrid -> Battery -> Fuel -> Logistics */}
          {/* ============================================================== */}
          {(isGen2Failed || isSelectedGen2) && (
            <g className="animate-pulse">
              {/* Generator #2 to Microgrid */}
              <path
                d="M 675 180 L 630 180 L 470 180"
                fill="none"
                stroke="#E53935"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Microgrid to Battery */}
              <path
                d="M 400 250 L 400 295"
                fill="none"
                stroke="#E53935"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Power House to Fuel Storage */}
              <path
                d="M 630 230 L 630 280"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Fuel to Logistics */}
              <path
                d="M 630 380 L 630 415"
                fill="none"
                stroke="#E53935"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>
          )}

          {/* Module 1: West Wing - Water & Life Support Facility */}
          <g>
            <rect
              x="150"
              y="165"
              width="130"
              height="100"
              rx="10"
              fill="#08243A"
              stroke="#00B8E6"
              strokeWidth="1.5"
            />
            <rect x="160" y="175" width="110" height="18" rx="4" fill="#0C2D48" />
            <text x="215" y="188" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#00B8E6" fontFamily="monospace">
              WEST: WATER / RO
            </text>
            <text x="215" y="246" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
              RO & Melt Tanks
            </text>
            {/* Impact tag beside module */}
            <g transform="translate(150, 272)">
              <rect x="0" y="0" width="130" height="16" rx="4" fill="#061c2d" stroke="#1d4b75" strokeWidth="1" />
              <text x="65" y="11" textAnchor="middle" fontSize="8.5" fill="#38bdf8" fontFamily="monospace">
                Intake: 18.2 L/min (Nominal)
              </text>
            </g>
          </g>

          {/* Module 2: North Sector - Communications & SATCOM Array */}
          <g>
            <rect
              x="320"
              y="25"
              width="160"
              height="80"
              rx="10"
              fill="#0C2D48"
              stroke={isHighWind ? "#F59E0B" : "#1d4b75"}
              strokeWidth={isHighWind ? "2" : "1.5"}
            />
            <circle cx="400" cy="65" r="22" fill="#08243A" stroke="#00B8E6" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="400" y="40" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#ffffff" fontFamily="monospace">
              SATCOM RADOME
            </text>
            <text x="400" y="94" textAnchor="middle" fontSize="8.5" fill={isHighWind ? "#F59E0B" : "#94a3b8"} fontFamily="monospace">
              {isHighWind ? 'HIGH WIND STOW (85 km/h)' : 'Ku/Ka 100% Tracking'}
            </text>
          </g>

          {/* Module 3: Central Core - Habitation, Operations & HVAC */}
          <g>
            <rect
              x="320"
              y="135"
              width="160"
              height="120"
              rx="12"
              fill="url(#grad-core)"
              stroke={isColdSnap ? "#F59E0B" : isPowerDeficit ? "#E53935" : "#00B8E6"}
              strokeWidth={isColdSnap || isPowerDeficit ? "2.5" : "1.5"}
            />
            <rect x="330" y="145" width="140" height="20" rx="4" fill="#0C2D48" />
            <text x="400" y="159" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#ffffff" fontFamily="monospace">
              CENTRAL HVAC CORE
            </text>
            <text x="400" y="215" textAnchor="middle" fontSize="9" fill="#cbd5e1" fontFamily="monospace">
              Core Habitation (21°C)
            </text>
            {/* Impact tag on HVAC */}
            <text x="400" y="240" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill={isColdSnap ? "#F59E0B" : "#00B8E6"} fontFamily="monospace">
              HVAC Draw: {derived.heatingLoadKw} kW {isColdSnap ? '(+35 kW SURGE)' : ''}
            </text>
          </g>

          {/* Module 4: East Wing - Microgrid Bus & Diesel Generators */}
          <g>
            <rect
              x="530"
              y="115"
              width="210"
              height="115"
              rx="12"
              fill="url(#grad-power)"
              stroke={isPowerDeficit ? "#E53935" : "#00B8E6"}
              strokeWidth={isPowerDeficit ? "3" : "1.5"}
            />
            <rect x="540" y="125" width="190" height="20" rx="4" fill="#1e293b" />
            <text x="635" y="139" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#f8fafc" fontFamily="monospace">
              MICROGRID BUS & POWER HOUSE
            </text>
            
            {/* Live Microgrid Power Balance Callout */}
            <text x="635" y="215" textAnchor="middle" fontSize="10" fontWeight="bold" fill={isPowerDeficit ? "#E53935" : "#10B981"} fontFamily="monospace">
              Demand: {derived.totalDemandKw} kW · {isPowerDeficit ? `${derived.powerSurplusDeficitKw} kW DEFICIT` : `+${derived.powerSurplusDeficitKw} kW SURPLUS`}
            </text>
          </g>

          {/* Module: BESS Battery Storage Subsystem */}
          <g>
            <rect
              x="320"
              y="295"
              width="160"
              height="80"
              rx="10"
              fill="#062e24"
              stroke={derived.batteryStatus === 'discharging' ? "#E53935" : "#10B981"}
              strokeWidth={derived.batteryStatus === 'discharging' ? "2.5" : "1.5"}
            />
            <rect x="330" y="305" width="140" height="18" rx="4" fill="#0a4637" />
            <text x="400" y="318" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#a7f3d0" fontFamily="monospace">
              BESS BATTERY BANK (450 kWh)
            </text>
            <text x="400" y="346" textAnchor="middle" fontSize="11" fontWeight="bold" fill={derived.batteryStatus === 'discharging' ? "#E53935" : "#34d399"} fontFamily="monospace">
              {derived.batterySocPercent}% SOC ({derived.batteryStatus.toUpperCase()})
            </text>
            <text x="400" y="364" textAnchor="middle" fontSize="8.5" fill={derived.batteryStatus === 'discharging' ? "#F59E0B" : "#6ee7b7"} fontFamily="monospace">
              {derived.batteryStatus === 'discharging' ? 'Discharging to cover deficit' : 'Floating in Standby'}
            </text>
          </g>

          {/* Module 5: South Sector - Fuel Depot & Bulk Storage */}
          <g>
            <rect
              x="530"
              y="280"
              width="210"
              height="95"
              rx="12"
              fill="#2e0814"
              stroke={isAutonomyConstrained ? "#E53935" : "#F59E0B"}
              strokeWidth={isAutonomyConstrained ? "2.5" : "1.5"}
            />
            <rect x="540" y="290" width="190" height="18" rx="4" fill="#4c0519" />
            <text x="635" y="303" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#fecdd3" fontFamily="monospace">
              CRYOGENIC BULK FUEL FARM
            </text>
            {/* Impact tags on Fuel Depot */}
            <text x="635" y="336" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill={isAutonomyConstrained ? "#E53935" : "#fda4af"} fontFamily="monospace">
              Burn: {derived.dailyFuelBurnLitres} L/d · Runway: {derived.fuelRunwayDays.toFixed(1)} Days
            </text>
            <text x="635" y="356" textAnchor="middle" fontSize="8.5" fill={isAutonomyConstrained ? "#F59E0B" : "#fda4af"} fontFamily="monospace">
              {isAutonomyConstrained ? '⚠ BELOW 14-DAY POLAR RESERVE' : 'Stock Above 14-day Safety Threshold'}
            </text>
          </g>

          {/* Logistics Arrival & Risk Destination Node (Bottom Right) */}
          <g transform="translate(530, 415)">
            <rect
              x="0"
              y="0"
              width="210"
              height="55"
              rx="8"
              fill="#08243A"
              stroke={isAutonomyConstrained ? "#E53935" : "#10B981"}
              strokeWidth={isAutonomyConstrained ? "2" : "1.5"}
            />
            <text x="105" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff" fontFamily="monospace">
              LOGISTICS RESUPPLY ETA & AUTONOMY
            </text>
            <text x="105" y="32" textAnchor="middle" fontSize="10" fontWeight="bold" fill={isAutonomyConstrained ? "#E53935" : "#10B981"} fontFamily="monospace">
              {isResupplyDelayed ? '30 Days (+12d ICE DELAY)' : '18 Days Scheduled Arrival'}
            </text>
            <text x="105" y="47" textAnchor="middle" fontSize="8.5" fill={isAutonomyConstrained ? "#F59E0B" : "#94a3b8"} fontFamily="monospace">
              {isAutonomyConstrained ? 'PROJECTED FUEL STOCKOUT BEFORE ETA' : 'Resupply Arrives Within Buffer'}
            </text>
          </g>

          {/* Interactive Hotspot Nodes for Assets with Dependency Highlights */}
          {assets.map((asset) => {
            const pos = ASSET_SCHEMATIC_POSITIONS[asset.assetId] || { x: 400, y: 200, zone: asset.building };
            const isSelected = selectedAssetId === asset.assetId;
            const isHovered = hoveredAssetId === asset.assetId;
            const isWarning = asset.status === 'warning';
            const isCritical = asset.status === 'critical' || asset.status === 'offline';
            const isThisGen2Failed = (asset.assetId.includes('gen-2') || asset.assetId.includes('gen-02')) && isGen2Failed;
            const isUp = isUpstream(asset);
            const isDown = isDownstream(asset);
            const isDimmed = isDimmedInFocus(asset);

            const statusFill = (isThisGen2Failed || isCritical) ? '#E53935' : isWarning ? '#F59E0B' : '#10B981';

            return (
              <g
                key={asset.assetId}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectAsset(asset.assetId)}
                onMouseEnter={() => setHoveredAssetId(asset.assetId)}
                onMouseLeave={() => setHoveredAssetId(null)}
                opacity={isDimmed ? 0.18 : 1}
                className="cursor-pointer group transition-opacity duration-300"
              >
                {/* Animated Pulsing Beacon Ring */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? "22" : (isUp || isDown) ? "18" : "15"}
                  fill={isUp ? "#F59E0B" : isDown ? "#38bdf8" : statusFill}
                  opacity={isSelected ? "0.4" : (isUp || isDown) ? "0.3" : "0.2"}
                  className="animate-ping"
                />

                {/* Outer Selection / Dependency Highlight Ring */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="19"
                    fill="none"
                    stroke="#00B8E6"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                )}

                {isUp && (
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}

                {isDown && (
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? "13" : "10"}
                  fill={isSelected ? "#00B8E6" : isUp ? "#78350f" : isDown ? "#0c4a6e" : "#08243A"}
                  stroke={isUp ? "#F59E0B" : isDown ? "#38bdf8" : statusFill}
                  strokeWidth={isSelected ? "3" : "2"}
                  className="transition-all duration-200 group-hover:scale-125"
                />

                {/* Inner Status Dot */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? "5" : "3.5"}
                  fill={isSelected ? "#ffffff" : isUp ? "#F59E0B" : isDown ? "#38bdf8" : statusFill}
                />

                {/* Focus Role Indicator Tag */}
                {focusIncidentMode && (
                  <text
                    x="0"
                    y="-24"
                    textAnchor="middle"
                    fontSize="7"
                    fontWeight="bold"
                    fill={isSelected ? "#00B8E6" : isUp ? "#F59E0B" : isDown ? "#38bdf8" : "#94a3b8"}
                    fontFamily="monospace"
                  >
                    {isSelected ? '★ INCIDENT FOCUS' : isUp ? '▲ UPSTREAM' : isDown ? '▼ DOWNSTREAM' : ''}
                  </text>
                )}

                {/* Asset Label Pill Badge */}
                <g transform="translate(0, 20)">
                  <rect
                    x="-42"
                    y="-7"
                    width="84"
                    height="15"
                    rx="7.5"
                    fill={isSelected ? "#00B8E6" : isUp ? "#78350f" : isDown ? "#0c4a6e" : "#08243A"}
                    stroke={isSelected ? "#38bdf8" : isUp ? "#F59E0B" : isDown ? "#38bdf8" : "#1d4b75"}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill="#ffffff"
                    fontFamily="monospace"
                  >
                    {asset.name.split(' ')[0]} {asset.name.split(' ')[1] || ''}
                  </text>
                </g>

                {/* Live Value Tag directly on Asset */}
                <text
                  x="0"
                  y="-14"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill={isThisGen2Failed ? "#E53935" : isWarning ? "#F59E0B" : "#00B8E6"}
                  fontFamily="monospace"
                >
                  {isThisGen2Failed ? '0 kW (OFFLINE)' : asset.type === 'generator' ? '220 kW' : `${asset.health}%`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Blueprint Legend Floating Bar */}
        <div className="absolute bottom-2.5 left-3 bg-polar-900/95 backdrop-blur-sm border border-polar-border px-3 py-1.5 rounded-lg shadow-sm font-mono text-[11px] flex items-center gap-4 text-slate-300">
          <span className="font-bold text-white flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-polar-cyan" /> Coupling Flow:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-operational-green" />
            Nominal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning-amber" />
            Advisory
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-critical-red" />
            Tripped / Deficit
          </span>
        </div>

        {/* Active Node Counter Indicator */}
        <div className="absolute bottom-2.5 right-3 bg-polar-900/95 backdrop-blur-sm border border-polar-border px-2.5 py-1 rounded-lg shadow-sm font-mono text-[10px] text-slate-400">
          Spatial Twin: {assets.length} Active Modules
        </div>
      </div>

      {/* Upstream/Downstream Directional Relationship Strip */}
      <div className="p-3 bg-polar-900 border-t border-polar-border">
        <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span className="text-white font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-polar-cyan" />
            Interactive Dependency Graph: Select node to trace upstream/downstream impact
          </span>
          <span className="text-polar-cyan font-semibold">Active: {selectedAsset?.name || 'Generator #2'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {assets.map((asset) => {
            const isSelected = selectedAssetId === asset.assetId;
            const isWarning = asset.status === 'warning';
            const isCritical = asset.status === 'critical' || asset.status === 'offline';
            const isThisGen2Failed = (asset.assetId.includes('gen-2') || asset.assetId.includes('gen-02')) && isGen2Failed;

            return (
              <button
                key={asset.assetId}
                onClick={() => onSelectAsset(asset.assetId)}
                className={`p-2 rounded-lg border text-left font-mono transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'border-polar-cyan bg-polar-800 ring-1 ring-polar-cyan/50 shadow-md'
                    : isThisGen2Failed || isCritical
                    ? 'border-critical-red/80 bg-critical-red/20 hover:bg-critical-red/30'
                    : isWarning
                    ? 'border-warning-amber/80 bg-warning-amber/20 hover:bg-warning-amber/30'
                    : 'border-polar-border bg-polar-950 hover:bg-polar-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 truncate">
                    {asset.type.replace('_', ' ')}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isThisGen2Failed || isCritical ? 'bg-critical-red animate-pulse' : isWarning ? 'bg-warning-amber' : 'bg-operational-green'
                  }`} />
                </div>
                <span className="font-bold text-white text-[11px] truncate">{asset.name}</span>
                <div className="mt-1.5 pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Health:</span>
                  <span className={`font-bold ${
                    isThisGen2Failed ? 'text-critical-red' :
                    asset.health >= 80 ? 'text-operational-green' : asset.health >= 60 ? 'text-warning-amber' : 'text-critical-red'
                  }`}>
                    {isThisGen2Failed ? '0% (TRIP)' : `${asset.health}%`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
