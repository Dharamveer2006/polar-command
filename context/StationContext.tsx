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
  UserRole,
  RiskSeverity
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
import { calculateStationHealth, calculateEnergyDemand, calculateFuelRunway, runWhatIfSimulation } from '@/lib/calculations';

interface StationContextType {
  // Station & Auth
  currentStationId: StationId;
  setCurrentStationId: (id: StationId) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  allUsers: User[];
  
  // Station State
  stationState: StationFullState;
  allStationsState: Record<StationId, StationFullState>;
  
  // Realtime & Offline status
  isRealtimeActive: boolean;
  setIsRealtimeActive: (active: boolean) => void;
  connectivity: ConnectivityStatus;
  setConnectivity: (status: ConnectivityStatus) => void;
  lastSyncTime: string;
  triggerManualSync: () => void;
  
  // Event Injections (for demo)
  activeInjectedEvents: {
    extremeCold: boolean;
    highWind: boolean;
    generator2Failure: boolean;
    resupplyDelay: boolean;
  };
  toggleInjectedEvent: (event: 'extremeCold' | 'highWind' | 'generator2Failure' | 'resupplyDelay') => void;
  resetAllEvents: () => void;
  
  // Alert Actions
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  
  // Requisitions
  createRequisition: (req: Omit<Requisition, 'id' | 'createdAt' | 'status' | 'requesterId' | 'requesterName' | 'requesterRole'>) => void;
  updateRequisitionStatus: (id: string, status: Requisition['status']) => void;
  
  // Simulation
  runSimulation: (inputs: SimulationInputs) => SimulationResult;
  lastSimulationResult: SimulationResult | null;
  
  // Audit Logs
  auditLogs: AuditLogEntry[];
}

const StationContext = createContext<StationContextType | null>(null);

