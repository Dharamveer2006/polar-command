import { NextResponse } from 'next/server';
import { INITIAL_STATIONS_METADATA } from '@/mocks/stationData';

export async function GET() {
  const stations = Object.values(INITIAL_STATIONS_METADATA);
  return NextResponse.json({
    status: 'success',
    data: stations,
    timestamp: new Date().toISOString(),
  });
}
