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
  generateStationForecast 
} from '@/lib/weatherEngine';
import { 
  SatelliteLayerId, 
  SatelliteMetadata, 
  WeatherForecastHorizon, 
  WeatherEventDetection, 
  WeatherState,
  EnvironmentTelemetry,
  DataProvenance
} from '@/types';
import { hasPermission } from '@/lib/permissions';

interface StationContextType {
  // Station & Auth
  currentStationId: StationId;
  setCurrentStationId: (id: StationId) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  allUsers: User[];
  
  // Station State (Derived from Central Pipeline)
  stationState: StationFullState;
  derived: StationFullState['derived'];
  allStationsState: Record<StationId, StationFullState>;
  
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
        pressureHpa: newP,
        visibilityKm: newVis,
        windChillC: newChill,
        source: patch.source || current.source,
        weatherState: (connectivity === 'DISCONNECTED' ? 'STALE' : 'LIVE') as WeatherState,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const detected = detectWeatherEvents(updated, current);
      updated.activeWeatherEvents = detected;

      addAuditLog('WEATHER_UPDATE', 'STATION', stationId, `Weather updated: ${newT}°C, ${newW} km/h (${newMs} m/s)`);
      return { ...prev, [stationId]: updated };
    });
  }, [connectivity, addAuditLog]);

  const refreshWeather = useCallback(() => {
    setLiveWeather(prev => {
      const now = new Date();
      return {
        maitri: {
          ...prev.maitri,
          lastUpdated: now.toISOString(),
          nextUpdate: new Date(now.getTime() + 180000).toISOString(),
          weatherState: (connectivity === 'DISCONNECTED' ? 'STALE' : 'LIVE') as WeatherState,
        },
        bharati: {
          ...prev.bharati,
          lastUpdated: now.toISOString(),
          nextUpdate: new Date(now.getTime() + 180000).toISOString(),
          weatherState: (connectivity === 'DISCONNECTED' ? 'STALE' : 'LIVE') as WeatherState,
        },
      };
    });
  }, [connectivity]);

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
    const detectedWeatherEvents = detectWeatherEvents(evaluated.environment, rawEnv);
    evaluated.environment.activeWeatherEvents = detectedWeatherEvents;
    evaluated.environment.windMs = Number((evaluated.environment.windKmh / 3.6).toFixed(1));
    evaluated.environment.windChillC = Number((evaluated.environment.temperatureC - (evaluated.environment.windKmh * 0.18)).toFixed(1));
    evaluated.environment.weatherState = baseEnv.weatherState;
    evaluated.environment.primarySource = baseEnv.primarySource;
    evaluated.environment.secondarySource = baseEnv.secondarySource;
    evaluated.environment.forecastSource = baseEnv.forecastSource;
    evaluated.environment.sourceLatencySec = baseEnv.sourceLatencySec;
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

    const stationAlerts = [
      ...dynamicAlerts,
      ...alerts.filter(a => a.stationId === stationId && a.status !== 'resolved'),
    ];

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
      activeAlerts: stationAlerts,
      derived: evaluated.derived,
      lastEvaluatedAt: new Date().toISOString(),
    };
  }, [connectivity, lastSyncTime, activeInjectedEvents, telemetryDrift, requisitions, alerts, stationMode]);

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

    setAlerts(prev => prev.map(a => {
      if (a.alertId === alertId) {
        return {
          ...a,
          acknowledged: true,
          status: 'acknowledged',
          acknowledgedBy: currentUser.name,
          acknowledgedAt: new Date().toISOString(),
        };
      }
      return a;
    }));

    setActionFeedback({
      type: 'success',
      message: `Alert acknowledged successfully by ${currentUser.name}.`,
    });
    addAuditLog('ACKNOWLEDGE_ALERT', 'ALERT', alertId, `Acknowledged by ${currentUser.name}`);
    return true;
  }, [currentUser, connectivity, addAuditLog]);

  const resolveAlert = useCallback((alertId: string): boolean => {
    if (!hasPermission(currentUser.role, 'canAcknowledgeAlerts')) {
      setActionFeedback({
        type: 'error',
        message: `RBAC Permission Denied: Role "${currentUser.role}" is not authorized to resolve alerts.`,
      });
      return false;
    }

    setAlerts(prev => prev.map(a => {
      if (a.alertId === alertId) {
        return { ...a, status: 'resolved' };
      }
      return a;
    }));

    setActionFeedback({
      type: 'success',
      message: `Alert resolved by ${currentUser.name}.`,
    });
    addAuditLog('RESOLVE_ALERT', 'ALERT', alertId, `Resolved by ${currentUser.name}`);
    return true;
  }, [currentUser, addAuditLog]);

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

  const setStationMode = useCallback((mode: StationMode) => {
    setStationModeState(mode);
    addAuditLog('CHANGE_STATION_MODE', 'STATION', currentStationId, `Operational stance updated to ${mode}`);
  }, [currentStationId, addAuditLog]);

  return (
    <StationContext.Provider value={{
      currentStationId,
      setCurrentStationId,
      currentUser,
      setCurrentUser,
      allUsers: DEMO_USERS,
      stationState: currentStationState,
      derived: currentStationState.derived,
      allStationsState,
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
      // Real-Time Polar Weather Engine (SIH26060)
      liveWeather,
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
