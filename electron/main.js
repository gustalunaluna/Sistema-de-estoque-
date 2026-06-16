const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const isDev = process.env.NODE_ENV === 'development';

// ── Logging to file (helps diagnose issues in production) ────────────────────
const logPath = path.join(app.getPath('userData'), 'fabricaerp-log.txt');

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  console.log(...args);
  try { fs.appendFileSync(logPath, line); } catch (_) {}
}

// Clear log on startup (keep only last session)
try { fs.writeFileSync(logPath, `=== FabricaERP iniciado em ${new Date().toISOString()} ===\n`); } catch (_) {}

// ── Resolve the dist/index.html path reliably ────────────────────────────────
// app.getAppPath() is the most reliable cross-platform way:
//   Dev:      <project root>
//   Packaged (asar:false): <install>\resources\app
//   Packaged (asar:true):  <install>\resources\app.asar
function resolveDistIndex() {
  const candidates = [
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(process.resourcesPath || '', 'app', 'dist', 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
  ];

  log('Procurando index.html...');
  for (const p of candidates) {
    const exists = fs.existsSync(p);
    log(`  ${exists ? '✓' : '✗'} ${p}`);
    if (exists) return p;
  }
  log('ERRO: index.html não encontrado em nenhum caminho candidato!');
  return candidates[0]; // return anyway so error handling can show the path
}

const DIST_INDEX = isDev
  ? path.join(__dirname, '..', 'dist', 'index.html')
  : resolveDistIndex();

log('isDev:', isDev);
log('DIST_INDEX:', DIST_INDEX);
log('DIST_INDEX existe:', fs.existsSync(DIST_INDEX));

// ── Settings ─────────────────────────────────────────────────────────────────
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch (_) {}
  return {};
}

function saveSettings(settings) {
  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) { log('Erro ao salvar settings:', err); }
}

// ── Data path ─────────────────────────────────────────────────────────────────
const DEFAULT_DATA_DIR = app.getPath('userData');
const DATA_FILENAME = 'fabrica-erp-data.json';

function getDataPath() {
  const settings = loadSettings();
  return path.join(settings.dataDir || DEFAULT_DATA_DIR, DATA_FILENAME);
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('save-data', (_event, data) => {
  try {
    const p = getDataPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, data, 'utf-8');
    return { ok: true };
  } catch (err) {
    log('Erro save-data:', err);
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('load-data', () => {
  try {
    const p = getDataPath();
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
    return null;
  } catch (err) {
    log('Erro load-data:', err);
    return null;
  }
});

ipcMain.handle('get-data-path', () => getDataPath());

ipcMain.handle('choose-data-dir', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    title: 'Escolher pasta para salvar os dados',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: path.dirname(getDataPath()),
    buttonLabel: 'Salvar dados aqui',
  });
  if (result.canceled || !result.filePaths.length) return null;

  const newDir = result.filePaths[0];
  const oldPath = getDataPath();
  const newPath = path.join(newDir, DATA_FILENAME);
  try { if (fs.existsSync(oldPath)) fs.copyFileSync(oldPath, newPath); } catch (_) {}

  const settings = loadSettings();
  settings.dataDir = newDir;
  saveSettings(settings);
  win.webContents.send('data-path-changed', newPath);
  return newPath;
});

ipcMain.handle('set-data-path', (_event, newDir) => {
  const s = loadSettings(); s.dataDir = newDir; saveSettings(s); return getDataPath();
});

ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('open-in-explorer', (_event, filePath) => shell.showItemInFolder(filePath));

// ── Menu ─────────────────────────────────────────────────────────────────────
let mainWindow;

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Sair', accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar (F5)' },
        { role: 'forceReload', label: 'Recarregar forçado' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { role: 'resetZoom', label: 'Zoom Padrão' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info', title: 'FabricaERP', message: 'FabricaERP v1.0.0',
            detail: `Dados: ${getDataPath()}`, buttons: ['OK'],
          }),
        },
        { type: 'separator' },
        {
          label: '🔧 Ferramentas do Desenvolvedor (Ctrl+Shift+I)',
          accelerator: 'Ctrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        {
          label: '📋 Diagnóstico — ver log de erros',
          click: () => {
            const logContent = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8') : 'Log não encontrado.';
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Diagnóstico FabricaERP',
              message: 'Log de inicialização',
              detail: logContent.slice(-3000), // last 3000 chars
              buttons: ['OK', 'Abrir arquivo de log'],
            }).then(r => { if (r.response === 1) shell.openPath(logPath); });
          },
        },
        {
          label: '📁 Abrir pasta de logs',
          click: () => shell.openPath(app.getPath('userData')),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,          // required for preload to work with CommonJS require()
      webSecurity: false,      // allows file:// protocol to load local assets freely
      preload: path.join(__dirname, 'preload.js'),
      devTools: true,
    },
    title: 'FabricaERP',
    backgroundColor: '#f1f5f9',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  createMenu();

  // Capture renderer console messages to log file
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) { // warn=2, error=3
      log(`[RENDERER ${level === 3 ? 'ERROR' : 'WARN'}] ${message} (${sourceId}:${line})`);
    }
  });

  // Catch network/file load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return; // ERR_ABORTED – user reloaded, ignore
    log(`did-fail-load: ${errorCode} ${errorDescription} url=${validatedURL}`);

    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Erro ao carregar',
      message: `Não foi possível carregar: ${errorDescription} (${errorCode})`,
      detail: [
        `URL: ${validatedURL}`,
        `Arquivo HTML: ${DIST_INDEX}`,
        `Existe: ${fs.existsSync(DIST_INDEX)}`,
        '',
        'Veja o log completo em: Ajuda > Diagnóstico',
      ].join('\n'),
      buttons: ['OK'],
    });
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    log('Janela exibida com sucesso.');
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // ── Load the app ────────────────────────────────────────────────────────────
  if (isDev) {
    log('Modo dev: carregando localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    if (!fs.existsSync(DIST_INDEX)) {
      log('ERRO FATAL: index.html não encontrado:', DIST_INDEX);
      mainWindow.show();
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Instalação incompleta',
        message: 'Os arquivos do sistema não foram encontrados.',
        detail: [
          `Esperado: ${DIST_INDEX}`,
          '',
          'Solução: Reinstale o aplicativo ou contacte o suporte.',
          '',
          `Log salvo em: ${logPath}`,
        ].join('\n'),
        buttons: ['OK'],
      });
      return;
    }

    const fileUrl = pathToFileURL(DIST_INDEX).href;
    log('Carregando URL:', fileUrl);
    mainWindow.loadURL(fileUrl).catch(err => {
      log('loadURL falhou:', err.message);
      // Fallback: try loadFile
      log('Tentando loadFile como fallback...');
      mainWindow.loadFile(DIST_INDEX).catch(err2 => {
        log('loadFile também falhou:', err2.message);
        dialog.showMessageBox(mainWindow, {
          type: 'error',
          title: 'Erro ao iniciar',
          message: 'Erro ao carregar o aplicativo.',
          detail: `${err2.message}\n\nArquivo: ${DIST_INDEX}\nLog: ${logPath}`,
          buttons: ['OK'],
        });
      });
    });
  }
}

app.whenReady().then(() => {
  log('app.whenReady — Electron', process.versions.electron, '/ Chrome', process.versions.chrome);
  log('userData:', app.getPath('userData'));
  log('execPath:', process.execPath);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
