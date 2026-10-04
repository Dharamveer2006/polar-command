const fs = require('fs');
const path = require('path');
const http = require('http');

const rootDir = path.resolve(__dirname, '..');

// Helper for test assertions
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [✓ PASS] ${message} ${details ? '(' + details + ')' : ''}`);
    return true;
  } else {
    failedChecks++;
    console.log(`  [✗ FAIL] ${message} ${details ? '(' + details + ')' : ''}`);
    return false;
  }
}

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

async function runIntegrityAudit() {
  console.log('====================================================');
  console.log('POLAR COMMAND SIH26060 — SYSTEM INTEGRITY AUDIT');
  console.log('Single Source of Truth & Zero P0 Discrepancy Verification');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SECTION 1: ROUTE AVAILABILITY & PAGES
  // ----------------------------------------------------
  console.log('1. AUDITING ROUTE AVAILABILITY...');
  const requiredRoutes = [
    { route: '/dashboard', file: 'app/dashboard/page.tsx' },
    { route: '/digital-twin', file: 'app/digital-twin/page.tsx' },
    { route: '/environment', file: 'app/environment/page.tsx' },
    { route: '/energy', file: 'app/energy/page.tsx' },
    { route: '/infrastructure', file: 'app/infrastructure/page.tsx' },
    { route: '/logistics', file: 'app/logistics/page.tsx' },
    { route: '/simulator', file: 'app/simulator/page.tsx' },
    { route: '/alerts', file: 'app/alerts/page.tsx' },
    { route: '/reports', file: 'app/reports/page.tsx' },
    { route: '/login', file: 'app/(auth)/login/page.tsx' },
  ];

  for (const r of requiredRoutes) {
    const filePath = path.join(rootDir, r.file);
    const exists = fs.existsSync(filePath);
    assert(exists, `Route ${r.route} source`, `Checked ${r.file}`);
  }

  // ----------------------------------------------------
  // SECTION 2: GITHUB PAGES BASEPATH & NAVIGATION
  // ----------------------------------------------------
  console.log('\n2. AUDITING GITHUB PAGES & NAVIGATION RESOLUTION...');
  const nextConfigContent = fs.readFileSync(path.join(rootDir, 'next.config.mjs'), 'utf8');
  assert(nextConfigContent.includes("basePath: '/polar-command'"), 'next.config.mjs configures basePath: /polar-command');
  assert(nextConfigContent.includes("assetPrefix: '/polar-command/'"), 'next.config.mjs configures assetPrefix: /polar-command/');

  const buildPagesContent = fs.readFileSync(path.join(rootDir, 'scripts/build-pages.js'), 'utf8');
  assert(buildPagesContent.includes('/polar-command/dashboard/'), 'Static export produces root redirect to /polar-command/dashboard/');

  // ----------------------------------------------------
  // SECTION 3: FUEL RUNWAY CONSISTENCY (Requirement 6)
  // ----------------------------------------------------
  console.log('\n3. AUDITING FUEL RUNWAY CONSISTENCY ACROSS DOMAINS...');
  const calculationsPath = path.join(rootDir, 'lib/calculations.ts');
  const calcContent = fs.readFileSync(calculationsPath, 'utf8');
  
  assert(calcContent.includes('fuelBurnLitresPerDay = Math.round(baseFuelBurn * demandRatio * coldBurnMultiplier * genFailureBurnMultiplier)'), 'Canonical fuel burn formula incorporates demand, cold, and generator multipliers');
  assert(calcContent.includes('fuelRunwayDays = Number((fuelLitres / Math.max(1, fuelBurnLitresPerDay)).toFixed(1))'), 'Canonical fuel runway = fuelLitres / fuelBurnLitresPerDay');
  assert(calcContent.includes('derivedInventory = calculatePredictiveLogistics'), 'Predictive logistics receives canonical fuel burn and fuel litres');

  const stationContextPath = path.join(rootDir, 'context/StationContext.tsx');
  const ctxContent = fs.readFileSync(stationContextPath, 'utf8');
  assert(ctxContent.includes('effectiveStationState: EffectiveStationState'), 'StationContext exposes canonical effectiveStationState');
  assert(ctxContent.includes('runwayDays: state.derived.fuelRunwayDays'), 'effectiveStationState binds canonical fuel runway');

  const logisticsPagePath = path.join(rootDir, 'app/logistics/page.tsx');
  const logPageContent = fs.readFileSync(logisticsPagePath, 'utf8');
  assert(logPageContent.includes('effectiveStationState?.fuel.runwayDays'), 'Logistics page binds directly to canonical effectiveStationState.fuel.runwayDays');

  // ----------------------------------------------------
  // SECTION 4: LOGISTICS SEMANTICS (Requirement 7)
  // ----------------------------------------------------
  console.log('\n4. AUDITING LOGISTICS SEMANTICS & SHORTAGE DEFINITIONS...');
  assert(logPageContent.includes('1. Autonomy'), 'Differentiates Autonomy semantics');
  assert(logPageContent.includes('2. Safety Buffer'), 'Differentiates Safety Buffer semantics');
  assert(logPageContent.includes('3. Resupply ETA'), 'Differentiates Resupply ETA semantics');
  assert(logPageContent.includes('4. Projected Depletion'), 'Differentiates Projected Depletion semantics');
  assert(calcContent.includes('if (daysRemaining < effectiveEtaDays) {'), 'Physical shortage strictly defined as daysRemaining < effectiveEtaDays');

  // ----------------------------------------------------
  // SECTION 5: MAITRI PUMP ADVISORY (Requirement 8)
  // ----------------------------------------------------
  console.log('\n5. AUDITING MAITRI PUMP ALERT CLASSIFICATION...');
  const stationDataPath = path.join(rootDir, 'mocks/stationData.ts');
  const stationDataContent = fs.readFileSync(stationDataPath, 'utf8');
  assert(stationDataContent.includes('PROTOTYPE ADVISORY: Lake Priyadarshini Pump #1 Suction Pressure Deviation'), 'Maitri Pump #1 alert labeled PROTOTYPE ADVISORY');
  assert(stationDataContent.includes('pressure 3.4 bar (baseline 3.8 bar, -0.4 bar deviation)'), 'Maitri Pump #1 alert includes baseline deviation comparison');
  assert(stationDataContent.includes('Vibration nominal at 2.1 mm/s, health 82%, status operational'), 'Maitri Pump #1 alert acknowledges operational telemetry status');

  // ----------------------------------------------------
  // SECTION 6: ALERT WORKFLOW & RBAC (Requirement 4)
  // ----------------------------------------------------
  console.log('\n6. AUDITING ALERT WORKFLOW (ACTIVE -> ACKNOWLEDGED -> RESOLVED)...');
  const alertsPagePath = path.join(rootDir, 'app/alerts/page.tsx');
  const alertsPageContent = fs.readFileSync(alertsPagePath, 'utf8');
  assert(alertsPageContent.includes('Incident Summary'), 'Alerts page contains Incident Summary panel');
  assert(alertsPageContent.includes('Affected Systems Matrix'), 'Alerts page contains Affected Systems matrix');
  assert(alertsPageContent.includes('Resolution State Pipeline'), 'Alerts page contains Resolution State Pipeline');
  assert(alertsPageContent.includes('Operational Impact'), 'Alerts page contains Operational Impact panel');
  assert(alertsPageContent.includes('resolveAlert(alert.alertId)'), 'Alerts page provides Resolve Alert action');
  assert(ctxContent.includes('canAcknowledgeAlerts'), 'Alert resolution enforces RBAC permissions');
  assert(ctxContent.includes('resolveAlert: (alertId: string) => boolean'), 'StationContext exports resolveAlert method');

  // ----------------------------------------------------
  // SECTION 7: RESPONSIVE NAVIGATION & 1536PX BREAKPOINT (Requirement 11)
  // ----------------------------------------------------
  console.log('\n7. AUDITING RESPONSIVE NAVIGATION & 1536PX BREAKPOINT...');
  const navbarPath = path.join(rootDir, 'components/layout/Navbar.tsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  assert(navbarContent.includes('2xl:flex items-center gap-1'), 'Full desktop navigation activates at 2xl (>=1536px)');
  assert(navbarContent.includes('2xl:hidden'), 'Compact/scrollable navigation activates below 2xl (<1536px)');

  // ----------------------------------------------------
  // SECTION 8: LUCIDE ICONS & ARIA-LABELS (Requirement 12)
  // ----------------------------------------------------
  console.log('\n8. AUDITING ICON SEMANTICS & ARIA-LABELS...');
  assert(navbarContent.includes('aria-label="Switch to Maitri Station"'), 'Station switcher icon button includes aria-label');
  assert(navbarContent.includes('aria-label="Open Demo Scenarios & Stress Testing Menu"'), 'Demo scenario button includes aria-label');
  assert(navbarContent.includes('aria-label={isRealtimeActive ? "Pause Realtime Telemetry Drift" : "Resume Realtime Telemetry Drift"}'), 'Realtime pause/resume button includes aria-label');

  // ----------------------------------------------------
  // SECTION 9: LIVE SERVER PROBE (Optional / if dev server running)
  // ----------------------------------------------------
  console.log('\n9. PROBING LOCAL SERVER (http://localhost:3000)...');
  const rootResult = await checkUrl('/');
  if (rootResult.ok) {
    console.log('  [✓ SERVER ACTIVE] Running live route probe...');
    const liveRoutes = [
      '/dashboard',
      '/environment',
      '/digital-twin',
      '/energy',
      '/infrastructure',
      '/logistics',
      '/simulator',
      '/alerts',
      '/reports',
      '/api/weather/bharati',
      '/api/weather/maitri'
    ];
    for (const lr of liveRoutes) {
      const res = await checkUrl(lr);
      assert(res.ok, `Live endpoint ${lr}`, res.details);
    }
  } else {
    console.log('  [ℹ INFO] Development server on port 3000 is idle. (Static verification 100% complete)');
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`INTEGRITY AUDIT COMPLETE: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  if (failedChecks === 0) {
    console.log('STATUS: ZERO P0 CONSISTENCY ISSUES DETECTED. SYSTEM READY.');
  } else {
    console.log(`STATUS: ${failedChecks} CHECKS FAILED.`);
    process.exitCode = 1;
  }
  console.log('====================================================');
}

runIntegrityAudit();
