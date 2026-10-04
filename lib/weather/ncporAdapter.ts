import { StationId, NormalizedWeatherResponse, WeatherState } from '@/types';

/**
 * NCPOR Weather Adapter (SIH26060)
 * Server-side ingestion layer for National Centre for Polar and Ocean Research (NCPOR)
 * Automatic Weather Stations (AWS) at Maitri and Bharati, Antarctica.
 */

export const NCPOR_UPSTREAM_URLS: Record<StationId, string> = {
  maitri: 'https://data.ncpor.res.in/maitri/live',
  bharati: 'https://data.ncpor.res.in/bharati/live',
};

// In-memory cache for last valid NCPOR observation per station
export const LAST_VALID_OBSERVATIONS: Partial<Record<StationId, NormalizedWeatherResponse>> = {};

// Fallback baseline values when NCPOR is completely unreachable and cache is empty
export const FALLBACK_WEATHER_DEFAULTS: Record<StationId, {
  temperatureC: number;
  pressureHpa: number;
  humidityPercent: number;
  windKnots: number;
  windKmh: number;
  windMs: number;
  windDirectionDeg: number;
  visibilityKm: number;
}> = {
  bharati: {
    temperatureC: -17.5,
    pressureHpa: 978.2,
    humidityPercent: 58,
    windKnots: 10.1,
    windKmh: 18.7,
    windMs: 5.2,
    windDirectionDeg: 190,
    visibilityKm: 12.0,
  },
  maitri: {
    temperatureC: -24.6,
    pressureHpa: 965.4,
    humidityPercent: 62,
    windKnots: 20.4,
    windKmh: 37.8,
    windMs: 10.5,
    windDirectionDeg: 135,
    visibilityKm: 8.5,
  },
};

// 30-minute freshness threshold in seconds
export const FRESHNESS_THRESHOLD_SECONDS = 30 * 60;

/**
 * Raw data extractor supporting multiple JSON schemas, nested payloads,
 * HTML tables, and plain text key-value stream formats.
 */
export function parseNcporRawData(rawText: string, contentType: string, station: StationId): {
  temperatureC?: number;
  pressureHpa?: number;
  humidityPercent?: number;
  windKnots?: number;
  windKmh?: number;
  windMs?: number;
  windDirectionDeg?: number;
  visibilityKm?: number;
  observedAt?: string;
} {
  const defaults = FALLBACK_WEATHER_DEFAULTS[station];

  // 1. Attempt JSON parsing if content-type says json, or text looks like json
  const trimmed = rawText.trim();
  if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const root = Array.isArray(parsed) ? parsed[0] : parsed;
      // Search root or common nested keys
      const data = root.data || root.aws || root.current || root.observation || root.payload || root.metrics || root;

      const tempVal = findNumeric(data, [
        'temperatureC', 'temperature_c', 'temp_c', 'temperature', 'temp', 'air_temp', 't'
      ]);
      const pressVal = findNumeric(data, [
        'pressureHpa', 'pressure_hpa', 'pressure', 'press', 'mbar', 'slp', 'barometer', 'p'
      ]);
      const humVal = findNumeric(data, [
        'humidityPercent', 'humidity_percent', 'humidity', 'rh', 'relative_humidity', 'hum'
      ]);
      const windKtsVal = findNumeric(data, [
        'windKnots', 'wind_knots', 'wind_kts', 'kts', 'wind_speed_kts'
      ]);
      const windKmhVal = findNumeric(data, [
        'windKmh', 'wind_kmh', 'wind_speed', 'wspd', 'ws_kmh'
      ]);
      const windMsVal = findNumeric(data, [
        'windMs', 'wind_ms', 'wind_mps', 'ws_ms'
      ]);
      const windDirVal = findNumeric(data, [
        'windDirectionDeg', 'wind_direction_deg', 'wind_dir', 'wind_direction', 'wdir', 'dir', 'deg'
      ]);
      const visVal = findNumeric(data, [
        'visibilityKm', 'visibility_km', 'visibility', 'vis', 'vis_km'
      ]);

      const timestampVal = findString(data, [
        'observedAt', 'observed_at', 'timestamp', 'datetime', 'date', 'time', 'obs_time', 'recorded_at'
      ]);

      return {
        temperatureC: tempVal !== null ? tempVal : undefined,
        pressureHpa: pressVal !== null ? pressVal : undefined,
        humidityPercent: humVal !== null ? humVal : undefined,
        windKnots: windKtsVal !== null ? windKtsVal : undefined,
        windKmh: windKmhVal !== null ? windKmhVal : undefined,
        windMs: windMsVal !== null ? windMsVal : undefined,
        windDirectionDeg: windDirVal !== null ? windDirVal : undefined,
        visibilityKm: visVal !== null ? visVal : undefined,
        observedAt: timestampVal || undefined,
      };
    } catch {
      // Fall through to text/HTML parsing
    }
  }

  // 2. HTML Table or Plain Text Parsing
  return parseTextOrHtmlObservation(rawText, defaults);
}

