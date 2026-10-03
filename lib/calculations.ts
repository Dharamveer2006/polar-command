import { 
  StationHealthScore, 
  EnvironmentTelemetry, 
  EnergyTelemetry, 
  InfrastructureTelemetry, 
  InventoryItem, 
  RiskSeverity,
  SimulationInputs, 
  SimulationResult,
  SimulationTimelinePoint,
  SimulationCascadeStep,
  StationId,
  ActiveScenarios,
  StationDerivedState,
  StationAsset,
  InventoryStatus,
  DataProvenance
} from '@/types';

export const HEALTH_WEIGHTS = {
  environment: 0.20,
  energy: 0.30,
  infrastructure: 0.25,
  logistics: 0.25,
};

/**
 * Deterministic energy demand calculation based on outside temperature & wind convective loss.
 * Formula:
 * baseline heating at -15°C with 20 km/h wind = 135 kW
 * For every 1°C colder than -15°C: adds ~2.3 kW thermal load
 * For every 10 km/h wind above 20 km/h: adds ~4.5 kW convective leakage
 */
export function calculateEnergyDemand(
  baseLoadKw: number,
  temperatureC: number,
  windKmh: number
): { demandKw: number; heatingLoadKw: number } {
  const tempDeficit = Math.max(0, -15 - temperatureC);
  const windExcess = Math.max(0, windKmh - 20);

  const heatingLoadKw = Math.round(135 + (tempDeficit * 2.3) + ((windExcess / 10) * 4.5));
  const demandKw = baseLoadKw + heatingLoadKw;

  return { demandKw, heatingLoadKw };
}

/**
 * Specific fuel consumption for polar marine diesel gensets ~ 0.245 L / kWh
 * Daily generation in kWh = generationKw * 24
 */
export function calculateFuelRunway(
  fuelLitres: number,
  generationKw: number,
  activeGeneratorCount: number = 2
): { dailyBurnLitres: number; runwayDays: number } {
  const hourlyLitres = generationKw * 0.245;
  const dailyBurnLitres = Math.round(hourlyLitres * 24);
  const runwayDays = dailyBurnLitres > 0 ? Number((fuelLitres / dailyBurnLitres).toFixed(1)) : 999;
  return { dailyBurnLitres, runwayDays };
}

/**
 * Phase 9 — Predictive Logistics Intelligence
 * For each consumable calculate:
 * daysRemaining = quantity / dailyConsumption
 * shortageDate = today + daysRemaining
 * compare shortage date against resupply ETA to categorize:
 * SAFE | WARNING | PROJECTED SHORTAGE | CRITICAL
 */
