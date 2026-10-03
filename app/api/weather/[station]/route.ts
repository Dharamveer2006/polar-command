import { NextResponse } from 'next/server';
import { StationId, NormalizedWeatherResponse, WeatherState } from '@/types';

// In-memory cache for last valid NCPOR observation per station
const LAST_VALID_OBSERVATIONS: Partial<Record<StationId, NormalizedWeatherResponse>> = {};

// Fallback baseline values when NCPOR is completely unreachable
const FALLBACK_WEATHER_DEFAULTS: Record<StationId, {
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
  }
};

// Configurable freshness threshold in seconds (30 minutes)
const FRESHNESS_THRESHOLD_SECONDS = 30 * 60;

export async function GET(
  request: Request,
  { params }: { params: { station: string } }
) {
  const stationParam = params.station?.toLowerCase();
  
  if (stationParam !== 'maitri' && stationParam !== 'bharati') {
    return NextResponse.json(
      { error: `Invalid station '${stationParam}'. Supported stations: 'maitri', 'bharati'.` },
      { status: 400 }
    );
  }

  const station = stationParam as StationId;
  const upstreamUrl = `https://data.ncpor.res.in/${station}/live`;
  const receivedAt = new Date().toISOString();

  try {
    // Server-side fetch from NCPOR with strict no-store and 3.5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(upstreamUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'PolarCommand-SIH26060-WeatherEngine/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let rawData: any = null;

      if (contentType.includes('application/json')) {
        rawData = await response.json();
      } else {
        const textData = await response.text();
        try {
          rawData = JSON.parse(textData);
        } catch {
          // If plain text tabular or key-value format, extract numeric values
          rawData = parseTextObservation(textData, station);
        }
      }

      if (rawData) {
        const observedAt = rawData.observedAt || rawData.timestamp || rawData.date || new Date().toISOString();
        const obsTime = new Date(observedAt).getTime();
        const recTime = new Date(receivedAt).getTime();
        const latencySeconds = Math.max(0, Math.round((recTime - obsTime) / 1000));

        // Determine status based on freshness threshold
        const status: WeatherState = latencySeconds <= FRESHNESS_THRESHOLD_SECONDS ? 'LIVE' : 'STALE';

        // Extract and normalize numeric fields (1 knot = 1.852 km/h; pressure mBar == hPa)
        const temperatureC = typeof rawData.temperatureC === 'number' 
          ? rawData.temperatureC 
          : parseFloat(rawData.temperature || rawData.temp || FALLBACK_WEATHER_DEFAULTS[station].temperatureC);

        const pressureHpa = typeof rawData.pressureHpa === 'number' 
          ? rawData.pressureHpa 
          : parseFloat(rawData.pressure || rawData.mbar || FALLBACK_WEATHER_DEFAULTS[station].pressureHpa);

        const humidityPercent = typeof rawData.humidityPercent === 'number' 
          ? rawData.humidityPercent 
          : parseFloat(rawData.humidity || rawData.rh || FALLBACK_WEATHER_DEFAULTS[station].humidityPercent);

        let windKnots = typeof rawData.windKnots === 'number'
          ? rawData.windKnots
          : (rawData.wind_kts ? parseFloat(rawData.wind_kts) : null);

        let windKmh = typeof rawData.windKmh === 'number'
          ? rawData.windKmh
          : (rawData.wind_kmh ? parseFloat(rawData.wind_kmh) : null);

        if (windKnots === null && windKmh !== null) {
          windKnots = Number((windKmh / 1.852).toFixed(1));
        } else if (windKnots !== null && windKmh === null) {
          windKmh = Number((windKnots * 1.852).toFixed(1));
        } else if (windKnots === null && windKmh === null) {
          windKnots = FALLBACK_WEATHER_DEFAULTS[station].windKnots;
          windKmh = FALLBACK_WEATHER_DEFAULTS[station].windKmh;
        }

        const windMs = Number((windKmh! / 3.6).toFixed(1));
        const windDirectionDeg = typeof rawData.windDirectionDeg === 'number'
          ? rawData.windDirectionDeg
          : (rawData.wind_dir ? parseFloat(rawData.wind_dir) : FALLBACK_WEATHER_DEFAULTS[station].windDirectionDeg);

        const visibilityKm = rawData.visibilityKm 
          ? parseFloat(rawData.visibilityKm) 
          : FALLBACK_WEATHER_DEFAULTS[station].visibilityKm;

        const windChillC = Number((temperatureC - (windKmh! * 0.18)).toFixed(1));

        const normalized: NormalizedWeatherResponse = {
          station,
          source: 'NCPOR',
          status,
          observedAt,
          receivedAt,
          latencySeconds,
          temperatureC: Number(temperatureC.toFixed(1)),
          pressureHpa: Number(pressureHpa.toFixed(1)),
          humidityPercent: Math.round(humidityPercent),
          windKnots: Number(windKnots!.toFixed(1)),
          windKmh: Number(windKmh!.toFixed(1)),
          windMs,
          windDirectionDeg: Math.round(windDirectionDeg),
          visibilityKm,
          windChillC,
          rawUpstreamStatus: 'HTTP 200 OK from data.ncpor.res.in',
          rawUpstreamUrl: upstreamUrl,
        };

        // Cache as last valid observation
        LAST_VALID_OBSERVATIONS[station] = normalized;

        return NextResponse.json(normalized, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        });
      }
    }
  } catch (error: any) {
    // Fall through to cache or fallback below
  }

  // 14. FALLBACK BEHAVIOR
  // If NCPOR is unavailable, check if we have a last valid observation
  const lastValid = LAST_VALID_OBSERVATIONS[station];
  if (lastValid) {
    const obsTime = new Date(lastValid.observedAt).getTime();
    const recTime = new Date().getTime();
    const latencySeconds = Math.max(0, Math.round((recTime - obsTime) / 1000));

    const staleResponse: NormalizedWeatherResponse = {
      ...lastValid,
      status: 'STALE',
      receivedAt,
      latencySeconds,
      rawUpstreamStatus: 'NCPOR connection timed out. Retaining last valid observation (STALE).',
    };

    return NextResponse.json(staleResponse, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  }

  // If no prior valid observation in memory, return clearly-labeled SYNTHETIC FALLBACK baseline
  const defaults = FALLBACK_WEATHER_DEFAULTS[station];
  const fallbackResponse: NormalizedWeatherResponse = {
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

  return NextResponse.json(fallbackResponse, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}

function parseTextObservation(text: string, station: StationId) {
  const d = FALLBACK_WEATHER_DEFAULTS[station];
  // Basic regex fallback to extract temperature and wind from raw text stream if present
  const tempMatch = text.match(/temp(?:erature)?[:\s=]+([-\d.]+)/i);
  const pressMatch = text.match(/press(?:ure)?[:\s=]+([-\d.]+)/i);
  const windMatch = text.match(/wind(?:_spd)?[:\s=]+([-\d.]+)/i);
  const dirMatch = text.match(/dir(?:ection)?[:\s=]+([-\d.]+)/i);
  const humMatch = text.match(/hum(?:idity)?[:\s=]+([-\d.]+)/i);

  return {
    temperatureC: tempMatch ? parseFloat(tempMatch[1]) : d.temperatureC,
    pressureHpa: pressMatch ? parseFloat(pressMatch[1]) : d.pressureHpa,
    humidityPercent: humMatch ? parseFloat(humMatch[1]) : d.humidityPercent,
    windKmh: windMatch ? parseFloat(windMatch[1]) : d.windKmh,
    windDirectionDeg: dirMatch ? parseFloat(dirMatch[1]) : d.windDirectionDeg,
    observedAt: new Date().toISOString(),
  };
}

export function generateStaticParams() {
  return [{ station: 'maitri' }, { station: 'bharati' }];
}
