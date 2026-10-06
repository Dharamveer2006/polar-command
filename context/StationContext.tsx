'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StationId, 
  User, 
  StationFullState, 
  Alert, 
  Requisition, 
  InventoryItem, 
  ConnectivityStatus, 
  SimulationInputs, 
  SimulationResult,
  AuditLogEntry,
  EdgeQueueItem,
  ActiveScenarios,
  StationMode,
  MissionTimelineEvent
} from '@/types';
import { 
  DEMO_USERS, 
  INITIAL_STATIONS_METADATA, 
  INITIAL_ENVIRONMENT, 
  INITIAL_ENERGY, 
  INITIAL_INFRASTRUCTURE, 
  INITIAL_INVENTORY, 
  INITIAL_REQUISITIONS, 
  INITIAL_ALERTS 
} from '@/mocks/stationData';
import { 
  evaluateStationState, 
  runWhatIfSimulation 
} from '@/lib/calculations';
import { 
  BASELINE_STATION_WEATHER, 
  SATELLITE_LAYERS, 
  detectWeatherEvents, 
  generateStationForecast,
  generateHistoricalWeather,
  convertNormalizedToTelemetry
} from '@/lib/weatherEngine';
import { 
  SatelliteLayerId, 
  SatelliteMetadata, 
  WeatherForecastHorizon, 
  WeatherEventDetection, 
  WeatherState,
  EnvironmentTelemetry,
  DataProvenance,
  NormalizedWeatherResponse,
  HistoricalWeatherObservation,
  EffectiveStationState,
  EffectiveFuelState
} from '@/types';
import { hasPermission } from '@/lib/permissions';
import {
  HardwareFieldSimulator,
  EdgeGatewayManager,
  HardwareCommandDispatcher,
  HardwareScenarioState,
  HardwareNetworkSummary,
  HardwareAssetNode,
  CommandPacket,
  EdgeGateway,
  CommandExecutionResult,
  HardwareCommandType
} from '@/lib/hardware';

interface StationContextType {
  // Station & Auth
  currentStationId: StationId;
  setCurrentStationId: (id: StationId) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  allUsers: User[];

  // Hardware-First Architecture (SIH26060)
  hardwareSimulator: HardwareFieldSimulator;
  hardwareNetwork: HardwareNetworkSummary;
  edgeGateway: EdgeGateway;
  spatialHardwareNodes: HardwareAssetNode[];
  commandHistory: CommandPacket[];
  hardwareScenario: HardwareScenarioState;
  toggleHardwareScenario: (scenario: keyof HardwareScenarioState) => void;
  dispatchHardwareCommand: (params: {
    deviceId: string;
    assetId: string;
    command: HardwareCommandType;
    forceActuatorFailure?: boolean;
  }) => Promise<CommandExecutionResult>;
  syncEdgeGateway: () => Promise<{ syncedPacketsCount: number; executedCommandsCount: number }>;
  selectedHardwareNodeId: string | null;
  setSelectedHardwareNodeId: (id: string | null) => void;
  
  // Single Source of Truth: Canonical Station State
  effectiveStationState: EffectiveStationState;
  allEffectiveStationsState: Record<StationId, EffectiveStationState>;
  stationState: StationFullState;
  derived: StationFullState['derived'];
  allStationsState: Record<StationId, StationFullState>;
  resolvedAlerts: Alert[];
  
  // Realtime & Offline status
  isRealtimeActive: boolean;
  setIsRealtimeActive: (active: boolean) => void;
  connectivity: ConnectivityStatus;
  setConnectivity: (status: ConnectivityStatus) => void;
  lastSyncTime: string;
  triggerManualSync: () => void;
  
  // Edge / Offline Sync State
  edgeQueue: EdgeQueueItem[];
  pendingOperationsCount: number;
  syncNotification: string | null;
  dismissSyncNotification: () => void;

  // Station Mode
  stationMode: StationMode;
  setStationMode: (mode: StationMode) => void;
  missionTimeline: MissionTimelineEvent[];

  // Event Injections (Composable Scenarios)
  activeInjectedEvents: ActiveScenarios;
  toggleInjectedEvent: (event: keyof ActiveScenarios) => void;
  triggerFullCascade: () => void;
  resetAllEvents: () => void;
  
  // Alert Actions (Protected by RBAC)
  acknowledgeAlert: (alertId: string) => boolean;
  resolveAlert: (alertId: string) => boolean;
  
  // Requisitions (Protected by RBAC)
  createRequisition: (req: Omit<Requisition, 'id' | 'createdAt' | 'status' | 'requesterId' | 'requesterName' | 'requesterRole'>) => boolean;
  updateRequisitionStatus: (id: string, status: Requisition['status']) => boolean;
  
  // Simulation
  runSimulation: (inputs: SimulationInputs) => SimulationResult;
  lastSimulationResult: SimulationResult | null;
  
  // Real-Time Polar Weather Engine (SIH26060)
  liveWeather: Record<StationId, EnvironmentTelemetry>;
  normalizedWeather: Record<StationId, NormalizedWeatherResponse | null>;
  weatherHistory: Record<StationId, HistoricalWeatherObservation[]>;
  isWeatherLoading: boolean;
  lastWeatherSync: string | null;
  nextWeatherSync: string | null;
  fetchStationWeather: (targetId?: StationId) => Promise<void>;
  updateLiveWeather: (stationId: StationId, patch: Partial<EnvironmentTelemetry>) => void;
  activeWeatherEvents: WeatherEventDetection[];
  satelliteMetadata: Record<SatelliteLayerId, SatelliteMetadata>;
  activeSatelliteLayer: SatelliteLayerId;
  setActiveSatelliteLayer: (layer: SatelliteLayerId) => void;
  stationForecast: WeatherForecastHorizon[];
  refreshWeather: () => void;

  // Security / RBAC Feedback & Audit Logs
  actionFeedback: { type: 'success' | 'error'; message: string } | null;
  dismissActionFeedback: () => void;
  auditLogs: AuditLogEntry[];
}

const StationContext = createContext<StationContextType | null>(null);

