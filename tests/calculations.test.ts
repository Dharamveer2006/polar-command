import { describe, it, expect } from 'vitest';
import { 
  evaluateStationState,
  calculateStationHealth, 
  calculateEnergyDemand, 
  calculateFuelRunway, 
  calculatePredictiveLogistics,
  runWhatIfSimulation 
} from '../lib/calculations';
import { 
  INITIAL_ENVIRONMENT, 
  INITIAL_ENERGY, 
  INITIAL_INFRASTRUCTURE, 
  INITIAL_INVENTORY 
} from '../mocks/stationData';
import { hasPermission, ROLE_PERMISSIONS } from '../lib/permissions';
import { ActiveScenarios, EdgeQueueItem } from '../types';

describe('SIH26060 Polar Command - Digital Twin State Engine & Coupling Tests', () => {
  const defaultEvents: ActiveScenarios = {
    extremeCold: false,
    highWind: false,
    generator2Failure: false,
    resupplyDelay: false,
  };

  const zeroDrift = { tempNoise: 0, windNoise: 0, loadNoise: 0 };

  // 1. Cold + Wind Combination
  it('1. correctly evaluates cold + wind combination with thermodynamic heating surge', () => {
    const baseline = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    const coldWind = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, extremeCold: true, highWind: true },
      zeroDrift,
      'bharati'
    );

    expect(coldWind.derived.effectiveTempC).toBeLessThan(baseline.derived.effectiveTempC);
    expect(coldWind.derived.effectiveWindKmh).toBeGreaterThan(baseline.derived.effectiveWindKmh);
    expect(coldWind.derived.heatingLoadKw).toBeGreaterThan(baseline.derived.heatingLoadKw);
    expect(coldWind.derived.totalDemandKw).toBeGreaterThan(baseline.derived.totalDemandKw);
    expect(coldWind.derived.dailyFuelBurnLitres).toBeGreaterThan(baseline.derived.dailyFuelBurnLitres);
  });

  // 2. Generator Failure + Cold
  it('2. evaluates generator failure + cold leading to microgrid deficit and battery discharge', () => {
    const genCold = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, generator2Failure: true, extremeCold: true },
      zeroDrift,
      'bharati'
    );

    expect(genCold.derived.generationCapacityKw).toBeLessThan(INITIAL_ENERGY.bharati.generationKw);
    expect(genCold.derived.powerSurplusDeficitKw).toBeLessThan(0); // Power deficit
    expect(genCold.derived.batteryStatus).toBe('discharging');
    expect(genCold.derived.crossDomainRisk).toBe('critical');
    expect(genCold.derived.rootCause).toContain('Generator #2');
  });

  // 3. Generator Failure + Resupply Delay
  it('3. evaluates generator failure + resupply delay leading to accelerated fuel burn and logistics gap', () => {
    const genDelay = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, generator2Failure: true, resupplyDelay: true },
      zeroDrift,
      'bharati'
    );

    expect(genDelay.derived.fuelRunwayDays).toBeLessThan(INITIAL_ENERGY.bharati.fuelRunwayDays);
    expect(genDelay.inventory.some(i => i.inventoryStatus === 'PROJECTED SHORTAGE' || i.inventoryStatus === 'CRITICAL')).toBe(true);
    expect(genDelay.derived.causalChain.some(c => c.includes('MV Vasiliy Golovnin'))).toBe(true);
  });

  // 4. All Four Simultaneous Events
  it('4. composably handles all four simultaneous events in a single deterministic derived state', () => {
    const compounded = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { extremeCold: true, highWind: true, generator2Failure: true, resupplyDelay: true },
      zeroDrift,
      'bharati'
    );

    expect(compounded.derived.crossDomainRisk).toBe('critical');
    expect(compounded.derived.overallHealthScore).toBeLessThan(65);
    expect(compounded.derived.causalChain.length).toBeGreaterThanOrEqual(4);
    expect(compounded.derived.activeIncident).toContain('CRITICAL');
    expect(compounded.derived.recommendedResponse).toBeTruthy();
    expect(compounded.derived.powerSurplusDeficitKw).toBeLessThan(0);
  });

  // 5. Offline Queue
  it('5. validates edge queue buffering when disconnected', () => {
    const edgeQueue: EdgeQueueItem[] = [];
    const pushToQueue = (item: Omit<EdgeQueueItem, 'id' | 'timestamp' | 'status'>) => {
      edgeQueue.push({
        ...item,
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toISOString(),
        status: 'queued',
      });
    };

    pushToQueue({
      stationId: 'bharati',
      type: 'ALERT_ACK',
      payload: { alertId: 'ALT-BHR-01' },
    });
    pushToQueue({
      stationId: 'bharati',
      type: 'TELEMETRY_SAMPLE',
      payload: { temperature: -24.5, demand: 360 },
    });

    expect(edgeQueue.length).toBe(2);
    expect(edgeQueue[0].status).toBe('queued');
    expect(edgeQueue[1].type).toBe('TELEMETRY_SAMPLE');
  });

  // 6. Reconnection Sync
  it('6. simulates flush and sync on reconnection', () => {
    const edgeQueue: EdgeQueueItem[] = [
      { id: '1', stationId: 'bharati', type: 'TELEMETRY_SAMPLE', payload: {}, timestamp: '', status: 'queued' },
      { id: '2', stationId: 'bharati', type: 'ALERT_ACK', payload: {}, timestamp: '', status: 'queued' },
      { id: '3', stationId: 'bharati', type: 'REQUISITION_CREATE', payload: {}, timestamp: '', status: 'queued' },
    ];

    const flushQueue = (queue: EdgeQueueItem[]) => {
      const count = queue.filter(q => q.status === 'queued').length;
      const flushed = queue.map(q => ({ ...q, status: 'synced' as const }));
      return {
        flushed,
        message: `${count} telemetry events synchronized`,
      };
    };

    const syncResult = flushQueue(edgeQueue);
    expect(syncResult.message).toBe('3 telemetry events synchronized');
    expect(syncResult.flushed.every(i => i.status === 'synced')).toBe(true);
  });

  // 7. Fuel Runway Calculation
  it('7. calculates deterministic fuel runway days with varying load and genset counts', () => {
    const fuelRunway1 = calculateFuelRunway(10000, 300, 2);
    const fuelRunway2 = calculateFuelRunway(10000, 450, 2);

    expect(fuelRunway2.dailyBurnLitres).toBeGreaterThan(fuelRunway1.dailyBurnLitres);
    expect(fuelRunway2.runwayDays).toBeLessThan(fuelRunway1.runwayDays);
    expect(fuelRunway1.runwayDays).toBeCloseTo(10000 / fuelRunway1.dailyBurnLitres, 1);
  });

  // 8. Predictive Inventory Shortage
  it('8. computes daysRemaining = quantity / dailyConsumption and assigns SAFE/WARNING/PROJECTED SHORTAGE/CRITICAL', () => {
    const predictive = calculatePredictiveLogistics(INITIAL_INVENTORY.bharati, 12);
    
    predictive.forEach(item => {
      const expectedDays = Number((item.quantity / Math.max(0.1, item.dailyConsumption)).toFixed(1));
      expect(item.daysRemaining).toBeCloseTo(expectedDays, 1);
      expect(['SAFE', 'WARNING', 'PROJECTED SHORTAGE', 'CRITICAL']).toContain(item.inventoryStatus);
      expect(item.projectedShortageDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // 9. Risk Transition
  it('9. correctly transitions risk from nominal to elevated to critical as thresholds breach', () => {
    // Nominal state
    const nominal = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );
    expect(nominal.derived.crossDomainRisk).toBe('nominal');

    // Elevated state (e.g. Resupply Delay only)
    const elevated = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, resupplyDelay: true },
      zeroDrift,
      'bharati'
    );
    expect(['warning', 'elevated']).toContain(elevated.derived.crossDomainRisk);

    // Critical state (e.g. Generator 2 failure)
    const critical = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, generator2Failure: true },
      zeroDrift,
      'bharati'
    );
    expect(critical.derived.crossDomainRisk).toBe('critical');
  });

  // 10. Role Permissions & Action Layer RBAC
  it('10. strictly enforces role permissions at action layer', () => {
    // NCPOR Operations has full control
    expect(hasPermission('NCPOR Operations', 'canAcknowledgeAlerts')).toBe(true);
    expect(hasPermission('NCPOR Operations', 'canApproveRequisition')).toBe(true);
    expect(hasPermission('NCPOR Operations', 'canModifyConfig')).toBe(true);

    // Station Engineer can acknowledge alerts and create reqs, but cannot approve reqs or modify config
    expect(hasPermission('Station Engineer', 'canAcknowledgeAlerts')).toBe(true);
    expect(hasPermission('Station Engineer', 'canCreateRequisition')).toBe(true);
    expect(hasPermission('Station Engineer', 'canApproveRequisition')).toBe(false);
    expect(hasPermission('Station Engineer', 'canModifyConfig')).toBe(false);

    // Logistics Officer can create & approve reqs, but cannot modify station config or acknowledge critical station alerts
    expect(hasPermission('Logistics Officer', 'canCreateRequisition')).toBe(true);
    expect(hasPermission('Logistics Officer', 'canApproveRequisition')).toBe(true);
    expect(hasPermission('Logistics Officer', 'canAcknowledgeAlerts')).toBe(false);
    expect(hasPermission('Logistics Officer', 'canModifyConfig')).toBe(false);

    // Leadership can approve requisitions, but cannot create requisitions or acknowledge technical alerts
    expect(hasPermission('Leadership', 'canApproveRequisition')).toBe(true);
    expect(hasPermission('Leadership', 'canCreateRequisition')).toBe(false);
    expect(hasPermission('Leadership', 'canAcknowledgeAlerts')).toBe(false);
  });
});
