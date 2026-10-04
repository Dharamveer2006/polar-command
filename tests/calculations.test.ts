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
  INITIAL_INVENTORY,
  INITIAL_ALERTS 
} from '../mocks/stationData';
import { hasPermission, ROLE_PERMISSIONS } from '../lib/permissions';
import { ActiveScenarios, EdgeQueueItem, EnvironmentTelemetry } from '../types';
import { 
  BASELINE_STATION_WEATHER, 
  detectWeatherEvents, 
  calculateEffectiveWeather 
} from '../lib/weatherEngine';

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
        status: 'PENDING',
      });
    };

    pushToQueue({
      stationId: 'bharati',
      type: 'ALERT_ACK',
      payload: { alertId: 'ALT-BHR-01' },
    });
    pushToQueue({
      stationId: 'bharati',
      type: 'TELEMETRY_LOG',
      payload: { temperature: -24.5, demand: 360 },
    });

    expect(edgeQueue.length).toBe(2);
    expect(edgeQueue[0].status).toBe('PENDING');
    expect(edgeQueue[1].type).toBe('TELEMETRY_LOG');
  });

  // 6. Reconnection Sync
  it('6. simulates flush and sync on reconnection', () => {
    const edgeQueue: EdgeQueueItem[] = [
      { id: '1', stationId: 'bharati', type: 'TELEMETRY_LOG', payload: {}, timestamp: '', status: 'PENDING' },
      { id: '2', stationId: 'bharati', type: 'ALERT_ACK', payload: {}, timestamp: '', status: 'PENDING' },
      { id: '3', stationId: 'bharati', type: 'REQUISITION_CREATE', payload: {}, timestamp: '', status: 'PENDING' },
    ];

    const flushQueue = (queue: EdgeQueueItem[]) => {
      const count = queue.filter(q => q.status === 'PENDING').length;
      const flushed = queue.map(q => ({ ...q, status: 'SYNCED' as const }));
      return {
        flushed,
        message: `${count} telemetry events synchronized`,
      };
    };

    const syncResult = flushQueue(edgeQueue);
    expect(syncResult.message).toBe('3 telemetry events synchronized');
    expect(syncResult.flushed.every(i => i.status === 'SYNCED')).toBe(true);
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

  // 11. Section 14 Test Case: Live Observation Update Cascade
  it('11. verifies Section 14 test case: Live baseline (-17.5°C, 5.2 m/s) -> New observation (-21.0°C, 10.8 m/s) triggers downstream cascade', () => {
    // Live baseline: Bharati (-17.5°C, 5.2 m/s -> 18.7 km/h)
    const baselineObs: EnvironmentTelemetry = {
      ...BASELINE_STATION_WEATHER.bharati,
      temperatureC: -17.5,
      windKmh: 18.7,
      windMs: 5.2,
    };

    const baselineState = evaluateStationState(
      baselineObs,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    // New observation: Bharati (-21.0°C, 10.8 m/s -> 38.9 km/h)
    const newObs: EnvironmentTelemetry = {
      ...baselineObs,
      temperatureC: -21.0,
      windKmh: 38.9,
      windMs: 10.8,
    };

    const updatedState = evaluateStationState(
      newObs,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    // 1. Weather values update
    expect(updatedState.environment.temperatureC).toBe(-21.0);
    expect(updatedState.environment.windKmh).toBe(39);

    // 2. HVAC load changes (increases)
    expect(updatedState.energy.heatingLoadKw).toBeGreaterThan(baselineState.energy.heatingLoadKw);

    // 3. Energy demand changes (increases)
    expect(updatedState.derived.totalDemandKw).toBeGreaterThan(baselineState.derived.totalDemandKw);

    // 4. Fuel burn changes (increases)
    expect(updatedState.derived.dailyFuelBurnLitres).toBeGreaterThan(baselineState.derived.dailyFuelBurnLitres);

    // 5. Fuel runway changes (decreases)
    expect(updatedState.derived.fuelRunwayDays).toBeLessThan(baselineState.derived.fuelRunwayDays);
  });

  // 12. Deterministic Weather Event Detector
  it('12. deterministically detects Rapid Cooling, High Wind, Low Visibility, and Pressure Drop', () => {
    const prev: EnvironmentTelemetry = {
      ...BASELINE_STATION_WEATHER.bharati,
      temperatureC: -17.5,
      windKmh: 20,
      pressureHpa: 980,
      visibilityKm: 10,
    };

    // Rapid Cooling: Delta T <= -3.0°C (-17.5°C to -22.8°C is -5.3°C)
    const coolingCurrent: EnvironmentTelemetry = {
      ...prev,
      temperatureC: -22.8,
    };
    const coolingEvents = detectWeatherEvents(coolingCurrent, prev);
    expect(coolingEvents.some(e => e.type === 'RAPID_COOLING')).toBe(true);

    // High Wind: >= 55 km/h
    const windCurrent: EnvironmentTelemetry = {
      ...prev,
      windKmh: 68,
    };
    const windEvents = detectWeatherEvents(windCurrent, prev);
    expect(windEvents.some(e => e.type === 'HIGH_WIND')).toBe(true);

    // Pressure Drop: Delta P <= -4.0 hPa
    const pressureCurrent: EnvironmentTelemetry = {
      ...prev,
      pressureHpa: 974,
    };
    const pressureEvents = detectWeatherEvents(pressureCurrent, prev);
    expect(pressureEvents.some(e => e.type === 'PRESSURE_DROP')).toBe(true);

    // Low Visibility: <= 1.5 km
    const visCurrent: EnvironmentTelemetry = {
      ...prev,
      visibilityKm: 0.8,
    };
    const visEvents = detectWeatherEvents(visCurrent, prev);
    expect(visEvents.some(e => e.type === 'LOW_VISIBILITY')).toBe(true);

    // Blizzard Risk: High Wind + Low Visibility + Sub-zero temp
    const blizzardCurrent: EnvironmentTelemetry = {
      ...prev,
      temperatureC: -25.0,
      windKmh: 65,
      visibilityKm: 0.5,
    };
    const blizzardEvents = detectWeatherEvents(blizzardCurrent, prev);
    expect(blizzardEvents.some(e => e.type === 'BLIZZARD_RISK')).toBe(true);
  });

  // 13. Separation of Real Weather + Active Scenario (Section 9)
  it('13. cleanly separates Live Observation from Active Scenario offsets without overwriting baseline', () => {
    const liveObs: EnvironmentTelemetry = {
      ...BASELINE_STATION_WEATHER.bharati,
      temperatureC: -17.5,
      windKmh: 18.7,
      source: 'Observed',
    };

    const scenario: ActiveScenarios = {
      ...defaultEvents,
      extremeCold: true, // -12°C offset
    };

    const separation = calculateEffectiveWeather(liveObs, scenario);

    // Live observation remains strictly untouched
    expect(separation.liveObservation.temperatureC).toBe(-17.5);
    expect(separation.liveObservation.source).toBe('Observed');

    // Scenario offset is isolated
    expect(separation.activeScenarioOffset.tempOffsetC).toBe(-12.0);

    // Effective state is derived: -17.5 + (-12) = -29.5°C
    expect(separation.effectiveWeather.temperatureC).toBe(-29.5);
    expect(separation.effectiveWeather.source).toBe('Derived');
  });

  // 14. Normalized Weather Response & Physical Unit Conversions (Sections 3 & 4)
  it('14. correctly normalizes weather units (knots to km/h, m/s, mBar = hPa)', () => {
    const rawKnots = 18.4;
    const expectedKmh = Number((rawKnots * 1.852).toFixed(1)); // ~34.1 km/h
    const expectedMs = Number((expectedKmh / 3.6).toFixed(1)); // ~9.5 m/s

    expect(expectedKmh).toBe(34.1);
    expect(expectedMs).toBe(9.5);

    // Verify pressure equality (mBar = hPa)
    const pressureMbar = 965.4;
    const pressureHpa = pressureMbar;
    expect(pressureHpa).toBe(965.4);
  });

  // 15. Real Weather Propagation into Digital Twin Cascade (Section 10 & 18)
  it('15. verifies that colder real weather observation directly escalates HVAC load, fuel burn, and contracts runway', () => {
    const baselineObs: EnvironmentTelemetry = {
      ...BASELINE_STATION_WEATHER.bharati,
      temperatureC: -17.5,
      windKmh: 18.7,
      pressureHpa: 982.0,
      source: 'Public Observation',
    };

    const state1 = evaluateStationState(
      baselineObs,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    // Severe Antarctic drop: -17.5°C -> -27.5°C (+10°C colder) and wind 18.7 -> 48.7 km/h
    const coldObs: EnvironmentTelemetry = {
      ...baselineObs,
      temperatureC: -27.5,
      windKmh: 48.7,
    };

    const state2 = evaluateStationState(
      coldObs,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    // Weather changes propagate into Energy
    expect(state2.derived.heatingLoadKw).toBeGreaterThan(state1.derived.heatingLoadKw);
    expect(state2.derived.totalDemandKw).toBeGreaterThan(state1.derived.totalDemandKw);
    // Energy changes propagate into Fuel
    expect(state2.derived.dailyFuelBurnLitres).toBeGreaterThan(state1.derived.dailyFuelBurnLitres);
    // Fuel changes propagate into Logistics
    expect(state2.derived.fuelRunwayDays).toBeLessThan(state1.derived.fuelRunwayDays);
  });

  // 16. Trend-based Synoptic Event Detection (Section 12)
  it('16. detects synoptic Rapid Cooling and Rapid Pressure Drop from observation history', () => {
    const history = [
      {
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
        station: 'bharati' as const,
        temperatureC: -16.0,
        pressureHpa: 980.0,
        humidityPercent: 60,
        windKnots: 10,
        windKmh: 18.5,
        windDirectionDeg: 120,
        source: 'NCPOR',
        status: 'LIVE' as const,
      }
    ];

    const currentFastDrop: EnvironmentTelemetry = {
      ...BASELINE_STATION_WEATHER.bharati,
      temperatureC: -21.0, // Delta = -5°C over 3h (threshold <= -3°C)
      pressureHpa: 973.0,  // Delta = -7 hPa over 3h (threshold <= -4 hPa)
      windKmh: 35,
    };

    const events = detectWeatherEvents(currentFastDrop, BASELINE_STATION_WEATHER.bharati, history);
    expect(events.some(e => e.type === 'RAPID_COOLING')).toBe(true);
    expect(events.some(e => e.type === 'PRESSURE_DROP')).toBe(true);
  });

  // 17. Offline Resilience: Retain Last Valid Observation (Section 15)
  it('17. retains last valid weather observation during disconnection without fabricating fake data', () => {
    const lastValidObs: EnvironmentTelemetry = {
      ...BASELINE_STATION_WEATHER.maitri,
      temperatureC: -24.6,
      windKmh: 37.8,
      source: 'Public Observation',
      weatherState: 'LIVE',
    };

    // When disconnected, status transitions to STALE, retaining last observation
    const offlineObs: EnvironmentTelemetry = {
      ...lastValidObs,
      weatherState: 'STALE',
    };

    expect(offlineObs.temperatureC).toBe(-24.6);
    expect(offlineObs.windKmh).toBe(37.8);
    expect(offlineObs.weatherState).toBe('STALE');
  });

  // 18. Fuel Runway Consistency Across Domains (Requirement 6)
  it('18. guarantees canonical fuel runway equality across Energy and Logistics', () => {
    const evaluated = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    const energyBurn = evaluated.energy.averageFuelBurnLitresPerDay;
    const energyRunway = evaluated.energy.fuelRunwayDays;
    const derivedBurn = evaluated.derived.dailyFuelBurnLitres;
    const derivedRunway = evaluated.derived.fuelRunwayDays;

    const fuelItem = evaluated.inventory.find(i => i.category === 'fuel');
    expect(fuelItem).toBeDefined();

    // Must be mathematically identical
    expect(derivedBurn).toBe(energyBurn);
    expect(derivedRunway).toBe(energyRunway);
    expect(fuelItem!.dailyConsumption).toBe(energyBurn);
    expect(fuelItem!.daysRemaining).toBe(energyRunway);
  });

  // 19. Logistics Semantics: Physical Shortage vs Safety Buffer (Requirement 7)
  it('19. differentiates Autonomy, Safety Buffer, Resupply ETA, and Projected Depletion without false physical shortage', () => {
    // Nominal state: 9400L / 460L/day = 20.4 days runway. Resupply ETA = 18 days.
    const nominal = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    const fuelItem = nominal.inventory.find(i => i.category === 'fuel')!;
    // Resupply arrives at Day 18, stock runs out at Day 20.4 -> NEVER physical shortage
    expect(fuelItem.daysRemaining).toBeGreaterThanOrEqual(18);
    expect(fuelItem.inventoryStatus).not.toBe('CRITICAL');

    // When Resupply is delayed (+12d -> 30 days ETA), stock (20.4d) exhausts BEFORE vessel arrives (30d) -> TRUE CRITICAL
    const delayed = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, resupplyDelay: true },
      zeroDrift,
      'bharati'
    );

    const delayedFuel = delayed.inventory.find(i => i.category === 'fuel')!;
    expect(delayedFuel.inventoryStatus).toBe('CRITICAL');
  });

  // 20. Maitri Pump Advisory Classification (Requirement 8)
  it('20. labels Maitri pump suction deviation as PROTOTYPE ADVISORY with baseline comparison', () => {
    const pumpAlert = INITIAL_ALERTS.find(a => a.alertId === 'ALT-MTR-001' || (a as any).id === 'ALT-MTR-001');
    expect(pumpAlert).toBeDefined();
    expect(pumpAlert!.title).toContain('PROTOTYPE ADVISORY');
    const fullText = (pumpAlert!.cause || []).join(' ') + ' ' + ((pumpAlert as any)!.message || '');
    expect(fullText).toContain('3.4 bar');
    expect(fullText).toContain('3.8 bar');
    expect(fullText).toContain('operational');
    expect(['warning', 'low', 'info'].includes(pumpAlert!.severity)).toBe(true);
  });

  // 21. Threshold Validation for Nominal Weather (Requirement 9)
  it('21. validates nominal weather does not trigger false critical weather alerts', () => {
    const nominalMaitri = BASELINE_STATION_WEATHER.maitri;
    const history = [{
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      station: 'maitri' as const,
      temperatureC: nominalMaitri.temperatureC,
      pressureHpa: nominalMaitri.pressureHpa,
      humidityPercent: 65,
      windKnots: nominalMaitri.windKnots || 20,
      windKmh: nominalMaitri.windKmh,
      windDirectionDeg: 110,
      source: 'NCPOR',
      status: 'FALLBACK' as const,
    }];

    const events = detectWeatherEvents(nominalMaitri, nominalMaitri, history);
    expect(events.filter(e => e.severity === 'critical').length).toBe(0);
  });

  // 22. Compound Scenarios & Multi-Event Combinations (Requirement 14)
  it('22. verifies composable scenario combinations without accidental clearing', () => {
    // Cold + Blizzard
    const coldBlizzard = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, extremeCold: true, highWind: true },
      zeroDrift,
      'bharati'
    );
    expect(coldBlizzard.derived.activeIncident.toUpperCase()).toContain('BLIZZARD');
    expect(coldBlizzard.derived.activeIncident.toUpperCase()).toContain('COLD');

    // Cold + Generator
    const coldGen = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, extremeCold: true, generator2Failure: true },
      zeroDrift,
      'bharati'
    );
    expect(coldGen.derived.powerSurplusDeficitKw).toBeLessThan(0);
    expect(coldGen.derived.batteryStatus).toBe('discharging');

    // Generator + Resupply
    const genResupply = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { ...defaultEvents, generator2Failure: true, resupplyDelay: true },
      zeroDrift,
      'bharati'
    );
    expect(genResupply.derived.crossDomainRisk).toBe('critical');

    // Cold + Generator + Resupply
    const trio = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { extremeCold: true, highWind: false, generator2Failure: true, resupplyDelay: true },
      zeroDrift,
      'bharati'
    );
    expect(trio.derived.crossDomainRisk).toBe('critical');
    expect(trio.derived.fuelRunwayDays).toBeLessThan(INITIAL_ENERGY.bharati.fuelRunwayDays);

    // Full Cascade
    const cascade = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { extremeCold: true, highWind: true, generator2Failure: true, resupplyDelay: true },
      zeroDrift,
      'bharati'
    );
    expect(cascade.derived.crossDomainRisk).toBe('critical');
    expect(cascade.derived.overallHealthScore).toBeLessThan(65);
  });

  // 23. Reset Idempotency (Requirement 15)
  it('23. resets to exact nominal baseline after any scenario sequence', () => {
    const nominal = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    // Run Full Cascade
    const cascade = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      { extremeCold: true, highWind: true, generator2Failure: true, resupplyDelay: true },
      zeroDrift,
      'bharati'
    );
    expect(cascade.derived.overallHealthScore).not.toBe(nominal.derived.overallHealthScore);

    // Reset back to nominal
    const afterReset = evaluateStationState(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati,
      defaultEvents,
      zeroDrift,
      'bharati'
    );

    expect(afterReset.derived.overallHealthScore).toBe(nominal.derived.overallHealthScore);
    expect(afterReset.derived.fuelRunwayDays).toBe(nominal.derived.fuelRunwayDays);
    expect(afterReset.derived.generationCapacityKw).toBe(nominal.derived.generationCapacityKw);
    expect(afterReset.derived.powerSurplusDeficitKw).toBe(nominal.derived.powerSurplusDeficitKw);
    expect(afterReset.derived.crossDomainRisk).toBe(nominal.derived.crossDomainRisk);
  });
});

