'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StationId, NormalizedWeatherResponse, WeatherState } from '@/types';

export interface UseLiveWeatherOptions {
  pollingIntervalMs?: number; // default: 180000 (3 min, within 2-5 min range)
  enabled?: boolean;
  onWeatherUpdate?: (data: NormalizedWeatherResponse) => void;
}

export interface UseLiveWeatherReturn {
  weather: NormalizedWeatherResponse | null;
  status: WeatherState;
  source: string;
  observedAt: string | null;
  receivedAt: string | null;
  latencySeconds: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastSynced: string | null;
  nextPollInSeconds: number;
}

/**
 * useLiveWeather Client Hook (SIH26060)
 * Polls /api/weather/{station} server-side route every 2-5 minutes (default 3m).
 * Never polls every second to preserve satellite/edge bandwidth.
 */
export function useLiveWeather(
  stationId: StationId,
  options: UseLiveWeatherOptions = {}
): UseLiveWeatherReturn {
  const {
    pollingIntervalMs = 180000, // 3 minutes
    enabled = true,
    onWeatherUpdate,
  } = options;

  const [weather, setWeather] = useState<NormalizedWeatherResponse | null>(null);
  const [status, setStatus] = useState<WeatherState>('LIVE');
  const [source, setSource] = useState<string>('NCPOR');
  const [observedAt, setObservedAt] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState<string | null>(null);
  const [latencySeconds, setLatencySeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [nextPollInSeconds, setNextPollInSeconds] = useState<number>(Math.round(pollingIntervalMs / 1000));

  const callbackRef = useRef(onWeatherUpdate);
  callbackRef.current = onWeatherUpdate;

  const fetchWeather = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/weather/${stationId}`, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch weather for ${stationId}`);
      }

      const data: NormalizedWeatherResponse = await res.json();

      setWeather(data);
      setStatus(data.status);
      setSource(data.source);
      setObservedAt(data.observedAt);
      setReceivedAt(data.receivedAt);
      setLatencySeconds(data.latencySeconds);
      setLastSynced(new Date().toISOString());

      if (callbackRef.current) {
        callbackRef.current(data);
      }
    } catch (err: any) {
      console.warn(`[useLiveWeather] Polling error for ${stationId}:`, err);
      setStatus('ERROR');
      setError(err?.message || 'Failed to fetch weather');
    } finally {
      setIsLoading(false);
      setNextPollInSeconds(Math.round(pollingIntervalMs / 1000));
    }
  }, [stationId, enabled, pollingIntervalMs]);

  // Initial fetch and interval timer
  useEffect(() => {
    fetchWeather();

    const intervalId = setInterval(fetchWeather, pollingIntervalMs);

    // Countdown timer for nextPollInSeconds display
    const countdownId = setInterval(() => {
      setNextPollInSeconds(prev => (prev > 1 ? prev - 1 : Math.round(pollingIntervalMs / 1000)));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, [fetchWeather, pollingIntervalMs]);

  return {
    weather,
    status,
    source,
    observedAt,
    receivedAt,
    latencySeconds,
    isLoading,
    error,
    refetch: fetchWeather,
    lastSynced,
    nextPollInSeconds,
  };
}
