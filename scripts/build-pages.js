const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'app', 'api');
const backupDir = path.join(rootDir, 'api_routes_backup');
const outDir = path.join(rootDir, 'out');
const nojekyllOut = path.join(outDir, '.nojekyll');

let apiMoved = false;

function moveDir(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (process.platform === 'win32') {
      execSync(`powershell -Command "Move-Item -LiteralPath '${src}' -Destination '${dest}' -Force"`);
    } else {
      throw err;
    }
  }
}

try {
  console.log('[POLAR COMMAND] Preparing static export for GitHub Pages...');

  // 1. Temporarily stash app/api if present to allow static export of all client UI pages
  if (fs.existsSync(apiDir)) {
    console.log('[POLAR COMMAND] Stashing app/api -> api_routes_backup for static export...');
    moveDir(apiDir, backupDir);
    apiMoved = true;
  }

  // 2. Run next build with IS_PAGES=true
  console.log('[POLAR COMMAND] Building Next.js static site (output: export)...');
  const npxCmd = process.platform === 'win32' ? 'npx.cmd next build' : 'npx next build';
  execSync(npxCmd, {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      IS_PAGES: 'true',
    }
  });

  // 3. Ensure .nojekyll exists in out/ directory & add root redirect
  if (fs.existsSync(outDir)) {
    fs.writeFileSync(nojekyllOut, '# Disable Jekyll processing on GitHub Pages\n');
    console.log('[POLAR COMMAND] Verified .nojekyll in out/ directory.');

    const outIndex = path.join(outDir, 'index.html');
    const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>POLAR COMMAND SIH26060</title>
  <meta http-equiv="refresh" content="0; url=/polar-command/dashboard/">
  <script>window.location.replace('/polar-command/dashboard/');</script>
</head>
<body style="background:#061524;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Initializing Polar Command Center... Redirecting to <a href="/polar-command/dashboard/" style="color:#22d3ee;">Dashboard</a></p>
</body>
</html>`;
    fs.writeFileSync(outIndex, redirectHtml);
    console.log('[POLAR COMMAND] Verified root redirect in out/index.html -> /polar-command/dashboard/');
  }

  console.log('[POLAR COMMAND] GitHub Pages export completed successfully in ./out');
} catch (error) {
  console.error('[POLAR COMMAND] Build failed:', error);
  process.exitCode = 1;
} finally {
  // 4. Always restore app/api so local development and API routes remain intact
  if (apiMoved && fs.existsSync(backupDir)) {
    console.log('[POLAR COMMAND] Restoring app/api from backup...');
    if (fs.existsSync(apiDir)) {
      // In case app/api was recreated
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    moveDir(backupDir, apiDir);
    console.log('[POLAR COMMAND] app/api restored successfully.');
  }
}