export function StationProvider({ children }: { children: React.ReactNode }) {
  const [currentStationId, setCurrentStationId] = useState<StationId>('bharati');
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]); // Default to Ops
  const [connectivity, setConnectivityState] = useState<ConnectivityStatus>('CONNECTED');
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());

  // Edge queue for offline resilience
  const [edgeQueue, setEdgeQueue] = useState<EdgeQueueItem[]>([]);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Station Mode
  const [stationMode, setStationModeState] = useState<StationMode>('NORMAL');

  // Mission Event Timeline (Section 26: Telemetry -> Alert -> Analysis -> Human Action -> Follow-up)
  const [missionTimeline, setMissionTimeline] = useState<MissionTimelineEvent[]>([
    { id: 'mt-1', time: '06:20', category: 'TELEMETRY', title: 'Synoptic Weather Observation Received', details: 'ECMWF / IMD Synoptic station model decoded with katabatic velocity logging.', stationId: 'bharati' },
    { id: 'mt-2', time: '06:31', category: 'ALERT', title: 'Aux Genset #2 Bearing Telemetry Advisory', details: 'Vibration 2.8 mm/s; bearing temperature delta +4.2°C logged.', stationId: 'bharati' },
    { id: 'mt-3', time: '06:40', category: 'ANALYSIS', title: 'Cross-Domain Risk Engine Evaluated', details: 'Microgrid coupling assessed: potential 190 kW drop if Genset #2 trips.', stationId: 'bharati' },
    { id: 'mt-4', time: '06:43', category: 'HUMAN ACTION', title: 'Station Operator Acknowledged', details: 'SOP-044 electrical pre-start sequence initialized by duty engineer.', stationId: 'bharati' },
    { id: 'mt-5', time: '07:00', category: 'FOLLOW-UP', title: 'Preventative Maintenance Scheduled', details: 'Lubricant oil check & heat exchanger flush scheduled before katabatic window.', stationId: 'bharati' },
    { id: 'mt-6', time: '08:30', category: 'FOLLOW-UP', title: 'Station Inspection Sortie Window', details: 'Outer perimeter thermal seal verification and radome anchor inspection.', stationId: 'bharati' },
  ]);

  // Composable active scenarios state
  const [activeInjectedEvents, setActiveInjectedEvents] = useState<ActiveScenarios>({
    extremeCold: false,
    highWind: false,
    generator2Failure: false,
    resupplyDelay: false,
  });

  // Hardware-First Architecture State (SIH26060)
  const hardwareSimulators = useMemo(() => ({
    maitri: new HardwareFieldSimulator('maitri'),
    bharati: new HardwareFieldSimulator('bharati'),
  }), []);

  const edgeGateways = useMemo(() => ({
    maitri: new EdgeGatewayManager('maitri'),
    bharati: new EdgeGatewayManager('bharati'),
  }), []);

  const commandDispatcher = useMemo(() => new HardwareCommandDispatcher(), []);

  const [hardwareScenario, setHardwareScenario] = useState<HardwareScenarioState>({
    generator2Offline: false,
    pumpVibrationFault: false,
    pressureSensorOffline: false,
    edgeGatewayDisconnected: false,
    bessLowSoc: false,
    fuelTransferFailure: false,
    actuatorStartGenFailure: false,
  });

  const [commandHistory, setCommandHistory] = useState<CommandPacket[]>(() => commandDispatcher.getHistory());
  const [selectedHardwareNodeId, setSelectedHardwareNodeId] = useState<string | null>(null);

  // Realtime continuous physical drift
  const [telemetryDrift, setTelemetryDrift] = useState<Record<StationId, { tempNoise: number; windNoise: number; loadNoise: number }>>({
    maitri: { tempNoise: 0, windNoise: 0, loadNoise: 0 },
    bharati: { tempNoise: 0, windNoise: 0, loadNoise: 0 },
  });

  // Audit trail
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'audit-init-01',
      userId: DEMO_USERS[0].id,
      userName: DEMO_USERS[0].name,
      userRole: DEMO_USERS[0].role,
      action: 'SYSTEM_BOOT',
      entityType: 'STATION',
      entityId: 'ALL',
      details: 'Polar Command Digital Twin telemetry pipeline initialized with deterministic coupling.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const addAuditLog = useCallback((action: string, entityType: AuditLogEntry['entityType'], entityId: string, details: string) => {
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        entityType,
        entityId,
        details,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, [currentUser]);

  // Real-Time Polar Weather Engine
  const [liveWeather, setLiveWeather] = useState<Record<StationId, EnvironmentTelemetry>>(BASELINE_STATION_WEATHER);
  const [activeSatelliteLayer, setActiveSatelliteLayer] = useState<SatelliteLayerId>('true-color');
  const [normalizedWeather, setNormalizedWeather] = useState<Record<StationId, NormalizedWeatherResponse | null>>({
    maitri: null,
    bharati: null,
  });
  const [weatherHistory, setWeatherHistory] = useState<Record<StationId, HistoricalWeatherObservation[]>>({
    maitri: generateHistoricalWeather('maitri'),
    bharati: generateHistoricalWeather('bharati'),
  });
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [lastWeatherSync, setLastWeatherSync] = useState<string | null>(null);
  const [nextWeatherSync, setNextWeatherSync] = useState<string | null>(null);

  const fetchStationWeather = useCallback(async (targetId?: StationId) => {
    if (connectivity === 'DISCONNECTED') {
      // Offline behavior (Req 15): retain last valid observation, mark as STALE
      setLiveWeather(prev => ({
        maitri: { ...prev.maitri, weatherState: 'STALE' },
        bharati: { ...prev.bharati, weatherState: 'STALE' },
      }));
      return;
    }

    const stationsToFetch: StationId[] = targetId ? [targetId] : ['maitri', 'bharati'];
    setIsWeatherLoading(true);
    try {
      for (const sId of stationsToFetch) {
        const res = await fetch(`/api/weather/${sId}`, { cache: 'no-store' });
        if (res.ok) {
          const data: NormalizedWeatherResponse = await res.json();
          setNormalizedWeather(prev => ({ ...prev, [sId]: data }));
          const telemetry = convertNormalizedToTelemetry(data);
          setLiveWeather(prev => ({ ...prev, [sId]: telemetry }));

          const newObs: HistoricalWeatherObservation = {
            timestamp: data.observedAt || data.receivedAt,
            station: sId,
            temperatureC: data.temperatureC,
            pressureHpa: data.pressureHpa,
            humidityPercent: data.humidityPercent,
            windKnots: data.windKnots,
            windKmh: data.windKmh,
            windDirectionDeg: data.windDirectionDeg,
            source: data.source,
            status: data.status,
          };

          setWeatherHistory(prev => {
            const currentHist = prev[sId] || [];
            const updated = [newObs, ...currentHist.filter(h => h.timestamp !== newObs.timestamp)].slice(0, 48);
            return { ...prev, [sId]: updated };
          });
        } else {
          // Upstream API routes not available on static hosting (e.g. GitHub Pages)
          // Explicitly label as FALLBACK / SYNTHETIC PROTOTYPE - do not label as LIVE
          setLiveWeather(prev => ({
            ...prev,
            [sId]: {
              ...prev[sId],
              weatherState: 'FALLBACK',
              source: 'Synthetic Telemetry',
              primarySource: 'NCPOR Synthetic Baseline Model',
            }
          }));
        }
      }
      const now = new Date();
      setLastWeatherSync(now.toISOString());
      setNextWeatherSync(new Date(now.getTime() + 180000).toISOString());
    } catch {
      // Static export or client network catch: fallback to synthetic baseline
      setLiveWeather(prev => ({
        maitri: {
          ...prev.maitri,
          weatherState: 'FALLBACK',
          source: 'Synthetic Telemetry',
          primarySource: 'NCPOR Synthetic Baseline Model',
        },
        bharati: {
          ...prev.bharati,
          weatherState: 'FALLBACK',
          source: 'Synthetic Telemetry',
          primarySource: 'NCPOR Synthetic Baseline Model',
        }
      }));
    } finally {
      setIsWeatherLoading(false);
    }
  }, [connectivity]);

  // Initial fetch and 3-minute polling (2-5 minutes requirement)
  useEffect(() => {
    fetchStationWeather();
    const interval = setInterval(() => {
      fetchStationWeather();
    }, 180000);
    return () => clearInterval(interval);
  }, [fetchStationWeather]);

  const updateLiveWeather = useCallback((stationId: StationId, patch: Partial<EnvironmentTelemetry>) => {
    setLiveWeather(prev => {
      const current = prev[stationId] || BASELINE_STATION_WEATHER[stationId];
      const newT = patch.temperatureC !== undefined ? patch.temperatureC : current.temperatureC;
      const newW = patch.windKmh !== undefined ? patch.windKmh : (patch.windMs !== undefined ? Math.round(patch.windMs * 3.6) : current.windKmh);
      const newMs = patch.windMs !== undefined ? patch.windMs : Number((newW / 3.6).toFixed(1));
      const newP = patch.pressureHpa !== undefined ? patch.pressureHpa : current.pressureHpa;
      const newVis = patch.visibilityKm !== undefined ? patch.visibilityKm : current.visibilityKm;
      const newChill = Number((newT - (newW * 0.18)).toFixed(1));

      const updated: EnvironmentTelemetry = {
        ...current,
        ...patch,
        temperatureC: newT,
        windKmh: newW,
        windMs: newMs,
        windKnots: patch.windKnots !== undefined ? patch.windKnots : Number((newW / 1.852).toFixed(1)),
        pressureHpa: newP,
        visibilityKm: newVis,
        windChillC: newChill,
        source: patch.source || current.source,
        weatherState: (connectivity === 'DISCONNECTED' ? 'STALE' : (patch.weatherState || current.weatherState || 'LIVE')) as WeatherState,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const detected = detectWeatherEvents(updated, current, weatherHistory[stationId]);
      updated.activeWeatherEvents = detected;

      addAuditLog('WEATHER_UPDATE', 'STATION', stationId, `Weather updated: ${newT}°C, ${newW} km/h (${newMs} m/s)`);
      return { ...prev, [stationId]: updated };
    });
  }, [connectivity, addAuditLog, weatherHistory]);

  const refreshWeather = useCallback(() => {
    fetchStationWeather();
  }, [fetchStationWeather]);

  const currentStationForecast = useMemo(() => {
    const curEnv = liveWeather[currentStationId] || BASELINE_STATION_WEATHER[currentStationId];
    return generateStationForecast(curEnv, currentStationId);
  }, [liveWeather, currentStationId]);

  // Mutable collections (Requisitions & Alerts)
  const [requisitions, setRequisitions] = useState<Requisition[]>(INITIAL_REQUISITIONS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [lastSimulationResult, setLastSimulationResult] = useState<SimulationResult | null>(null);

  // Phase 1 — Central Evaluation Pipeline Builder
  const buildStationFullState = useCallback((stationId: StationId): StationFullState => {
    const meta = {
      ...INITIAL_STATIONS_METADATA[stationId],
      connectivityState: connectivity,
      lastSync: lastSyncTime,
    };

    const rawEnv = liveWeather[stationId] || BASELINE_STATION_WEATHER[stationId];
    const baseEnv: EnvironmentTelemetry = {
      ...rawEnv,
      weatherState: connectivity === 'DISCONNECTED' ? 'STALE' : rawEnv.weatherState || 'LIVE',
      source: connectivity === 'DISCONNECTED' ? ('Synthetic Fallback' as DataProvenance) : rawEnv.source,
    };
    const baseEnergy = INITIAL_ENERGY[stationId];
    const baseInfra = INITIAL_INFRASTRUCTURE[stationId];
    const baseInventory = INITIAL_INVENTORY[stationId];
    const drift = telemetryDrift[stationId] || { tempNoise: 0, windNoise: 0, loadNoise: 0 };

    // Deterministic state derivation
    const evaluated = evaluateStationState(
      baseEnv,
      baseEnergy,
      baseInfra,
      baseInventory,
      activeInjectedEvents,
      drift,
      stationId
    );

    // Weather metadata & event detection attachment
    const detectedWeatherEvents = detectWeatherEvents(evaluated.environment, rawEnv, weatherHistory[stationId]);
    evaluated.environment.activeWeatherEvents = detectedWeatherEvents;
    evaluated.environment.windMs = Number((evaluated.environment.windKmh / 3.6).toFixed(1));
    evaluated.environment.windKnots = baseEnv.windKnots || Number((evaluated.environment.windKmh / 1.852).toFixed(1));
    evaluated.environment.windChillC = Number((evaluated.environment.temperatureC - (evaluated.environment.windKmh * 0.18)).toFixed(1));
    evaluated.environment.weatherState = baseEnv.weatherState;
    evaluated.environment.primarySource = baseEnv.primarySource;
    evaluated.environment.secondarySource = baseEnv.secondarySource;
    evaluated.environment.forecastSource = baseEnv.forecastSource;
    evaluated.environment.sourceLatencySec = baseEnv.sourceLatencySec;
    evaluated.environment.observedAt = baseEnv.observedAt;
    evaluated.environment.receivedAt = baseEnv.receivedAt;
    evaluated.environment.latency = baseEnv.latency;
    evaluated.environment.lastUpdated = baseEnv.lastUpdated;
    evaluated.environment.nextUpdate = baseEnv.nextUpdate;

    const stationReqs = requisitions.filter(r => r.stationId === stationId);
    
    // Merge baseline alerts with active scenario dynamic alerts
    const dynamicAlerts: Alert[] = [];
    if (detectedWeatherEvents.length > 0) {
      detectedWeatherEvents.forEach((wev, idx) => {
        dynamicAlerts.push({
          alertId: `ALT-WTR-${wev.type}-${stationId}-${idx}`,
          stationId,
          severity: wev.severity,
          domain: 'environment',
          title: `Weather Alert: ${wev.title}`,
          cause: [wev.description, wev.rateOfChange || 'Polar atmospheric shift'],
          affectedAssets: [`${stationId}-hvac-01`],
          recommendations: [wev.operationalImpact],
          acknowledged: false,
          createdAt: wev.detectedAt,
        });
      });
    }
    if (activeInjectedEvents.extremeCold) {
      dynamicAlerts.push({
        alertId: `ALT-DYN-COLD-${stationId}`,
        stationId,
        severity: 'critical',
        domain: 'cross-domain',
        title: `Severe Antarctic Cold Snap (-12°C Offset) - Thermal Overdrive`,
        cause: [
          `Ambient temperature plunged to ${evaluated.environment.temperatureC}°C`,
          `HVAC heating draw surged to ${evaluated.energy.heatingLoadKw} kW`,
          `Accelerated fuel burn rate: ${evaluated.derived.dailyFuelBurnLitres} L/day`,
        ],
        affectedAssets: [`${stationId}-hvac-01`, `${stationId}-gen-01`],
        recommendations: [
          'Engage secondary heat exchanger loop',
          'Deploy thermal night-shutters across station perimeter',
        ],
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (activeInjectedEvents.highWind) {
      dynamicAlerts.push({
        alertId: `ALT-DYN-WIND-${stationId}`,
        stationId,
        severity: 'critical',
        domain: 'environment',
        title: `Katabatic Storm & Blizzard Alert (${evaluated.environment.windKmh} km/h)`,
        cause: [
          `Sustained katabatic wind front exceeding 80 km/h threshold`,
          `Outdoor visibility collapsed to ${evaluated.environment.visibilityKm} km`,
        ],
        affectedAssets: [`${stationId}-sat-01`],
        recommendations: [
          'Enforce strict station lockdown; prohibit all outdoor sorties',
          'Stow satellite tracking dish into wind-park position',
        ],
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (activeInjectedEvents.generator2Failure) {
      dynamicAlerts.push({
        alertId: `ALT-DYN-GEN2-${stationId}`,
        stationId,
        severity: 'critical',
        domain: 'energy',
        title: `Generator #2 Emergency Trip / Mechanical Lockout`,
        cause: [
          `Genset #2 taken offline: station lost 190 kW generation capacity`,
          `Microgrid power deficit of ${Math.abs(evaluated.derived.powerBalanceKw)} kW discharging battery reserve`,
        ],
        affectedAssets: [`${stationId}-gen-02`],
        recommendations: [
          'Immediately start cold-reserve backup Genset #4',
          'Execute Tier-3 load shedding protocol (-65 kW)',
        ],
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
    }

    if (activeInjectedEvents.resupplyDelay) {
      dynamicAlerts.push({
        alertId: `ALT-DYN-RESUPPLY-${stationId}`,
        stationId,
        severity: 'warning',
        domain: 'logistics',
        title: `Pack-Ice Navigation Obstruction: Vessel MV Vasiliy Golovnin Delayed (+12d)`,
        cause: [
          `Multi-year pack ice obstruction at coastal approach`,
          `Vessel arrival pushed back +12 days beyond safety buffer`,
          `Fuel runway margin reduced below mandatory 14-day winter threshold`,
        ],
        affectedAssets: [`${stationId}-fuel-01`],
        recommendations: [
          'Issue Emergency Air-Drop / Ski-Plane Fuel Requisition',
          'Enact strict thermal setpoint rationing (-1.5°C)',
        ],
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Hardware-First Scenarios Integration (SIH26060 Requirements 8, 10, 20, 21, 28)
    if (hardwareScenario.pumpVibrationFault) {
      dynamicAlerts.push({
        alertId: `ALT-DYN-PUMP-VIB-${stationId}`,
        stationId,
        severity: 'warning',
        domain: 'infrastructure',
        title: `Water Pump #1 Triaxial Vibration Warning (4.8 mm/s - ISO 10816 Zone D)`,
        cause: [
          `Vibration surged to 4.8 mm/s on primary pump drive bearing`,
          `Suction pressure variance detected (2.7 bar vs nominal 3.4 bar)`,
          `Hydraulic flow reduced to 98 Lpm: Mechanical degradation risk`,
        ],
        affectedAssets: [`${stationId}-water-1`],
        recommendations: [
          'Shift primary water extraction loop to standby pump',
          'Inspect impeller cavitation and bearing lubricant viscosity',
          'Place Life Support thermal trace loop on WATCH',
        ],
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });

      // Update physical assets in evaluated state (Single Source of Truth)
      evaluated.infrastructure.assets = evaluated.infrastructure.assets.map(asset => {
        if (asset.type === 'water_pump') {
          return {
            ...asset,
            status: 'warning',
            health: 42,
            metrics: {
              ...asset.metrics,
              vibrationMmSec: 4.8,
              vibrationMmS: 4.8,
              pressureBar: 2.7,
              flowRateLpm: 98,
            },
            alerts: ['Vibration 4.8 mm/s (Zone D) + Pressure deviation = Mechanical wear risk'],
          };
        }
        return asset;
      });
      evaluated.infrastructure.waterPumpHealth = 42;
      evaluated.healthScore.infrastructureScore = Math.max(30, evaluated.healthScore.infrastructureScore - 22);
      evaluated.healthScore.overall = Math.round(
        (evaluated.healthScore.environmentScore * 0.20) +
        (evaluated.healthScore.energyScore * 0.30) +
        (evaluated.healthScore.infrastructureScore * 0.25) +
        (evaluated.healthScore.logisticsScore * 0.25)
      );
    }

    if (hardwareScenario.pressureSensorOffline) {
      dynamicAlerts.push({
        alertId: `ALT-DYN-SENSOR-FAULT-${stationId}`,
        stationId,
        severity: 'warning',
        domain: 'infrastructure',
        title: `Instrumentation Fault: Pump #1 Discharge Pressure Sensor Offline`,
        cause: [
          `Transducer circuit open on sensor ${stationId === 'bharati' ? 'BHR' : 'MTR'}-PUMP-01-PRES`,
          `Data quality degraded to UNCERTAIN / FAULT`,
          `Real physical equipment health is UNKNOWN — false alarm prevention interlock active`,
        ],
        affectedAssets: [`${stationId}-water-1`],
        recommendations: [
          'Dispatch instrumentation technician to pumphouse junction box',
          'Verify analog 4-20mA loop continuity',
          'Do NOT trip primary pump until physical telemetry verified',
        ],
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });

      evaluated.infrastructure.assets = evaluated.infrastructure.assets.map(asset => {
        if (asset.type === 'water_pump') {
          return {
            ...asset,
            health: 0,
            metrics: {
              ...asset.metrics,
              pressureBar: 0,
            },
            alerts: ['Discharge pressure sensor offline: DATA QUALITY DEGRADED (Health Unknown)'],
          };
        }
        return asset;
      });
    }

    if (hardwareScenario.actuatorStartGenFailure) {
      dynamicAlerts.push({
        alertId: `ALT-DYN-ACTUATOR-FAULT-${stationId}`,
        stationId,
        severity: 'critical',
        domain: 'energy',
        title: `Actuator Start Failure: Genset #2 Auxiliary Starter Contactor Trip`,
        cause: [
          `Operator command START was ACKNOWLEDGED by gateway but EXECUTED FAILED`,
          `Main breaker failed to close due to starter solenoid coil interlock`,
          `Genset #2 remains in lock-out offline state`,
        ],
        affectedAssets: [`${stationId}-gen-02`],
        recommendations: [
          'Inspect generator main breaker auxiliary contacts',
          'Verify 24V DC starting battery bank voltage',
          'Keep cold-reserve Genset #4 on high standby',
        ],
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Merge dynamic alerts with state overrides to support complete workflow: ACTIVE -> ACKNOWLEDGED -> RESOLVED
    const candidateMap = new Map<string, Alert>();
    
    // 1. Persistent alerts from alerts state (includes acknowledgements & resolutions)
    alerts.filter(a => a.stationId === stationId).forEach(a => {
      candidateMap.set(a.alertId, a);
    });

    // 2. Dynamic alerts from active scenarios and weather triggers
    dynamicAlerts.forEach(dAlert => {
      const existing = candidateMap.get(dAlert.alertId);
      if (existing) {
        candidateMap.set(dAlert.alertId, {
          ...dAlert,
          acknowledged: existing.acknowledged,
          status: existing.status || (existing.acknowledged ? 'acknowledged' : 'active'),
          acknowledgedBy: existing.acknowledgedBy,
          acknowledgedAt: existing.acknowledgedAt,
        });
      } else {
        candidateMap.set(dAlert.alertId, {
          ...dAlert,
          acknowledged: false,
          status: 'active',
        });
      }
    });

    const activeStationAlerts: Alert[] = [];
    const resolvedStationAlerts: Alert[] = [];

    candidateMap.forEach(al => {
      if (al.status === 'resolved') {
        resolvedStationAlerts.push(al);
      } else {
        activeStationAlerts.push(al);
      }
    });

    // Section 9: Station Mode Operational Effects
    if (stationMode === 'POWER CONSERVATION') {
      const loadShedKw = 45;
      evaluated.energy.demandKw = Math.max(160, evaluated.energy.demandKw - loadShedKw);
      evaluated.energy.nonCriticalLoadKw = 0;
      evaluated.derived.totalDemandKw = evaluated.energy.demandKw;
      evaluated.derived.powerBalanceKw = evaluated.derived.generationCapacityKw - evaluated.derived.totalDemandKw;
      evaluated.derived.powerSurplusDeficitKw = evaluated.derived.powerBalanceKw;
      evaluated.derived.batteryStatus = evaluated.derived.powerBalanceKw >= 0 ? 'charging' : 'nominal';
      evaluated.derived.dailyFuelBurnLitres = Math.round(evaluated.derived.dailyFuelBurnLitres * 0.84);
      if (evaluated.derived.dailyFuelBurnLitres > 0) {
        evaluated.derived.fuelRunwayDays = Number((evaluated.energy.fuelLitres / evaluated.derived.dailyFuelBurnLitres).toFixed(1));
      }
    } else if (stationMode === 'SCIENCE OPERATIONS') {
      const scienceLoadKw = 20;
      evaluated.energy.demandKw += scienceLoadKw;
      evaluated.derived.totalDemandKw += scienceLoadKw;
      evaluated.derived.powerBalanceKw -= scienceLoadKw;
      evaluated.derived.powerSurplusDeficitKw -= scienceLoadKw;
    }

    return {
      metadata: meta,
      environment: evaluated.environment,
      energy: evaluated.energy,
      infrastructure: evaluated.infrastructure,
      logistics: {
        inventory: evaluated.inventory,
        requisitions: stationReqs,
        source: 'Derived Calculation',
      },
      healthScore: evaluated.healthScore,
      activeAlerts: activeStationAlerts,
      resolvedAlerts: resolvedStationAlerts,
      derived: evaluated.derived,
      lastEvaluatedAt: new Date().toISOString(),
    };
  }, [connectivity, lastSyncTime, activeInjectedEvents, hardwareScenario, telemetryDrift, requisitions, alerts, stationMode]);

  // Phase 3 — Composable Scenario Toggling
  const toggleInjectedEvent = useCallback((eventKey: keyof ActiveScenarios) => {
    setActiveInjectedEvents(prev => {
      const nextVal = !prev[eventKey];
      const updated = { ...prev, [eventKey]: nextVal };
      addAuditLog('TOGGLE_SCENARIO', 'STATION', currentStationId, `Scenario ${eventKey} set to ${nextVal}`);
      return updated;
    });
  }, [currentStationId, addAuditLog]);

  const resetAllEvents = useCallback(() => {
    setActiveInjectedEvents({
      extremeCold: false,
      highWind: false,
      generator2Failure: false,
      resupplyDelay: false,
    });
    setTelemetryDrift({
      maitri: { tempNoise: 0, windNoise: 0, loadNoise: 0 },
      bharati: { tempNoise: 0, windNoise: 0, loadNoise: 0 },
    });
    setAlerts(INITIAL_ALERTS);
    addAuditLog('RESET_SCENARIOS', 'STATION', currentStationId, 'All composable scenarios reset to nominal baseline.');
  }, [currentStationId, addAuditLog]);

  const triggerFullCascade = useCallback(() => {
    setActiveInjectedEvents({
      extremeCold: true,
      highWind: true,
      generator2Failure: true,
      resupplyDelay: true,
    });
    addAuditLog('CASCADE_SCENARIOS', 'STATION', currentStationId, 'Simultaneous multi-domain cascade triggered (Cold + Wind + Gen2 + Resupply).');
  }, [currentStationId, addAuditLog]);

  // Phase 2 — Physically Coupled Realtime Telemetry Drift Tick
  useEffect(() => {
    if (!isRealtimeActive || connectivity === 'DISCONNECTED') return;

    const interval = setInterval(() => {
      // In intermittent mode, randomly simulate packet loss (~30% of ticks dropped)
      if (connectivity === 'INTERMITTENT' && Math.random() < 0.3) {
        return;
      }

      setLastSyncTime(new Date().toISOString());

      // Update small deterministic drift (bounded within +/- 0.4°C, +/- 3 km/h, +/- 5 kW)
      setTelemetryDrift(prev => {
        const next = { ...prev };
        (['maitri', 'bharati'] as StationId[]).forEach(id => {
          const current = next[id] || { tempNoise: 0, windNoise: 0, loadNoise: 0 };
          const dTemp = (Math.random() - 0.5) * 0.15;
          const dWind = Math.round((Math.random() - 0.5) * 1.5);
          const dLoad = Math.round((Math.random() - 0.5) * 3);

          next[id] = {
            tempNoise: Number(Math.max(-0.8, Math.min(0.8, current.tempNoise + dTemp)).toFixed(2)),
            windNoise: Math.max(-5, Math.min(5, current.windNoise + dWind)),
            loadNoise: Math.max(-8, Math.min(8, current.loadNoise + dLoad)),
          };
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isRealtimeActive, connectivity]);

  // Phase 5 — Connectivity State Transitions & Sync Queue Flush
  const setConnectivity = useCallback((newStatus: ConnectivityStatus) => {
    setConnectivityState(prevStatus => {
      if (prevStatus !== 'CONNECTED' && newStatus === 'CONNECTED') {
        // Reconnection: Flush edge queue
        const pendingCount = edgeQueue.length;
        const totalEventsSynced = pendingCount > 0 ? pendingCount + 12 : 17; // Realistic telemetry event count
        setSyncNotification(`${totalEventsSynced} telemetry events synchronized from station edge buffer.`);
        setEdgeQueue([]);
        setLastSyncTime(new Date().toISOString());
        addAuditLog('CLOUD_SYNC', 'STATION', currentStationId, `Station reconnected to NCPOR Cloud. ${totalEventsSynced} events flushed from buffer.`);
      }
      return newStatus;
    });
  }, [edgeQueue, currentStationId, addAuditLog]);

  const triggerManualSync = useCallback(() => {
    const count = edgeQueue.length > 0 ? edgeQueue.length + 8 : 17;
    setEdgeQueue([]);
    setLastSyncTime(new Date().toISOString());
    setSyncNotification(`${count} telemetry events synchronized`);
    addAuditLog('MANUAL_SYNC', 'STATION', currentStationId, `Manual edge buffer sync triggered. ${count} events synchronized.`);
  }, [edgeQueue, currentStationId, addAuditLog]);

  const dismissSyncNotification = useCallback(() => {
    setSyncNotification(null);
  }, []);

  const dismissActionFeedback = useCallback(() => {
    setActionFeedback(null);
  }, []);

  // Phase 12 — Action-Layer RBAC Permissions Enforcement
  const acknowledgeAlert = useCallback((alertId: string): boolean => {
    if (!hasPermission(currentUser.role, 'canAcknowledgeAlerts')) {
      setActionFeedback({
        type: 'error',
        message: `RBAC Permission Denied: Role "${currentUser.role}" is not authorized to acknowledge operational alerts.`,
      });
      addAuditLog('UNAUTHORIZED_ACTION', 'ALERT', alertId, `User ${currentUser.name} (${currentUser.role}) denied alert acknowledgement.`);
      return false;
    }

    if (connectivity === 'DISCONNECTED') {
      // Queue locally at edge
      const queueItem: EdgeQueueItem = {
        id: `q-ack-${Date.now()}`,
        type: 'ALERT_ACK',
        payload: { alertId, acknowledgedBy: currentUser.name },
        timestamp: new Date().toISOString(),
        status: 'PENDING',
      };
      setEdgeQueue(q => [queueItem, ...q]);
    }

    setAlerts(prev => {
      const exists = prev.some(a => a.alertId === alertId);
      if (exists) {
        return prev.map(a => a.alertId === alertId ? {
          ...a,
          acknowledged: true,
          status: 'acknowledged' as const,
          acknowledgedBy: currentUser.name,
          acknowledgedAt: new Date().toISOString(),
        } : a);
      } else {
        return [...prev, {
          alertId,
          stationId: currentStationId,
          severity: 'warning',
          domain: 'cross-domain',
          title: `Alert ${alertId}`,
          cause: ['Operational event trigger acknowledged by operator'],
          affectedAssets: [],
          recommendations: ['Active monitoring'],
          acknowledged: true,
          status: 'acknowledged' as const,
          acknowledgedBy: currentUser.name,
          acknowledgedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }];
      }
    });

    setActionFeedback({
      type: 'success',
      message: `Alert acknowledged successfully by ${currentUser.name} (${currentUser.role}).`,
    });
    addAuditLog('ACKNOWLEDGE_ALERT', 'ALERT', alertId, `Acknowledged by ${currentUser.name} (${currentUser.role})`);
    return true;
  }, [currentUser, connectivity, currentStationId, addAuditLog]);

  const resolveAlert = useCallback((alertId: string): boolean => {
    if (!hasPermission(currentUser.role, 'canAcknowledgeAlerts')) {
      setActionFeedback({
        type: 'error',
        message: `RBAC Permission Denied: Role "${currentUser.role}" is not authorized to resolve operational alerts.`,
      });
      addAuditLog('UNAUTHORIZED_ACTION', 'ALERT', alertId, `User ${currentUser.name} (${currentUser.role}) denied alert resolution.`);
      return false;
    }

    if (connectivity === 'DISCONNECTED') {
      const queueItem: EdgeQueueItem = {
        id: `q-res-${Date.now()}`,
        type: 'ALERT_ACK',
        payload: { alertId, resolvedBy: currentUser.name },
        timestamp: new Date().toISOString(),
        status: 'PENDING',
      };
      setEdgeQueue(q => [queueItem, ...q]);
    }

    setAlerts(prev => {
      const exists = prev.some(a => a.alertId === alertId);
      if (exists) {
        return prev.map(a => a.alertId === alertId ? {
          ...a,
          acknowledged: true,
          status: 'resolved' as const,
          acknowledgedBy: a.acknowledgedBy || currentUser.name,
          acknowledgedAt: a.acknowledgedAt || new Date().toISOString(),
        } : a);
      } else {
        return [...prev, {
          alertId,
          stationId: currentStationId,
          severity: 'warning',
          domain: 'cross-domain',
          title: `Alert ${alertId}`,
          cause: ['Incident resolved by operator'],
          affectedAssets: [],
          recommendations: ['Triage completed'],
          acknowledged: true,
          status: 'resolved' as const,
          acknowledgedBy: currentUser.name,
          acknowledgedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }];
      }
    });

    setActionFeedback({
      type: 'success',
      message: `Alert resolved successfully by ${currentUser.name} (${currentUser.role}).`,
    });
    addAuditLog('RESOLVE_ALERT', 'ALERT', alertId, `Resolved by ${currentUser.name} (${currentUser.role})`);
    return true;
  }, [currentUser, connectivity, currentStationId, addAuditLog]);

  const createRequisition = useCallback((req: Omit<Requisition, 'id' | 'createdAt' | 'status' | 'requesterId' | 'requesterName' | 'requesterRole'>): boolean => {
    if (!hasPermission(currentUser.role, 'canCreateRequisition')) {
      setActionFeedback({
        type: 'error',
        message: `RBAC Permission Denied: Role "${currentUser.role}" is not authorized to create requisitions.`,
      });
      addAuditLog('UNAUTHORIZED_ACTION', 'REQUISITION', 'NEW', `User ${currentUser.name} denied requisition creation.`);
      return false;
    }

    const newReq: Requisition = {
      ...req,
      id: `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };

    if (connectivity === 'DISCONNECTED') {
      const queueItem: EdgeQueueItem = {
        id: `q-req-${Date.now()}`,
        type: 'REQUISITION_CREATE',
        payload: newReq,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
      };
      setEdgeQueue(q => [queueItem, ...q]);
    }

    setRequisitions(prev => [newReq, ...prev]);
    setActionFeedback({
      type: 'success',
      message: `Requisition ${newReq.id} submitted for command approval.`,
    });
    addAuditLog('CREATE_REQUISITION', 'REQUISITION', newReq.id, `Created: ${newReq.title}`);
    return true;
  }, [currentUser, connectivity, addAuditLog]);

  const updateRequisitionStatus = useCallback((id: string, status: Requisition['status']): boolean => {
    if (status === 'APPROVED' && !hasPermission(currentUser.role, 'canApproveRequisition')) {
      setActionFeedback({
        type: 'error',
        message: `RBAC Permission Denied: Role "${currentUser.role}" does not have approval authority for supply requisitions.`,
      });
      addAuditLog('UNAUTHORIZED_ACTION', 'REQUISITION', id, `User ${currentUser.name} denied requisition approval.`);
      return false;
    }

    if (connectivity === 'DISCONNECTED') {
      const queueItem: EdgeQueueItem = {
        id: `q-upd-${Date.now()}`,
        type: 'REQUISITION_UPDATE',
        payload: { id, status, user: currentUser.name },
        timestamp: new Date().toISOString(),
        status: 'PENDING',
      };
      setEdgeQueue(q => [queueItem, ...q]);
    }

    setRequisitions(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          approvedBy: status === 'APPROVED' ? currentUser.name : r.approvedBy,
          approvedAt: status === 'APPROVED' ? new Date().toISOString() : r.approvedAt,
        };
      }
      return r;
    }));

    setActionFeedback({
      type: 'success',
      message: `Requisition ${id} status updated to ${status}.`,
    });
    addAuditLog('UPDATE_REQUISITION', 'REQUISITION', id, `Status updated to ${status} by ${currentUser.name}`);
    return true;
  }, [currentUser, connectivity, addAuditLog]);

  // Phase 4 — Simulation Runner with Timeline Horizon
  const runSimulation = useCallback((inputs: SimulationInputs): SimulationResult => {
    if (!hasPermission(currentUser.role, 'canRunSimulations')) {
      throw new Error(`User role ${currentUser.role} is not authorized to execute predictive simulations.`);
    }

    const res = runWhatIfSimulation(
      inputs.stationId,
      inputs,
      INITIAL_ENVIRONMENT[inputs.stationId],
      INITIAL_ENERGY[inputs.stationId],
      INITIAL_INVENTORY[inputs.stationId]
    );
    setLastSimulationResult(res);
    addAuditLog('RUN_SIMULATION', 'SIMULATION', inputs.stationId, `Executed predictive simulation: ${res.scenarioName}`);
    return res;
  }, [currentUser, addAuditLog]);

  // Current Evaluated Station State
  const currentStationState = useMemo(() => buildStationFullState(currentStationId), [buildStationFullState, currentStationId]);
  
  // Dual Station State for Command Dashboard Comparison
  const allStationsState = useMemo(() => ({
    maitri: buildStationFullState('maitri'),
    bharati: buildStationFullState('bharati'),
  }), [buildStationFullState]);

  // Requirement 5 & 6 — Single Source of Truth: Canonical Effective Station State
  const buildEffectiveState = useCallback((
    state: StationFullState,
    forecast: WeatherForecastHorizon[]
  ): EffectiveStationState => {
    const fuelItem = state.logistics.inventory.find(i => i.category === 'fuel' || i.sku.includes('FUEL')) || state.logistics.inventory[0];
    const baseEtaDays = 18 + (activeInjectedEvents.resupplyDelay ? 12 : 0);
    const today = new Date();
    const resupplyDate = new Date(today.getTime() + baseEtaDays * 86400000);
    const shortageDate = new Date(today.getTime() + state.derived.fuelRunwayDays * 86400000);
    const marginDays = Number((state.derived.fuelRunwayDays - baseEtaDays).toFixed(1));
    const hasPhysicalShortage = state.derived.fuelRunwayDays < baseEtaDays;

    const effectiveFuel: EffectiveFuelState = {
      stockLitres: state.energy.fuelLitres,
      capacityLitres: state.energy.fuelCapacityLitres,
      burnLitresPerDay: state.derived.dailyFuelBurnLitres,
      runwayDays: state.derived.fuelRunwayDays,
      safetyBufferDays: 14,
      resupplyEtaDays: baseEtaDays,
      resupplyArrivalDate: resupplyDate.toISOString().split('T')[0],
      projectedDepletionDate: shortageDate.toISOString().split('T')[0],
      hasPhysicalShortage,
      marginDays,
      status: fuelItem?.inventoryStatus || (hasPhysicalShortage ? 'CRITICAL' : marginDays < 4 ? 'PROJECTED SHORTAGE' : 'SAFE'),
    };

    return {
      stationId: state.metadata.stationId,
      metadata: state.metadata,
      health: state.healthScore,
      energy: state.energy,
      fuel: effectiveFuel,
      infrastructure: state.infrastructure,
      logistics: {
        inventory: state.logistics.inventory,
        requisitions: state.logistics.requisitions,
        resupplyVesselStatus: activeInjectedEvents.resupplyDelay ? 'DELAYED (+12d Pack Ice)' : 'ON SCHEDULE',
        resupplyEtaDays: baseEtaDays,
        criticalConsumablesCount: state.logistics.inventory.filter(i => i.inventoryStatus === 'CRITICAL').length,
      },
      environment: state.environment,
      risk: {
        severity: state.derived.crossDomainRisk,
        activeIncidentTitle: state.derived.activeIncidentTitle,
        rootCause: state.derived.rootCause,
        causalChain: state.derived.causalChain,
        forecastedImpact: state.derived.forecastedImpact,
        recommendedResponses: state.derived.recommendedResponses || [state.derived.recommendedResponse],
      },
      forecast,
      alerts: state.activeAlerts,
      resolvedAlerts: state.resolvedAlerts || [],
      derived: state.derived,
      lastUpdated: state.lastEvaluatedAt,
    };
  }, [activeInjectedEvents]);

  const currentEffectiveStationState = useMemo(() => 
    buildEffectiveState(currentStationState, currentStationForecast),
    [buildEffectiveState, currentStationState, currentStationForecast]
  );

  const allEffectiveStationsState = useMemo(() => ({
    maitri: buildEffectiveState(allStationsState.maitri, generateStationForecast(allStationsState.maitri.environment, 'maitri')),
    bharati: buildEffectiveState(allStationsState.bharati, generateStationForecast(allStationsState.bharati.environment, 'bharati')),
  }), [buildEffectiveState, allStationsState]);

  const setStationMode = useCallback((mode: StationMode) => {
    setStationModeState(mode);
    addAuditLog('CHANGE_STATION_MODE', 'STATION', currentStationId, `Operational stance updated to ${mode}`);
  }, [currentStationId, addAuditLog]);

  // Hardware-First Handlers (SIH26060)
  const toggleHardwareScenario = useCallback((scenario: keyof HardwareScenarioState) => {
    setHardwareScenario(prev => {
      const nextVal = !prev[scenario];
      const updated = { ...prev, [scenario]: nextVal };

      hardwareSimulators.maitri.setScenario(updated);
      hardwareSimulators.bharati.setScenario(updated);

      if (scenario === 'generator2Offline') {
        setActiveInjectedEvents(aPrev => ({ ...aPrev, generator2Failure: nextVal }));
      }

      if (scenario === 'edgeGatewayDisconnected') {
        edgeGateways.maitri.setConnectionState(nextVal ? 'OFFLINE' : 'CONNECTED');
        edgeGateways.bharati.setConnectionState(nextVal ? 'OFFLINE' : 'CONNECTED');
        setConnectivityState(nextVal ? 'DISCONNECTED' : 'CONNECTED');
      }

      addAuditLog('HARDWARE_SCENARIO_TOGGLE', 'STATION', currentStationId, `Hardware scenario ${scenario} set to ${nextVal}`);
      return updated;
    });
  }, [hardwareSimulators, edgeGateways, currentStationId, addAuditLog]);

  const dispatchHardwareCommand = useCallback(async (params: {
    deviceId: string;
    assetId: string;
    command: HardwareCommandType;
    forceActuatorFailure?: boolean;
  }): Promise<CommandExecutionResult> => {
    const result = await commandDispatcher.executeCommand({
      stationId: currentStationId,
      deviceId: params.deviceId,
      assetId: params.assetId,
      command: params.command,
      currentUser,
      forceActuatorFailure: params.forceActuatorFailure,
    });

    setCommandHistory(commandDispatcher.getHistory(currentStationId));

    if (result.success && params.deviceId.includes('GEN-02')) {
      if (params.command === 'START') {
        setHardwareScenario(prev => {
          const next = { ...prev, generator2Offline: false, actuatorStartGenFailure: false };
          hardwareSimulators.maitri.setScenario(next);
          hardwareSimulators.bharati.setScenario(next);
          return next;
        });
        setActiveInjectedEvents(prev => ({ ...prev, generator2Failure: false }));
      } else if (params.command === 'STOP') {
        setHardwareScenario(prev => {
          const next = { ...prev, generator2Offline: true };
          hardwareSimulators.maitri.setScenario(next);
          hardwareSimulators.bharati.setScenario(next);
          return next;
        });
        setActiveInjectedEvents(prev => ({ ...prev, generator2Failure: true }));
      }
    } else if (!result.success && result.isActuatorFailure) {
      setHardwareScenario(prev => {
        const next = { ...prev, actuatorStartGenFailure: true };
        hardwareSimulators.maitri.setScenario(next);
        hardwareSimulators.bharati.setScenario(next);
        return next;
      });
    }

    if (params.command === 'RESET_FAULT') {
      setHardwareScenario(prev => {
        const next = { ...prev, pumpVibrationFault: false, pressureSensorOffline: false, actuatorStartGenFailure: false, fuelTransferFailure: false };
        hardwareSimulators.maitri.setScenario(next);
        hardwareSimulators.bharati.setScenario(next);
        return next;
      });
    }

    addAuditLog('DISPATCH_HARDWARE_COMMAND', 'STATION', params.deviceId, `${params.command} executed by ${currentUser.name} - Status: ${result.packet.status}`);
    return result;
  }, [commandDispatcher, currentStationId, currentUser, hardwareSimulators, addAuditLog]);

  const syncEdgeGateway = useCallback(async () => {
    const res = edgeGateways[currentStationId].syncAfterReconnection();
    setHardwareScenario(prev => {
      const next = { ...prev, edgeGatewayDisconnected: false };
      hardwareSimulators.maitri.setScenario(next);
      hardwareSimulators.bharati.setScenario(next);
      return next;
    });
    setConnectivityState('CONNECTED');
    setSyncNotification(`${res.syncedPacketsCount} buffered packets reconciled from ${edgeGateways[currentStationId].getGatewayState().gatewayId}`);
    addAuditLog('EDGE_GATEWAY_SYNC', 'STATION', currentStationId, `Reconnected edge gateway; synced ${res.syncedPacketsCount} packets.`);
    return res;
  }, [edgeGateways, currentStationId, hardwareSimulators, addAuditLog]);

  const currentSimulator = hardwareSimulators[currentStationId];
  const hardwareNetwork = currentSimulator.getNetworkSummary();
  const edgeGateway = edgeGateways[currentStationId].getGatewayState();
  const spatialHardwareNodes = currentSimulator.getSpatialHardwareNodes();

  return (
    <StationContext.Provider value={{
      currentStationId,
      setCurrentStationId,
      currentUser,
      setCurrentUser,
      allUsers: DEMO_USERS,
      effectiveStationState: currentEffectiveStationState,
      allEffectiveStationsState,
      stationState: currentStationState,
      derived: currentStationState.derived,
      allStationsState,
      resolvedAlerts: currentStationState.resolvedAlerts || [],
      stationMode,
      setStationMode,
      missionTimeline,
      isRealtimeActive,
      setIsRealtimeActive,
      connectivity,
      setConnectivity,
      lastSyncTime,
      triggerManualSync,
      edgeQueue,
      pendingOperationsCount: edgeQueue.length,
      syncNotification,
      dismissSyncNotification,
      activeInjectedEvents,
      toggleInjectedEvent,
      triggerFullCascade,
      resetAllEvents,
      acknowledgeAlert,
      resolveAlert,
      createRequisition,
      updateRequisitionStatus,
      runSimulation,
      lastSimulationResult,
      actionFeedback,
      dismissActionFeedback,
      auditLogs,
      // Hardware-First Architecture (SIH26060)
      hardwareSimulator: currentSimulator,
      hardwareNetwork,
      edgeGateway,
      spatialHardwareNodes,
      commandHistory,
      hardwareScenario,
      toggleHardwareScenario,
      dispatchHardwareCommand,
      syncEdgeGateway,
      selectedHardwareNodeId,
      setSelectedHardwareNodeId,
      // Real-Time Polar Weather Engine (SIH26060)
      liveWeather,
      normalizedWeather,
      weatherHistory,
      isWeatherLoading,
      lastWeatherSync,
      nextWeatherSync,
      fetchStationWeather,
      updateLiveWeather,
      activeWeatherEvents: currentStationState.environment.activeWeatherEvents || [],
      satelliteMetadata: SATELLITE_LAYERS,
      activeSatelliteLayer,
      setActiveSatelliteLayer,
      stationForecast: currentStationForecast,
      refreshWeather,
    }}>
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
}
