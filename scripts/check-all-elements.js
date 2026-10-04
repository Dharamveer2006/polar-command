const http = require('http');

async function checkUrl(path) {
  const url = `http://localhost:3000${path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    let isOk = res.status >= 200 && res.status < 400;
    let details = `Status: ${res.status}`;
    
    if (res.headers.get('location')) {
      details += ` -> Redirect: ${res.headers.get('location')}`;
    }
    
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      details += ` (JSON keys: ${Object.keys(json).slice(0, 5).join(', ')}...)`;
    } else if (contentType.includes('text/html')) {
      const html = await res.text();
      details += ` (HTML length: ${html.length} bytes)`;
    } else if (contentType.includes('text/css')) {
      const css = await res.text();
      details += ` (CSS length: ${css.length} bytes)`;
    }

    return { path, ok: isOk, details };
  } catch (err) {
    return { path, ok: false, details: `Failed: ${err.message}` };
  }
}

async function runAllChecks() {
  console.log('====================================================');
  console.log('POLAR COMMAND SIH26060 — FULL SYSTEM HEALTH VERIFICATION');
  console.log('====================================================\n');

  const pages = [
    '/',
    '/dashboard',
    '/environment',
    '/digital-twin',
    '/energy',
    '/infrastructure',
    '/logistics',
    '/simulator',
    '/alerts',
    '/reports',
    '/login'
  ];

  console.log('1. VERIFYING UI PAGES...');
  for (const page of pages) {
    const result = await checkUrl(page);
    const mark = result.ok ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${mark}] ${result.path.padEnd(20)} ${result.details}`);
  }

  console.log('\n2. VERIFYING API ENDPOINTS...');
  const apis = [
    '/api/weather/maitri',
    '/api/weather/bharati',
    '/api/stations',
    '/api/stations/bharati/state',
    '/api/stations/maitri/state',
    '/api/stations/bharati/alerts',
    '/api/stations/bharati/telemetry',
    '/api/logistics/requisitions',
    '/api/reports',
  ];

  for (const api of apis) {
    const result = await checkUrl(api);
    const mark = result.ok ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${mark}] ${result.path.padEnd(35)} ${result.details}`);
  }

  console.log('\n3. VERIFYING CSS STYLESHEET PIPELINE...');
  const dashRes = await fetch('http://localhost:3000/dashboard');
  const dashHtml = await dashRes.text();
  const cssMatch = dashHtml.match(/href="(\/_next\/static\/css\/[^"]+)"/);
  
  if (cssMatch) {
    const cssResult = await checkUrl(cssMatch[1]);
    const mark = cssResult.ok ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${mark}] ${cssResult.path.padEnd(45)} ${cssResult.details}`);
  } else {
    console.log('  [✗ FAIL] No CSS stylesheet link found in /dashboard HTML!');
  }

  console.log('\n4. VERIFYING WEATHER DATA STRUCTURE & CONVERSIONS...');
  const weatherRes = await fetch('http://localhost:3000/api/weather/bharati');
  const w = await weatherRes.json();
  const checks = [
    { name: 'Station name', pass: w.station === 'bharati', val: w.station },
    { name: 'Source present', pass: !!w.source, val: w.source },
    { name: 'Status present', pass: ['LIVE', 'STALE', 'FALLBACK', 'ERROR'].includes(w.status), val: w.status },
    { name: 'Temperature numeric', pass: typeof w.temperatureC === 'number', val: `${w.temperatureC}°C` },
    { name: 'Pressure numeric', pass: typeof w.pressureHpa === 'number', val: `${w.pressureHpa} hPa` },
    { name: 'Wind Knots numeric', pass: typeof w.windKnots === 'number', val: `${w.windKnots} kts` },
    { name: 'Wind km/h numeric', pass: typeof w.windKmh === 'number', val: `${w.windKmh} km/h` },
    { name: 'Wind m/s numeric', pass: typeof w.windMs === 'number', val: `${w.windMs} m/s` },
    { name: 'Unit Conversion (knots -> km/h)', pass: Math.abs(w.windKnots * 1.852 - w.windKmh) < 0.2, val: `${w.windKnots} kts * 1.852 ≈ ${w.windKmh} km/h` },
    { name: 'Unit Conversion (km/h -> m/s)', pass: Math.abs(w.windKmh / 3.6 - w.windMs) < 0.2, val: `${w.windKmh} km/h / 3.6 ≈ ${w.windMs} m/s` },
  ];

  for (const c of checks) {
    const mark = c.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${mark}] ${c.name.padEnd(35)} Value: ${c.val}`);
  }

  console.log('\n====================================================');
  console.log('VERIFICATION COMPLETE');
  console.log('====================================================');
}

runAllChecks();
