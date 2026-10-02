import { NextResponse } from 'next/server';
import { INITIAL_ALERTS } from '@/mocks/stationData';
import { StationId } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const stationId = params.id.toLowerCase() as StationId;

  if (stationId !== 'maitri' && stationId !== 'bharati') {
    return NextResponse.json({ error: 'Station not found.' }, { status: 404 });
  }

  const alerts = INITIAL_ALERTS.filter(a => a.stationId === stationId);

  return NextResponse.json({
    status: 'success',
    stationId,
    count: alerts.length,
    alerts,
    timestamp: new Date().toISOString(),
  });
}
