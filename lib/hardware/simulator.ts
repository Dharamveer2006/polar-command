// SIH26060 Polar Command - Hardware Field Simulator & Telemetry Synthesizer
// Provides physical fieldbus device models, sensor degradation, and ICS what-if simulations.

import { 
  SensorDevice, 
  ActuatorDevice, 
  TelemetryPacket, 
  HardwareCategory, 
  GeneratorHardwareModel, 
  PumpHardwareModel, 
  BessHardwareModel, 
  FuelHardwareModel, 
  HardwareNetworkSummary,
  HardwareAssetNode,
  HardwareProvenance
} from './types';
import { StationId } from '@/types';
import { ProtocolAdapterRegistry } from './protocols';
import { calculatePumpHealthScore, calculateGeneratorHealthScore } from './telemetry';

export interface HardwareScenarioState {
  generator2Offline: boolean;
  pumpVibrationFault: boolean;
  pressureSensorOffline: boolean;
  edgeGatewayDisconnected: boolean;
  bessLowSoc: boolean;
  fuelTransferFailure: boolean;
  actuatorStartGenFailure: boolean;
}

export class HardwareFieldSimulator {
  private stationId: StationId;
  private sensors: Map<string, SensorDevice> = new Map();
  private actuators: Map<string, ActuatorDevice> = new Map();
  private packetSeq: number = 1000;
  private scenarioState: HardwareScenarioState = {
    generator2Offline: false,
    pumpVibrationFault: false,
    pressureSensorOffline: false,
    edgeGatewayDisconnected: false,
    bessLowSoc: false,
    fuelTransferFailure: false,
    actuatorStartGenFailure: false
  };

  constructor(stationId: StationId) {
    this.stationId = stationId;
    this.initializeDevices();
  }

  private initializeDevices(): void {
    const isBharati = this.stationId === 'bharati';
    const prefix = isBharati ? 'BHR' : 'MTR';

    // 1. ENVIRONMENT CATEGORY (8 Devices)
    this.addSensor({
      deviceId: `${prefix}-ENV-TEMP`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-env-01`,
      category: 'ENVIRONMENT',
      name: 'Ambient Air Temperature RTD Pt100',
      sensorType: 'temperature',
      unit: '°C',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 5,
      lastReading: isBharati ? -19.2 : -24.6,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'PUBLIC OBSERVATION',
      metadata: { rangeMin: -70, rangeMax: 20 }
    });

    this.addSensor({
      deviceId: `${prefix}-ENV-PRES`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-env-01`,
      category: 'ENVIRONMENT',
      name: 'Vaisala PTB330 Digital Barometer',
      sensorType: 'pressure',
      unit: 'hPa',
      protocol: 'RS-485',
      samplingIntervalSec: 10,
      lastReading: isBharati ? 978 : 965,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'PUBLIC OBSERVATION',
      metadata: { rangeMin: 850, rangeMax: 1050 }
    });

    this.addSensor({
      deviceId: `${prefix}-ENV-HUM`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-env-01`,
      category: 'ENVIRONMENT',
      name: 'Rotronic Capacitive Hygrometer',
      sensorType: 'humidity',
      unit: '%',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 10,
      lastReading: isBharati ? 58 : 62,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'PUBLIC OBSERVATION',
      metadata: { rangeMin: 0, rangeMax: 100 }
    });

    this.addSensor({
      deviceId: `${prefix}-ENV-WIND-SPD`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-env-01`,
      category: 'ENVIRONMENT',
      name: 'Gill Ultrasonic Anemometer 2D',
      sensorType: 'wind',
      unit: 'km/h',
      protocol: 'RS-485',
      samplingIntervalSec: 2,
      lastReading: isBharati ? 42 : 38,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'PUBLIC OBSERVATION',
      metadata: { rangeMin: 0, rangeMax: 250, thresholdWarning: 80, thresholdCritical: 110 }
    });

    this.addSensor({
      deviceId: `${prefix}-ENV-WIND-DIR`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-env-01`,
      category: 'ENVIRONMENT',
      name: 'Ultrasonic Wind Direction Vane',
      sensorType: 'wind_direction',
      unit: '°',
      protocol: 'RS-485',
      samplingIntervalSec: 5,
      lastReading: isBharati ? 190 : 135,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'PUBLIC OBSERVATION',
      metadata: { rangeMin: 0, rangeMax: 360 }
    });

    this.addSensor({
      deviceId: `${prefix}-ENV-VIS`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-env-01`,
      category: 'ENVIRONMENT',
      name: 'Belfort Atmospheric Visibility LiDAR',
      sensorType: 'visibility',
      unit: 'km',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 15,
      lastReading: isBharati ? 9.0 : 8.5,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'PUBLIC OBSERVATION',
      metadata: { rangeMin: 0.1, rangeMax: 20 }
    });

    this.addSensor({
      deviceId: `${prefix}-ENV-RAD`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-env-01`,
      category: 'ENVIRONMENT',
      name: 'Kipp & Zonen CMP11 Pyranometer',
      sensorType: 'radiation',
      unit: 'W/m²',
      protocol: 'CAN',
      samplingIntervalSec: 30,
      lastReading: 120,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 1200 }
    });

    this.addSensor({
      deviceId: `${prefix}-ENV-SNOW`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-env-01`,
      category: 'ENVIRONMENT',
      name: 'Sonic Ultrasonic Snow Depth Gauge',
      sensorType: 'snow/ice',
      unit: 'cm',
      protocol: 'RS-485',
      samplingIntervalSec: 60,
      lastReading: 45,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 300 }
    });

