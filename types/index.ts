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

export interface EnvironmentTelemetry {
  temperatureC: number;
  windKmh: number;
  windDirectionDeg: number;
  pressureHpa: number;
  visibilityKm: number;
  humidityPercent: number;
  blizzardRisk: RiskSeverity;
  source: 'Public observation' | 'Simulated telemetry';
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
  source: 'Simulated telemetry';
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
    loadKw?: number;
    flowRateLpm?: number;
    efficiencyPercent?: number;
    runtimeHours?: number;
    fuelRateLph?: number;
  };
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
  source: 'Simulated telemetry';
  updatedAt: string;
}

export type InventoryCategory = 
  | 'fuel' 
  | 'food' 
  | 'medical' 
  | 'water_treatment' 
  | 'spare_parts';

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
  burnRateTrend: 'normal' | 'elevated' | 'critical';
  riskLevel: RiskSeverity;
  nextResupplyEta: string;
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

export interface StationFullState {
  metadata: StationMetadata;
  environment: EnvironmentTelemetry;
  energy: EnergyTelemetry;
  infrastructure: InfrastructureTelemetry;
  logistics: {
    inventory: InventoryItem[];
    requisitions: Requisition[];
    source: 'Prototype operational model';
  };
  healthScore: StationHealthScore;
  activeAlerts: Alert[];
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
