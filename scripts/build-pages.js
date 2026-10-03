const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'app', 'api');
const backupDir = path.join(rootDir, 'api_routes_backup');
const outDir = path.join(rootDir, 'out');
const nojekyllOut = path.join(outDir, '.nojekyll');
const isWin = process.platform === 'win32';

let apiMoved = false;

function moveDir(src, dest) {
  if (isWin) {
    try {
      execSync(`robocopy "${src}" "${dest}" /E /MOVE >nul 2>&1`, { stdio: 'ignore' });
    } catch (e) {
      // robocopy returns non-zero on success (1 = files copied)
    }
    // Clean empty src dir
    if (fs.existsSync(src)) {
      try {
        fs.rmSync(src, { recursive: true, force: true });
      } catch (e) {}
    }
  } else {
    fs.renameSync(src, dest);
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
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env,
      IS_PAGES: 'true',
    }
  });

  // 3. Ensure .nojekyll exists in out/ directory
  if (fs.existsSync(outDir)) {
    fs.writeFileSync(nojekyllOut, '# Disable Jekyll processing on GitHub Pages\n');
    console.log('[POLAR COMMAND] Verified .nojekyll in out/ directory.');
  }

  console.log('[POLAR COMMAND] GitHub Pages export completed successfully in ./out');
} catch (error) {
  console.error('[POLAR COMMAND] Build failed:', error);
  process.exitCode = 1;
} finally {
  // 4. Always restore app/api so local development and API routes remain intact
  if (apiMoved && fs.existsSync(backupDir)) {
    console.log('[POLAR COMMAND] Restoring app/api from backup...');
    moveDir(backupDir, apiDir);
    console.log('[POLAR COMMAND] app/api restored successfully.');
  }
}
