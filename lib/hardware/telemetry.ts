// SIH26060 Polar Command - Hardware Telemetry Ingestion, Validation & Normalization Pipeline
// Translates raw sensor fieldbus packets into digital twin physical states with rigorous fault distinction.

import { 
  TelemetryPacket, 
  SensorDevice, 
  SensorQuality, 
  HardwareProvenance,
  HardwareCategory,
  GeneratorHardwareModel,
  PumpHardwareModel,
  BessHardwareModel,
  FuelHardwareModel
} from './types';
import { StationId, StationAsset, EnergyTelemetry, InfrastructureTelemetry } from '@/types';

export interface TelemetryValidationResult {
  isValid: boolean;
  quality: SensorQuality;
  isSensorFault: boolean;
  isEquipmentFault: boolean;
  anomalyReason?: string;
  normalizedValue: number;
}

/**
 * Validates raw telemetry packet against physical engineering tolerances
 */
export function validateTelemetryPacket(
  packet: TelemetryPacket, 
  device?: SensorDevice
): TelemetryValidationResult {
  // 1. Explicit sensor fault check
  if (packet.quality === 'FAULT' || packet.source === 'DEMO FAULT' && packet.value === 0 && packet.metric.includes('pressure')) {
    return {
      isValid: false,
      quality: 'FAULT',
      isSensorFault: true,
      isEquipmentFault: false,
      anomalyReason: `SENSOR DISCONNECTED: Telemetry loss on ${packet.deviceId} (${packet.metric}). Instrumentation circuit open.`,
      normalizedValue: packet.value
    };
  }

  // 2. Check metadata range bounds if available
  if (device?.metadata?.rangeMin !== undefined && packet.value < device.metadata.rangeMin) {
    return {
      isValid: false,
      quality: 'BAD',
      isSensorFault: true,
      isEquipmentFault: false,
      anomalyReason: `OUT OF PHYSICAL RANGE: Value ${packet.value} ${packet.unit} is below calibrated minimum (${device.metadata.rangeMin}).`,
      normalizedValue: packet.value
    };
  }

  if (device?.metadata?.rangeMax !== undefined && packet.value > device.metadata.rangeMax) {
    return {
      isValid: false,
      quality: 'BAD',
      isSensorFault: true,
      isEquipmentFault: false,
      anomalyReason: `TRANSDUCER SATURATION: Value ${packet.value} ${packet.unit} exceeds sensor ceiling (${device.metadata.rangeMax}).`,
      normalizedValue: packet.value
    };
  }

  // 3. Equipment threshold checks
  if (device?.metadata?.thresholdCritical !== undefined && packet.value >= device.metadata.thresholdCritical) {
    return {
      isValid: true,
      quality: 'DEGRADED',
      isSensorFault: false,
      isEquipmentFault: true,
      anomalyReason: `CRITICAL THRESHOLD BREACH: ${packet.metric} reached ${packet.value} ${packet.unit} (trip setpoint: ${device.metadata.thresholdCritical}).`,
      normalizedValue: packet.value
    };
  }

  if (device?.metadata?.thresholdWarning !== undefined && packet.value >= device.metadata.thresholdWarning) {
    return {
      isValid: true,
      quality: 'UNCERTAIN',
      isSensorFault: false,
      isEquipmentFault: true,
      anomalyReason: `WARNING ADVISORY: ${packet.metric} elevated at ${packet.value} ${packet.unit} (advisory: ${device.metadata.thresholdWarning}).`,
      normalizedValue: packet.value
    };
  }

  return {
    isValid: true,
    quality: 'GOOD',
    isSensorFault: false,
    isEquipmentFault: false,
    normalizedValue: packet.value
  };
}

/**
 * Multi-Sensor Health Fusion Engine for Pumps (ISO 10816-3 Standard)
 * Combines: Vibration (mm/s), Discharge Pressure (bar), Flow Rate (Lpm), Bearing Temp (°C), Runtime Hours
 */
