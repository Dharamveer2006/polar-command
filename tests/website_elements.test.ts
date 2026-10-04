import { describe, it, expect } from 'vitest';
import http from 'http';

function fetchUrl(path: string, options: http.RequestOptions = {}, postBody?: any): Promise<{ status: number; data: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const opts: http.RequestOptions = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: options.method || 'GET',
      headers: {
        ...(postBody ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    };

    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 0, data: body, headers: res.headers }));
    });

    req.on('error', reject);
    if (postBody) {
      req.write(JSON.stringify(postBody));
    }
    req.end();
  });
}

describe('Polar Command - Website Pages & Elements Integration Tests', () => {

  describe('1. Core Application Pages (HTTP 200 / Render checks)', () => {
    const pages = [
      { path: '/dashboard', label: 'Command Dashboard' },
      { path: '/digital-twin', label: 'Spatial Digital Twin' },
      { path: '/environment', label: 'Polar Weather Monitor' },
      { path: '/energy', label: 'Power & Microgrid' },
      { path: '/infrastructure', label: 'Infrastructure & Mechanical' },
      { path: '/logistics', label: 'Predictive Logistics' },
      { path: '/simulator', label: 'What-If Stress Simulator' },
      { path: '/alerts', label: 'Incident Response & Alarms' },
      { path: '/reports', label: 'Situation Reports' },
      { path: '/login', label: 'Operator Authentication' },
    ];

    it('Root route redirects to /dashboard', async () => {
      const res = await fetchUrl('/');
      expect([307, 308, 200]).toContain(res.status);
    });

    for (const page of pages) {
      it(`Page ${page.path} (${page.label}) responds with 200 and valid HTML`, async () => {
        const res = await fetchUrl(page.path);
        expect(res.status).toBe(200);
        expect(res.data).toContain('<!DOCTYPE html>');
        expect(res.data).toContain('POLAR COMMAND');
      }, 20000);
    }
  });

  describe('2. Telemetry & State API Endpoints', () => {
    it('GET /api/stations returns both Maitri and Bharati metadata', async () => {
      const res = await fetchUrl('/api/stations');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(json.data.some((s: any) => s.stationId === 'maitri')).toBe(true);
      expect(json.data.some((s: any) => s.stationId === 'bharati')).toBe(true);
    });

    it('GET /api/weather/maitri returns ground-truth or fallback weather data', async () => {
      const res = await fetchUrl('/api/weather/maitri');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(['LIVE', 'STALE', 'FALLBACK']).toContain(json.status);
      expect(json.station).toBe('maitri');
      expect(typeof json.temperatureC).toBe('number');
      expect(typeof json.windKmh).toBe('number');
    });

    it('GET /api/weather/bharati returns ground-truth or fallback weather data', async () => {
      const res = await fetchUrl('/api/weather/bharati');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(['LIVE', 'STALE', 'FALLBACK']).toContain(json.status);
      expect(json.station).toBe('bharati');
      expect(typeof json.temperatureC).toBe('number');
      expect(typeof json.windKmh).toBe('number');
    });

    it('GET /api/stations/maitri/state returns consolidated station state', async () => {
      const res = await fetchUrl('/api/stations/maitri/state');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(json.stationId).toBe('maitri');
      expect(json.healthScore).toBeDefined();
      expect(json.environment).toBeDefined();
      expect(json.energy).toBeDefined();
      expect(json.infrastructure).toBeDefined();
      expect(json.logistics).toBeDefined();
    });

    it('GET /api/stations/maitri/alerts returns active alarms list', async () => {
      const res = await fetchUrl('/api/stations/maitri/alerts');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(Array.isArray(json.alerts)).toBe(true);
    });

    it('GET /api/stations/maitri/telemetry returns full telemetry bundle', async () => {
      const res = await fetchUrl('/api/stations/maitri/telemetry');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(json.stationId).toBe('maitri');
      expect(json.current.energy).toBeDefined();
      expect(Array.isArray(json.series)).toBe(true);
      expect(json.series.length).toBe(24);
    });

    it('GET /api/logistics/maitri/inventory returns stock levels', async () => {
      const res = await fetchUrl('/api/logistics/maitri/inventory');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(Array.isArray(json.inventory)).toBe(true);
      expect(json.inventory.length).toBeGreaterThan(0);
    });

    it('GET /api/logistics/requisitions returns supply chain requisitions', async () => {
      const res = await fetchUrl('/api/logistics/requisitions');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(Array.isArray(json.requisitions)).toBe(true);
    });

    it('GET /api/reports returns reporting templates & metadata', async () => {
      const res = await fetchUrl('/api/reports');
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(Array.isArray(json.reports)).toBe(true);
    });
  });

  describe('3. Action Endpoints (Alerts, Requisitions, Simulation & Reports)', () => {
    it('PATCH /api/alerts/alt-mtr-01/ack acknowledges an alert', async () => {
      const res = await fetchUrl('/api/alerts/alt-mtr-01/ack', { method: 'PATCH' }, {
        acknowledgedBy: 'Commander Sharma'
      });
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(json.acknowledged).toBe(true);
      expect(json.acknowledgedBy).toBe('Commander Sharma');
    });

    it('POST /api/alerts/alt-mtr-01/ack also acknowledges an alert (compatibility)', async () => {
      const res = await fetchUrl('/api/alerts/alt-mtr-01/ack', { method: 'POST' }, {
        acknowledgedBy: 'Chief Engineer Roy'
      });
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(json.acknowledged).toBe(true);
    });

    it('POST /api/logistics/requisitions creates a new requisition', async () => {
      const res = await fetchUrl('/api/logistics/requisitions', { method: 'POST' }, {
        stationId: 'bharati',
        title: 'Replacement RO Filter Cartridges',
        priority: 'ELEVATED',
        rationale: 'Desalination maintenance reserve',
        items: [
          { sku: 'FILT-RO-5M', name: '5 Micron Sediment Filter', quantity: 50, unit: 'cartridges' }
        ]
      });
      expect(res.status).toBe(201);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(json.requisition.title).toBe('Replacement RO Filter Cartridges');
    });

    it('POST /api/simulations executes What-If predictive simulation', async () => {
      const res = await fetchUrl('/api/simulations', { method: 'POST' }, {
        stationId: 'bharati',
        temperatureAdjustmentC: -18,
        windAdjustmentKmh: 50,
        generator2Offline: true,
        resupplyDelayDays: 14
      });
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(json.simulation.timeline.length).toBeGreaterThan(0);
      expect(json.simulation.recommendedResponse.length).toBeGreaterThan(0);
    });

    it('POST /api/reports/export generates operational SITREP export', async () => {
      const res = await fetchUrl('/api/reports/export', { method: 'POST' }, {
        stationId: 'maitri',
        reportType: 'daily',
        format: 'json'
      });
      expect(res.status).toBe(200);
      const json = JSON.parse(res.data);
      expect(json.status).toBe('success');
      expect(json.report.referenceId).toContain('NCPOR/SITREP');
    });
  });
});
