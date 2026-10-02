import { NextResponse } from 'next/server';

export async function GET() {
  const availableReports = [
    {
      type: 'daily',
      name: 'Daily Situation Report (SITREP)',
      description: 'Comprehensive cross-domain snapshot covering Environment, Energy, Infrastructure, and Logistics.',
      frequency: 'Every 24 Hours',
      formats: ['PDF', 'CSV', 'JSON'],
    },
    {
      type: 'incident',
      name: 'Incident Response & Risk Chain Log',
      description: 'Audit report of all critical alarms, sensor trips, and acknowledged actions.',
      frequency: 'Ad-hoc / Event Driven',
      formats: ['PDF', 'CSV'],
    },
    {
      type: 'energy',
      name: 'Energy & Fuel Balance Report',
      description: 'Generation load profiles, genset fuel efficiency, and reserve runway projections.',
      frequency: 'Daily & Weekly',
      formats: ['PDF', 'CSV'],
    },
    {
      type: 'logistics',
      name: 'Consumables Depletion & Supply Chain Report',
      description: 'Stock on hand, daily consumption rates, and icebreaker resupply window forecasts.',
      frequency: 'Weekly',
      formats: ['PDF', 'CSV'],
    },
  ];

  return NextResponse.json({
    status: 'success',
    reports: availableReports,
    stations: ['maitri', 'bharati'],
    timestamp: new Date().toISOString(),
  });
}
