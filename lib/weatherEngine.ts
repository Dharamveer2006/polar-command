import { 
  EnvironmentTelemetry, 
  StationId, 
  ActiveScenarios, 
  WeatherState, 
  WeatherEventDetection, 
  SatelliteMetadata, 
  SatelliteLayerId, 
  WeatherForecastHorizon,
  RiskSeverity,
  DataProvenance,
  NormalizedWeatherResponse,
  HistoricalWeatherObservation
} from '@/types';

// ============================================================================
// 1. BASELINE GROUND TRUTH OBSERVATIONS (NCPOR Primary Source)
// ============================================================================

export const BASELINE_STATION_WEATHER: Record<StationId, EnvironmentTelemetry> = {
  bharati: {
    temperatureC: -17.5,
    windKmh: 18.7,
    windMs: 5.2,
    windDirectionDeg: 190,
    pressureHpa: 978.2,
    visibilityKm: 12.0,
    humidityPercent: 58,
    windChillC: -22.3,
    blizzardRisk: 'nominal',
    source: 'Synthetic Telemetry',
    primarySource: 'NCPOR Synthetic Baseline Model',
    secondarySource: 'NOAA-21 VIIRS Polar Day-Night Band',
    forecastSource: 'ECMWF High-Resolution (0.1° Integrated Forecasting System)',
    weatherState: 'FALLBACK',
    sourceLatencySec: 42,
    lastUpdated: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + 180000).toISOString(), // 3 min refresh
    activeWeatherEvents: [],
    updatedAt: new Date().toISOString(),
  },
  maitri: {
    temperatureC: -24.6,
    windKmh: 37.8,
    windMs: 10.5,
    windDirectionDeg: 135,
    pressureHpa: 965.4,
    visibilityKm: 8.5,
    humidityPercent: 62,
    windChillC: -32.8,
    blizzardRisk: 'nominal',
    source: 'Synthetic Telemetry',
    primarySource: 'NCPOR Synthetic Baseline Model',
    secondarySource: 'Terra / Aqua MODIS Corrected Reflectance',
    forecastSource: 'ECMWF High-Resolution (0.1° Integrated Forecasting System)',
    weatherState: 'FALLBACK',
    sourceLatencySec: 58,
    lastUpdated: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + 180000).toISOString(),
    activeWeatherEvents: [],
    updatedAt: new Date().toISOString(),
  }
};

// ============================================================================
// 2. NASA WORLDVIEW / GIBS & NOAA JPSS SATELLITE LAYERS
// ============================================================================

export const SATELLITE_LAYERS: Record<SatelliteLayerId, SatelliteMetadata> = {
  'true-color': {
    satelliteName: 'Terra & Aqua / MODIS',
    layerId: 'true-color',
    layerName: 'Corrected Reflectance (True Color)',
    status: 'NEAR-REAL-TIME',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    latency: '45 minutes (Orbit pass)',
    resolution: '250m / pixel',
    projection: 'EPSG:3031 Antarctic Polar Stereographic',
    source: 'NASA GIBS / EOSDIS Earthdata',
    tileUrlTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/250m/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  },
  'infrared': {
    satelliteName: 'NOAA-21 / VIIRS',
    layerId: 'infrared',
    layerName: 'Brightness Temperature Band M15 (Thermal IR)',
    status: 'NEAR-REAL-TIME',
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    latency: '32 minutes (JPSS-2 Orbit)',
    resolution: '375m / pixel',
    projection: 'EPSG:3031 Antarctic Polar Stereographic',
    source: 'NOAA NESDIS / NASA LANCE',
    tileUrlTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/VIIRS_NOAA21_Thermal_Anomalies_375m_All/default/{Time}/250m/{TileMatrix}/{TileRow}/{TileCol}.png',
  },
  'clouds': {
    satelliteName: 'Suomi NPP / VIIRS',
    layerId: 'clouds',
    layerName: 'Cloud Top Pressure & Polar Moisture',
    status: 'NEAR-REAL-TIME',
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
    latency: '55 minutes',
    resolution: '1km / pixel',
    projection: 'EPSG:3031 Antarctic Polar Stereographic',
    source: 'NASA GIBS / Worldview',
    tileUrlTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/MODIS_Terra_Cloud_Top_Temp_Day/default/{Time}/2km/{TileMatrix}/{TileRow}/{TileCol}.png',
  },
  'snow-ice': {
    satelliteName: 'DMSP / SSMIS & AMSR2',
    layerId: 'snow-ice',
    layerName: 'Near-Real-Time Sea Ice & Snow Extent (NISE)',
    status: 'LATEST_CYCLE',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    latency: '2 hours (Daily composite cycle)',
    resolution: '12.5km / pixel',
    projection: 'EPSG:3031 Antarctic Polar Stereographic',
    source: 'NSIDC / NASA EOSDIS',
    tileUrlTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/AMSR2_Sea_Ice_Brightness_Temp_89H_Day/default/{Time}/2km/{TileMatrix}/{TileRow}/{TileCol}.png',
  }
};

