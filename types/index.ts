// Domain types for SIH26060 Polar Command Digital Twin

export type StationId = 'maitri' | 'bharati';

export type UserRole = 
  | 'NCPOR Operations' 
  | 'Station Engineer' 
  | 'Logistics Officer' 
  | 'Leadership';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
}

export type ConnectivityStatus = 'CONNECTED' | 'INTERMITTENT' | 'DISCONNECTED';

export type RiskSeverity = 'nominal' | 'warning' | 'critical';

export type DataProvenance = 
  | 'Observed'
  | 'Derived'
  | 'Forecast'
  | 'Synthetic Fallback'
  | 'Public Observation' 
  | 'Synthetic Telemetry' 
  | 'Prototype Forecast' 
  | 'Derived Calculation';

export interface StationMetadata {
  stationId: StationId;
  name: string;
  hindiName: string;
  coordinates: {
    lat: number;
    lng: number;
    elevationM: number;
  };
  region: string;
  establishedYear: number;
  winterCapacity: number;
  summerCapacity: number;
  currentPersonnel: number;
  timezone: string;
  connectivityState: ConnectivityStatus;
  lastSync: string;
}

export type WeatherState = 'LIVE' | 'STALE' | 'FALLBACK' | 'ERROR';

export type WeatherEventType = 
  | 'RAPID_COOLING' 
  | 'HIGH_WIND' 
  | 'LOW_VISIBILITY' 
  | 'PRESSURE_DROP' 
  | 'BLIZZARD_RISK' 
  | 'NONE';

export interface WeatherEventDetection {
  type: WeatherEventType;
  severity: 'nominal' | 'warning' | 'critical';
  title: string;
  description: string;
  rateOfChange?: string;
  operationalImpact: string;
  detectedAt: string;
}

export type SatelliteLayerId = 'true-color' | 'infrared' | 'clouds' | 'snow-ice';

export interface SatelliteMetadata {
  satelliteName: string;
  layerId: SatelliteLayerId;
  layerName: string;
  status: 'NEAR-REAL-TIME' | 'LATEST_CYCLE' | 'UNAVAILABLE';
  timestamp: string;
  latency: string;
  resolution: string;
  projection: string;
  source: string;
  tileUrlTemplate?: string;
}

export interface WeatherForecastHorizon {
  horizon: '+6H' | '+12H' | '+24H' | '+48H' | '+72H' | '+96H';
  timestamp: string;
  temperatureC: number;
  windKmh: number;
  windMs: number;
  pressureHpa: number;
  blizzardProbability: number;
  condition: string;
  projectedHeatingLoadKw: number;
  modelCycle: string;
}

export interface NormalizedWeatherResponse {
  station: StationId;
  source: 'NCPOR' | 'SYNTHETIC FALLBACK';
  status: WeatherState;
  observedAt: string;
  receivedAt: string;
  latencySeconds: number;
  temperatureC: number;
  pressureHpa: number;
  humidityPercent: number;
  windKnots: number;
  windKmh: number;
  windMs: number;
  windDirectionDeg: number;
  visibilityKm?: number;
  windChillC?: number;
  rawUpstreamStatus?: string;
  rawUpstreamUrl?: string;
}

export interface HistoricalWeatherObservation {
  timestamp: string;
  station: StationId;
  temperatureC: number;
  pressureHpa: number;
  humidityPercent: number;
  windKmh: number;
  windKnots: number;
  windDirectionDeg: number;
  source: string;
  status: WeatherState;
}

export interface EnvironmentTelemetry {
  temperatureC: number;
  windKmh: number;
  windMs?: number;
  windKnots?: number;
  windDirectionDeg: number;
  pressureHpa: number;
  visibilityKm: number;
  humidityPercent: number;
  windChillC?: number;
  blizzardRisk: RiskSeverity;
  source: DataProvenance;
  primarySource?: string;
  secondarySource?: string;
  forecastSource?: string;
  weatherState?: WeatherState;
  sourceLatencySec?: number;
  observedAt?: string;
  receivedAt?: string;
  latency?: string;
  lastUpdated?: string;
  nextUpdate?: string;
  activeWeatherEvents?: WeatherEventDetection[];
  liveObservation?: {
    temperatureC: number;
    windKmh: number;
    windKnots?: number;
    pressureHpa: number;
    observedAt: string;
    source: string;
    status: WeatherState;
  };
  demoScenarioOffset?: {
    temperatureOffset: number;
    windOffset: number;
    active: boolean;
  };
  simulatedState?: {
    temperatureC: number;
    windKmh: number;
  };
  updatedAt: string;
}

export interface GeneratorAsset {
  id: string;
  name: string;
  status: 'running' | 'standby' | 'maintenance' | 'offline';
  capacityKw: number;
  currentOutputKw: number;
  loadPercent: number;
  coolantTempC: number;
  oilPressureBar: number;
  fuelRateLph: number;
  health: number;
}