export function calculatePumpHealthScore(params: {
  vibrationMmS: number;
  pressureBar: number;
  flowRateLpm: number;
  bearingTempC: number;
  runtimeHours: number;
  nominalPressure?: number;
  nominalFlow?: number;
  isPressureSensorFault?: boolean;
}): { health: number; dataQuality: 'GOOD' | 'DEGRADED' | 'UNKNOWN'; explanation?: string; status: 'running' | 'operational' | 'warning' | 'critical' } {
  // If critical instrumentation is offline, do NOT guess health — flag DATA QUALITY DEGRADED / UNKNOWN
  if (params.isPressureSensorFault) {
    return {
      health: 0,
      dataQuality: 'UNKNOWN',
      explanation: 'DATA QUALITY DEGRADED: Primary discharge pressure sensor offline. Health calculation suspended to prevent false trip.',
      status: 'warning'
    };
  }

  let healthScore = 100;
  const warnings: string[] = [];

  // Vibration evaluation (ISO 10816 Zone A/B/C/D)
  // <1.8: Zone A (Good)
  // 1.8 - 4.5: Zone B/C (Unrestricted / Restricted long-term operation)
  // >4.5: Zone D (Vibration danger, imminent damage)
  if (params.vibrationMmS > 4.5) {
    healthScore -= 38;
    warnings.push(`Severe vibration ${params.vibrationMmS.toFixed(1)} mm/s (ISO 10816 Zone D)`);
  } else if (params.vibrationMmS > 2.5) {
    healthScore -= 18;
    warnings.push(`Elevated vibration ${params.vibrationMmS.toFixed(1)} mm/s (Zone C)`);
  }

  // Bearing temperature evaluation
  if (params.bearingTempC > 65) {
    healthScore -= 25;
    warnings.push(`Bearing overheating at ${params.bearingTempC.toFixed(1)}°C`);
  } else if (params.bearingTempC > 50) {
    healthScore -= 10;
    warnings.push(`Bearing thermal rise at ${params.bearingTempC.toFixed(1)}°C`);
  }

  // Hydraulic performance deviation
  const nominalP = params.nominalPressure || 3.5;
  const pDelta = Math.abs(params.pressureBar - nominalP) / nominalP;
  if (pDelta > 0.25) {
    healthScore -= 18;
    warnings.push(`Discharge pressure deviation (${params.pressureBar.toFixed(1)} bar vs nominal ${nominalP} bar)`);
  }

  const nominalQ = params.nominalFlow || 120;
  const qDelta = (nominalQ - params.flowRateLpm) / nominalQ;
  if (qDelta > 0.20) {
    healthScore -= 15;
    warnings.push(`Hydraulic flow drop (${params.flowRateLpm.toFixed(0)} Lpm vs nominal ${nominalQ} Lpm)`);
  }

  // Mechanical wear factor based on runtime
  const maintenanceInterval = 5000;
  const serviceFactor = Math.min(15, (params.runtimeHours % maintenanceInterval) / 400);
  healthScore -= Math.round(serviceFactor);

  const clampedHealth = Math.max(10, Math.min(100, Math.round(healthScore)));
  
  let status: 'running' | 'operational' | 'warning' | 'critical' = 'operational';
  if (clampedHealth < 50) status = 'critical';
  else if (clampedHealth < 75) status = 'warning';

  let explanation: string | undefined = undefined;
  if (warnings.length > 0) {
    explanation = warnings.join(' + ') + ` = Mechanical degradation risk (Score: ${clampedHealth}%)`;
  }

  return {
    health: clampedHealth,
    dataQuality: clampedHealth < 75 ? 'DEGRADED' : 'GOOD',
    explanation,
    status
  };
}

/**
 * Multi-Sensor Health Fusion Engine for Diesel Gensets
 * Combines: Coolant Temp, Oil Pressure, Vibration, Load Factor, Runtime
 */
export function calculateGeneratorHealthScore(params: {
  coolantTempC: number;
  oilPressureBar: number;
  vibrationMmS: number;
  loadPercent: number;
  runtimeHours: number;
  status: string;
}): number {
  if (params.status === 'offline') return 0;
  
  let score = 98;
  
  // Coolant temp check (nominal 70-85°C)
  if (params.coolantTempC > 95) score -= 40;
  else if (params.coolantTempC > 88) score -= 18;
  else if (params.coolantTempC < 50 && params.status === 'running') score -= 12; // cold wet-stacking risk

  // Oil pressure check (nominal 4.2 - 5.8 bar)
  if (params.oilPressureBar < 3.0 && params.status === 'running') score -= 45;
  else if (params.oilPressureBar < 4.0 && params.status === 'running') score -= 20;

  // Vibration
  if (params.vibrationMmS > 3.0) score -= 22;
  else if (params.vibrationMmS > 2.0) score -= 10;

  // Excessive load
  if (params.loadPercent > 95) score -= 15;

  return Math.max(10, Math.min(100, Math.round(score)));
}