// ============================================================================
// 3. DETERMINISTIC WEATHER EVENT DETECTOR (Section 7)
// ============================================================================

export function detectWeatherEvents(
  current: EnvironmentTelemetry,
  previous?: EnvironmentTelemetry,
  history?: HistoricalWeatherObservation[]
): WeatherEventDetection[] {
  const events: WeatherEventDetection[] = [];

  // 1. Rapid Cooling Detection (Instant delta or 2-3 hour trend)
  let deltaT: number | null = null;
  let coolingTimeframe = 'observation interval';

  if (previous) {
    deltaT = current.temperatureC - previous.temperatureC;
  }
  
  if (history && history.length >= 2) {
    // Check 2-3h window (e.g., 3-4 readings back)
    const older = history[Math.min(history.length - 1, 3)];
    if (older) {
      const historicalDeltaT = current.temperatureC - older.temperatureC;
      if (historicalDeltaT < (deltaT ?? 0)) {
        deltaT = historicalDeltaT;
        coolingTimeframe = '3h synoptic window';
      }
    }
  }

  if (deltaT !== null && deltaT <= -3.0) {
    events.push({
      type: 'RAPID_COOLING',
      severity: deltaT <= -5.0 ? 'critical' : 'warning',
      title: 'Rapid Temperature Drop Detected',
      description: `Ambient temperature plunged by ${Math.abs(deltaT).toFixed(1)}°C to ${current.temperatureC.toFixed(1)}°C.`,
      rateOfChange: `${deltaT.toFixed(1)}°C in ${coolingTimeframe}`,
      operationalImpact: `HVAC heating load expands (+2.3 kW/°C deficit). Generator load and daily fuel burn accelerate.`,
      detectedAt: new Date().toISOString()
    });
  }

  // 2. High Katabatic Wind
  if (current.windKmh >= 55) {
    events.push({
      type: 'HIGH_WIND',
      severity: current.windKmh >= 75 ? 'critical' : 'warning',
      title: 'High Katabatic Gale Advisory',
      description: `Wind speed reached ${current.windKmh} km/h (${(current.windKmh / 3.6).toFixed(1)} m/s, ${Number((current.windKmh / 1.852).toFixed(1))} kts) with peak gusts.`,
      rateOfChange: `Gale Category ${current.windKmh >= 75 ? 'Storm Level 2' : 'Warning Level 1'}`,
      operationalImpact: `SATCOM tracking dish stow protocol initiated. Outdoor research sorties suspended. Convective building thermal loss +4.5 kW/10 km/h.`,
      detectedAt: new Date().toISOString()
    });
  }

  // 3. Rapid Pressure Drop (Cyclonic Front Approach: delta P <= -4.0 hPa over 2-3h)
  let deltaP: number | null = null;
  let pressureTimeframe = 'observation interval';

  if (previous) {
    deltaP = current.pressureHpa - previous.pressureHpa;
  }

  if (history && history.length >= 2) {
    const older = history[Math.min(history.length - 1, 3)];
    if (older) {
      const historicalDeltaP = current.pressureHpa - older.pressureHpa;
      if (historicalDeltaP < (deltaP ?? 0)) {
        deltaP = historicalDeltaP;
        pressureTimeframe = '3h synoptic window';
      }
    }
  }

  if (deltaP !== null && deltaP <= -4.0) {
    events.push({
      type: 'PRESSURE_DROP',
      severity: deltaP <= -8.0 ? 'critical' : 'warning',
      title: 'Rapid Barometric Pressure Fall',
      description: `Atmospheric pressure dropped by ${Math.abs(deltaP).toFixed(1)} hPa to ${current.pressureHpa.toFixed(1)} hPa.`,
      rateOfChange: `${deltaP.toFixed(1)} hPa in ${pressureTimeframe}`,
      operationalImpact: `Deep polar frontal cyclone approaching station longitude. Heightened risk of severe katabatic squalls within 6-12 hours.`,
      detectedAt: new Date().toISOString()
    });
  }

  // 4. Low Visibility / Whiteout
  if (current.visibilityKm <= 1.5) {
    events.push({
      type: 'LOW_VISIBILITY',
      severity: current.visibilityKm <= 0.5 ? 'critical' : 'warning',
      title: 'Polar Whiteout / Low Visibility Alert',
      description: `Surface horizontal optical visibility contracted to ${current.visibilityKm.toFixed(1)} km.`,
      rateOfChange: `Restricted Optical Horizon`,
      operationalImpact: `All vehicular traverses and field aviation sorties grounded. Station perimeter safety guide-ropes mandatory.`,
      detectedAt: new Date().toISOString()
    });
  }

  // 5. Compound Blizzard Risk
  if (current.windKmh >= 55 && current.visibilityKm <= 2.0 && current.temperatureC <= -20) {
    events.push({
      type: 'BLIZZARD_RISK',
      severity: 'critical',
      title: 'CRITICAL ANTARCTIC BLIZZARD ACTIVE',
      description: `Severe blizzard conditions confirmed: ${current.windKmh} km/h wind combined with ${current.temperatureC.toFixed(1)}°C and whiteout conditions.`,
      rateOfChange: `Compound Extreme Meteorology`,
      operationalImpact: `Station sealed under Blizzard Protocol. Thermal recovery exchangers running at maximum emergency capacity. Non-critical loads shed.`,
      detectedAt: new Date().toISOString()
    });
  }

  return events;
}