export interface EnergyTelemetry {
  generationKw: number;
  demandKw: number;
  baseLoadKw: number;
  heatingLoadKw: number;
  criticalLoadKw: number;
  nonCriticalLoadKw: number;
  batterySoc: number; // percentage 0-100
  batteryCapacityKwh: number;
  usableKwh: number;
  fuelLitres: number;
  fuelCapacityLitres: number;
  averageFuelBurnLitresPerDay: number;
  fuelRunwayDays: number;
  batteryRunwayHours: number;
  generators: GeneratorAsset[];
  source: DataProvenance;
  updatedAt: string;
}

export type AssetType = 
  | 'generator' 
  | 'hvac' 
  | 'water_pump' 
  | 'fuel_pump' 
  | 'reverse_osmosis' 
  | 'satellite_uplink' 
  | 'greenhouse_control';

export interface AssetAnomaly {
  parameter: string;
  expectedRange: string;
  observedValue: string;
  isAnomaly: boolean;
  status?: 'ANOMALY' | 'NOMINAL';
  explanation?: string;
  affectedDomain: 'energy' | 'infrastructure' | 'hvac' | 'water' | 'comms';
}

export interface StationAsset {
  assetId: string;
  stationId: StationId;
  name: string;
  type: AssetType;
  building: string;
  status: 'operational' | 'running' | 'warning' | 'critical' | 'offline' | 'standby';
  health: number; // 0 - 100
  metrics: {
    temperatureC?: number;
    pressureBar?: number;
    vibrationMmSec?: number;
    vibrationMmS?: number;
    loadKw?: number;
    flowRateLpm?: number;
    efficiencyPercent?: number;
    runtimeHours?: number;
    fuelRateLph?: number;
  };
  anomaly?: AssetAnomaly;
  alerts: string[];
  lastServiced: string;
  nextServiceDue: string;
  updatedAt: string;
}

export interface InfrastructureTelemetry {
  overallHealth: number;
  assets: StationAsset[];
  hvacHealth: number;
  waterPumpHealth: number;
  generatorHealth: number;
  criticalAlertsCount: number;
  source: DataProvenance;
  updatedAt: string;
}

export type InventoryCategory = 
  | 'fuel' 
  | 'food' 
  | 'medical' 
  | 'water_treatment' 
  | 'spare_parts';

export type InventoryStatus = 'SAFE' | 'WARNING' | 'PROJECTED SHORTAGE' | 'CRITICAL';

export interface InventoryItem {
  id: string;
  stationId: StationId;
  sku: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  dailyConsumption: number;
  daysRemaining: number;
  safetyStock: number;
  safetyStockDays: number;
  projectedShortageDate: string;
  burnRateTrend: 'normal' | 'elevated' | 'critical';
  riskLevel: RiskSeverity;
  inventoryStatus: InventoryStatus;
  nextResupplyEta: string;
  source: DataProvenance;
  updatedAt: string;
}

export type RequisitionStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'APPROVED' 
  | 'IN_TRANSIT' 
  | 'DELIVERED';

export type RequisitionPriority = 'ROUTINE' | 'ELEVATED' | 'CRITICAL_AIRLIFT';

