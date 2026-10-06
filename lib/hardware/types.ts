// Domain types for SIH26060 Polar Command Hardware-First Digital Twin Architecture
import { StationId, UserRole, RiskSeverity, DataProvenance } from '@/types';

export type HardwareCategory = 'ENVIRONMENT' | 'ENERGY' | 'INFRASTRUCTURE' | 'COMMUNICATION';

export type HardwareProvenance = 
  | 'REAL SENSOR' 
  | 'SIMULATED SENSOR' 
  | 'PUBLIC OBSERVATION' 
  | 'DERIVED' 
  | 'FORECAST' 
  | 'DEMO FAULT';

export type SensorQuality = 'GOOD' | 'UNCERTAIN' | 'BAD' | 'DEGRADED' | 'FAULT';

export type DeviceStatus = 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE';

export type GatewayConnectionState = 'CONNECTED' | 'DEGRADED' | 'OFFLINE';

export type HardwareProtocol = 
  | 'Modbus RTU' 
  | 'Modbus TCP' 
  | 'RS-485' 
  | 'CAN' 
  | 'OPC-UA' 
  | 'MQTT' 
  | 'HTTP/REST' 
  | 'SIMULATED';

export type SensorFailureMode = 
  | 'NOMINAL' 
  | 'SENSOR_OFFLINE' 
  | 'STUCK_VALUE' 
  | 'OUT_OF_RANGE' 
  | 'NOISY';

export type ActuatorFailureMode = 
  | 'NOMINAL' 
  | 'FAIL_TO_START' 
  | 'FAIL_TO_STOP' 
  | 'COMMAND_TIMEOUT' 
  | 'INTERLOCK_TRIP';

export interface SensorDevice {
  deviceId: string;
  stationId: StationId;
  assetId: string;
  category: HardwareCategory;
  name: string;
  sensorType: string;
  unit: string;
  protocol: HardwareProtocol;
  samplingIntervalSec: number;
  lastReading: number;
  timestamp: string;
  status: DeviceStatus;
  quality: SensorQuality;
  provenance: HardwareProvenance;
  failureMode?: SensorFailureMode;
  metadata?: {
    channel?: string;
    registerAddress?: number;
    rangeMin?: number;
    rangeMax?: number;
    thresholdWarning?: number;
    thresholdCritical?: number;
  };
}

export interface ActuatorDevice {
  deviceId: string;
  stationId: StationId;
  assetId: string;
  category: HardwareCategory;
  name: string;
  actuatorType: string;
  protocol: HardwareProtocol;
  status: DeviceStatus;
  targetState: string;
  currentState: string;
  lastCommandAt: string;
  failureMode?: ActuatorFailureMode;
}

export interface TelemetryPacket {
  deviceId: string;
  assetId: string;
  stationId: StationId;
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  quality: SensorQuality;
  source: HardwareProvenance;
  sequenceNumber: number;
}

export type HardwareCommandType = 
  | 'START' 
  | 'STOP' 
  | 'RESET_FAULT' 
  | 'ACKNOWLEDGE' 
  | 'ISOLATE' 
  | 'ENTER_SAFE_MODE';

export type CommandStatus = 
  | 'QUEUED' 
  | 'SENT' 
  | 'ACKNOWLEDGED' 
  | 'EXECUTED' 
  | 'FAILED';

export interface CommandPacket {
  commandId: string;
  deviceId: string;
  assetId: string;
  stationId: StationId;
  command: HardwareCommandType;
  parameters?: Record<string, any>;
  timestamp: string;
  operator: string;
  operatorRole: UserRole;
  status: CommandStatus;
  failureReason?: string;
  acknowledgedAt?: string;
  executedAt?: string;
}

export interface EdgeGateway {
  gatewayId: string;
  stationId: StationId;
  name: string;
  connectionState: GatewayConnectionState;
  devicesConnected: number;
  totalDevices: number;
  lastPacketAt: string;
  packetLossPercent: number;
  bufferedPackets: TelemetryPacket[];
  queuedCommands: CommandPacket[];
  protocols: HardwareProtocol[];
  firmwareVersion: string;
  localControlActive: boolean;
}

export interface HardwareConnection {
  id: string;
  sourceDeviceId: string;
  targetGatewayId: string;
  protocol: HardwareProtocol;
  interfacePort?: string;
  latencyMs: number;
  signalQualityPercent: number;
  packetCount: number;
  droppedCount: number;
  status: 'ACTIVE' | 'INTERMITTENT' | 'DISCONNECTED';
}

export interface GeneratorHardwareModel {
  deviceId: string;
  assetId: string;
  name: string;
  status: 'running' | 'standby' | 'maintenance' | 'offline';
  capacityKw: number;
  currentOutputKw: number;
  loadPercent: number;
  coolantTempC: number;
  oilPressureBar: number;
  fuelRateLph: number;
  vibrationMmS: number;
  runtimeHours: number;
  health: number;
  edgeLink: 'CONNECTED' | 'DEGRADED' | 'OFFLINE';
  lastPacketSecondsAgo: number;
}

export interface PumpHardwareModel {
  deviceId: string;
  assetId: string;
  name: string;
  status: 'operational' | 'running' | 'warning' | 'critical' | 'offline';
  flowRateLpm: number;
  pressureBar: number;
  bearingTempC: number;
  vibrationMmS: number;
  runtimeHours: number;
  health: number;
  edgeLink: 'CONNECTED' | 'DEGRADED' | 'OFFLINE';
  dataQuality: 'GOOD' | 'DEGRADED' | 'UNKNOWN';
  alertExplanation?: string;
}

export interface BessHardwareModel {
  deviceId: string;
  assetId: string;
  name: string;
  socPercent: number;
  voltageV: number;
  currentA: number;
  powerKw: number;
  cellTempC: number;
  chargeDischargeState: 'CHARGING' | 'DISCHARGING' | 'STANDBY';
  availableEnergyKwh: number;
  totalCapacityKwh: number;
  health: number;
}

export interface FuelHardwareModel {
  deviceId: string;
  assetId: string;
  name: string;
  tankLevelPercent: number;
  stockLitres: number;
  capacityLitres: number;
  flowRateLph: number;
  dailyConsumptionLitres: number;
  autonomyDays: number;
  transferPumpStatus: 'RUNNING' | 'STANDBY' | 'FAULT';
}

export interface HardwareNetworkSummary {
  stationId: StationId;
  totalDevices: number;
  onlineCount: number;
  warningCount: number;
  offlineCount: number;
  packetLossPercent: number;
  lastPacketSecondsAgo: number;
  gatewayStatus: GatewayConnectionState;
  localControlActive: boolean;
}

export interface HardwareAssetNode {
  nodeId: string;
  deviceId: string;
  assetId: string;
  category: HardwareCategory;
  name: string;
  shortLabel: string;
  status: DeviceStatus;
  health: number;
  primaryMetric: string;
  primaryValue: string;
  subMetric?: string;
  subValue?: string;
  edgeLink: GatewayConnectionState;
  protocol: HardwareProtocol;
  coordinates: { x: number; y: number };
}
