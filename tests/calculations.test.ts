import { describe, it, expect } from 'vitest';
import { 
  calculateStationHealth, 
  calculateEnergyDemand, 
  calculateFuelRunway, 
  runWhatIfSimulation 
} from '../lib/calculations';
import { 
  INITIAL_ENVIRONMENT, 
  INITIAL_ENERGY, 
  INITIAL_INFRASTRUCTURE, 
  INITIAL_INVENTORY 
} from '../mocks/stationData';

describe('SIH26060 Polar Command - Core Calculations & Formulas', () => {
  it('correctly calculates station health score with weighted domains (AC-02, AC-06)', () => {
    const health = calculateStationHealth(
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INFRASTRUCTURE.bharati,
      INITIAL_INVENTORY.bharati
    );

    expect(health.overall).toBeGreaterThan(60);
    expect(health.overall).toBeLessThanOrEqual(100);
    expect(health.weights.environment).toBe(0.20);
    expect(health.weights.energy).toBe(0.30);
    expect(health.weights.infrastructure).toBe(0.25);
    expect(health.weights.logistics).toBe(0.25);
  });

  it('correctly increases heating load when ambient temperature drops (AC-04)', () => {
    const baseline = calculateEnergyDemand(220, -19.2, 42);
    const coldSnap = calculateEnergyDemand(220, -31.2, 42);

    expect(coldSnap.demandKw).toBeGreaterThan(baseline.demandKw);
    expect(coldSnap.heatingLoadKw).toBeGreaterThan(baseline.heatingLoadKw);
  });

  it('calculates deterministic fuel runway days (AC-09)', () => {
    const { dailyBurnLitres, runwayDays } = calculateFuelRunway(9400, 451, 2);
    expect(dailyBurnLitres).toBeGreaterThan(0);
    expect(runwayDays).toBeCloseTo(9400 / dailyBurnLitres, 1);
  });

  it('propagates what-if scenario impacts deterministically (AC-08)', () => {
    const simResult = runWhatIfSimulation(
      'bharati',
      {
        stationId: 'bharati',
        temperatureAdjustmentC: -10,
        windAdjustmentKmh: 20,
        generator2Offline: true,
        resupplyDelayDays: 5,
      },
      INITIAL_ENVIRONMENT.bharati,
      INITIAL_ENERGY.bharati,
      INITIAL_INVENTORY.bharati
    );

    expect(simResult.simulated.energyDemandKw).toBeGreaterThan(simResult.baseline.energyDemandKw);
    expect(simResult.simulated.overallRisk).toBe('critical');
    expect(simResult.causalChain.length).toBeGreaterThan(0);
    expect(simResult.recommendedResponse.length).toBeGreaterThan(0);
  });
});
