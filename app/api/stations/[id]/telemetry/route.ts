import { NextResponse } from 'next/server';
import { INITIAL_ENVIRONMENT, INITIAL_ENERGY, INITIAL_INFRASTRUCTURE } from '@/mocks/stationData';
import { StationId } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const stationId = params.id.toLowerCase() as StationId;

  if (stationId !== 'maitri' && stationId !== 'bharati') {
    return NextResponse.json({ error: 'Station not found.' }, { status: 404 });
  }

  const baseEnv = INITIAL_ENVIRONMENT[stationId];
  const baseEnergy = INITIAL_ENERGY[stationId];
  const baseInfra = INITIAL_INFRASTRUCTURE[stationId];

  // Generate 24-point historical telemetry series (e.g. 24 hours)
  const history = Array.from({ length: 24 }).map((_, i) => {
    const timeOffsetHours = 23 - i;
    const date = new Date(Date.now() - timeOffsetHours * 3600 * 1000);
    const noise = Math.sin(i * 0.5) * 1.5;

    return {
      timestamp: date.toISOString(),
      hour: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperatureC: Number((baseEnv.temperatureC + noise).toFixed(1)),
      windKmh: Math.round(baseEnv.windKmh + Math.cos(i * 0.4) * 6),
      pressureHpa: Math.round(baseEnv.pressureHpa + Math.sin(i * 0.3) * 3),
      generationKw: baseEnergy.generationKw,
      demandKw: Math.round(baseEnergy.demandKw + noise * 5),
      heatingLoadKw: Math.round(baseEnergy.heatingLoadKw + noise * 4),
      batterySoc: Math.max(20, Math.min(100, Math.round(baseEnergy.batterySoc - (i * 0.2)))),
      fuelLitres: Math.round(baseEnergy.fuelLitres - (i * 18)),
    };
  });

  return NextResponse.json({
    status: 'success',
    stationId,
    window: '24h',
    current: {
      environment: baseEnv,
      energy: baseEnergy,
      infrastructure: baseInfra,
    },
    series: history,
    timestamp: new Date().toISOString(),
  });
}