function findNumeric(obj: any, keys: string[]): number | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    if (k in obj && obj[k] !== null && obj[k] !== undefined) {
      const parsed = parseFloat(String(obj[k]));
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function findString(obj: any, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    if (k in obj && typeof obj[k] === 'string' && obj[k].trim().length > 0) {
      return obj[k].trim();
    }
  }
  return null;
}

function parseTextOrHtmlObservation(text: string, defaults: typeof FALLBACK_WEATHER_DEFAULTS['bharati']) {
  // Strip out HTML markup to analyze plain content while keeping values
  const cleanText = text.replace(/<[^>]+>/g, ' ');

  const tempMatch = cleanText.match(/(?:temperature|temp|air\s*temp)[:\s=]+([-\d.]+)/i);
  const pressMatch = cleanText.match(/(?:pressure|mbar|hpa|barometer)[:\s=]+([-\d.]+)/i);
  const humMatch = cleanText.match(/(?:humidity|rh)[:\s=]+([-\d.]+)/i);
  const windMatch = cleanText.match(/(?:wind\s*speed|wind)[:\s=]+([-\d.]+)/i);
  const dirMatch = cleanText.match(/(?:wind\s*dir(?:ection)?|direction)[:\s=]+([-\d.]+)/i);
  const dateMatch = cleanText.match(/(?:observed|date|time|timestamp)[:\s=]+([0-9T:.\-Z\s]+)/i);

  return {
    temperatureC: tempMatch ? parseFloat(tempMatch[1]) : undefined,
    pressureHpa: pressMatch ? parseFloat(pressMatch[1]) : undefined,
    humidityPercent: humMatch ? parseFloat(humMatch[1]) : undefined,
    windKmh: windMatch ? parseFloat(windMatch[1]) : undefined,
    windDirectionDeg: dirMatch ? parseFloat(dirMatch[1]) : undefined,
    observedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : undefined,
  };
}

/**
 * Main Server-Side Ingestion Function
 * Fetches from NCPOR, normalizes all physical fields, evaluates latency and status,
 * and maintains resilient cache fallback with clear provenance labels.
 */
