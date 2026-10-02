import { NextResponse } from 'next/server';
import { runWhatIfSimulation } from '@/lib/calculations';
import { INITIAL_ENVIRONMENT, INITIAL_ENERGY, INITIAL_INVENTORY } from '@/mocks/stationData';
import { SimulationInputs, StationId } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stationId: StationId = body.stationId || 'bharati';

    const inputs: SimulationInputs = {
      stationId,
      temperatureAdjustmentC: Number(body.temperatureAdjustmentC ?? -10),
      windAdjustmentKmh: Number(body.windAdjustmentKmh ?? 20),
      generator2Offline: Boolean(body.generator2Offline ?? false),
      resupplyDelayDays: Number(body.resupplyDelayDays ?? 0),
      degradeAssetId: body.degradeAssetId,
    };

    const result = runWhatIfSimulation(
      stationId,
      inputs,
      INITIAL_ENVIRONMENT[stationId],
      INITIAL_ENERGY[stationId],
      INITIAL_INVENTORY[stationId]
    );

    return NextResponse.json({
      status: 'success',
      simulation: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to execute simulation', details: error?.message },
      { status: 400 }
    );
  }
}
