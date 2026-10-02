import { 
  StationHealthScore, 
  EnvironmentTelemetry, 
  EnergyTelemetry, 
  InfrastructureTelemetry, 
  InventoryItem, 
  RiskSeverity,
  SimulationInputs,
  SimulationResult,
  StationId
} from '@/types';

export const HEALTH_WEIGHTS = {
  environment: 0.20,
  energy: 0.30,
  infrastructure: 0.25,
  logistics: 0.25,
};

/**
 * Calculates domain scores and weighted overall station health score (0 - 100)
 * As defined in SIH26060 MVP Blueprint:
 * healthScore = 0.20 * envScore + 0.30 * energyScore + 0.25 * infraScore + 0.25 * logisticsScore
 */
export function calculateStationHealth(
  env: EnvironmentTelemetry,
  energy: EnergyTelemetry,
  infra: InfrastructureTelemetry,
  inventory: InventoryItem[],
  customWeights = HEALTH_WEIGHTS
): StationHealthScore {
  // 1. Environment Score
  let envScore = 100;
  if (env.temperatureC < -30) envScore -= 25;
  else if (env.temperatureC < -20) envScore -= 10;

  if (env.windKmh > 70) envScore -= 35;
  else if (env.windKmh > 50) envScore -= 20;
  else if (env.windKmh > 35) envScore -= 5;

  if (env.visibilityKm < 1.0) envScore -= 25;
  else if (env.visibilityKm < 5.0) envScore -= 10;
  envScore = Math.max(10, Math.min(100, envScore));

  // 2. Energy Score
  let energyScore = 100;
  const netPower = energy.generationKw - energy.demandKw;
  if (netPower < 0) {
    energyScore -= Math.min(50, Math.abs(netPower) * 0.8);
  }
  if (energy.batterySoc < 30) energyScore -= 30;
  else if (energy.batterySoc < 50) energyScore -= 15;

  if (energy.fuelRunwayDays < 10) energyScore -= 40;
  else if (energy.fuelRunwayDays < 15) energyScore -= 20;
  else if (energy.fuelRunwayDays < 21) energyScore -= 5;
  energyScore = Math.max(10, Math.min(100, Math.round(energyScore)));

  // 3. Infrastructure Score
  const infraScore = Math.max(10, Math.min(100, Math.round(infra.overallHealth)));

  // 4. Logistics Score (based on days remaining vs safety stock)
  let logDeduction = 0;
  for (const item of inventory) {
    if (item.daysRemaining < 14) {
      logDeduction += item.category === 'fuel' ? 30 : 15;
    } else if (item.daysRemaining < 21) {
      logDeduction += 8;
    }
  }
  const logisticsScore = Math.max(15, Math.min(100, 100 - logDeduction));

  const overall = Math.round(
    customWeights.environment * envScore +
    customWeights.energy * energyScore +
    customWeights.infrastructure * infraScore +
    customWeights.logistics * logisticsScore
  );

  return {
    overall,
    environmentScore: envScore,
    energyScore,
    infrastructureScore: infraScore,
    logisticsScore,
    weights: customWeights,
  };
}

/**
 * Deterministic energy demand calculation based on outside temperature & wind
 */
export function calculateEnergyDemand(
  baseLoadKw: number,
  temperatureC: number,
  windKmh: number
): { demandKw: number; heatingLoadKw: number } {
  // Baseline heating at -15 C with 20 km/h wind
  const tempDeficit = Math.max(0, -15 - temperatureC);
  const windExcess = Math.max(0, windKmh - 20);

  // For every 1 deg C colder, heating rises ~2.3 kW
  // For every 10 km/h wind, convective loss adds ~4.5 kW
  const heatingLoadKw = Math.round(135 + (tempDeficit * 2.3) + ((windExcess / 10) * 4.5));
  const demandKw = baseLoadKw + heatingLoadKw;

  return { demandKw, heatingLoadKw };
}

/**
 * Fuel burn and runway calculator
 */
export function calculateFuelRunway(
  fuelLitres: number,
  generationKw: number,
  activeGeneratorCount: number
): { dailyBurnLitres: number; runwayDays: number } {
  // Specific fuel consumption for polar marine diesel gensets ~ 0.24 L / kWh
  // Daily generation in kWh = generationKw * 24
  const hourlyLitres = generationKw * 0.245;
  const dailyBurnLitres = Math.round(hourlyLitres * 24);
  const runwayDays = dailyBurnLitres > 0 ? Number((fuelLitres / dailyBurnLitres).toFixed(1)) : 999;
  return { dailyBurnLitres, runwayDays };
}

/**
 * Run What-If Scenario simulation
 * Calculates the cross-domain propagation:
 * Temp / Wind -> HVAC load -> Energy demand -> Generator capacity -> Battery & Fuel Runway -> Logistics Risk
 */
