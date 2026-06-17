'use strict';
const { execSync, spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function exec(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', timeout: 300000, ...opts }).trim();
}

function checkUpdate() {
  const branch = exec('git rev-parse --abbrev-ref HEAD');
  const localHash = exec('git rev-parse HEAD');
  const localShort = exec('git rev-parse --short HEAD');

  exec('git fetch origin', { timeout: 20000 });

  let remoteHash, remoteShort;
  try {
    remoteHash = exec(`git rev-parse origin/${branch}`);
    remoteShort = exec(`git rev-parse --short origin/${branch}`);
  } catch (_) {
    remoteHash = localHash;
    remoteShort = localShort;
  }

  const hasUpdate = localHash !== remoteHash;
  let behind = 0;
  if (hasUpdate) {
    try { behind = parseInt(exec(`git rev-list --count HEAD..origin/${branch}`), 10); } catch (_) {}
  }

  let lastCommitMsg = '', lastCommitDate = '';
  try {
    lastCommitMsg = exec(`git log origin/${branch} -1 --pretty=format:%s`);
    lastCommitDate = exec(`git log origin/${branch} -1 --pretty=format:%ci`);
  } catch (_) {}

  return { hasUpdate, branch, currentVersion: localShort, latestVersion: remoteShort, behind, lastCommitMsg, lastCommitDate };
}

function applyUpdate(send) {
  const branch = exec('git rev-parse --abbrev-ref HEAD');

  send('⬇️  Baixando atualizações do GitHub...');
  const pullOut = exec(`git pull origin ${branch}`, { timeout: 60000 });
  send(pullOut || 'Repositório já está atualizado.');

  // Re-install deps only if package.json changed
  let diffFiles = '';
  try { diffFiles = exec('git diff HEAD@{1} --name-only'); } catch (_) {}
  if (diffFiles.includes('package.json') || diffFiles.includes('package-lock.json')) {
    send('📦 Dependências alteradas — instalando...');
    exec('npm install --prefer-offline', { timeout: 180000 });
    send('✔ Dependências instaladas.');
  }

  send('🔨 Compilando o aplicativo (aguarde ~30s)...');
  exec('npm run build', { timeout: 300000 });
  send('✅ Compilação concluída!');
  send('__DONE__');
}

// Spawn a new server process and exit this one after a short delay
function scheduleRestart() {
  const script = `sleep 1.5 && node "${path.join(__dirname, 'index.js')}"`;
  const child = spawn('sh', ['-c', script], {
    detached: true,
    stdio: 'ignore',
    env: process.env,
    cwd: ROOT,
  });
  child.unref();
  setTimeout(() => process.exit(0), 800);
}

module.exports = { checkUpdate, applyUpdate, scheduleRestart };
