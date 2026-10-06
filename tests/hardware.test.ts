import { describe, it, expect } from 'vitest';
import {
  HardwareFieldSimulator,
  EdgeGatewayManager,
  HardwareCommandDispatcher,
  ProtocolAdapterRegistry,
  SimulatedProtocolAdapter,
  MqttJsonProtocolAdapter,
  validateTelemetryPacket,
  calculatePumpHealthScore,
  calculateGeneratorHealthScore,
  TelemetryPacket,
  SensorDevice
} from '../lib/hardware';
import { DEMO_USERS } from '../mocks/stationData';

describe('SIH26060 Polar Command - Hardware-First Architecture Tests', () => {

  describe('1. Hardware Field Simulator & 27 Devices Topology', () => {
    it('initializes 27 physical devices across all 4 categories', () => {
      const simulator = new HardwareFieldSimulator('bharati');
      const sensors = simulator.getAllSensors();

      expect(sensors.length).toBe(27);

      const envSensors = sensors.filter(s => s.category === 'ENVIRONMENT');
      const energySensors = sensors.filter(s => s.category === 'ENERGY');
      const infraSensors = sensors.filter(s => s.category === 'INFRASTRUCTURE');
      const commSensors = sensors.filter(s => s.category === 'COMMUNICATION');

      expect(envSensors.length).toBe(8);
      expect(energySensors.length).toBe(8);
      expect(infraSensors.length).toBe(9);
      expect(commSensors.length).toBe(2);
    });

    it('generates 8 Spatial Hardware Engineering Nodes for digital twin', () => {
      const simulator = new HardwareFieldSimulator('bharati');
      const nodes = simulator.getSpatialHardwareNodes();

      expect(nodes.length).toBe(8);
      const labels = nodes.map(n => n.shortLabel);
      expect(labels).toContain('GEN #1');
      expect(labels).toContain('GEN #2');
      expect(labels).toContain('BESS');
      expect(labels).toContain('HVAC');
      expect(labels).toContain('WATER PUMP');
      expect(labels).toContain('RO DESAL');
      expect(labels).toContain('FUEL TANK');
      expect(labels).toContain('SATCOM');
    });
  });

  describe('2. Telemetry Packet Validation & Fault Discrimination (Requirement 20)', () => {
    it('validates nominal sensor packet', () => {
      const packet: TelemetryPacket = {
        deviceId: 'BHR-PUMP-01-PRES',
        assetId: 'bharati-water-1',
        stationId: 'bharati',
        timestamp: new Date().toISOString(),
        metric: 'pressure',
        value: 3.4,
        unit: 'bar',
        quality: 'GOOD',
        source: 'SIMULATED SENSOR',
        sequenceNumber: 101
      };

      const device: SensorDevice = {
        deviceId: 'BHR-PUMP-01-PRES',
        stationId: 'bharati',
        assetId: 'bharati-water-1',
        category: 'INFRASTRUCTURE',
        name: 'Pump Discharge Pressure',
        sensorType: 'pressure',
        unit: 'bar',
        protocol: 'Modbus RTU',
        samplingIntervalSec: 2,
        lastReading: 3.4,
        timestamp: new Date().toISOString(),
        status: 'ONLINE',
        quality: 'GOOD',
        provenance: 'SIMULATED SENSOR',
        metadata: { rangeMin: 0, rangeMax: 10 }
      };

      const res = validateTelemetryPacket(packet, device);
      expect(res.isValid).toBe(true);
      expect(res.quality).toBe('GOOD');
      expect(res.isSensorFault).toBe(false);
      expect(res.isEquipmentFault).toBe(false);
    });

    it('distinguishes SENSOR FAULT from equipment breakdown when instrument is offline', () => {
      const packet: TelemetryPacket = {
        deviceId: 'BHR-PUMP-01-PRES',
        assetId: 'bharati-water-1',
        stationId: 'bharati',
        timestamp: new Date().toISOString(),
        metric: 'pressure',
        value: 0,
        unit: 'bar',
        quality: 'FAULT',
        source: 'DEMO FAULT',
        sequenceNumber: 102
      };

      const res = validateTelemetryPacket(packet);
      expect(res.isValid).toBe(false);
      expect(res.isSensorFault).toBe(true);
      expect(res.isEquipmentFault).toBe(false);
      expect(res.anomalyReason).toContain('SENSOR DISCONNECTED');
    });

    it('flags OUT_OF_RANGE transducer saturation as sensor anomaly', () => {
      const packet: TelemetryPacket = {
        deviceId: 'BHR-PUMP-01-PRES',
        assetId: 'bharati-water-1',
        stationId: 'bharati',
        timestamp: new Date().toISOString(),
        metric: 'pressure',
        value: 18.5,
        unit: 'bar',
        quality: 'BAD',
        source: 'SIMULATED SENSOR',
        sequenceNumber: 103
      };

      const device: SensorDevice = {
        deviceId: 'BHR-PUMP-01-PRES',
        stationId: 'bharati',
        assetId: 'bharati-water-1',
        category: 'INFRASTRUCTURE',
        name: 'Pump Discharge Pressure',
        sensorType: 'pressure',
        unit: 'bar',
        protocol: 'Modbus RTU',
        samplingIntervalSec: 2,
        lastReading: 3.4,
        timestamp: new Date().toISOString(),
        status: 'ONLINE',
        quality: 'GOOD',
        provenance: 'SIMULATED SENSOR',
        metadata: { rangeMin: 0, rangeMax: 10 }
      };

      const res = validateTelemetryPacket(packet, device);
      expect(res.isValid).toBe(false);
      expect(res.isSensorFault).toBe(true);
      expect(res.anomalyReason).toContain('TRANSDUCER SATURATION');
    });
  });

  describe('3. Multi-Sensor Health Fusion Engine (ISO 10816)', () => {
    it('calculates nominal pump health score', () => {
      const result = calculatePumpHealthScore({
        vibrationMmS: 1.4,
        pressureBar: 3.4,
        flowRateLpm: 125,
        bearingTempC: 45,
        runtimeHours: 2000
      });

      expect(result.health).toBeGreaterThan(85);
      expect(result.dataQuality).toBe('GOOD');
      expect(result.status).toBe('operational');
    });

    it('detects severe vibration (ISO 10816 Zone D) and generates explainable deviation report', () => {
      const result = calculatePumpHealthScore({
        vibrationMmS: 4.8,
        pressureBar: 2.6,
        flowRateLpm: 95,
        bearingTempC: 68,
        runtimeHours: 4200
      });

      expect(result.health).toBeLessThan(50);
      expect(result.explanation).toContain('Severe vibration 4.8 mm/s (ISO 10816 Zone D)');
      expect(result.explanation).toContain('Bearing overheating');
      expect(result.status).toBe('critical');
    });

    it('marks pump health as UNKNOWN when critical pressure sensor is offline', () => {
      const result = calculatePumpHealthScore({
        vibrationMmS: 1.4,
        pressureBar: 0,
        flowRateLpm: 125,
        bearingTempC: 45,
        runtimeHours: 2000,
        isPressureSensorFault: true
      });

      expect(result.health).toBe(0);
      expect(result.dataQuality).toBe('UNKNOWN');
      expect(result.explanation).toContain('DATA QUALITY DEGRADED');
    });

    it('calculates diesel generator health with coolant and oil pressure fusion', () => {
      const healthyScore = calculateGeneratorHealthScore({
        coolantTempC: 73.1,
        oilPressureBar: 5.0,
        vibrationMmS: 1.4,
        loadPercent: 86.4,
        runtimeHours: 3200,
        status: 'running'
      });
      expect(healthyScore).toBeGreaterThanOrEqual(90);

      const degradedScore = calculateGeneratorHealthScore({
        coolantTempC: 96.5,
        oilPressureBar: 2.6,
        vibrationMmS: 3.8,
        loadPercent: 98,
        runtimeHours: 4500,
        status: 'running'
      });
      expect(degradedScore).toBeLessThan(50);
    });
  });

  describe('4. Protocol Adapter Registry & Fieldbus Interfaces', () => {
    it('retrieves adapters for supported industrial protocols', () => {
      const simAdapter = ProtocolAdapterRegistry.getAdapter('SIMULATED');
      expect(simAdapter.protocol).toBe('SIMULATED');

      const mqttAdapter = ProtocolAdapterRegistry.getAdapter('MQTT');
      expect(mqttAdapter.protocol).toBe('MQTT');

      const modbusAdapter = ProtocolAdapterRegistry.getAdapter('Modbus RTU');
      expect(modbusAdapter.protocol).toBe('Modbus RTU');

      const canAdapter = ProtocolAdapterRegistry.getAdapter('CAN');
      expect(canAdapter.protocol).toBe('CAN');
    });

    it('simulated adapter generates deterministic telemetry with sequence numbers', async () => {
      const adapter = new SimulatedProtocolAdapter();
      const mockSensor: SensorDevice = {
        deviceId: 'BHR-GEN-01',
        stationId: 'bharati',
        assetId: 'bharati-gen-1',
        category: 'ENERGY',
        name: 'Genset #1',
        sensorType: 'generator',
        unit: 'kW',
        protocol: 'SIMULATED',
        samplingIntervalSec: 2,
        lastReading: 195,
        timestamp: new Date().toISOString(),
        status: 'ONLINE',
        quality: 'GOOD',
        provenance: 'SIMULATED SENSOR'
      };

      const packet = await adapter.readTelemetry(mockSensor, 105);
      expect(packet.sequenceNumber).toBe(105);
      expect(packet.deviceId).toBe('BHR-GEN-01');
      expect(packet.value).toBeGreaterThan(190);
      expect(packet.value).toBeLessThan(200);
    });
  });

  describe('5. Edge Gateway Offline Mode & Reconnection Sync (Requirements 6 & 7)', () => {
    it('manages edge gateway state and buffers telemetry during disconnect', () => {
      const gwManager = new EdgeGatewayManager('bharati');
      const initial = gwManager.getGatewayState();

      expect(initial.gatewayId).toBe('BHR-EDGE-01');
      expect(initial.connectionState).toBe('CONNECTED');
      expect(initial.localControlActive).toBe(false);

      // Disconnect SATCOM uplink
      gwManager.setConnectionState('OFFLINE');
      const offline = gwManager.getGatewayState();
      expect(offline.connectionState).toBe('OFFLINE');
      expect(offline.localControlActive).toBe(true);

      // Ingest packet while offline
      const packet: TelemetryPacket = {
        deviceId: 'BHR-GEN-01',
        assetId: 'bharati-gen-1',
        stationId: 'bharati',
        timestamp: new Date().toISOString(),
        metric: 'power',
        value: 195,
        unit: 'kW',
        quality: 'GOOD',
        source: 'SIMULATED SENSOR',
        sequenceNumber: 201
      };

      const sentLive = gwManager.ingestTelemetry(packet);
      expect(sentLive).toBe(false); // Buffered
      expect(gwManager.getGatewayState().bufferedPackets.length).toBe(1);

      // Reconnection sync
      const syncRes = gwManager.syncAfterReconnection();
      expect(syncRes.syncedPacketsCount).toBe(1);
      expect(gwManager.getGatewayState().bufferedPackets.length).toBe(0);
      expect(gwManager.getGatewayState().connectionState).toBe('CONNECTED');
      expect(gwManager.getGatewayState().localControlActive).toBe(false);
    });
  });

  describe('6. Operator Command Dispatcher & Actuator Failure (Requirements 13, 18, 21)', () => {
    it('dispatches authorized operator command through lifecycle to EXECUTED', async () => {
      const dispatcher = new HardwareCommandDispatcher();
      const engineerUser = DEMO_USERS.find(u => u.role === 'Station Engineer') || DEMO_USERS[1];

      const res = await dispatcher.executeCommand({
        stationId: 'bharati',
        deviceId: 'BHR-GEN-02-ACT',
        assetId: 'bharati-gen-2',
        command: 'START',
        currentUser: engineerUser
      });

      expect(res.success).toBe(true);
      expect(res.packet.status).toBe('EXECUTED');
      expect(res.packet.operator).toBe(engineerUser.name);
      expect(res.packet.acknowledgedAt).toBeDefined();
      expect(res.packet.executedAt).toBeDefined();
    });

    it('simulates Actuator Failure (Requirement 21: COMMAND SENT vs EXECUTED)', async () => {
      const dispatcher = new HardwareCommandDispatcher();
      const engineerUser = DEMO_USERS.find(u => u.role === 'Station Engineer') || DEMO_USERS[1];

      const res = await dispatcher.executeCommand({
        stationId: 'bharati',
        deviceId: 'BHR-GEN-02-ACT',
        assetId: 'bharati-gen-2',
        command: 'START',
        currentUser: engineerUser,
        forceActuatorFailure: true
      });

      expect(res.success).toBe(false);
      expect(res.isActuatorFailure).toBe(true);
      expect(res.packet.status).toBe('FAILED');
      expect(res.packet.failureReason).toContain('ACTUATOR_INTERLOCK_TRIP');
    });
  });

  describe('7. Hardware Scenarios Cascades (Requirement 28)', () => {
    it('verifies Generator #2 failure zeroes output and triggers microgrid impact', () => {
      const simulator = new HardwareFieldSimulator('bharati');
      
      const gen2Before = simulator.getGeneratorModel(2);
      expect(gen2Before.status).toBe('running');
      expect(gen2Before.currentOutputKw).toBe(190);

      // Trigger Gen 2 Offline
      simulator.setScenario({ generator2Offline: true });
      const gen2After = simulator.getGeneratorModel(2);
      expect(gen2After.status).toBe('offline');
      expect(gen2After.currentOutputKw).toBe(0);
      expect(gen2After.health).toBe(0);

      // Microgrid BESS reflects discharge
      const bess = simulator.getBessModel();
      expect(bess.chargeDischargeState).toBe('DISCHARGING');
      expect(bess.powerKw).toBeLessThan(0);
    });
  });
});