export function StationProvider({ children }: { children: React.ReactNode }) {
  const [currentStationId, setCurrentStationId] = useState<StationId>('bharati');
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]); // Default to Ops
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>('CONNECTED');
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());

  // Injected events state
  const [activeInjectedEvents, setActiveInjectedEvents] = useState({
    extremeCold: false,
    highWind: false,
    generator2Failure: false,
    resupplyDelay: false,
  });

  // State store per station
  const [environmentData, setEnvironmentData] = useState(INITIAL_ENVIRONMENT);
  const [energyData, setEnergyData] = useState(INITIAL_ENERGY);
  const [infrastructureData, setInfrastructureData] = useState(INITIAL_INFRASTRUCTURE);
  const [inventoryData, setInventoryData] = useState(INITIAL_INVENTORY);
  const [requisitions, setRequisitions] = useState<Requisition[]>(INITIAL_REQUISITIONS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [lastSimulationResult, setLastSimulationResult] = useState<SimulationResult | null>(null);

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
      details: 'Polar Command Digital Twin telemetry bridge synchronized.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const addAuditLog = useCallback((action: string, entityType: AuditLogEntry['entityType'], entityId: string, details: string) => {
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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

  // Compute Full Station State
  const buildStationFullState = useCallback((stationId: StationId): StationFullState => {
    const meta = {
      ...INITIAL_STATIONS_METADATA[stationId],
      connectivityState: connectivity,
      lastSync: lastSyncTime,
    };

    const env = environmentData[stationId];
    const energy = energyData[stationId];
    const infra = infrastructureData[stationId];
    const inv = inventoryData[stationId];
    const stationReqs = requisitions.filter(r => r.stationId === stationId);
    const stationAlerts = alerts.filter(a => a.stationId === stationId && a.status !== 'resolved' as any);

    const healthScore = calculateStationHealth(env, energy, infra, inv);

    return {
      metadata: meta,
      environment: env,
      energy,
      infrastructure: infra,
      logistics: {
        inventory: inv,
        requisitions: stationReqs,
        source: 'Prototype operational model',
      },
      healthScore,
      activeAlerts: stationAlerts,
      lastEvaluatedAt: new Date().toISOString(),
    };
  }, [connectivity, lastSyncTime, environmentData, energyData, infrastructureData, inventoryData, requisitions, alerts]);

  // Handle Event Injections
  const toggleInjectedEvent = useCallback((eventKey: keyof typeof activeInjectedEvents) => {
    setActiveInjectedEvents(prev => {
      const updated = { ...prev, [eventKey]: !prev[eventKey] };
      const isNowActive = updated[eventKey];

      // Propagate changes into telemetry
      const targetStation: StationId = currentStationId;

      if (eventKey === 'extremeCold') {
        const tempDrop = isNowActive ? -12 : 0;
        setEnvironmentData(curr => ({
          ...curr,
          [targetStation]: {
            ...curr[targetStation],
            temperatureC: INITIAL_ENVIRONMENT[targetStation].temperatureC + tempDrop,
            blizzardRisk: isNowActive ? 'critical' : 'nominal',
            updatedAt: new Date().toISOString(),
          },
        }));

        // Trigger dynamic heating load escalation
        const newTemp = INITIAL_ENVIRONMENT[targetStation].temperatureC + tempDrop;
        const currentWind = environmentData[targetStation]?.windKmh || 38;
        const { demandKw, heatingLoadKw } = calculateEnergyDemand(
          INITIAL_ENERGY[targetStation].baseLoadKw,
          newTemp,
          currentWind
        );

        setEnergyData(curr => {
          const stationEng = curr[targetStation];
          const newDemand = demandKw;
          const { dailyBurnLitres, runwayDays } = calculateFuelRunway(
            stationEng.fuelLitres,
            stationEng.generationKw,
            stationEng.generators.filter(g => g.status === 'running').length
          );

          return {
            ...curr,
            [targetStation]: {
              ...stationEng,
              heatingLoadKw,
              demandKw: newDemand,
              averageFuelBurnLitresPerDay: Math.round(dailyBurnLitres * 1.15),
              fuelRunwayDays: Number((runwayDays * 0.82).toFixed(1)),
              updatedAt: new Date().toISOString(),
            },
          };
        });

        // Trigger cross-domain alert
        if (isNowActive) {
          const coldAlert: Alert = {
            alertId: `ALT-COLD-${Date.now()}`,
            stationId: targetStation,
            severity: 'critical',
            domain: 'cross-domain',
            title: `Severe Antarctic Cold Snap (-${Math.abs(newTemp).toFixed(1)}°C) - Heating Demand Surge`,
            cause: [
              `Ambient temperature dropped below -30°C threshold`,
              `HVAC thermal recovery draw surged +28%`,
              `Projected fuel runway reduced by -3.2 days`,
            ],
            affectedAssets: [`${targetStation}-hvac-01`, `${targetStation}-gen-01`],
            recommendations: [
              'Engage auxiliary heat exchangers',
              'Activate fuel line pre-heaters to prevent wax crystallization',
              'Review fuel resupply buffer schedule',
            ],
            acknowledged: false,
            createdAt: new Date().toISOString(),
          };
          setAlerts(a => [coldAlert, ...a]);
          addAuditLog('TRIGGER_ALERT', 'ALERT', coldAlert.alertId, coldAlert.title);
        }
      }

      if (eventKey === 'highWind') {
        const windBoost = isNowActive ? 45 : 0;
        setEnvironmentData(curr => ({
          ...curr,
          [targetStation]: {
            ...curr[targetStation],
            windKmh: INITIAL_ENVIRONMENT[targetStation].windKmh + windBoost,
            visibilityKm: isNowActive ? 1.2 : 9.0,
            blizzardRisk: isNowActive ? 'critical' : 'nominal',
            updatedAt: new Date().toISOString(),
          },
        }));

        if (isNowActive) {
          const stormAlert: Alert = {
            alertId: `ALT-STORM-${Date.now()}`,
            stationId: targetStation,
            severity: 'critical',
            domain: 'environment',
            title: `Katabatic Storm & Blizzard Warning (${INITIAL_ENVIRONMENT[targetStation].windKmh + windBoost} km/h)`,
            cause: [
              `Katabatic gusts exceeding 80 km/h detected at meteorological mast`,
              `Visibility decreased below safe outdoor transit limit (1.2 km)`,
            ],
            affectedAssets: [`${targetStation}-sat-01`],
            recommendations: [
              'Issue station lockdown protocol - restrict all outdoor sorties',
              'Lock antenna azimuth motors to stowage wind-park position',
            ],
            acknowledged: false,
            createdAt: new Date().toISOString(),
          };
          setAlerts(a => [stormAlert, ...a]);
          addAuditLog('TRIGGER_ALERT', 'ALERT', stormAlert.alertId, stormAlert.title);
        }
      }

      if (eventKey === 'generator2Failure') {
        setEnergyData(curr => {
          const s = curr[targetStation];
          const updatedGens = s.generators.map(g => {
            if (g.id.includes('gen-02')) {
              return {
                ...g,
                status: isNowActive ? 'offline' as const : 'running' as const,
                currentOutputKw: isNowActive ? 0 : 190,
                health: isNowActive ? 22 : 91,
              };
            }
            return g;
          });
          const newGenKw = isNowActive ? Math.max(180, s.generationKw - 190) : INITIAL_ENERGY[targetStation].generationKw;
          return {
            ...curr,
            [targetStation]: {
              ...s,
              generators: updatedGens,
              generationKw: newGenKw,
              batterySoc: isNowActive ? Math.max(35, s.batterySoc - 22) : INITIAL_ENERGY[targetStation].batterySoc,
              updatedAt: new Date().toISOString(),
            },
          };
        });

        if (isNowActive) {
          const genAlert: Alert = {
            alertId: `ALT-GEN-${Date.now()}`,
            stationId: targetStation,
            severity: 'critical',
            domain: 'energy',
            title: `Generator #2 Trip / Mechanical Lockout`,
            cause: [
              `Coolant over-temperature sensor triggered automatic emergency trip`,
              `Active station generation deficit of ~190 kW transferred to battery reserve`,
            ],
            affectedAssets: [`${targetStation}-gen-02`],
            recommendations: [
              'Start emergency cold-reserve genset #4 or #3 immediately',
              'Shed non-critical accommodation loads',
            ],
            acknowledged: false,
            createdAt: new Date().toISOString(),
          };
          setAlerts(a => [genAlert, ...a]);
          addAuditLog('TRIGGER_ALERT', 'ALERT', genAlert.alertId, genAlert.title);
        }
      }

      if (eventKey === 'resupplyDelay') {
        const delayDays = isNowActive ? 12 : 0;
        setInventoryData(curr => {
          const items = curr[targetStation].map(item => {
            if (item.category === 'fuel') {
              return {
                ...item,
                riskLevel: isNowActive ? ('critical' as RiskSeverity) : ('warning' as RiskSeverity),
                nextResupplyEta: isNowActive ? '2026-11-03' : '2026-10-22',
              };
            }
            return item;
          });
          return { ...curr, [targetStation]: items };
        });

        if (isNowActive) {
          const delayAlert: Alert = {
            alertId: `ALT-LOG-${Date.now()}`,
            stationId: targetStation,
            severity: 'critical',
            domain: 'logistics',
            title: `Resupply Vessel MV Vasiliy Golovnin Pack-Ice Delay (+12 Days)`,
            cause: [
              `Heavy multi-year pack ice obstruction at Prydz Bay approach`,
              `Projected arrival shifted from Oct 22 to Nov 03`,
              `Fuel reserve falls below mandatory 14-day winter safety buffer`,
            ],
            affectedAssets: [`${targetStation}-fuel-01`],
            recommendations: [
              'Submit Emergency Requisition for twin-otter ski-plane fuel airlift',
              'Implement Tier-2 station energy conservation rationing',
            ],
            acknowledged: false,
            createdAt: new Date().toISOString(),
          };
          setAlerts(a => [delayAlert, ...a]);
          addAuditLog('TRIGGER_ALERT', 'ALERT', delayAlert.alertId, delayAlert.title);
        }
      }

      addAuditLog('TOGGLE_EVENT', 'STATION', targetStation, `Event ${eventKey} toggled to ${isNowActive}`);
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
    setEnvironmentData(INITIAL_ENVIRONMENT);
    setEnergyData(INITIAL_ENERGY);
    setInfrastructureData(INITIAL_INFRASTRUCTURE);
    setInventoryData(INITIAL_INVENTORY);
    setAlerts(INITIAL_ALERTS);
    addAuditLog('RESET_DEMO', 'STATION', currentStationId, 'All simulated events and telemetry reset to nominal.');
  }, [currentStationId, addAuditLog]);

  // Realtime Telemetry Simulation Tick (continuous realistic drift)
  useEffect(() => {
    if (!isRealtimeActive || connectivity === 'DISCONNECTED') return;

    const interval = setInterval(() => {
      setLastSyncTime(new Date().toISOString());

      setEnvironmentData(prev => {
        const next = { ...prev };
        (['maitri', 'bharati'] as StationId[]).forEach(id => {
          const current = next[id];
          const tempNoise = (Math.random() - 0.5) * 0.2;
          const windNoise = Math.round((Math.random() - 0.5) * 2);
          next[id] = {
            ...current,
            temperatureC: Number((current.temperatureC + tempNoise).toFixed(1)),
            windKmh: Math.max(10, current.windKmh + windNoise),
            updatedAt: new Date().toISOString(),
          };
        });
        return next;
      });

      setEnergyData(prev => {
        const next = { ...prev };
        (['maitri', 'bharati'] as StationId[]).forEach(id => {
          const current = next[id];
          const loadNoise = Math.round((Math.random() - 0.5) * 4);
          const demandKw = Math.max(200, current.demandKw + loadNoise);
          next[id] = {
            ...current,
            demandKw,
            updatedAt: new Date().toISOString(),
          };
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isRealtimeActive, connectivity]);

  // Alert Handlers
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.alertId === alertId) {
        return {
          ...a,
          acknowledged: true,
          acknowledgedBy: currentUser.name,
          acknowledgedAt: new Date().toISOString(),
        };
      }
      return a;
    }));
    addAuditLog('ACKNOWLEDGE_ALERT', 'ALERT', alertId, `Acknowledged by ${currentUser.name}`);
  }, [currentUser, addAuditLog]);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.alertId === alertId) {
        return {
          ...a,
          status: 'resolved' as any,
        };
      }
      return a;
    }));
    addAuditLog('RESOLVE_ALERT', 'ALERT', alertId, `Resolved by ${currentUser.name}`);
  }, [currentUser, addAuditLog]);

  // Requisition Handlers
  const createRequisition = useCallback((req: Omit<Requisition, 'id' | 'createdAt' | 'status' | 'requesterId' | 'requesterName' | 'requesterRole'>) => {
    const newReq: Requisition = {
      ...req,
      id: `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    setRequisitions(prev => [newReq, ...prev]);
    addAuditLog('CREATE_REQUISITION', 'REQUISITION', newReq.id, `Created: ${newReq.title}`);
  }, [currentUser, addAuditLog]);

  const updateRequisitionStatus = useCallback((id: string, status: Requisition['status']) => {
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
    addAuditLog('UPDATE_REQUISITION', 'REQUISITION', id, `Status updated to ${status} by ${currentUser.name}`);
  }, [currentUser, addAuditLog]);

  // Simulation Runner
  const runSimulation = useCallback((inputs: SimulationInputs): SimulationResult => {
    const res = runWhatIfSimulation(
      inputs.stationId,
      inputs,
      environmentData[inputs.stationId],
      energyData[inputs.stationId],
      inventoryData[inputs.stationId]
    );
    setLastSimulationResult(res);
    addAuditLog('RUN_SIMULATION', 'SIMULATION', inputs.stationId, `Executed scenario: ${res.scenarioName}`);
    return res;
  }, [environmentData, energyData, inventoryData, addAuditLog]);

  const triggerManualSync = useCallback(() => {
    setLastSyncTime(new Date().toISOString());
    addAuditLog('MANUAL_SYNC', 'STATION', currentStationId, 'Manual edge sync triggered.');
  }, [currentStationId, addAuditLog]);

  const currentStationState = useMemo(() => buildStationFullState(currentStationId), [buildStationFullState, currentStationId]);
  
  const allStationsState = useMemo(() => ({
    maitri: buildStationFullState('maitri'),
    bharati: buildStationFullState('bharati'),
  }), [buildStationFullState]);

  return (
    <StationContext.Provider value={{
      currentStationId,
      setCurrentStationId,
      currentUser,
      setCurrentUser,
      allUsers: DEMO_USERS,
      stationState: currentStationState,
      allStationsState,
      isRealtimeActive,
      setIsRealtimeActive,
      connectivity,
      setConnectivity,
      lastSyncTime,
      triggerManualSync,
      activeInjectedEvents,
      toggleInjectedEvent,
      resetAllEvents,
      acknowledgeAlert,
      resolveAlert,
      createRequisition,
      updateRequisitionStatus,
      runSimulation,
      lastSimulationResult,
      auditLogs,
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
