import { NextResponse } from 'next/server';
import { INITIAL_INVENTORY } from '@/mocks/stationData';
import { StationId } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const stationId = params.id.toLowerCase() as StationId;

  if (stationId !== 'maitri' && stationId !== 'bharati') {
    return NextResponse.json({ error: 'Station not found.' }, { status: 404 });
  }

  const items = INITIAL_INVENTORY[stationId];

  return NextResponse.json({
    status: 'success',
    stationId,
    inventory: items,
    criticalCount: items.filter(i => i.riskLevel === 'critical').length,
    warningCount: items.filter(i => i.riskLevel === 'warning').length,
    timestamp: new Date().toISOString(),
  });
}
