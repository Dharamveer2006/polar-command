'use client';

import React, { useState } from 'react';
import { StationAsset, StationId } from '@/types';
import { 
  Zap, 
  Wind, 
  Droplets, 
  Radio, 
  Fuel, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Cpu, 
  Compass, 
  Crosshair,
  Flame,
  BatteryCharging,
  ArrowRight
} from 'lucide-react';
import { useStation } from '@/context/StationContext';

interface StationTwin2DProps {
  stationId: StationId;
  assets: StationAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  showThermalFlow?: boolean;
  showEnergyFlow?: boolean;
}

// Coordinate layout mapping for 2D schematic blueprint (percentages in SVG viewbox 800x480)
const ASSET_SCHEMATIC_POSITIONS: Record<string, { x: number; y: number; zone: string; icon: React.ComponentType<{ className?: string }> }> = {
  // Bharati Assets
  'bhr-gen-1': { x: 570, y: 150, zone: 'Power Generation Module', icon: Zap },
  'bhr-gen-2': { x: 670, y: 150, zone: 'Power Generation Module', icon: Zap },
  'bhr-hvac-1': { x: 400, y: 160, zone: 'Central HVAC & Air Scrubbers', icon: Wind },
  'bhr-water-1': { x: 230, y: 200, zone: 'Water RO & Desalination Facility', icon: Droplets },
  'bhr-comms-1': { x: 400, y: 70, zone: 'SATCOM Radome & Deep-Space Array', icon: Radio },
  'bhr-fuel-1': { x: 630, y: 320, zone: 'Cryo Fuel Tanks & Pump Station', icon: Fuel },

  // Maitri Assets
  'mtr-gen-1': { x: 570, y: 160, zone: 'Main Power House', icon: Zap },
  'mtr-gen-2': { x: 660, y: 160, zone: 'Auxiliary Power Unit', icon: Zap },
  'mtr-hvac-1': { x: 400, y: 170, zone: 'Station Thermal & Ventilation', icon: Wind },
  'mtr-water-1': { x: 220, y: 220, zone: 'Priyadarshini Lake Water Intake', icon: Droplets },
  'mtr-comms-1': { x: 400, y: 70, zone: 'HF/VHF & Satellite Uplink', icon: Radio },
  'mtr-fuel-1': { x: 610, y: 320, zone: 'Bulk Fuel Storage & Manifold', icon: Fuel },
};