export function runWhatIfSimulation(
  stationId: StationId,
  inputs: SimulationInputs,
  baselineEnv: EnvironmentTelemetry,
  baselineEnergy: EnergyTelemetry,
  baselineInventory: InventoryItem[]
): SimulationResult {
  const simulatedTemp = baselineEnv.temperatureC + inputs.temperatureAdjustmentC;
  const simulatedWind = baselineEnv.windKmh + inputs.windAdjustmentKmh;

  const { demandKw: simulatedDemandKw } = calculateEnergyDemand(
    baselineEnergy.baseLoadKw,
    simulatedTemp,
    simulatedWind
  );

  // Calculate generation capacity based on generator state
  let simulatedGenerationKw = baselineEnergy.generationKw;
  if (inputs.generator2Offline) {
    // If Generator #2 is offline, subtract roughly 190 kW
    simulatedGenerationKw = Math.max(180, simulatedGenerationKw - 190);
  }

  const netPower = simulatedGenerationKw - simulatedDemandKw;
  const powerDeficitKw = netPower < 0 ? Math.abs(netPower) : 0;
  const energyDeficitPercent = simulatedDemandKw > 0 
    ? Number(((powerDeficitKw / simulatedDemandKw) * 100).toFixed(1))
    : 0;

  // Battery drain after 24h
  let batterySocAfter24h = baselineEnergy.batterySoc;
  if (netPower < 0) {
    const deficit24hKwh = powerDeficitKw * 24;
    const socDrainPercent = (deficit24hKwh / baselineEnergy.batteryCapacityKwh) * 100;
    batterySocAfter24h = Math.max(0, Math.round(baselineEnergy.batterySoc - socDrainPercent));
  }

  // Fuel runway with increased demand
  const simulatedGenForFuel = Math.min(simulatedGenerationKw, simulatedDemandKw);
  const { runwayDays: simulatedFuelRunway } = calculateFuelRunway(
    baselineEnergy.fuelLitres,
    simulatedGenForFuel,
    inputs.generator2Offline ? 1 : 2
  );

  // Critical inventory with resupply delay
  const fuelItem = baselineInventory.find(i => i.category === 'fuel');
  const baselineFuelDays = fuelItem ? fuelItem.daysRemaining : 20.4;
  const daysUntilResupply = 18 + inputs.resupplyDelayDays; // assumed 18 days baseline to resupply

  // Determine overall risk
  let overallRisk: RiskSeverity = 'nominal';
  if (simulatedFuelRunway < daysUntilResupply || batterySocAfter24h < 25 || powerDeficitKw > 50) {
    overallRisk = 'critical';
  } else if (simulatedFuelRunway < daysUntilResupply + 4 || batterySocAfter24h < 50 || powerDeficitKw > 0) {
    overallRisk = 'warning';
  }

  // Causal Chain construction
  const causalChain: string[] = [];
  if (inputs.temperatureAdjustmentC < 0) {
    causalChain.push(`Ambient temp lowered to ${simulatedTemp.toFixed(1)}°C -> HVAC heating load increases`);
  }
  if (inputs.windAdjustmentKmh > 0) {
    causalChain.push(`Wind speed increased by +${inputs.windAdjustmentKmh} km/h -> wind chill elevates thermal leakage`);
  }
  causalChain.push(`Total station demand rises to ${simulatedDemandKw} kW`);
  
  if (inputs.generator2Offline) {
    causalChain.push(`Generator #2 OFFLINE drops capacity to ${simulatedGenerationKw} kW -> Net deficit of ${powerDeficitKw} kW`);
    causalChain.push(`Battery bank projected to drain down to ${batterySocAfter24h}% after 24 hours`);
  }
  
  causalChain.push(`Fuel burn rate accelerates -> Fuel runway contracts to ${simulatedFuelRunway} days`);
  
  if (inputs.resupplyDelayDays > 0) {
    causalChain.push(`Resupply delayed by +${inputs.resupplyDelayDays} days -> Buffer gap becomes negative`);
  }

  // Recommended responses
  const recommendedResponse: string[] = [];
  if (inputs.generator2Offline) {
    recommendedResponse.push('Activate cold-reserve backup generator (Genset #4 / Emergency genset) immediately.');
    recommendedResponse.push('Shed Tier-3 non-critical recreational and ancillary research loads (-65 kW).');
  }
  if (simulatedFuelRunway < daysUntilResupply) {
    recommendedResponse.push('Issue Critical Priority resupply escalation to NCPOR Logistics Command.');
    recommendedResponse.push('Implement thermal insulation night-shutter protocol to conserve HVAC power.');
  }
  if (batterySocAfter24h < 40) {
    recommendedResponse.push('Prioritize battery bank float-charging from secondary auxiliary source.');
  }
  if (recommendedResponse.length === 0) {
    recommendedResponse.push('Maintain nominal operating parameters; continue standard hourly watchkeeping.');
  }

  return {
    scenarioName: inputs.generator2Offline 
      ? 'Generator Failure + Extreme Weather Simulation' 
      : 'Cold Snap & Wind Surge Simulation',
    stationId,
    inputs,
    baseline: {
      energyDemandKw: baselineEnergy.demandKw,
      netPowerKw: baselineEnergy.generationKw - baselineEnergy.demandKw,
      batterySocAfter24h: baselineEnergy.batterySoc,
      fuelRunwayDays: baselineEnergy.fuelRunwayDays,
      criticalInventoryDays: baselineFuelDays,
      overallRisk: 'nominal',
    },
    simulated: {
      energyDemandKw: simulatedDemandKw,
      netPowerKw: netPower,
      batterySocAfter24h,
      fuelRunwayDays: simulatedFuelRunway,
      criticalInventoryDays: Number((baselineFuelDays - (inputs.resupplyDelayDays * 0.4)).toFixed(1)),
      energyDeficitPercent,
      overallRisk,
    },
    causalChain,
    recommendedResponse,
    createdAt: new Date().toISOString(),
  };
}
