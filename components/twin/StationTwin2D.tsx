'use client';

import React, { useState } from 'react';
import { StationAsset, StationId } from '@/types';
import { 
  Zap, 
  Thermometer, 
  Droplets, 
  Radio, 
  Fuel, 
  Wind, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Cpu,
  Layers,
  Compass,
  Crosshair
} from 'lucide-react';

interface StationTwin2DProps {
  stationId: StationId;
  assets: StationAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
}

// Coordinate layout mapping for 2D schematic blueprint (percentages in SVG viewbox 800x480)
const ASSET_SCHEMATIC_POSITIONS: Record<string, { x: number; y: number; zone: string; icon: React.ComponentType<{ className?: string }> }> = {
  // Bharati Assets
  'bhr-gen-1': { x: 580, y: 150, zone: 'Power Generation Module', icon: Zap },
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
}: StationTwin2DProps) {
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);

  const isBharati = stationId === 'bharati';
  const stationTitle = isBharati ? 'Bharati Research Station' : 'Maitri Research Station';
  const stationRegion = isBharati ? 'Larsemann Hills (69°S, 76°E)' : 'Schirmacher Oasis (70°S, 11°E)';

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {/* 2D Blueprint Header Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-sky-100 text-sky-700">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wider">{stationTitle}</span>
            <span className="text-slate-500 ml-2">2D Architectural Blueprint • {stationRegion}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            2D Vector Telemetry Live
          </span>
          <span className="text-slate-400">Scale: 1:250 CAD Orthographic</span>
        </div>
      </div>

      {/* Main 2D Interactive Blueprint SVG Canvas */}
      <div className="relative w-full h-[400px] md:h-[460px] bg-slate-50/60 overflow-hidden select-none">
        {/* Subtle CAD Blueprint Grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cad-small-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>
            <pattern id="cad-large-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#cad-small-grid)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
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
            <circle cx="0" cy="0" r="28" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="-28" x2="0" y2="28" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="-28" y1="0" x2="28" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="0" y="-32" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0284c7" fontFamily="monospace">N</text>
            <text x="0" y="40" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">S</text>
            <text x="36" y="3" textAnchor="start" fontSize="9" fill="#64748b" fontFamily="monospace">E</text>
            <text x="-36" y="3" textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">W</text>
          </g>

          {/* Ice / Terrain Elevation Boundary */}
          <path
            d="M 50 420 Q 250 370 450 410 T 750 390"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text x="80" y="440" fontSize="10" fill="#60a5fa" fontFamily="monospace">ICE SHELF PERIMETER / HARD PACKED BEDROCK</text>

          {/* Station Enclosed Heated Corridors (Inter-module conduits) */}
          <path
            d="M 230 200 L 400 200 L 400 70 M 400 200 L 620 200 L 620 150 M 620 200 L 630 320"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
          />
          <path
            d="M 230 200 L 400 200 L 400 70 M 400 200 L 620 200 L 620 150 M 620 200 L 630 320"
            fill="none"
            stroke="#0284c7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Module 1: West Wing - Water & Life Support Facility */}
          <g>
            <rect
              x="160"
              y="150"
              width="140"
              height="110"
              rx="12"
              fill="#f0f9ff"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="none"
              className="transition-all hover:fill-sky-100"
            />
            <rect x="170" y="160" width="120" height="20" rx="4" fill="#e0f2fe" />
            <text x="230" y="174" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0369a1" fontFamily="monospace">
              WEST MODULE (LIFE SUPPORT)
            </text>
            <text x="230" y="248" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
              RO Filtration & Greywater
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
              fill="#f8fafc"
              stroke="#64748b"
              strokeWidth="2"
              className="transition-all hover:fill-slate-100"
            />
            <circle cx="400" cy="70" r="24" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="400" y="44" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a" fontFamily="monospace">
              NORTH RADOME DOME
            </text>
            <text x="400" y="98" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
              Ku/Ka Band SATCOM Tracking
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
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="2.5"
              className="transition-all shadow-md"
            />
            <rect x="340" y="140" width="120" height="22" rx="4" fill="#f1f5f9" />
            <text x="400" y="155" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a" fontFamily="monospace">
              MAIN STATION CORE
            </text>
            <line x1="340" y1="195" x2="460" y2="195" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 2" />
            <text x="400" y="215" textAnchor="middle" fontSize="9" fill="#475569" fontFamily="monospace">
              Command Deck & Labs
            </text>
            <text x="400" y="240" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
              Air Scrubbers / HVAC Loop
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
              fill="#fffbeb"
              stroke="#d97706"
              strokeWidth="2"
              className="transition-all hover:fill-amber-100/50"
            />
            <rect x="540" y="120" width="170" height="20" rx="4" fill="#fef3c7" />
            <text x="625" y="134" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e" fontFamily="monospace">
              EAST POWER HOUSE (MICROGRID)
            </text>
            <text x="625" y="196" textAnchor="middle" fontSize="9" fill="#78350f" fontFamily="monospace">
              Primary Gen #1 & Aux Gen #2
            </text>
          </g>

          {/* Module 5: South Sector - Fuel Depot & Bulk Storage */}
          <g>
            <rect
              x="540"
              y="270"
              width="180"
              height="100"
              rx="12"
              fill="#fef2f2"
              stroke="#e11d48"
              strokeWidth="2"
              className="transition-all hover:fill-rose-100/50"
            />
            <rect x="550" y="280" width="160" height="20" rx="4" fill="#fee2e2" />
            <text x="630" y="294" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#9f1239" fontFamily="monospace">
              SOUTH CRYOGENIC FUEL DEPOT
            </text>
            <text x="630" y="356" textAnchor="middle" fontSize="9" fill="#881337" fontFamily="monospace">
              Aviation Turbine Fuel & Manifold
            </text>
          </g>

          {/* Interactive Hotspot Nodes for Assets */}
          {assets.map((asset) => {
            const pos = ASSET_SCHEMATIC_POSITIONS[asset.assetId] || { x: 400, y: 200, zone: asset.building, icon: Cpu };
            const isSelected = selectedAssetId === asset.assetId;
            const isHovered = hoveredAssetId === asset.assetId;
            const isWarning = asset.status === 'warning';
            const isCritical = asset.status === 'critical' || asset.status === 'offline';

            const statusFill = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
            const statusStroke = isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#d1fae5';

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
                  opacity={isSelected ? "0.3" : "0.15"}
                  className="animate-ping"
                />

                {/* Outer Selection Highlight Ring */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="20"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? "14" : "11"}
                  fill={isSelected ? "#0284c7" : "#ffffff"}
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
                    fill={isSelected ? "#0f172a" : "#ffffff"}
                    stroke={isSelected ? "#0284c7" : "#cbd5e1"}
                    strokeWidth="1"
                    className="shadow-sm"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="bold"
                    fill={isSelected ? "#ffffff" : "#1e293b"}
                    fontFamily="monospace"
                  >
                    {asset.name.split(' ')[0]} {asset.name.split(' ')[1] || ''}
                  </text>
                </g>

                {/* Interactive Tooltip Card on Hover */}
                {isHovered && !isSelected && (
                  <g transform="translate(18, -45)" className="pointer-events-none">
                    <rect
                      x="0"
                      y="0"
                      width="150"
                      height="58"
                      rx="6"
                      fill="#ffffff"
                      stroke="#94a3b8"
                      strokeWidth="1"
                      className="shadow-lg"
                    />
                    <text x="8" y="16" fontSize="10" fontWeight="bold" fill="#0f172a" fontFamily="monospace">
                      {asset.name}
                    </text>
                    <text x="8" y="32" fontSize="9" fill="#64748b" fontFamily="monospace">
                      Health: {asset.health}% • {asset.status.toUpperCase()}
                    </text>
                    <text x="8" y="47" fontSize="9" fill="#0284c7" fontFamily="monospace">
                      Click to inspect telemetry →
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Blueprint Legend Floating Bar */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm font-mono text-[11px] flex items-center gap-4 text-slate-700">
          <span className="font-bold text-slate-900 flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-sky-600" /> Hotspot Legend:
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
            Critical / Offline
          </span>
        </div>

        {/* Active Node Counter Indicator */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm font-mono text-[10px] text-slate-600">
          Active 2D Hotspots: {assets.length} Nodes
        </div>
      </div>

      {/* Quick Asset Selector Grid Underneath Blueprint */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="text-[11px] font-mono text-slate-500 mb-2 flex items-center justify-between">
          <span>Click any station subsystem below or on the blueprint above to inspect:</span>
          <span className="text-sky-600 font-semibold">{assets.length} Modules in Current Filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {assets.map((asset) => {
            const isSelected = selectedAssetId === asset.assetId;
            const isWarning = asset.status === 'warning';
            const isCritical = asset.status === 'critical' || asset.status === 'offline';

            return (
              <button
                key={asset.assetId}
                onClick={() => onSelectAsset(asset.assetId)}
                className={`p-2 rounded-lg border text-left font-mono transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-300 shadow-sm'
                    : isCritical
                    ? 'border-rose-300 bg-rose-50 hover:bg-rose-100/70'
                    : isWarning
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100/70'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 truncate">
                    {asset.type.replace('_', ' ')}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isCritical ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                </div>
                <span className="font-bold text-slate-800 text-[11px] truncate">{asset.name}</span>
                <div className="mt-1.5 pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Health:</span>
                  <span className={`font-bold ${
                    asset.health >= 80 ? 'text-emerald-700' : asset.health >= 60 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {asset.health}%
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