export default function StationTwin2D({
  stationId,
  assets,
  selectedAssetId,
  onSelectAsset,
  showThermalFlow = true,
  showEnergyFlow = true,
}: StationTwin2DProps) {
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);
  const { stationState, activeInjectedEvents } = useStation();
  const { derived, activeAlerts } = stationState;

  const isBharati = stationId === 'bharati';
  const stationTitle = isBharati ? 'Bharati Research Station' : 'Maitri Research Station';
  const stationRegion = isBharati ? 'Larsemann Hills (69°S, 76°E)' : 'Schirmacher Oasis (70°S, 11°E)';

  // Check if selected or hovered asset is a failed/critical generator
  const selectedAsset = assets.find(a => a.assetId === selectedAssetId);
  const isSelectedGenFailed = selectedAsset?.type === 'generator' && (selectedAsset.status === 'offline' || selectedAsset.status === 'critical' || activeInjectedEvents.generator2Failure);

  return (
    <div className="relative bg-polar-950 rounded-xl border border-polar-border overflow-hidden shadow-lg flex flex-col font-mono text-xs">
      {/* 2D Blueprint Header Toolbar */}
      <div className="px-4 py-3 bg-polar-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider">{stationTitle}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Spatial Digital Twin
              </span>
            </div>
            <span className="text-[11px] text-slate-400">{stationRegion}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Live Vector Telemetry
          </span>
          <span className="text-slate-400">Scale: 1:250 Orthographic CAD</span>
        </div>
      </div>

      {/* Main 2D Interactive Blueprint SVG Canvas */}
      <div className="relative w-full h-[400px] md:h-[460px] bg-polar-950 overflow-hidden select-none">
        {/* Subtle CAD Blueprint Grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cad-small-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
            </pattern>
            <pattern id="cad-large-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#cad-small-grid)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cad-large-grid)" />
        </svg>

        {/* 2D Station Structural Blueprint Elements */}
        <svg
          viewBox="0 0 800 480"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Compass Rose */}
          <g transform="translate(60, 60)" className="text-slate-400">
            <circle cx="0" cy="0" r="28" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="-28" x2="0" y2="28" stroke="#475569" strokeWidth="1.5" />
            <line x1="-28" y1="0" x2="28" y2="0" stroke="#475569" strokeWidth="1.5" />
            <text x="0" y="-32" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#38bdf8" fontFamily="monospace">N</text>
            <text x="0" y="40" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">S</text>
            <text x="36" y="3" textAnchor="start" fontSize="9" fill="#64748b" fontFamily="monospace">E</text>
            <text x="-36" y="3" textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">W</text>
          </g>

          {/* Ice / Bedrock Boundary */}
          <path
            d="M 50 420 Q 250 370 450 410 T 750 390"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text x="80" y="440" fontSize="10" fill="#3b82f6" fontFamily="monospace">PERMAFROST ICE BOUNDARY / ANCHOR PILINGS</text>

          {/* ============================================================== */}
          {/* INTER-MODULE CONDUITS CONNECTING ALL 7 CORE SUBSYSTEMS         */}
          {/* Generators ↔ Microgrid ↔ Battery ↔ HVAC ↔ Water ↔ Fuel ↔ SATCOM */}
          {/* ============================================================== */}
          {/* Base Engineering Trunk Lines */}
          <g opacity="0.35" strokeLinecap="round" strokeLinejoin="round">
            {/* Water to Core */}
            <path d="M 230 200 L 400 200" fill="none" stroke="#00B8E6" strokeWidth="8" />
            {/* SATCOM to Core */}
            <path d="M 400 70 L 400 200" fill="none" stroke="#818CF8" strokeWidth="6" />
            {/* Core to Microgrid Bus */}
            <path d="M 400 200 L 620 200" fill="none" stroke="#F59E0B" strokeWidth="8" />
            {/* Generators to Microgrid Bus */}
            <path d="M 620 150 L 620 200" fill="none" stroke="#F59E0B" strokeWidth="8" />
            {/* Microgrid Bus to BESS Battery */}
            <path d="M 620 200 L 480 320 L 405 320" fill="none" stroke="#10B981" strokeWidth="7" />
            {/* Core to BESS Battery */}
            <path d="M 400 200 L 405 280" fill="none" stroke="#10B981" strokeWidth="6" />
            {/* Fuel Farm to Microgrid / Generators */}
            <path d="M 630 320 L 620 200 L 620 150" fill="none" stroke="#E53935" strokeWidth="7" />
          </g>

          {/* High-Contrast Conduit Overlays */}
          <g opacity="0.85" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 230 200 L 400 200" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="6 3" />
            <path d="M 400 70 L 400 200" fill="none" stroke="#A5B4FC" strokeWidth="2" strokeDasharray="4 2" />
            <path d="M 400 200 L 620 200" fill="none" stroke="#FCD34D" strokeWidth="2.5" />
            <path d="M 620 150 L 620 200" fill="none" stroke="#FBBF24" strokeWidth="2.5" />
            <path d="M 620 200 L 480 320 L 405 320" fill="none" stroke="#34D399" strokeWidth="2.5" strokeDasharray="5 3" />
            <path d="M 400 200 L 405 280" fill="none" stroke="#34D399" strokeWidth="2" />
            <path d="M 630 320 L 620 200 L 620 150" fill="none" stroke="#F87171" strokeWidth="2.5" strokeDasharray="6 3" />
          </g>

          {/* Central Microgrid Bus Node Junction Marker */}
          <g transform="translate(620, 200)">
            <circle cx="0" cy="0" r="10" fill="#0C2D48" stroke="#00B8E6" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="4" fill="#00B8E6" className="animate-ping" />
            <text x="14" y="4" fontSize="8.5" fontWeight="bold" fill="#00B8E6" fontFamily="monospace">
              415V GRID BUS
            </text>
          </g>

          {/* ============================================================== */}
          {/* DYNAMIC CAUSAL PATH HIGHLIGHTING WHEN ASSETS ARE SELECTED       */}
          {/* ============================================================== */}
          {/* 1. Generator Selected / Failed: Gen → Microgrid → Battery → Fuel → Station Risk */}
          {(selectedAsset?.type === 'generator' || selectedAssetId?.includes('gen') || activeInjectedEvents.generator2Failure) && (
            <g className="animate-pulse">
              <path
                d="M 670 150 L 620 200 L 480 320 L 405 320 M 620 200 L 630 320 M 620 200 L 400 200"
                fill="none"
                stroke={activeInjectedEvents.generator2Failure ? "#E53935" : "#00B8E6"}
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Numbered Causal Sequence Badges */}
              <g transform="translate(670, 135)">
                <circle cx="0" cy="0" r="9" fill="#E53935" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFF" fontFamily="monospace">1</text>
              </g>
              <g transform="translate(620, 185)">
                <circle cx="0" cy="0" r="9" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFF" fontFamily="monospace">2</text>
              </g>
              <g transform="translate(435, 320)">
                <circle cx="0" cy="0" r="9" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFF" fontFamily="monospace">3</text>
              </g>
              <g transform="translate(630, 340)">
                <circle cx="0" cy="0" r="9" fill="#E53935" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFF" fontFamily="monospace">4</text>
              </g>
              <g transform="translate(500, 230)">
                <rect x="-95" y="-14" width="190" height="28" rx="6" fill="#881337" stroke="#E53935" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#fff" fontFamily="monospace">
                  ⚠ GEN CASCADE → BESS → FUEL
                </text>
              </g>
            </g>
          )}

          {/* 2. HVAC Selected / Cold Snap: HVAC → Demand → Microgrid → Gen → Fuel */}
          {(selectedAsset?.type === 'hvac' || selectedAssetId?.includes('hvac') || activeInjectedEvents.extremeCold) && (
            <g className="animate-pulse">
              <path
                d="M 400 160 L 400 200 L 620 200 L 620 150 M 620 200 L 630 320"
                fill="none"
                stroke="#00B8E6"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <g transform="translate(400, 140)">
                <circle cx="0" cy="0" r="9" fill="#00B8E6" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFF" fontFamily="monospace">1</text>
              </g>
              <g transform="translate(510, 190)">
                <circle cx="0" cy="0" r="9" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFF" fontFamily="monospace">2</text>
              </g>
              <g transform="translate(630, 305)">
                <circle cx="0" cy="0" r="9" fill="#E53935" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FFF" fontFamily="monospace">3</text>
              </g>
              <g transform="translate(480, 175)">
                <rect x="-85" y="-12" width="170" height="24" rx="5" fill="#08243A" stroke="#00B8E6" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#00B8E6" fontFamily="monospace">
                  ❄ HVAC THERMAL CASCADE
                </text>
              </g>
            </g>
          )}

          {/* 3. Fuel Selected / Resupply Delay: Fuel → Gensets → Microgrid → Life Support */}
          {(selectedAsset?.type === 'fuel_pump' || selectedAssetId?.includes('fuel') || activeInjectedEvents.resupplyDelay) && (
            <g className="animate-pulse">
              <path
                d="M 630 320 L 620 200 L 620 150 M 620 200 L 400 200"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <g transform="translate(560, 260)">
                <rect x="-85" y="-12" width="170" height="24" rx="5" fill="#451A03" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FCD34D" fontFamily="monospace">
                  🛢 FUEL AUTONOMY CASCADE
                </text>
              </g>
            </g>
          )}

          {/* 4. Water Desalination Selected: Water → Core Habitation → Microgrid */}
          {(selectedAsset?.type === 'water_pump' || selectedAsset?.type === 'reverse_osmosis' || selectedAssetId?.includes('water') || selectedAssetId?.includes('pump') || selectedAssetId?.includes('ro')) && (
            <g className="animate-pulse">
              <path
                d="M 230 200 L 400 200 L 620 200"
                fill="none"
                stroke="#00B8E6"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <g transform="translate(300, 185)">
                <rect x="-70" y="-12" width="140" height="24" rx="5" fill="#08243A" stroke="#00B8E6" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#00B8E6" fontFamily="monospace">
                  💧 WATER TRACE HEAT
                </text>
              </g>
            </g>
          )}

          {/* 5. SATCOM Radome Selected: SATCOM → Core Command Deck → Edge Sync */}
          {(selectedAsset?.type === 'satellite_uplink' || selectedAssetId?.includes('comms') || selectedAssetId?.includes('sat')) && (
            <g className="animate-pulse">
              <path
                d="M 400 70 L 400 200"
                fill="none"
                stroke="#818CF8"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <g transform="translate(400, 110)">
                <rect x="-65" y="-12" width="130" height="24" rx="5" fill="#08243A" stroke="#818CF8" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#A5B4FC" fontFamily="monospace">
                  📡 SATCOM UPLINK BUS
                </text>
              </g>
            </g>
          )}

          {/* 6. Battery Selected: BESS → Microgrid Bus → Core */}
          {(selectedAssetId?.includes('battery') || selectedAssetId?.includes('bess')) && (
            <g className="animate-pulse">
              <path
                d="M 405 320 L 480 320 L 620 200 L 400 200"
                fill="none"
                stroke="#10B981"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <g transform="translate(480, 300)">
                <rect x="-75" y="-12" width="150" height="24" rx="5" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#A7F3D0" fontFamily="monospace">
                  🔋 BESS RESERVE FLOW
                </text>
              </g>
            </g>
          )}

          {/* Flow Indicator Particle */}
          <circle cx="400" cy="200" r="3.5" fill="#00B8E6" className="animate-ping" />

          {/* Module 1: West Wing - Water & Life Support Facility */}
          <g>
            <rect
              x="160"
              y="150"
              width="140"
              height="110"
              rx="12"
              fill="#082f49"
              stroke="#0284c7"
              strokeWidth="2"
              className="transition-all hover:fill-sky-950"
            />
            <rect x="170" y="160" width="120" height="20" rx="4" fill="#0c4a6e" />
            <text x="230" y="174" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#38bdf8" fontFamily="monospace">
              WEST (LIFE SUPPORT)
            </text>
            <text x="230" y="248" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
              RO & Greywater Intake
            </text>
          </g>

          {/* Module 2: North Sector - Communications & SATCOM Array */}
          <g>
            <rect
              x="320"
              y="25"
              width="160"
              height="80"
              rx="12"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
              className="transition-all hover:fill-slate-900"
            />
            <circle cx="400" cy="70" r="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="400" y="44" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#f8fafc" fontFamily="monospace">
              NORTH RADOME DOME
            </text>
            <text x="400" y="98" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
              SATCOM Ku/Ka Tracking
            </text>
          </g>

          {/* Module 3: Central Core - Habitation, Operations & HVAC */}
          <g>
            <rect
              x="330"
              y="130"
              width="140"
              height="130"
              rx="14"
              fill="#020617"
              stroke={isSelectedGenFailed ? "#f43f5e" : "#0284c7"}
              strokeWidth={isSelectedGenFailed ? "3" : "2"}
              className="transition-all"
            />
            <rect x="340" y="140" width="120" height="22" rx="4" fill="#0f172a" />
            <text x="400" y="155" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffffff" fontFamily="monospace">
              MAIN STATION CORE
            </text>
            <line x1="340" y1="195" x2="460" y2="195" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 2" />
            <text x="400" y="215" textAnchor="middle" fontSize="9" fill="#cbd5e1" fontFamily="monospace">
              Command Deck & Labs
            </text>
            <text x="400" y="240" textAnchor="middle" fontSize="9" fill="#38bdf8" fontFamily="monospace">
              HVAC Loop ({derived.heatingLoadKw} kW)
            </text>
          </g>

          {/* Module 4: East Wing - Microgrid & Diesel Generators */}
          <g>
            <rect
              x="530"
              y="110"
              width="190"
              height="100"
              rx="12"
              fill="#451a03"
              stroke={isSelectedGenFailed ? "#f43f5e" : "#d97706"}
              strokeWidth={isSelectedGenFailed ? "3" : "2"}
              className="transition-all hover:fill-amber-950"
            />
            <rect x="540" y="120" width="170" height="20" rx="4" fill="#78350f" />
            <text x="625" y="134" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fde68a" fontFamily="monospace">
              EAST POWER HOUSE (MICROGRID)
            </text>
            <text x="625" y="196" textAnchor="middle" fontSize="9" fill="#fcd34d" fontFamily="monospace">
              Primary Gen #1 & Aux Gen #2
            </text>
          </g>

          {/* Module: BESS Battery Storage Subsystem */}
          <g 
            onClick={() => onSelectAsset(isBharati ? 'bhr-battery-1' : 'mtr-battery-1')}
            className="cursor-pointer group"
          >
            <rect
              x="330"
              y="280"
              width="150"
              height="80"
              rx="10"
              fill={selectedAssetId?.includes('battery') ? "#065F46" : "#064E3B"}
              stroke={selectedAssetId?.includes('battery') ? "#00B8E6" : derived.batterySocPercent < 40 ? "#E53935" : "#10B981"}
              strokeWidth={selectedAssetId?.includes('battery') ? "3" : "2"}
              className="transition-all group-hover:fill-emerald-950"
            />
            <rect x="340" y="290" width="130" height="18" rx="4" fill="#065f46" />
            <text x="405" y="303" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#a7f3d0" fontFamily="monospace">
              BESS BATTERY STORAGE
            </text>
            <text x="405" y="332" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#34d399" fontFamily="monospace">
              {derived.batterySocPercent}% SOC ({derived.batteryStatus.toUpperCase()})
            </text>
            <text x="405" y="350" textAnchor="middle" fontSize="8.5" fill="#6ee7b7" fontFamily="monospace">
              Usable: 450 kWh Buffer (Click)
            </text>
          </g>

          {/* Module 5: South Sector - Fuel Depot & Bulk Storage */}
          <g>
            <rect
              x="530"
              y="270"
              width="190"
              height="100"
              rx="12"
              fill="#4c0519"
              stroke={isSelectedGenFailed ? "#f43f5e" : "#e11d48"}
              strokeWidth={isSelectedGenFailed ? "3" : "2"}
              className="transition-all hover:fill-rose-950"
            />
            <rect x="540" y="280" width="170" height="20" rx="4" fill="#881337" />
            <text x="625" y="294" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fecdd3" fontFamily="monospace">
              SOUTH CRYOGENIC FUEL DEPOT
            </text>
            <text x="625" y="356" textAnchor="middle" fontSize="9" fill="#fda4af" fontFamily="monospace">
              Aviation Turbine Fuel ({derived.fuelRunwayDays}d runway)
            </text>
          </g>

          {/* Interactive Hotspot Nodes for Assets */}
          {assets.map((asset) => {
            const pos = ASSET_SCHEMATIC_POSITIONS[asset.assetId] || { x: 400, y: 200, zone: asset.building, icon: Cpu };
            const isSelected = selectedAssetId === asset.assetId;
            const isHovered = hoveredAssetId === asset.assetId;
            const isWarning = asset.status === 'warning';
            const isCritical = asset.status === 'critical' || asset.status === 'offline';
            const isGen2Failed = asset.assetId.includes('gen-02') && activeInjectedEvents.generator2Failure;

            const statusFill = (isGen2Failed || isCritical) ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';

            return (
              <g
                key={asset.assetId}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectAsset(asset.assetId)}
                onMouseEnter={() => setHoveredAssetId(asset.assetId)}
                onMouseLeave={() => setHoveredAssetId(null)}
                className="cursor-pointer group"
              >
                {/* Animated Pulsing Beacon Ring */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? "22" : "16"}
                  fill={statusFill}
                  opacity={isSelected ? "0.4" : "0.2"}
                  className="animate-ping"
                />

                {/* Outer Selection Highlight Ring */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="20"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? "14" : "11"}
                  fill={isSelected ? "#0284c7" : "#0f172a"}
                  stroke={statusFill}
                  strokeWidth={isSelected ? "3" : "2.5"}
                  className="transition-all duration-200 group-hover:scale-125"
                />

                {/* Inner Status Dot */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? "5" : "4"}
                  fill={isSelected ? "#ffffff" : statusFill}
                />

                {/* Asset Label Pill Badge */}
                <g transform="translate(0, 22)">
                  <rect
                    x="-45"
                    y="-8"
                    width="90"
                    height="16"
                    rx="8"
                    fill={isSelected ? "#0284c7" : "#0f172a"}
                    stroke={isSelected ? "#38bdf8" : "#334155"}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="bold"
                    fill="#ffffff"
                    fontFamily="monospace"
                  >
                    {asset.name.split(' ')[0]} {asset.name.split(' ')[1] || ''}
                  </text>
                </g>

                {/* Tooltip Card on Hover */}
                {isHovered && !isSelected && (
                  <g transform="translate(18, -45)" className="pointer-events-none z-50">
                    <rect
                      x="0"
                      y="0"
                      width="160"
                      height="64"
                      rx="6"
                      fill="#020617"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                    <text x="8" y="16" fontSize="10" fontWeight="bold" fill="#ffffff" fontFamily="monospace">
                      {asset.name}
                    </text>
                    <text x="8" y="32" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                      Health: {isGen2Failed ? '0%' : `${asset.health}%`} • {isGen2Failed ? 'OFFLINE' : asset.status.toUpperCase()}
                    </text>
                    <text x="8" y="47" fontSize="9" fill="#38bdf8" fontFamily="monospace">
                      Click to inspect causal links →
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Blueprint Legend Floating Bar */}
        <div className="absolute bottom-3 left-3 bg-polar-900/95 backdrop-blur-sm border border-polar-border px-3 py-1.5 rounded-lg shadow-sm font-mono text-[11px] flex items-center gap-4 text-slate-300">
          <span className="font-bold text-white flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Hotspot Legend:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Operational
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Critical / Tripped
          </span>
        </div>

        {/* Active Node Counter Indicator */}
        <div className="absolute bottom-3 right-3 bg-polar-900/95 backdrop-blur-sm border border-polar-border px-2.5 py-1 rounded-lg shadow-sm font-mono text-[10px] text-slate-400">
          Spatial Twin Hotspots: {assets.length} Nodes
        </div>
      </div>

      {/* ============================================================== */}
      {/* PHASE 8: CAUSAL RELATIONSHIP BANNER WHEN FAILED GEN SELECTED   */}
      {/* ============================================================== */}
      {isSelectedGenFailed && (
        <div className="p-3 bg-rose-950/90 border-t border-rose-600/60 text-rose-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
            <span className="font-bold">CAUSAL COUPLING IMPACT:</span>
            <span className="text-[11px]">
              Genset #2 Trip → <strong>{Math.abs(derived.powerSurplusDeficitKw)} kW Microgrid Deficit</strong> → Battery Discharging ({derived.batterySocPercent}%) → Fuel burn shifts to Gen #1 → Resupply gap escalated.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase bg-rose-900/80 px-2 py-0.5 rounded border border-rose-400">
            Affected Alerts: {activeAlerts.length}
          </span>
        </div>
      )}

      {/* Quick Asset Selector Grid Underneath Blueprint */}
      <div className="p-3 bg-polar-900/80 border-t border-polar-border">
        {(() => {
          const displayAssets = [...assets];
          if (!displayAssets.some(a => a.assetId.includes('battery'))) {
            displayAssets.push({
              assetId: isBharati ? 'bhr-battery-1' : 'mtr-battery-1',
              stationId,
              name: 'BESS Battery Bank (450 kWh)',
              type: 'battery' as any,
              building: 'Power Substation Core',
              status: (derived.batterySocPercent < 25 ? 'critical' : derived.batterySocPercent < 50 ? 'warning' : 'running') as any,
              health: derived.batterySocPercent,
              metrics: {},
              alerts: [],
              lastServiced: '2026-09-15',
              nextServiceDue: '2026-12-15',
              updatedAt: new Date().toISOString()
            });
          }

          return (
            <>
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span>Click any station subsystem below or on the schematic above:</span>
                <span className="text-cyan-400 font-semibold">{displayAssets.length} Connected Subsystems</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                {displayAssets.map((asset) => {
                  const isSelected = selectedAssetId === asset.assetId;
                  const isWarning = asset.status === 'warning';
                  const isCritical = asset.status === 'critical' || asset.status === 'offline';
                  const isGen2Failed = asset.assetId.includes('gen-02') && activeInjectedEvents.generator2Failure;

                  return (
                    <button
                      key={asset.assetId}
                      onClick={() => onSelectAsset(asset.assetId)}
                      className={`p-2 rounded-lg border text-left font-mono transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? 'border-cyan-400 bg-polar-800 ring-1 ring-cyan-400/50 shadow-md'
                          : isGen2Failed || isCritical
                          ? 'border-rose-700 bg-rose-950/60 hover:bg-rose-900/40'
                          : isWarning
                          ? 'border-amber-700 bg-amber-950/60 hover:bg-amber-900/40'
                          : 'border-polar-border bg-polar-950 hover:bg-polar-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 truncate">
                          {asset.type.replace('_', ' ')}
                        </span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isGen2Failed || isCritical ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                      </div>
                      <span className="font-bold text-white text-[11px] truncate">{asset.name}</span>
                      <div className="mt-1.5 pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Health:</span>
                        <span className={`font-bold ${
                          isGen2Failed ? 'text-rose-400' :
                          asset.health >= 80 ? 'text-emerald-400' : asset.health >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {isGen2Failed ? '0%' : `${asset.health}%`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
