const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const gitDir = path.join(outDir, '.git');

console.log('[POLAR COMMAND] Step 1: Building static export for GitHub Pages...');

// 1. Run build:pages
execSync('node scripts/build-pages.js', { stdio: 'inherit', cwd: rootDir });

console.log('[POLAR COMMAND] Step 2: Deploying out/ to gh-pages branch...');

try {
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  execSync('git init', { stdio: 'inherit', cwd: outDir });
  execSync('git checkout -B gh-pages', { stdio: 'inherit', cwd: outDir });
  execSync('git add -A', { stdio: 'inherit', cwd: outDir });
  execSync('git commit -m deploy-update-github-pages-build', { stdio: 'inherit', cwd: outDir });
  execSync('git remote add origin https://github.com/Rahulcoder-881/polar-command.git', { stdio: 'inherit', cwd: outDir });
  execSync('git push -u -f origin gh-pages', { stdio: 'inherit', cwd: outDir });

  console.log('[POLAR COMMAND] Deployment to gh-pages branch complete!');
  console.log('[POLAR COMMAND] Site URL: https://rahulcoder-881.github.io/polar-command/');
} catch (err) {
  console.error('[POLAR COMMAND] Deployment failed:', err);
  process.exitCode = 1;
} finally {
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
}