export interface RequisitionItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Requisition {
  id: string;
  stationId: StationId;
  title: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  items: RequisitionItem[];
  rationale: string;
  eta: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Alert {
  alertId: string;
  stationId: StationId;
  severity: RiskSeverity;
  domain: 'environment' | 'energy' | 'infrastructure' | 'logistics' | 'cross-domain';
  title: string;
  cause: string[];
  affectedAssets: string[];
  recommendations: string[];
  acknowledged: boolean;
  status?: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface StationHealthScore {
  overall: number; // 0 - 100
  environmentScore: number;
  energyScore: number;
  infrastructureScore: number;
  logisticsScore: number;
  weights: {
    environment: number; // 0.20
    energy: number; // 0.30
    infrastructure: number; // 0.25
    logistics: number; // 0.25
  };
}

export interface ActiveScenarios {
  extremeCold: boolean;
  highWind: boolean;
  generator2Failure: boolean;
  resupplyDelay: boolean;
}

export type StationMode = 
  | 'NORMAL' 
  | 'SCIENCE OPERATIONS' 
  | 'WEATHER ALERT' 
  | 'POWER CONSERVATION' 
  | 'EMERGENCY';

export interface MissionTimelineEvent {
  id: string;
  time: string;
  title: string;
  category: 'TELEMETRY' | 'ALERT' | 'ANALYSIS' | 'HUMAN ACTION' | 'FOLLOW-UP';
  details: string;
  stationId: StationId;
}

export interface StationDerivedState {
  effectiveTemperatureC: number;
  effectiveTempC: number;
  effectiveWindKmh: number;
  heatingLoadKw: number;
  totalDemandKw: number;
  generationCapacityKw: number;
  powerBalanceKw: number;
  powerSurplusDeficitKw: number;
  batterySoc: number;
  batterySocPercent: number;
  batteryStatus: 'charging' | 'discharging' | 'nominal';
  dailyFuelBurnLitres: number;
  fuelRunwayDays: number;
  infrastructureOverallHealth: number;
  overallInfrastructureHealth: number;
  inventoryRunways: Record<string, { daysRemaining: number; status: InventoryStatus; shortageDate: string }>;
  crossDomainRisk: RiskSeverity;
  activeIncidentTitle: string;
  activeIncident: string;
  rootCause: string;
  causalChain: string[];
  forecastedImpact: string;
  recommendedResponse: string;
  recommendedResponses: string[];
  overallHealth: number;
  overallHealthScore: number;
  stationMode: StationMode;
  healthDeltaExplanation: string;
  healthPointDelta: number;
  primaryDrivers: string[];
}

export interface EffectiveFuelState {
  stockLitres: number;
  capacityLitres: number;
  burnLitresPerDay: number;
  runwayDays: number;
  safetyBufferDays: number;
  resupplyEtaDays: number;
  resupplyArrivalDate: string;
  projectedDepletionDate: string;
  hasPhysicalShortage: boolean;
  marginDays: number;
  status: InventoryStatus;
}

export interface EffectiveStationState {
  stationId: StationId;
  metadata: StationMetadata;
  health: StationHealthScore;
  energy: EnergyTelemetry;
  fuel: EffectiveFuelState;
  infrastructure: InfrastructureTelemetry;
  logistics: {
    inventory: InventoryItem[];
    requisitions: Requisition[];
    resupplyVesselStatus: string;
    resupplyEtaDays: number;
    criticalConsumablesCount: number;
  };
  environment: EnvironmentTelemetry;
  risk: {
    severity: RiskSeverity;
    activeIncidentTitle: string;
    rootCause: string;
    causalChain: string[];
    forecastedImpact: string;
    recommendedResponses: string[];
  };
  forecast: WeatherForecastHorizon[];
  alerts: Alert[];
  resolvedAlerts: Alert[];
  derived: StationDerivedState;
  lastUpdated: string;
}

export interface StationFullState {
  metadata: StationMetadata;
  environment: EnvironmentTelemetry;
  energy: EnergyTelemetry;
  infrastructure: InfrastructureTelemetry;
  logistics: {
    inventory: InventoryItem[];
    requisitions: Requisition[];
    source: DataProvenance;
  };
  healthScore: StationHealthScore;
  activeAlerts: Alert[];
  resolvedAlerts?: Alert[];
  derived: StationDerivedState;
  lastEvaluatedAt: string;
}

export interface SimulationInputs {
  stationId: StationId;
  temperatureAdjustmentC: number;
  windAdjustmentKmh: number;
  generator2Offline: boolean;
  resupplyDelayDays: number;
  degradeAssetId?: string;
}

export interface SimulationTimelinePoint {
  timeHorizon: 'T+0h' | 'T+6h' | 'T+12h' | 'T+24h' | 'T+48h' | 'T+72h' | 'T+96h';
  hours: number;
  energyDemandKw: number;
  generationKw: number;
  powerDeficitKw: number;
  batterySoc: number;
  fuelRunwayDays: number;
  criticalInventoryDays: number;
  riskState: RiskSeverity;
}

export interface SimulationCascadeStep {
  step: string;
  fromDomain: string;
  toDomain: string;
  description: string;
}

export interface SimulationResult {
  scenarioName: string;
  stationId: StationId;
  inputs: SimulationInputs;
  baseline: {
    energyDemandKw: number;
    netPowerKw: number;
    batterySocAfter24h: number;
    fuelRunwayDays: number;
    criticalInventoryDays: number;
    overallRisk: RiskSeverity;
  };
  simulated: {
    energyDemandKw: number;
    netPowerKw: number;
    batterySocAfter24h: number;
    fuelRunwayDays: number;
    criticalInventoryDays: number;
    energyDeficitPercent: number;
    overallRisk: RiskSeverity;
  };
  timeline: SimulationTimelinePoint[];
  cascadeSteps: SimulationCascadeStep[];
  whyExplanation: string;
  whyDidThisHappen?: string;
  causalChain: string[];
  recommendedResponse: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'REQUISITION' | 'ALERT' | 'SIMULATION' | 'TELEMETRY' | 'REPORT' | 'STATION';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface EdgeQueueItem {
  id: string;
  stationId?: StationId;
  type: 'ALERT_ACK' | 'REQUISITION_CREATE' | 'REQUISITION_UPDATE' | 'TELEMETRY_LOG' | 'CONFIG_CHANGE';
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCED';
}