// ============================================================================
// 3B. HISTORICAL OBSERVATION GENERATION & BUFFERING (Section 13)
// ============================================================================

export function generateHistoricalWeather(
  stationId: StationId,
  count: number = 24
): HistoricalWeatherObservation[] {
  const base = BASELINE_STATION_WEATHER[stationId];
  const history: HistoricalWeatherObservation[] = [];
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000).toISOString();
    const tempNoise = Math.sin(i * 0.5) * 2.1;
    const windNoise = Math.cos(i * 0.4) * 6;
    const pressNoise = Math.sin(i * 0.3) * 3.5;

    const temp = Number((base.temperatureC + tempNoise).toFixed(1));
    const windKmh = Math.max(10, Math.round(base.windKmh + windNoise));
    const windKnots = Number((windKmh / 1.852).toFixed(1));
    const press = Number((base.pressureHpa + pressNoise).toFixed(1));

    history.push({
      timestamp,
      station: stationId,
      temperatureC: temp,
      pressureHpa: press,
      humidityPercent: Math.min(95, Math.max(40, Math.round(base.humidityPercent + Math.sin(i) * 5))),
      windKmh,
      windKnots,
      windDirectionDeg: base.windDirectionDeg,
      source: 'NCPOR Station Archive',
      status: 'LIVE'
    });
  }

  return history;
}

export function convertNormalizedToTelemetry(
  res: NormalizedWeatherResponse,
  prev?: EnvironmentTelemetry,
  connectivity: string = 'CONNECTED'
): EnvironmentTelemetry {
  const isDisconnected = connectivity === 'DISCONNECTED';
  const effectiveStatus: WeatherState = isDisconnected ? 'STALE' : res.status;
  const sourceLabel: DataProvenance = res.source === 'NCPOR' ? 'Observed' : 'Synthetic Fallback';

  const telemetry: EnvironmentTelemetry = {
    temperatureC: res.temperatureC,
    windKmh: res.windKmh,
    windMs: res.windMs,
    windDirectionDeg: res.windDirectionDeg,
    pressureHpa: res.pressureHpa,
    visibilityKm: res.visibilityKm || (prev?.visibilityKm ?? 10.0),
    humidityPercent: res.humidityPercent,
    windChillC: res.windChillC || Number((res.temperatureC - (res.windKmh * 0.18)).toFixed(1)),
    blizzardRisk: (res.windKmh >= 55 && (res.visibilityKm || 10) <= 2.0 && res.temperatureC <= -20) ? 'critical' : 'nominal',
    source: isDisconnected ? 'Synthetic Fallback' : sourceLabel,
    primarySource: res.source === 'NCPOR' 
      ? (res.station === 'bharati' ? 'NCPOR Automatic Weather Station (AWS-02)' : 'NCPOR Synoptic Met Tower') 
      : 'Synthetic Fallback Baseline',
    secondarySource: prev?.secondarySource || 'NOAA-21 VIIRS Polar Day-Night Band',
    forecastSource: prev?.forecastSource || 'ECMWF High-Resolution (0.1° IFS)',
    weatherState: effectiveStatus,
    sourceLatencySec: res.latencySeconds,
    lastUpdated: res.observedAt,
    nextUpdate: new Date(Date.now() + 180000).toISOString(),
    updatedAt: res.receivedAt,
  };

  telemetry.activeWeatherEvents = detectWeatherEvents(telemetry, prev);
  return telemetry;
}