export function calculatePredictiveLogistics(
  inventory: InventoryItem[],
  resupplyDelayDays: number = 0
): InventoryItem[] {
  const today = new Date();

  return inventory.map(item => {
    const dailyConsumption = Math.max(0.1, item.dailyConsumption);
    const daysRemaining = Number((item.quantity / dailyConsumption).toFixed(1));

    // Base resupply ETA in days from now (typically 18 days baseline)
    const baseEtaDays = 18;
    const effectiveEtaDays = baseEtaDays + resupplyDelayDays;
    const resupplyDate = new Date(today.getTime() + effectiveEtaDays * 86400000);
    const shortageDate = new Date(today.getTime() + daysRemaining * 86400000);

    let status: InventoryStatus = 'SAFE';
    let riskLevel: RiskSeverity = 'nominal';

    if (daysRemaining < effectiveEtaDays) {
      status = 'CRITICAL';
      riskLevel = 'critical';
    } else if (daysRemaining < effectiveEtaDays + 4) {
      status = 'PROJECTED SHORTAGE';
      riskLevel = 'warning';
    } else if (daysRemaining < item.safetyStockDays || daysRemaining < effectiveEtaDays + 8) {
      status = 'WARNING';
      riskLevel = 'warning';
    } else {
      status = 'SAFE';
      riskLevel = 'nominal';
    }

    return {
      ...item,
      daysRemaining,
      projectedShortageDate: shortageDate.toISOString().split('T')[0],
      nextResupplyEta: resupplyDate.toISOString().split('T')[0],
      inventoryStatus: status,
      riskLevel,
      burnRateTrend: daysRemaining < effectiveEtaDays ? 'critical' : daysRemaining < effectiveEtaDays + 7 ? 'elevated' : 'normal',
      source: 'Derived Calculation' as DataProvenance,
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Phase 10 — Explainable Asset Anomaly Detection
 * Checks telemetry parameters against physical thresholds and flags explainable signals
 */
export function detectAssetAnomalies(assets: StationAsset[]): StationAsset[] {
  return assets.map(asset => {
    let anomaly: StationAsset['anomaly'] = undefined;
    let status = asset.status;
    let health = asset.health;

    if (asset.type === 'generator') {
      const vib = asset.metrics.vibrationMmSec || 1.4;
      const temp = asset.metrics.temperatureC || 72;
      if (status === 'offline') {
        anomaly = {
          parameter: 'Coolant Temperature & Mechanical Lockout',
          expectedRange: '70.0 - 82.0 °C',
          observedValue: `${temp.toFixed(1)} °C (Emergency Trip)`,
          isAnomaly: true,
          affectedDomain: 'energy',
        };
        health = 22;
      } else if (vib > 2.8) {
        anomaly = {
          parameter: 'Bearing Vibration',
          expectedRange: '1.0 - 2.0 mm/s',
          observedValue: `${vib.toFixed(1)} mm/s`,
          isAnomaly: true,
          affectedDomain: 'energy',
        };
        status = 'warning';
        health = Math.min(health, 64);
      }
    } else if (asset.type === 'hvac') {
      const load = asset.metrics.loadKw || 140;
      if (load > 210) {
        anomaly = {
          parameter: 'Thermal Recovery Draw',
          expectedRange: '120 - 180 kW',
          observedValue: `${load} kW (Thermal Overdrive)`,
          isAnomaly: true,
          affectedDomain: 'hvac',
        };
        status = 'warning';
        health = Math.min(health, 70);
      }
    } else if (asset.type === 'water_pump' || asset.type === 'reverse_osmosis') {
      const pressure = asset.metrics.pressureBar || 3.2;
      if (pressure < 2.2) {
        anomaly = {
          parameter: 'Feedwater Intake Line Pressure',
          expectedRange: '2.8 - 4.2 bar',
          observedValue: `${pressure.toFixed(1)} bar`,
          isAnomaly: true,
          affectedDomain: 'water',
        };
        status = 'warning';
        health = Math.min(health, 68);
      }
    } else if (asset.type === 'satellite_uplink') {
      const eff = asset.metrics.efficiencyPercent || 94;
      if (eff < 70) {
        anomaly = {
          parameter: 'Carrier-to-Noise (C/N) Ratio',
          expectedRange: '85 - 99 %',
          observedValue: `${eff}% (Severe Fade)`,
          isAnomaly: true,
          affectedDomain: 'comms',
        };
        status = 'warning';
        health = Math.min(health, 58);
      }
    }

    return {
      ...asset,
      status,
      health,
      anomaly,
      updatedAt: new Date().toISOString(),
    };
  });
}

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
  if (env.temperatureC < -32) envScore -= 30;
  else if (env.temperatureC < -25) envScore -= 18;
  else if (env.temperatureC < -20) envScore -= 8;

  if (env.windKmh > 75) envScore -= 35;
  else if (env.windKmh > 55) envScore -= 20;
  else if (env.windKmh > 35) envScore -= 5;

  if (env.visibilityKm < 1.5) envScore -= 25;
  else if (env.visibilityKm < 5.0) envScore -= 10;
  envScore = Math.max(10, Math.min(100, Math.round(envScore)));

  // 2. Energy Score
  let energyScore = 100;
  const netPower = energy.generationKw - energy.demandKw;
  if (netPower < 0) {
    energyScore -= Math.min(50, Math.abs(netPower) * 0.75);
  }
  if (energy.batterySoc < 30) energyScore -= 30;
  else if (energy.batterySoc < 50) energyScore -= 15;

  if (energy.fuelRunwayDays < 10) energyScore -= 40;
  else if (energy.fuelRunwayDays < 15) energyScore -= 20;
  else if (energy.fuelRunwayDays < 21) energyScore -= 5;
  energyScore = Math.max(10, Math.min(100, Math.round(energyScore)));

  // 3. Infrastructure Score
  const infraScore = Math.max(10, Math.min(100, Math.round(infra.overallHealth)));

  // 4. Logistics Score
  let logDeduction = 0;
  for (const item of inventory) {
    if (item.inventoryStatus === 'CRITICAL' || item.daysRemaining < 14) {
      logDeduction += item.category === 'fuel' ? 35 : 15;
    } else if (item.inventoryStatus === 'PROJECTED SHORTAGE' || item.daysRemaining < 18) {
      logDeduction += item.category === 'fuel' ? 20 : 10;
    } else if (item.inventoryStatus === 'WARNING' || item.daysRemaining < 22) {
      logDeduction += 6;
    }
  }
  const logisticsScore = Math.max(10, Math.min(100, Math.round(100 - logDeduction)));

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
 * PHASE 1 & PHASE 3 — CENTRAL DIGITAL TWIN STATE ENGINE
 * Composable evaluation pipeline:
 * baseline state + active scenario events + realtime telemetry drift
 * ↓ derived station state ↓ risk engine ↓ health score
 * 
 * Never mutates baseline mock data!
 */
export function evaluateStationState(
  baselineEnv: EnvironmentTelemetry,
  baselineEnergy: EnergyTelemetry,
  baselineInfra: InfrastructureTelemetry,
  baselineInventory: InventoryItem[],
  activeEvents: ActiveScenarios,
  drift: { tempNoise?: number; windNoise?: number; loadNoise?: number } = {},
  stationId: StationId = 'bharati'
): {
  environment: EnvironmentTelemetry;
  energy: EnergyTelemetry;
  infrastructure: InfrastructureTelemetry;
  inventory: InventoryItem[];
  healthScore: StationHealthScore;
  derived: StationDerivedState;
} {
  // 1. Calculate Effective Environment
  const tempOffset = activeEvents.extremeCold ? -12.0 : 0;
  const windOffset = activeEvents.highWind ? 45.0 : 0;
  const tempNoise = drift.tempNoise || 0;
  const windNoise = drift.windNoise || 0;

  const effectiveTemperatureC = Number((baselineEnv.temperatureC + tempOffset + tempNoise).toFixed(1));
  const effectiveWindKmh = Math.max(10, Math.round(baselineEnv.windKmh + windOffset + windNoise));
  const effectiveVisibility = activeEvents.highWind ? 1.2 : baselineEnv.visibilityKm;
  const blizzardRisk: RiskSeverity = (activeEvents.highWind || activeEvents.extremeCold) 
    ? 'critical' 
    : baselineEnv.blizzardRisk;

  const derivedEnvironment: EnvironmentTelemetry = {
    ...baselineEnv,
    temperatureC: effectiveTemperatureC,
    windKmh: effectiveWindKmh,
    windMs: Number((effectiveWindKmh / 3.6).toFixed(1)),
    windKnots: Number((effectiveWindKmh / 1.852).toFixed(1)),
    visibilityKm: effectiveVisibility,
    blizzardRisk,
    source: (activeEvents.extremeCold || activeEvents.highWind) ? 'Synthetic Telemetry' : (baselineEnv.source || 'Public Observation'),
    liveObservation: {
      temperatureC: baselineEnv.temperatureC,
      windKmh: baselineEnv.windKmh,
      windKnots: baselineEnv.windKnots || Number((baselineEnv.windKmh / 1.852).toFixed(1)),
      pressureHpa: baselineEnv.pressureHpa,
      observedAt: baselineEnv.observedAt || baselineEnv.lastUpdated || new Date().toISOString(),
      source: baselineEnv.primarySource || baselineEnv.source || 'NCPOR',
      status: baselineEnv.weatherState || 'LIVE',
    },
    demoScenarioOffset: {
      temperatureOffset: tempOffset,
      windOffset,
      active: activeEvents.extremeCold || activeEvents.highWind,
    },
    simulatedState: {
      temperatureC: effectiveTemperatureC,
      windKmh: effectiveWindKmh,
    },
    updatedAt: new Date().toISOString(),
  };

  // 2. Calculate Effective Energy Demand & Generation
  const { demandKw, heatingLoadKw } = calculateEnergyDemand(
    baselineEnergy.baseLoadKw,
    effectiveTemperatureC,
    effectiveWindKmh
  );
  const loadNoise = drift.loadNoise || 0;
  const totalDemandKw = Math.max(180, demandKw + loadNoise);

  let generationCapacityKw = baselineEnergy.generationKw;
  const updatedGenerators = baselineEnergy.generators.map(g => {
    if (g.id.includes('gen-02') && activeEvents.generator2Failure) {
      return {
        ...g,
        status: 'offline' as const,
        currentOutputKw: 0,
        loadPercent: 0,
        health: 22,
      };
    }
    return g;
  });

  if (activeEvents.generator2Failure) {
    generationCapacityKw = Math.max(180, generationCapacityKw - 190);
  }

  const powerBalanceKw = generationCapacityKw - totalDemandKw;

  // Battery SOC calculation
  let batterySoc = baselineEnergy.batterySoc;
  if (powerBalanceKw < 0) {
    // Deficit draws down battery
    const deficitHours = 4; // simulated window
    const energyDrainedKwh = Math.abs(powerBalanceKw) * deficitHours;
    const socDrain = (energyDrainedKwh / baselineEnergy.batteryCapacityKwh) * 100;
    batterySoc = Math.max(15, Math.round(baselineEnergy.batterySoc - socDrain));
  } else if (activeEvents.extremeCold) {
    batterySoc = Math.max(40, baselineEnergy.batterySoc - 10);
  }

  // Fuel calculation
  const genForBurn = Math.min(generationCapacityKw, totalDemandKw);
  const activeGenCount = updatedGenerators.filter(g => g.status === 'running').length;
  const { dailyBurnLitres, runwayDays: baseRunway } = calculateFuelRunway(
    baselineEnergy.fuelLitres,
    genForBurn,
    activeGenCount
  );
  const fuelRunwayDays = activeEvents.extremeCold 
    ? Number((baseRunway * 0.85).toFixed(1)) 
    : baseRunway;

  const derivedEnergy: EnergyTelemetry = {
    ...baselineEnergy,
    generationKw: generationCapacityKw,
    demandKw: totalDemandKw,
    heatingLoadKw,
    batterySoc,
    generators: updatedGenerators,
    averageFuelBurnLitresPerDay: dailyBurnLitres,
    fuelRunwayDays,
    source: (activeEvents.extremeCold || activeEvents.highWind || activeEvents.generator2Failure)
      ? 'Synthetic Telemetry'
      : 'Derived Calculation',
    updatedAt: new Date().toISOString(),
  };

  // 3. Infrastructure Evaluation & Anomaly Signals
  let assetsToProcess = baselineInfra.assets.map(a => {
    if (a.assetId.includes('gen-02') && activeEvents.generator2Failure) {
      return { ...a, status: 'offline' as const, health: 22 };
    }
    if (a.assetId.includes('hvac') && activeEvents.extremeCold) {
      return { ...a, metrics: { ...a.metrics, loadKw: heatingLoadKw } };
    }
    return a;
  });
  const processedAssets = detectAssetAnomalies(assetsToProcess);
  const avgHealth = Math.round(
    processedAssets.reduce((acc, a) => acc + a.health, 0) / Math.max(1, processedAssets.length)
  );

  const derivedInfra: InfrastructureTelemetry = {
    ...baselineInfra,
    overallHealth: avgHealth,
    assets: processedAssets,
    generatorHealth: activeEvents.generator2Failure ? 52 : baselineInfra.generatorHealth,
    hvacHealth: activeEvents.extremeCold ? 70 : baselineInfra.hvacHealth,
    criticalAlertsCount: (activeEvents.generator2Failure || activeEvents.extremeCold || activeEvents.highWind) ? 2 : 0,
    source: 'Derived Calculation',
    updatedAt: new Date().toISOString(),
  };

  // 4. Predictive Logistics
  const resupplyDelayDays = activeEvents.resupplyDelay ? 12 : 0;
  const derivedInventory = calculatePredictiveLogistics(baselineInventory, resupplyDelayDays);

  // 5. Overall Health Calculation
  const healthScore = calculateStationHealth(
    derivedEnvironment,
    derivedEnergy,
    derivedInfra,
    derivedInventory
  );

  // 6. Cross-domain Risk, Causal Chain, and Recommendations
  const inventoryRunways: Record<string, { daysRemaining: number; status: InventoryStatus; shortageDate: string }> = {};
  derivedInventory.forEach(item => {
    inventoryRunways[item.sku] = {
      daysRemaining: item.daysRemaining,
      status: item.inventoryStatus,
      shortageDate: item.projectedShortageDate,
    };
  });

  const causalChain: string[] = [];
  const recommendedResponse: string[] = [];
  let crossDomainRisk: RiskSeverity = 'nominal';
  let activeIncidentTitle = 'Nominal Operations Across All Systems';
  let rootCause = 'All subsystems operating within defined polar thresholds.';
  let forecastedImpact = 'Station will maintain continuous thermal balance, microgrid equilibrium, and 20+ day resupply margin.';

  const isSevereCompounded = (activeEvents.extremeCold || activeEvents.highWind) && activeEvents.generator2Failure;

  if (activeEvents.extremeCold) {
    causalChain.push(`Severe Cold Snap (-12°C): Outside ambient temperature drops to ${effectiveTemperatureC}°C.`);
    causalChain.push(`Thermodynamic load jumps: HVAC thermal recovery draw escalates to ${heatingLoadKw} kW.`);
  }

  if (activeEvents.highWind) {
    causalChain.push(`Katabatic Gale (+45 km/h): Sustained winds reach ${effectiveWindKmh} km/h with severe drift.`);
    causalChain.push(`Surface visibility plunges to ${effectiveVisibility} km, freezing external sorting corridors.`);
  }

  if (activeEvents.generator2Failure) {
    causalChain.push(`Genset #2 Trip: Emergency trip removes 190 kW generation capacity.`);
    causalChain.push(`Microgrid Deficit: Net power balance drops to ${powerBalanceKw} kW, forcing battery discharge.`);
  }

  if (activeEvents.resupplyDelay) {
    causalChain.push(`Prydz Bay Pack Ice Delay: MV Vasiliy Golovnin resupply delayed by +12 days.`);
    causalChain.push(`Logistics Gap: Fuel runway (${fuelRunwayDays}d) contracts inside the revised 30-day resupply window.`);
  }

  // Determine active incident & recommendations
  if (isSevereCompounded) {
    crossDomainRisk = 'critical';
    activeIncidentTitle = `CRITICAL COMPOUND ANOMALY: Microgrid Deficit (${Math.abs(powerBalanceKw)} kW) during Severe Antarctic Cold Snap`;
    rootCause = `Simultaneous Generator #2 mechanical lockout coincided with sub-zero HVAC thermal overdrive.`;
    forecastedImpact = `Station battery reserves will deplete to critical minimum within 6 hours. Unmitigated power deficit threatens life support and indoor thermal stability.`;
    recommendedResponse.push('IMMEDIATE: Start Cold-Reserve Emergency Generator (Genset #3 / #4).');
    recommendedResponse.push('PRIORITY: Shed non-essential Tier-3 scientific experiments and living quarters heating (-65 kW).');
    recommendedResponse.push('PRIORITY: Pre-heat fuel distribution lines to inhibit parrafin waxing.');
    recommendedResponse.push('LOGISTICS: Issue urgent Twin-Otter ski-plane emergency resupply alert to NCPOR Command.');
  } else if (activeEvents.generator2Failure) {
    crossDomainRisk = 'critical';
    activeIncidentTitle = `HIGH SEVERITY: Generator #2 Mechanical Lockout (${Math.abs(powerBalanceKw)} kW Deficit)`;
    rootCause = `Emergency shutdown of Generator #2 transferred primary microgrid load onto single operational genset and battery bank.`;
    forecastedImpact = `Station battery bank discharging rapidly; fuel burn per operational cylinder increases.`;
    recommendedResponse.push('Start auxiliary genset immediately to restore positive microgrid balance.');
    recommendedResponse.push('Isolate non-critical accommodation circuits.');
  } else if (activeEvents.extremeCold || activeEvents.highWind) {
    crossDomainRisk = activeEvents.extremeCold ? 'warning' : 'warning';
    activeIncidentTitle = `WEATHER ADVISORY: ${activeEvents.extremeCold ? 'Extreme Polar Cold Snap' : 'Blizzard Conditions'} (${effectiveTemperatureC}°C, ${effectiveWindKmh} km/h)`;
    rootCause = `Katabatic storm front propagating through ${stationId === 'bharati' ? 'Larsemann Hills' : 'Schirmacher Oasis'}.`;
    forecastedImpact = `Accelerated thermal leakage increases daily fuel consumption by +15%.`;
    recommendedResponse.push('Enact station outdoor curfew; all sorties strictly restricted.');
    recommendedResponse.push('Engage auxiliary heat exchangers on main HVAC loop.');
  } else if (activeEvents.resupplyDelay) {
    crossDomainRisk = 'warning';
    activeIncidentTitle = `LOGISTICS ALERT: Pack-Ice Delay on Resupply Vessel (+12 Days)`;
    rootCause = `Heavy multi-year sea-ice barrier preventing polar vessel docking at coastal ice shelf.`;
    forecastedImpact = `Station safety fuel buffer drops below the mandatory 14-day polar contingency threshold.`;
    recommendedResponse.push('Implement Tier-2 station conservation protocol (reduce non-essential comfort heating by 1.5°C).');
    recommendedResponse.push('Prepare alternative fuel cache requisition from neighboring Antarctic station.');
  } else {
    crossDomainRisk = 'nominal';
    activeIncidentTitle = 'Nominal Operations Across All Systems';
    rootCause = 'All subsystems operating within defined polar thresholds.';
    forecastedImpact = 'Station will maintain continuous thermal balance, microgrid equilibrium, and 20+ day resupply margin.';
    recommendedResponse.push('Maintain nominal watchkeeping routine; all systems operating within baseline parameters.');
  }

  const batteryStatus: 'charging' | 'discharging' | 'nominal' = 
    powerBalanceKw < 0 ? 'discharging' : powerBalanceKw > 20 ? 'charging' : 'nominal';

  const derived: StationDerivedState = {
    effectiveTemperatureC,
    effectiveTempC: effectiveTemperatureC,
    effectiveWindKmh,
    heatingLoadKw,
    totalDemandKw,
    generationCapacityKw,
    powerBalanceKw,
    powerSurplusDeficitKw: powerBalanceKw,
    batterySoc,
    batterySocPercent: batterySoc,
    batteryStatus,
    dailyFuelBurnLitres: dailyBurnLitres,
    fuelRunwayDays,
    infrastructureOverallHealth: avgHealth,
    overallInfrastructureHealth: avgHealth,
    inventoryRunways,
    crossDomainRisk,
    activeIncidentTitle,
    activeIncident: activeIncidentTitle,
    rootCause,
    causalChain: causalChain.length > 0 ? causalChain : ['Continuous baseline monitoring: sensors reporting stable telemetry.'],
    forecastedImpact,
    recommendedResponse: recommendedResponse.join(' '),
    recommendedResponses: recommendedResponse,
    overallHealth: healthScore.overall,
    overallHealthScore: healthScore.overall,
    stationMode: 'NORMAL',
    healthPointDelta: Math.max(0, 93 - healthScore.overall),
    healthDeltaExplanation: Math.max(0, 93 - healthScore.overall) > 0
      ? `↓ ${Math.max(0, 93 - healthScore.overall)} points (Primary drivers: ${(activeEvents.generator2Failure ? ['Generator lockout'] : []).concat(activeEvents.resupplyDelay ? ['Logistics shortage'] : []).concat(activeEvents.extremeCold || activeEvents.highWind ? ['Weather load'] : []).concat(activeEvents.generator2Failure || activeEvents.resupplyDelay || activeEvents.extremeCold || activeEvents.highWind ? [] : ['Nominal baseline']).join(', ')})`
      : 'Nominal baseline across all 4 domains',
    primaryDrivers: (activeEvents.generator2Failure ? ['Generator #2 lockout & microgrid deficit'] : [])
      .concat(activeEvents.resupplyDelay ? ['Logistics shortage & pack-ice delay'] : [])
      .concat(activeEvents.extremeCold || activeEvents.highWind ? ['Katabatic weather & heating load'] : [])
      .concat(activeEvents.generator2Failure || activeEvents.resupplyDelay || activeEvents.extremeCold || activeEvents.highWind ? [] : ['Nominal operational equilibrium']),
  };

  return {
    environment: derivedEnvironment,
    energy: derivedEnergy,
    infrastructure: derivedInfra,
    inventory: derivedInventory,
    healthScore,
    derived,
  };
}

/**
 * PHASE 4 — TIMELINE-BASED WHAT-IF SIMULATOR
 * Calculates cross-domain timeline projections from T+0h to T+96h
 * with visual cascade steps and explainable causality.
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

  const { demandKw: initialDemandKw, heatingLoadKw } = calculateEnergyDemand(
    baselineEnergy.baseLoadKw,
    simulatedTemp,
    simulatedWind
  );

  let initialGenerationKw = baselineEnergy.generationKw;
  if (inputs.generator2Offline) {
    initialGenerationKw = Math.max(180, initialGenerationKw - 190);
  }

  const initialNetPower = initialGenerationKw - initialDemandKw;
  const initialDeficit = initialNetPower < 0 ? Math.abs(initialNetPower) : 0;
  const energyDeficitPercent = initialDemandKw > 0
    ? Number(((initialDeficit / initialDemandKw) * 100).toFixed(1))
    : 0;

  // Generate Timeline Points: T+0h, T+6h, T+12h, T+24h, T+48h, T+72h, T+96h
  const timeSteps: { horizon: SimulationTimelinePoint['timeHorizon']; hours: number }[] = [
    { horizon: 'T+0h', hours: 0 },
    { horizon: 'T+6h', hours: 6 },
    { horizon: 'T+12h', hours: 12 },
    { horizon: 'T+24h', hours: 24 },
    { horizon: 'T+48h', hours: 48 },
    { horizon: 'T+72h', hours: 72 },
    { horizon: 'T+96h', hours: 96 },
  ];

  const fuelItem = baselineInventory.find(i => i.category === 'fuel');
  const baselineFuelDays = fuelItem ? fuelItem.daysRemaining : 20.4;
  const daysUntilResupply = 18 + inputs.resupplyDelayDays;

  const timeline: SimulationTimelinePoint[] = timeSteps.map(ts => {
    // Dynamic progression over time
    const demandKw = initialDemandKw;
    const generationKw = initialGenerationKw;
    const powerDeficitKw = initialDeficit;

    // Battery SOC drain over hours
    let batterySoc = baselineEnergy.batterySoc;
    if (powerDeficitKw > 0) {
      const totalDeficitKwh = powerDeficitKw * ts.hours;
      const socDrain = (totalDeficitKwh / baselineEnergy.batteryCapacityKwh) * 100;
      batterySoc = Math.max(0, Math.round(baselineEnergy.batterySoc - socDrain));
    }

    // Fuel runway degradation
    const burnAccelerationFactor = 1 + (Math.abs(inputs.temperatureAdjustmentC) * 0.015);
    const effectiveRunwayDays = Math.max(
      1.0,
      Number((baselineEnergy.fuelRunwayDays / burnAccelerationFactor - (ts.hours / 24)).toFixed(1))
    );

    // Critical inventory days
    const criticalInventoryDays = Math.max(
      1.0,
      Number((baselineFuelDays - (inputs.resupplyDelayDays * 0.4) - (ts.hours / 24)).toFixed(1))
    );

    let riskState: RiskSeverity = 'nominal';
    if (batterySoc < 20 || effectiveRunwayDays < daysUntilResupply || powerDeficitKw > 60) {
      riskState = 'critical';
    } else if (batterySoc < 50 || effectiveRunwayDays < daysUntilResupply + 3 || powerDeficitKw > 0) {
      riskState = 'warning';
    }

    return {
      timeHorizon: ts.horizon,
      hours: ts.hours,
      energyDemandKw: demandKw,
      generationKw,
      powerDeficitKw,
      batterySoc,
      fuelRunwayDays: effectiveRunwayDays,
      criticalInventoryDays,
      riskState,
    };
  });

  const t24 = timeline.find(t => t.hours === 24) || timeline[3];

  // Visual Cascade Steps
  const cascadeSteps: SimulationCascadeStep[] = [
    {
      step: '1. Weather Stress',
      fromDomain: 'Environment',
      toDomain: 'HVAC Infrastructure',
      description: `Ambient temp adjusted by ${inputs.temperatureAdjustmentC}°C (Wind: +${inputs.windAdjustmentKmh} km/h), dropping station heat boundary.`,
    },
    {
      step: '2. HVAC Thermal Load Surge',
      fromDomain: 'HVAC Infrastructure',
      toDomain: 'Microgrid Energy',
      description: `Thermodynamic heating draw rises to ${heatingLoadKw} kW to prevent station internal freeze.`,
    },
    {
      step: '3. Energy Balance Deficit',
      fromDomain: 'Microgrid Energy',
      toDomain: 'Battery Bank',
      description: inputs.generator2Offline 
        ? `Genset #2 offline leaves ${initialGenerationKw} kW capacity against ${initialDemandKw} kW demand -> Net Deficit: ${initialDeficit} kW.`
        : `Generation of ${initialGenerationKw} kW handles demand, but thermal fuel burn escalates.`,
    },
    {
      step: '4. Battery Storage Depletion',
      fromDomain: 'Battery Bank',
      toDomain: 'Station Life Support',
      description: `Battery state-of-charge drops to ${t24.batterySoc}% by T+24h under sustained continuous discharge.`,
    },
    {
      step: '5. Accelerated Fuel Consumption',
      fromDomain: 'Energy',
      toDomain: 'Logistics Runway',
      description: `Diesel consumption contracts fuel runway to ${t24.fuelRunwayDays} days.`,
    },
    {
      step: '6. Resupply Buffer Risk',
      fromDomain: 'Logistics',
      toDomain: 'Mission Command',
      description: inputs.resupplyDelayDays > 0
        ? `Resupply delayed +${inputs.resupplyDelayDays} days creates an unrecoverable deficit gap before ship arrival.`
        : `Fuel reserve remains within marginal bounds, but requires load-shedding protocols.`,
    },
  ];

  // Causal Chain
  const causalChain: string[] = [
    `Simulated ambient temperature of ${simulatedTemp.toFixed(1)}°C with ${simulatedWind} km/h winds`,
    `HVAC thermal recovery load increases to ${heatingLoadKw} kW; Total demand reaches ${initialDemandKw} kW`,
  ];
  if (inputs.generator2Offline) {
    causalChain.push(`Generator #2 OFFLINE reduces capacity to ${initialGenerationKw} kW -> Net deficit of ${initialDeficit} kW`);
    causalChain.push(`Battery bank discharges to ${t24.batterySoc}% within 24 hours`);
  }
  causalChain.push(`Projected fuel runway declines to ${t24.fuelRunwayDays} days`);
  if (inputs.resupplyDelayDays > 0) {
    causalChain.push(`Vessel delay of +${inputs.resupplyDelayDays} days pushes arrival past fuel exhaustion point`);
  }

  // Why Did This Happen Explanation
  const whyExplanation = inputs.generator2Offline
    ? `The primary trigger was the simulated failure of Generator #2 during weather stress. Because Antarctic stations operate in an isolated island microgrid, losing 190 kW while HVAC heating demand surged due to ${simulatedTemp.toFixed(1)}°C cold immediately caused battery drain and fuel acceleration.`
    : `The primary trigger was severe thermodynamic coupling: as outside temperature dropped by ${Math.abs(inputs.temperatureAdjustmentC)}°C, station convective heat loss forced the HVAC subsystem to consume additional power, reducing the operational fuel runway.`;

  // Recommendations
  const recommendedResponse: string[] = [];
  if (inputs.generator2Offline) {
    recommendedResponse.push('Activate cold-reserve backup generator (Genset #4) immediately.');
    recommendedResponse.push('Execute non-critical load shedding protocol (-65 kW) across laboratories and gyms.');
  }
  if (t24.fuelRunwayDays < daysUntilResupply) {
    recommendedResponse.push('Request emergency ski-plane fuel airlift from coastal replenishment cache.');
    recommendedResponse.push('Drop indoor thermal setpoint by 1.5°C to save ~240 L/day fuel.');
  }
  if (recommendedResponse.length === 0) {
    recommendedResponse.push('Continue nominal station watchkeeping; current parameters remain resilient.');
  }

  return {
    scenarioName: inputs.generator2Offline 
      ? 'Coupled Microgrid Deficit + Polar Storm Simulation' 
      : 'Weather & Logistics Stress Simulation',
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
      energyDemandKw: initialDemandKw,
      netPowerKw: initialNetPower,
      batterySocAfter24h: t24.batterySoc,
      fuelRunwayDays: t24.fuelRunwayDays,
      criticalInventoryDays: t24.criticalInventoryDays,
      energyDeficitPercent,
      overallRisk: t24.riskState,
    },
    timeline,
    cascadeSteps,
    whyExplanation,
    whyDidThisHappen: whyExplanation,
    causalChain,
    recommendedResponse,
    createdAt: new Date().toISOString(),
  };
}