export async function fetchAndNormalizeNcporWeather(
  station: StationId,
  options: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<NormalizedWeatherResponse> {
  const upstreamUrl = NCPOR_UPSTREAM_URLS[station] || `https://data.ncpor.res.in/${station}/live`;
  const receivedAt = new Date().toISOString();
  const timeoutMs = options.timeoutMs ?? 3500;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const effectiveSignal = options.signal || controller.signal;

    const response = await fetch(upstreamUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json, text/plain, text/html, */*',
        'User-Agent': 'PolarCommand-SIH26060-WeatherEngine/1.0 (NCPOR Automated Synoptic Receiver)',
      },
      signal: effectiveSignal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();
      const parsed = parseNcporRawData(rawText, contentType, station);
      const defaults = FALLBACK_WEATHER_DEFAULTS[station];

      // Observed timestamp
      const observedAt = parsed.observedAt || new Date().toISOString();
      const obsTime = new Date(observedAt).getTime();
      const recTime = new Date(receivedAt).getTime();
      const latencySeconds = isNaN(obsTime) ? 0 : Math.max(0, Math.round((recTime - obsTime) / 1000));

      // Freshness: LIVE if <= 30 mins, STALE if older
      const status: WeatherState = latencySeconds <= FRESHNESS_THRESHOLD_SECONDS ? 'LIVE' : 'STALE';

      // Temperature
      const temperatureC = parsed.temperatureC !== undefined ? parsed.temperatureC : defaults.temperatureC;
      const pressureHpa = parsed.pressureHpa !== undefined ? parsed.pressureHpa : defaults.pressureHpa;
      const humidityPercent = parsed.humidityPercent !== undefined ? Math.round(parsed.humidityPercent) : defaults.humidityPercent;

      // Wind conversions (1 knot = 1.852 km/h; 1 m/s = 3.6 km/h)
      let windKnots = parsed.windKnots;
      let windKmh = parsed.windKmh;
      let windMs = parsed.windMs;

      if (windKmh === undefined && windKnots !== undefined) {
        windKmh = Number((windKnots * 1.852).toFixed(1));
      } else if (windKmh === undefined && windMs !== undefined) {
        windKmh = Number((windMs * 3.6).toFixed(1));
      } else if (windKmh === undefined) {
        windKmh = defaults.windKmh;
      }

      if (windKnots === undefined) {
        windKnots = Number((windKmh / 1.852).toFixed(1));
      }
      if (windMs === undefined) {
        windMs = Number((windKmh / 3.6).toFixed(1));
      }

      const windDirectionDeg = parsed.windDirectionDeg !== undefined
        ? Math.round(parsed.windDirectionDeg)
        : defaults.windDirectionDeg;

      const visibilityKm = parsed.visibilityKm !== undefined
        ? parsed.visibilityKm
        : defaults.visibilityKm;

      const windChillC = Number((temperatureC - (windKmh * 0.18)).toFixed(1));

      const normalized: NormalizedWeatherResponse = {
        station,
        source: 'NCPOR',
        status,
        observedAt,
        receivedAt,
        latencySeconds,
        temperatureC: Number(temperatureC.toFixed(1)),
        pressureHpa: Number(pressureHpa.toFixed(1)),
        humidityPercent,
        windKnots: Number(windKnots.toFixed(1)),
        windKmh: Number(windKmh.toFixed(1)),
        windMs: Number(windMs.toFixed(1)),
        windDirectionDeg,
        visibilityKm,
        windChillC,
        rawUpstreamStatus: `HTTP ${response.status} OK from data.ncpor.res.in`,
        rawUpstreamUrl: upstreamUrl,
      };

      // Store in memory as last valid observation for resilient fallback
      LAST_VALID_OBSERVATIONS[station] = normalized;

      return normalized;
    }
  } catch (error: any) {
    // Graceful fallback below
  }

  // 1. Use last valid cached observation marked as STALE
  const cached = LAST_VALID_OBSERVATIONS[station];
  if (cached) {
    const obsTime = new Date(cached.observedAt).getTime();
    const recTime = new Date().getTime();
    const latencySeconds = isNaN(obsTime) ? cached.latencySeconds : Math.max(0, Math.round((recTime - obsTime) / 1000));

    return {
      ...cached,
      status: 'STALE',
      receivedAt,
      latencySeconds,
      rawUpstreamStatus: 'NCPOR upstream unavailable. Serving last valid cached observation (STALE).',
    };
  }

  // 2. If no prior observation in memory, return clearly labeled SYNTHETIC FALLBACK
  const defaults = FALLBACK_WEATHER_DEFAULTS[station];
  return {
    station,
    source: 'SYNTHETIC FALLBACK',
    status: 'FALLBACK',
    observedAt: receivedAt,
    receivedAt,
    latencySeconds: 0,
    temperatureC: defaults.temperatureC,
    pressureHpa: defaults.pressureHpa,
    humidityPercent: defaults.humidityPercent,
    windKnots: defaults.windKnots,
    windKmh: defaults.windKmh,
    windMs: defaults.windMs,
    windDirectionDeg: defaults.windDirectionDeg,
    visibilityKm: defaults.visibilityKm,
    windChillC: Number((defaults.temperatureC - (defaults.windKmh * 0.18)).toFixed(1)),
    rawUpstreamStatus: 'NCPOR observation endpoint unavailable. Serving labeled synthetic baseline.',
    rawUpstreamUrl: upstreamUrl,
  };
}

export function setCachedNcporWeather(station: StationId, data: NormalizedWeatherResponse): void {
  LAST_VALID_OBSERVATIONS[station] = data;
}

export function getCachedNcporWeather(station: StationId): NormalizedWeatherResponse | undefined {
  return LAST_VALID_OBSERVATIONS[station];
}
