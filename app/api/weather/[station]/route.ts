import { NextResponse } from 'next/server';
import { StationId } from '@/types';
import { fetchAndNormalizeNcporWeather } from '@/lib/weather/ncporAdapter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  try {
    const normalized = await fetchAndNormalizeNcporWeather(station, { timeoutMs: 3500 });

    return NextResponse.json(normalized, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal error processing NCPOR weather data', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export function generateStaticParams() {
  return [{ station: 'maitri' }, { station: 'bharati' }];
}
