const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exportarFichaExcel, buildFilename } = require('./export-ficha');

const app = express();
const PORT = Number(process.env.PORT || 3000);

// ── Paths ─────────────────────────────────────────────────────────────────────
const SETTINGS_FILE = path.join(os.homedir(), '.fabricaerp', 'settings.json');
const DEFAULT_DATA_DIR = path.join(os.homedir(), 'FabricaERP');
const DATA_FILENAME = 'fabrica-erp-data.json';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// ── Settings helpers ──────────────────────────────────────────────────────────
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch (_) {}
  return {};
}

function saveSettings(s) {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar configurações:', err.message);
  }
}

function getDataPath() {
  const dir = loadSettings().dataDir || DEFAULT_DATA_DIR;
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
  return path.join(dir, DATA_FILENAME);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '100mb' }));

// ── Check dist folder ────────────────────────────────────────────────────────
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error('\n❌ ERRO: A pasta dist/ não foi encontrada!');
  console.error('   Execute o comando abaixo antes de iniciar o servidor:');
  console.error('   npm run build\n');
  process.exit(1);
}

// Serve static React build
app.use(express.static(DIST_DIR));

// ── API ───────────────────────────────────────────────────────────────────────

// Health / info
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    dataFile: getDataPath(),
    version: '1.0.0',
  });
});

// Load data
app.get('/api/data', (req, res) => {
  try {
    const p = getDataPath();
    const data = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Erro ao ler dados:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Save data
app.post('/api/data', (req, res) => {
  try {
    const { data } = req.body;
    if (typeof data !== 'string') {
      return res.status(400).json({ ok: false, error: 'Campo "data" inválido.' });
    }
    const p = getDataPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, data, 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao salvar dados:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get data directory setting
app.get('/api/settings/datadir', (req, res) => {
  res.json({
    dataDir: loadSettings().dataDir || DEFAULT_DATA_DIR,
    dataFile: getDataPath(),
  });
});

// Change data directory
app.post('/api/settings/datadir', (req, res) => {
  try {
    const { dataDir } = req.body;
    if (!dataDir || typeof dataDir !== 'string') {
      return res.status(400).json({ ok: false, error: 'dataDir inválido.' });
    }
    const oldPath = getDataPath();
    const settings = loadSettings();
    settings.dataDir = dataDir;
    saveSettings(settings);
    const newPath = getDataPath();
    if (fs.existsSync(oldPath) && oldPath !== newPath) {
      fs.copyFileSync(oldPath, newPath);
    }
    res.json({ ok: true, dataFile: newPath });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Export Ficha Técnica (template-based Excel) ───────────────────────────────
app.post('/api/export-ficha', async (req, res) => {
  try {
    const { ficha, modelo, insumos, versao } = req.body;
    if (!ficha || !modelo) return res.status(400).json({ ok: false, error: 'Dados insuficientes.' });
    const v = versao || 1;
    const buffer = await exportarFichaExcel({ ficha, modelo, insumos: insumos || [], versao: v });
    const filename = buildFilename(modelo, v);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Erro ao exportar ficha:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// All other routes → serve React app (handles React Router client-side navigation)
app.use((req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  // Discover local network IPs
  const nets = os.networkInterfaces();
  const ips = [];
  for (const iface of Object.values(nets)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address);
    }
  }

  const sep = '─'.repeat(48);
  console.log(`\n┌${sep}┐`);
  console.log(`│  FabricaERP  —  Sistema de Gestão Industrial  │`);
  console.log(`├${sep}┤`);
  console.log(`│  ✅  Servidor iniciado com sucesso!            │`);
  console.log(`├${sep}┤`);
  console.log(`│  Acesso neste computador:                      │`);
  console.log(`│    http://localhost:${PORT}                        │`);
  if (ips.length > 0) {
    console.log(`│                                                │`);
    console.log(`│  Acesso de OUTROS computadores da rede:        │`);
    ips.forEach(ip => {
      const entry = `    http://${ip}:${PORT}`;
      console.log(`│  ${entry.padEnd(46)}│`);
    });
  }
  console.log(`├${sep}┤`);
  console.log(`│  📁 Dados salvos em:                           │`);
  const dp = getDataPath();
  const dpShort = dp.length > 44 ? '...' + dp.slice(-41) : dp;
  console.log(`│    ${dpShort.padEnd(44)}│`);
  console.log(`├${sep}┤`);
  console.log(`│  Pressione Ctrl+C para encerrar o servidor     │`);
  console.log(`└${sep}┘\n`);
});
