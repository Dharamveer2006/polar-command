import { NextResponse } from 'next/server';
import { INITIAL_STATIONS_METADATA, INITIAL_ENVIRONMENT, INITIAL_ENERGY, INITIAL_INVENTORY, INITIAL_ALERTS } from '@/mocks/stationData';
import { calculateStationHealth } from '@/lib/calculations';
import { StationId } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stationId: StationId = body.stationId || 'bharati';
    const reportType = body.reportType || 'daily';
    const format = body.format || 'json';

    const meta = INITIAL_STATIONS_METADATA[stationId];
    const env = INITIAL_ENVIRONMENT[stationId];
    const energy = INITIAL_ENERGY[stationId];
    const inv = INITIAL_INVENTORY[stationId];
    const alerts = INITIAL_ALERTS.filter(a => a.stationId === stationId);

    const reportPayload = {
      referenceId: `NCPOR/SITREP/${stationId.toUpperCase()}/${Date.now()}`,
      station: meta,
      reportType,
      generatedAt: new Date().toISOString(),
      generatedBy: body.operator || 'NCPOR Operations Command',
      summary: {
        health: calculateStationHealth(env, energy, { overallHealth: 90, assets: [], hvacHealth: 90, waterPumpHealth: 90, generatorHealth: 90, criticalAlertsCount: 0, source: 'Simulated telemetry', updatedAt: '' }, inv),
        ambientTempC: env.temperatureC,
        windSpeedKmh: env.windKmh,
        powerDemandKw: energy.demandKw,
        powerGenerationKw: energy.generationKw,
        fuelRunwayDays: energy.fuelRunwayDays,
        activeAlertsCount: alerts.length,
      },
      provenance: {
        environment: env.source,
        energy: energy.source,
        logistics: 'Prototype operational model',
      },
    };

    return NextResponse.json({
      status: 'success',
      format,
      downloadUrl: `/api/reports/download/${reportPayload.referenceId}`,
      report: reportPayload,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate report export', details: error?.message }, { status: 400 });
  }
}