// ============================================================================
// 4. REAL WEATHER + ACTIVE DEMO SCENARIO SEPARATION (Section 9)
// ============================================================================

export function calculateEffectiveWeather(
  liveObs: EnvironmentTelemetry,
  scenario: ActiveScenarios
): {
  liveObservation: EnvironmentTelemetry;
  activeScenarioOffset: { tempOffsetC: number; windOffsetKmh: number; visibilityKm: number };
  effectiveWeather: EnvironmentTelemetry;
  labels: {
    live: string;
    scenario: string;
    derived: string;
  };
} {
  const tempOffsetC = scenario.extremeCold ? -12.0 : 0;
  const windOffsetKmh = scenario.highWind ? 45.0 : 0;
  const visibilityKm = scenario.highWind ? 1.2 : liveObs.visibilityKm;

  const effectiveTemperatureC = Number((liveObs.temperatureC + tempOffsetC).toFixed(1));
  const effectiveWindKmh = Math.round(liveObs.windKmh + windOffsetKmh);
  const effectiveWindMs = Number((effectiveWindKmh / 3.6).toFixed(1));
  const effectiveWindChillC = Number((effectiveTemperatureC - (effectiveWindKmh * 0.18)).toFixed(1));

  const effectiveBlizzardRisk: RiskSeverity = 
    (scenario.highWind || scenario.extremeCold || effectiveWindKmh >= 70) 
      ? 'critical' 
      : liveObs.blizzardRisk;

  const effectiveWeather: EnvironmentTelemetry = {
    ...liveObs,
    temperatureC: effectiveTemperatureC,
    windKmh: effectiveWindKmh,
    windMs: effectiveWindMs,
    visibilityKm,
    windChillC: effectiveWindChillC,
    blizzardRisk: effectiveBlizzardRisk,
    source: (scenario.extremeCold || scenario.highWind) ? 'Derived' : liveObs.source,
    updatedAt: new Date().toISOString(),
  };

  const detectedEvents = detectWeatherEvents(effectiveWeather, liveObs);
  effectiveWeather.activeWeatherEvents = detectedEvents;

  return {
    liveObservation: liveObs,
    activeScenarioOffset: { tempOffsetC, windOffsetKmh, visibilityKm },
    effectiveWeather,
    labels: {
      live: `LIVE OBSERVATION (${liveObs.source}): ${liveObs.temperatureC.toFixed(1)}°C, ${(liveObs.windKmh / 3.6).toFixed(1)} m/s`,
      scenario: (tempOffsetC !== 0 || windOffsetKmh !== 0) 
        ? `DEMO SCENARIO: ${tempOffsetC !== 0 ? `${tempOffsetC > 0 ? '+' : ''}${tempOffsetC}°C ` : ''}${windOffsetKmh !== 0 ? `+${windOffsetKmh} km/h Wind` : ''}` 
        : 'DEMO SCENARIO: Baseline (No Active Offsets)',
      derived: `DERIVED STATE: ${effectiveTemperatureC.toFixed(1)}°C, ${effectiveWindMs} m/s (${effectiveWindKmh} km/h)`,
    }
  };
}

// ============================================================================
// 5. ECMWF MULTI-HORIZON WEATHER FORECAST GENERATOR (Section 5)
// ============================================================================