    // 2. ENERGY CATEGORY (8 Devices)
    this.addSensor({
      deviceId: `${prefix}-GEN-01`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-gen-1`,
      category: 'ENERGY',
      name: 'Primary Diesel Genset #1 Power Meter',
      sensorType: 'generator',
      unit: 'kW',
      protocol: 'Modbus TCP',
      samplingIntervalSec: 2,
      lastReading: isBharati ? 195 : 185,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 220 }
    });

    this.addSensor({
      deviceId: `${prefix}-GEN-02`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-gen-2`,
      category: 'ENERGY',
      name: 'Secondary Diesel Genset #2 Power Meter',
      sensorType: 'generator',
      unit: 'kW',
      protocol: 'Modbus TCP',
      samplingIntervalSec: 2,
      lastReading: isBharati ? 190 : 180,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 220 }
    });

    this.addSensor({
      deviceId: `${prefix}-GEN-03`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-gen-3`,
      category: 'ENERGY',
      name: 'Thermal Waste Heat Co-gen Unit #3 Meter',
      sensorType: 'generator',
      unit: 'kW',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 5,
      lastReading: isBharati ? 66 : 55,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 100 }
    });

    this.addSensor({
      deviceId: `${prefix}-GEN-04`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-gen-4`,
      category: 'ENERGY',
      name: 'Cold-Reserve Emergency Genset #4 Monitor',
      sensorType: 'generator',
      unit: 'kW',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 10,
      lastReading: 0,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 180 }
    });

    this.addSensor({
      deviceId: `${prefix}-PWR-QUAL`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-energy-grid`,
      category: 'ENERGY',
      name: 'Microgrid Power Quality Meter (415V/50Hz)',
      sensorType: 'power quality meter',
      unit: 'Hz',
      protocol: 'Modbus TCP',
      samplingIntervalSec: 1,
      lastReading: 50.02,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 47, rangeMax: 53 }
    });

    this.addSensor({
      deviceId: `${prefix}-BESS-01`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-bess-1`,
      category: 'ENERGY',
      name: 'Central BESS Battery Management System',
      sensorType: 'BESS',
      unit: '%',
      protocol: 'CAN',
      samplingIntervalSec: 2,
      lastReading: isBharati ? 68 : 74,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 15, rangeMax: 100 }
    });

    this.addSensor({
      deviceId: `${prefix}-FUEL-LVL`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-fuel-1`,
      category: 'ENERGY',
      name: 'Bulk Fuel Tank Ultrasonic Level Transmitter',
      sensorType: 'fuel level sensor',
      unit: '%',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 30,
      lastReading: isBharati ? 62.7 : 68.3,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 10, rangeMax: 100 }
    });

    this.addSensor({
      deviceId: `${prefix}-FUEL-FLOW`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-fuel-1`,
      category: 'ENERGY',
      name: 'Micro Motion Coriolis Fuel Flow Meter',
      sensorType: 'fuel flow meter',
      unit: 'L/h',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 5,
      lastReading: isBharati ? 19.2 : 17.9,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 60 }
    });

    // 3. INFRASTRUCTURE CATEGORY (9 Devices)
    this.addSensor({
      deviceId: `${prefix}-HVAC-01`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-hvac-1`,
      category: 'INFRASTRUCTURE',
      name: 'Central Living Quarters HVAC Air Handler',
      sensorType: 'HVAC',
      unit: 'Lpm',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 5,
      lastReading: 3200,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 1000, rangeMax: 5000 }
    });

    this.addSensor({
      deviceId: `${prefix}-PUMP-01-FLOW`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-water-1`,
      category: 'INFRASTRUCTURE',
      name: 'Primary Water Intake Electromagnetic Flow Meter',
      sensorType: 'flow',
      unit: 'Lpm',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 5,
      lastReading: 125,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 200 }
    });

    this.addSensor({
      deviceId: `${prefix}-PUMP-01-PRES`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-water-1`,
      category: 'INFRASTRUCTURE',
      name: 'Water Pump Discharge Pressure Transducer',
      sensorType: 'pressure',
      unit: 'bar',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 2,
      lastReading: 3.4,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 10, thresholdWarning: 4.2 }
    });

    this.addSensor({
      deviceId: `${prefix}-PUMP-01-VIB`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-water-1`,
      category: 'INFRASTRUCTURE',
      name: 'Water Pump #1 Triaxial Vibration Sensor',
      sensorType: 'vibration sensor',
      unit: 'mm/s',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 1,
      lastReading: 2.1,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 15, thresholdWarning: 2.8, thresholdCritical: 4.5 }
    });

    this.addSensor({
      deviceId: `${prefix}-PUMP-01-TEMP`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-water-1`,
      category: 'INFRASTRUCTURE',
      name: 'Pump #1 Drive-End Bearing RTD',
      sensorType: 'bearing temperature',
      unit: '°C',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 5,
      lastReading: 48.2,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: -20, rangeMax: 120, thresholdWarning: 60 }
    });

    this.addSensor({
      deviceId: `${prefix}-PUMP-FUEL-01`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-fuel-1`,
      category: 'INFRASTRUCTURE',
      name: 'Aviation Turbine Fuel Transfer Pump',
      sensorType: 'fuel pump',
      unit: 'Lpm',
      protocol: 'RS-485',
      samplingIntervalSec: 10,
      lastReading: 80,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 150 }
    });

    this.addSensor({
      deviceId: `${prefix}-RO-01`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-water-1`,
      category: 'INFRASTRUCTURE',
      name: 'Sea Desalination RO HP Membrane Booster',
      sensorType: 'RO/desalination',
      unit: 'bar',
      protocol: 'Modbus TCP',
      samplingIntervalSec: 10,
      lastReading: 55.4,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 30, rangeMax: 75 }
    });

    this.addSensor({
      deviceId: `${prefix}-MELT-01`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-water-1`,
      category: 'INFRASTRUCTURE',
      name: 'Fresh Snow/Ice Melt Tank Glycol Heater',
      sensorType: 'melt tank',
      unit: '°C',
      protocol: 'Modbus RTU',
      samplingIntervalSec: 15,
      lastReading: 14.5,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 40 }
    });

    this.addSensor({
      deviceId: `${prefix}-GEN-VIB-02`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-gen-2`,
      category: 'INFRASTRUCTURE',
      name: 'Genset #2 Crankcase Vibration Accelerometer',
      sensorType: 'vibration sensor',
      unit: 'mm/s',
      protocol: 'CAN',
      samplingIntervalSec: 1,
      lastReading: 1.4,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 10, thresholdWarning: 2.5 }
    });

    // 4. COMMUNICATION CATEGORY (2 Devices)
    this.addSensor({
      deviceId: `${prefix}-SAT-01`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-comms-1`,
      category: 'COMMUNICATION',
      name: 'GSAT / C-Band Polar Radome Earth Station',
      sensorType: 'SATCOM',
      unit: 'dB SNR',
      protocol: 'HTTP/REST',
      samplingIntervalSec: 5,
      lastReading: 14.2,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 4, rangeMax: 20 }
    });

    this.addSensor({
      deviceId: `${prefix}-EDGE-01`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-edge-gateway`,
      category: 'COMMUNICATION',
      name: `${prefix}-EDGE-01 Antarctic Edge Gateway Link`,
      sensorType: 'edge gateway',
      unit: '% signal',
      protocol: 'MQTT',
      samplingIntervalSec: 2,
      lastReading: 98.2,
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      quality: 'GOOD',
      provenance: 'SIMULATED SENSOR',
      metadata: { rangeMin: 0, rangeMax: 100 }
    });

    // Add Actuators
    this.actuators.set(`${prefix}-GEN-01-ACT`, {
      deviceId: `${prefix}-GEN-01-ACT`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-gen-1`,
      category: 'ENERGY',
      name: 'Genset #1 Electronic Speed & Breaker Controller',
      actuatorType: 'generator_controller',
      protocol: 'Modbus TCP',
      status: 'ONLINE',
      targetState: 'RUNNING',
      currentState: 'RUNNING',
      lastCommandAt: new Date(Date.now() - 3600000).toISOString()
    });

    this.actuators.set(`${prefix}-GEN-02-ACT`, {
      deviceId: `${prefix}-GEN-02-ACT`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-gen-2`,
      category: 'ENERGY',
      name: 'Genset #2 Electronic Speed & Breaker Controller',
      actuatorType: 'generator_controller',
      protocol: 'Modbus TCP',
      status: 'ONLINE',
      targetState: 'RUNNING',
      currentState: 'RUNNING',
      lastCommandAt: new Date(Date.now() - 7200000).toISOString()
    });

    this.actuators.set(`${prefix}-PUMP-01-ACT`, {
      deviceId: `${prefix}-PUMP-01-ACT`,
      stationId: this.stationId,
      assetId: `${prefix.toLowerCase()}-water-1`,
      category: 'INFRASTRUCTURE',
      name: 'Water Extraction Pump Variable Frequency Drive',
      actuatorType: 'pump_vfd',
      protocol: 'Modbus RTU',
      status: 'ONLINE',
      targetState: 'RUNNING',
      currentState: 'RUNNING',
      lastCommandAt: new Date(Date.now() - 14400000).toISOString()
    });
  }

  private addSensor(sensor: SensorDevice): void {
    this.sensors.set(sensor.deviceId, sensor);
  }

  public setScenario(scenario: Partial<HardwareScenarioState>): void {
    this.scenarioState = { ...this.scenarioState, ...scenario };
  }

  public getScenario(): HardwareScenarioState {
    return { ...this.scenarioState };
  }

  public getAllSensors(): SensorDevice[] {
    const list = Array.from(this.sensors.values());
    const isBharati = this.stationId === 'bharati';
    const prefix = isBharati ? 'BHR' : 'MTR';

    return list.map(sensor => {
      const cloned = { ...sensor };
      
      // Apply scenario effects
      if (this.scenarioState.generator2Offline && (sensor.deviceId === `${prefix}-GEN-02` || sensor.deviceId === `${prefix}-GEN-VIB-02`)) {
        cloned.status = 'OFFLINE';
        cloned.lastReading = 0;
        cloned.quality = 'UNCERTAIN';
      }

      if (this.scenarioState.pumpVibrationFault && sensor.deviceId === `${prefix}-PUMP-01-VIB`) {
        cloned.status = 'CRITICAL';
        cloned.lastReading = 4.8; // Zone D severe vibration
        cloned.quality = 'DEGRADED';
      }

      if (this.scenarioState.pressureSensorOffline && sensor.deviceId === `${prefix}-PUMP-01-PRES`) {
        cloned.status = 'OFFLINE';
        cloned.lastReading = 0;
        cloned.quality = 'FAULT';
        cloned.failureMode = 'SENSOR_OFFLINE';
        cloned.provenance = 'DEMO FAULT';
      }

      if (this.scenarioState.edgeGatewayDisconnected && sensor.deviceId === `${prefix}-EDGE-01`) {
        cloned.status = 'OFFLINE';
        cloned.quality = 'FAULT';
        cloned.lastReading = 0;
      }

      if (this.scenarioState.bessLowSoc && sensor.deviceId === `${prefix}-BESS-01`) {
        cloned.status = 'WARNING';
        cloned.lastReading = 22; // Low SOC
        cloned.quality = 'DEGRADED';
      }

      return cloned;
    });
  }

  public getSensor(deviceId: string): SensorDevice | undefined {
    return this.getAllSensors().find(s => s.deviceId === deviceId);
  }

  public getActuators(): ActuatorDevice[] {
    return Array.from(this.actuators.values());
  }

  /**
   * Generates latest TelemetryPacket for a device
   */
  public async pollDevice(deviceId: string): Promise<TelemetryPacket> {
    const device = this.getSensor(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found on station ${this.stationId}`);
    }
    this.packetSeq++;
    const adapter = ProtocolAdapterRegistry.getAdapter(device.protocol);
    return adapter.readTelemetry(device, this.packetSeq);
  }

  /**
   * Generator Model (Requirement 9)
   */
  public getGeneratorModel(genNumber: 1 | 2): GeneratorHardwareModel {
    const isBharati = this.stationId === 'bharati';
    const prefix = isBharati ? 'BHR' : 'MTR';
    const deviceId = `${prefix}-GEN-0${genNumber}`;
    const assetId = `${prefix.toLowerCase()}-gen-${genNumber}`;
    const name = isBharati 
      ? `Main Cogeneration Unit #${genNumber} (CAT 275kVA)` 
      : `Primary Diesel Genset #${genNumber} (Cummins 250kVA)`;

    const isGen2Offline = genNumber === 2 && this.scenarioState.generator2Offline;
    const capacityKw = isBharati ? 220 : 200;
    const outputKw = isGen2Offline ? 0 : (genNumber === 1 ? (isBharati ? 195 : 185) : (isBharati ? 190 : 180));
    const loadPercent = isGen2Offline ? 0 : Number(((outputKw / capacityKw) * 100).toFixed(1));
    const coolantTempC = isGen2Offline ? 28.0 : (genNumber === 1 ? 72.5 : 73.1);
    const oilPressureBar = isGen2Offline ? 0 : (genNumber === 1 ? 5.1 : 5.0);
    const fuelRateLph = isGen2Offline ? 0 : (genNumber === 1 ? 17.2 : 16.8);
    const vibrationMmS = isGen2Offline ? 0 : (genNumber === 1 ? 1.2 : 1.4);
    const runtimeHours = genNumber === 1 ? 3420 : 3200;

    const health = isGen2Offline ? 0 : calculateGeneratorHealthScore({
      coolantTempC,
      oilPressureBar,
      vibrationMmS,
      loadPercent,
      runtimeHours,
      status: isGen2Offline ? 'offline' : 'running'
    });

    return {
      deviceId,
      assetId,
      name,
      status: isGen2Offline ? 'offline' : 'running',
      capacityKw,
      currentOutputKw: outputKw,
      loadPercent,
      coolantTempC,
      oilPressureBar,
      fuelRateLph,
      vibrationMmS,
      runtimeHours,
      health,
      edgeLink: this.scenarioState.edgeGatewayDisconnected ? 'OFFLINE' : 'CONNECTED',
      lastPacketSecondsAgo: 8
    };
  }

  /**
   * Pump Model (Requirement 10)
   */
  public getPumpModel(): PumpHardwareModel {
    const isBharati = this.stationId === 'bharati';
    const prefix = isBharati ? 'BHR' : 'MTR';
    const deviceId = `${prefix}-PUMP-01-VIB`;
    const assetId = `${prefix.toLowerCase()}-water-1`;
    const name = isBharati ? 'Desalination Intake Water Pump #1' : 'Lake Priyadarshini Extraction Pump #1';

    const vibReading = this.scenarioState.pumpVibrationFault ? 4.8 : 2.1;
    const presReading = this.scenarioState.pressureSensorOffline ? 0 : (this.scenarioState.pumpVibrationFault ? 2.7 : 3.4);
    const flowReading = this.scenarioState.pumpVibrationFault ? 98 : 125;
    const bearingTemp = this.scenarioState.pumpVibrationFault ? 68.4 : 48.2;
    const runtime = 4120;

    const evaluation = calculatePumpHealthScore({
      vibrationMmS: vibReading,
      pressureBar: presReading,
      flowRateLpm: flowReading,
      bearingTempC: bearingTemp,
      runtimeHours: runtime,
      isPressureSensorFault: this.scenarioState.pressureSensorOffline
    });

    return {
      deviceId,
      assetId,
      name,
      status: evaluation.status,
      flowRateLpm: flowReading,
      pressureBar: presReading,
      bearingTempC: bearingTemp,
      vibrationMmS: vibReading,
      runtimeHours: runtime,
      health: evaluation.health,
      edgeLink: this.scenarioState.edgeGatewayDisconnected ? 'OFFLINE' : 'CONNECTED',
      dataQuality: evaluation.dataQuality,
      alertExplanation: evaluation.explanation
    };
  }

  /**
   * BESS Model (Requirement 11)
   */
  public getBessModel(): BessHardwareModel {
    const isBharati = this.stationId === 'bharati';
    const prefix = isBharati ? 'BHR' : 'MTR';
    const totalCapacityKwh = isBharati ? 750 : 600;
    const baseSoc = isBharati ? 68 : 74;
    const socPercent = this.scenarioState.bessLowSoc 
      ? 22 
      : (this.scenarioState.generator2Offline ? 48 : baseSoc);

    const isDischarging = this.scenarioState.generator2Offline || this.scenarioState.bessLowSoc;
    const powerKw = isDischarging ? -45.0 : 12.5;
    const voltageV = 720 - (100 - socPercent) * 0.8;
    const currentA = Number(((powerKw * 1000) / voltageV).toFixed(1));
    const availableEnergyKwh = Math.round((totalCapacityKwh * socPercent) / 100);

    return {
      deviceId: `${prefix}-BESS-01`,
      assetId: `${prefix.toLowerCase()}-bess-1`,
      name: 'Microgrid Battery Energy Storage System',
      socPercent,
      voltageV: Math.round(voltageV),
      currentA,
      powerKw,
      cellTempC: 19.8,
      chargeDischargeState: isDischarging ? 'DISCHARGING' : 'CHARGING',
      availableEnergyKwh,
      totalCapacityKwh,
      health: 96
    };
  }

  /**
   * Fuel Hardware Model (Requirement 12)
   */
  public getFuelModel(canonicalBurnLitresPerDay: number, canonicalStockLitres: number, canonicalCapacityLitres: number): FuelHardwareModel {
    const isBharati = this.stationId === 'bharati';
    const prefix = isBharati ? 'BHR' : 'MTR';
    const tankLevelPercent = Number(((canonicalStockLitres / canonicalCapacityLitres) * 100).toFixed(1));
    const autonomyDays = canonicalBurnLitresPerDay > 0 
      ? Number((canonicalStockLitres / canonicalBurnLitresPerDay).toFixed(1)) 
      : 999;

    return {
      deviceId: `${prefix}-FUEL-LVL`,
      assetId: `${prefix.toLowerCase()}-fuel-1`,
      name: 'Cryogenic Fuel Storage & Distribution Manifold',
      tankLevelPercent,
      stockLitres: canonicalStockLitres,
      capacityLitres: canonicalCapacityLitres,
      flowRateLph: Number((canonicalBurnLitresPerDay / 24).toFixed(1)),
      dailyConsumptionLitres: canonicalBurnLitresPerDay,
      autonomyDays,
      transferPumpStatus: this.scenarioState.fuelTransferFailure ? 'FAULT' : 'RUNNING'
    };
  }

  /**
   * Hardware Network Summary (Requirement 16 & 23)
   */
  public getNetworkSummary(): HardwareNetworkSummary {
    const sensors = this.getAllSensors();
    const totalDevices = sensors.length;
    let onlineCount = 0;
    let warningCount = 0;
    let offlineCount = 0;

    for (const s of sensors) {
      if (s.status === 'ONLINE') onlineCount++;
      else if (s.status === 'WARNING') warningCount++;
      else offlineCount++;
    }

    const gatewayStatus = this.scenarioState.edgeGatewayDisconnected ? 'OFFLINE' : 'CONNECTED';
    const packetLossPercent = this.scenarioState.edgeGatewayDisconnected ? 100 : 1.8;

    return {
      stationId: this.stationId,
      totalDevices,
      onlineCount,
      warningCount,
      offlineCount,
      packetLossPercent,
      lastPacketSecondsAgo: this.scenarioState.edgeGatewayDisconnected ? 142 : 8,
      gatewayStatus,
      localControlActive: this.scenarioState.edgeGatewayDisconnected
    };
  }

  /**
   * Returns list of primary hardware nodes for the Spatial Digital Twin
   */
  public getSpatialHardwareNodes(): HardwareAssetNode[] {
    const isBharati = this.stationId === 'bharati';
    const prefix = isBharati ? 'BHR' : 'MTR';
    const gen1 = this.getGeneratorModel(1);
    const gen2 = this.getGeneratorModel(2);
    const bess = this.getBessModel();
    const pump = this.getPumpModel();

    return [
      {
        nodeId: 'node-gen-1',
        deviceId: `${prefix}-GEN-01`,
        assetId: `${prefix.toLowerCase()}-gen-1`,
        category: 'ENERGY',
        name: isBharati ? 'Genset #1 (CAT 275kVA)' : 'Genset #1 (Cummins 250kVA)',
        shortLabel: 'GEN #1',
        status: gen1.status === 'running' ? 'ONLINE' : 'OFFLINE',
        health: gen1.health,
        primaryMetric: 'OUTPUT',
        primaryValue: `${gen1.currentOutputKw} kW`,
        subMetric: 'LOAD',
        subValue: `${gen1.loadPercent}%`,
        edgeLink: gen1.edgeLink,
        protocol: 'Modbus TCP',
        coordinates: { x: 570, y: 150 }
      },
      {
        nodeId: 'node-gen-2',
        deviceId: `${prefix}-GEN-02`,
        assetId: `${prefix.toLowerCase()}-gen-2`,
        category: 'ENERGY',
        name: isBharati ? 'Genset #2 (CAT 275kVA)' : 'Genset #2 (Cummins 250kVA)',
        shortLabel: 'GEN #2',
        status: gen2.status === 'running' ? 'ONLINE' : 'OFFLINE',
        health: gen2.health,
        primaryMetric: 'OUTPUT',
        primaryValue: `${gen2.currentOutputKw} kW`,
        subMetric: 'LOAD',
        subValue: `${gen2.loadPercent}%`,
        edgeLink: gen2.edgeLink,
        protocol: 'Modbus TCP',
        coordinates: { x: 670, y: 150 }
      },
      {
        nodeId: 'node-bess',
        deviceId: `${prefix}-BESS-01`,
        assetId: `${prefix.toLowerCase()}-bess-1`,
        category: 'ENERGY',
        name: 'Central Battery Energy Storage',
        shortLabel: 'BESS',
        status: bess.socPercent < 25 ? 'WARNING' : 'ONLINE',
        health: bess.health,
        primaryMetric: 'SOC',
        primaryValue: `${bess.socPercent}%`,
        subMetric: 'POWER',
        subValue: `${bess.powerKw} kW`,
        edgeLink: 'CONNECTED',
        protocol: 'CAN',
        coordinates: { x: 500, y: 220 }
      },
      {
        nodeId: 'node-hvac',
        deviceId: `${prefix}-HVAC-01`,
        assetId: `${prefix.toLowerCase()}-hvac-1`,
        category: 'INFRASTRUCTURE',
        name: 'Central Living Quarters HVAC',
        shortLabel: 'HVAC',
        status: 'ONLINE',
        health: 92,
        primaryMetric: 'AIRFLOW',
        primaryValue: '3,200 Lpm',
        subMetric: 'STATUS',
        subValue: 'NOMINAL',
        edgeLink: 'CONNECTED',
        protocol: 'Modbus RTU',
        coordinates: { x: 400, y: 160 }
      },
      {
        nodeId: 'node-water-pump',
        deviceId: `${prefix}-PUMP-01-VIB`,
        assetId: `${prefix.toLowerCase()}-water-1`,
        category: 'INFRASTRUCTURE',
        name: 'Intake Water Extraction Pump #1',
        shortLabel: 'WATER PUMP',
        status: pump.status === 'critical' ? 'CRITICAL' : (pump.status === 'warning' ? 'WARNING' : 'ONLINE'),
        health: pump.health,
        primaryMetric: 'PRESSURE',
        primaryValue: pump.dataQuality === 'UNKNOWN' ? 'NO DATA' : `${pump.pressureBar.toFixed(1)} bar`,
        subMetric: 'VIB',
        subValue: `${pump.vibrationMmS.toFixed(1)} mm/s`,
        edgeLink: pump.edgeLink,
        protocol: 'Modbus RTU',
        coordinates: { x: 230, y: 200 }
      },
      {
        nodeId: 'node-ro',
        deviceId: `${prefix}-RO-01`,
        assetId: `${prefix.toLowerCase()}-water-1`,
        category: 'INFRASTRUCTURE',
        name: 'Sea Desalination RO HP System',
        shortLabel: 'RO DESAL',
        status: 'ONLINE',
        health: 90,
        primaryMetric: 'PRESSURE',
        primaryValue: '55.4 bar',
        subMetric: 'SALINITY',
        subValue: '<15 ppm',
        edgeLink: 'CONNECTED',
        protocol: 'Modbus TCP',
        coordinates: { x: 180, y: 260 }
      },
      {
        nodeId: 'node-fuel-tank',
        deviceId: `${prefix}-FUEL-LVL`,
        assetId: `${prefix.toLowerCase()}-fuel-1`,
        category: 'ENERGY',
        name: 'Bulk Fuel Tank & Flow Station',
        shortLabel: 'FUEL TANK',
        status: this.scenarioState.fuelTransferFailure ? 'WARNING' : 'ONLINE',
        health: 94,
        primaryMetric: 'LEVEL',
        primaryValue: isBharati ? '62.7%' : '68.3%',
        subMetric: 'FLOW',
        subValue: isBharati ? '19.2 L/h' : '17.9 L/h',
        edgeLink: 'CONNECTED',
        protocol: 'Modbus RTU',
        coordinates: { x: 630, y: 320 }
      },
      {
        nodeId: 'node-satcom',
        deviceId: `${prefix}-SAT-01`,
        assetId: `${prefix.toLowerCase()}-comms-1`,
        category: 'COMMUNICATION',
        name: 'C-Band SATCOM Gateway Radome',
        shortLabel: 'SATCOM',
        status: 'ONLINE',
        health: 95,
        primaryMetric: 'LINK SNR',
        primaryValue: '14.2 dB',
        subMetric: 'CARRIER',
        subValue: 'LOCKED',
        edgeLink: 'CONNECTED',
        protocol: 'HTTP/REST',
        coordinates: { x: 400, y: 70 }
      }
    ];
  }
}
