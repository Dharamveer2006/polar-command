import { NextResponse } from 'next/server';
import { 
  INITIAL_STATIONS_METADATA, 
  INITIAL_ENVIRONMENT, 
  INITIAL_ENERGY, 
  INITIAL_INFRASTRUCTURE, 
  INITIAL_INVENTORY, 
  INITIAL_REQUISITIONS, 
  INITIAL_ALERTS 
} from '@/mocks/stationData';
import { calculateStationHealth } from '@/lib/calculations';
import { StationId } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const stationId = params.id.toLowerCase() as StationId;

  if (stationId !== 'maitri' && stationId !== 'bharati') {
    return NextResponse.json({ error: 'Station not found. Expected "maitri" or "bharati".' }, { status: 404 });
  }

  const meta = INITIAL_STATIONS_METADATA[stationId];
  const env = INITIAL_ENVIRONMENT[stationId];
  const energy = INITIAL_ENERGY[stationId];
  const infra = INITIAL_INFRASTRUCTURE[stationId];
  const inv = INITIAL_INVENTORY[stationId];
  const reqs = INITIAL_REQUISITIONS.filter(r => r.stationId === stationId);
  const alerts = INITIAL_ALERTS.filter(a => a.stationId === stationId);
  const health = calculateStationHealth(env, energy, infra, inv);

  return NextResponse.json({
    status: 'success',
    stationId,
    metadata: meta,
    environment: env,
    energy,
    infrastructure: infra,
    logistics: {
      inventory: inv,
      requisitions: reqs,
      source: 'Prototype operational model',
    },
    healthScore: health,
    activeAlerts: alerts,
    timestamp: new Date().toISOString(),
  });
}