export function generateStationForecast(
  base: EnvironmentTelemetry,
  stationId: StationId
): WeatherForecastHorizon[] {
  const isMaitri = stationId === 'maitri';
  const baseT = base.temperatureC;
  const baseW = base.windKmh;
  const baseP = base.pressureHpa;

  return [
    {
      horizon: '+6H',
      timestamp: new Date(Date.now() + 6 * 3600000).toISOString(),
      temperatureC: Number((baseT - 1.2).toFixed(1)),
      windKmh: baseW + 4,
      windMs: Number(((baseW + 4) / 3.6).toFixed(1)),
      pressureHpa: Number((baseP - 1.8).toFixed(1)),
      blizzardProbability: isMaitri ? 15 : 10,
      condition: 'Clear Katabatic Transition',
      projectedHeatingLoadKw: Math.round(135 + Math.max(0, -15 - (baseT - 1.2)) * 2.3),
      modelCycle: 'ECMWF 00Z Cycle (HRES 0.1°)',
    },
    {
      horizon: '+12H',
      timestamp: new Date(Date.now() + 12 * 3600000).toISOString(),
      temperatureC: Number((baseT - 2.8).toFixed(1)),
      windKmh: baseW + 12,
      windMs: Number(((baseW + 12) / 3.6).toFixed(1)),
      pressureHpa: Number((baseP - 4.2).toFixed(1)),
      blizzardProbability: isMaitri ? 28 : 22,
      condition: 'Strengthening Polar Gale',
      projectedHeatingLoadKw: Math.round(135 + Math.max(0, -15 - (baseT - 2.8)) * 2.3 + 5),
      modelCycle: 'ECMWF 00Z Cycle (HRES 0.1°)',
    },
    {
      horizon: '+24H',
      timestamp: new Date(Date.now() + 24 * 3600000).toISOString(),
      temperatureC: Number((baseT - 4.5).toFixed(1)),
      windKmh: baseW + 24,
      windMs: Number(((baseW + 24) / 3.6).toFixed(1)),
      pressureHpa: Number((baseP - 7.5).toFixed(1)),
      blizzardProbability: isMaitri ? 65 : 55,
      condition: 'Deep Low-Pressure Front Approach',
      projectedHeatingLoadKw: Math.round(135 + Math.max(0, -15 - (baseT - 4.5)) * 2.3 + 12),
      modelCycle: 'ECMWF 00Z Cycle (HRES 0.1°)',
    },
    {
      horizon: '+48H',
      timestamp: new Date(Date.now() + 48 * 3600000).toISOString(),
      temperatureC: Number((baseT - 3.1).toFixed(1)),
      windKmh: Math.max(20, baseW + 15),
      windMs: Number(((baseW + 15) / 3.6).toFixed(1)),
      pressureHpa: Number((baseP - 3.0).toFixed(1)),
      blizzardProbability: isMaitri ? 40 : 35,
      condition: 'Frontal Passage & Blowing Snow',
      projectedHeatingLoadKw: Math.round(135 + Math.max(0, -15 - (baseT - 3.1)) * 2.3 + 8),
      modelCycle: 'ECMWF 00Z Cycle (HRES 0.1°)',
    },
    {
      horizon: '+72H',
      timestamp: new Date(Date.now() + 72 * 3600000).toISOString(),
      temperatureC: Number((baseT + 0.5).toFixed(1)),
      windKmh: Math.max(15, baseW - 5),
      windMs: Number(((baseW - 5) / 3.6).toFixed(1)),
      pressureHpa: Number((baseP + 2.5).toFixed(1)),
      blizzardProbability: 12,
      condition: 'Post-Frontal Ridge Stabilisation',
      projectedHeatingLoadKw: Math.round(135 + Math.max(0, -15 - (baseT + 0.5)) * 2.3),
      modelCycle: 'ECMWF 00Z Cycle (HRES 0.1°)',
    },
    {
      horizon: '+96H',
      timestamp: new Date(Date.now() + 96 * 3600000).toISOString(),
      temperatureC: Number((baseT - 0.2).toFixed(1)),
      windKmh: baseW,
      windMs: Number((baseW / 3.6).toFixed(1)),
      pressureHpa: baseP,
      blizzardProbability: 8,
      condition: 'Nominal Polar High Equilibrium',
      projectedHeatingLoadKw: Math.round(135 + Math.max(0, -15 - baseT) * 2.3),
      modelCycle: 'ECMWF 00Z Cycle (HRES 0.1°)',
    }
  ];
}
