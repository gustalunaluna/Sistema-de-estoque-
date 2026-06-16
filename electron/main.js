const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const isDev = process.env.NODE_ENV === 'development';

// ── Logging ───────────────────────────────────────────────────────────────────
const logPath = path.join(app.getPath('userData'), 'erp-log.txt');

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  console.log(...args);
  try { fs.appendFileSync(logPath, line); } catch (_) {}
}

try { fs.writeFileSync(logPath, `=== ERP iniciado em ${new Date().toISOString()} ===\n`); } catch (_) {}

// ── Resolve dist/index.html ───────────────────────────────────────────────────
function resolveDistIndex() {
  const candidates = [
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(process.resourcesPath || '', 'app', 'dist', 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
  ];
  for (const p of candidates) {
    const exists = fs.existsSync(p);
    log(`  ${exists ? '✓' : '✗'} ${p}`);
    if (exists) return p;
  }
  return candidates[0];
}

const DIST_INDEX = isDev
  ? path.join(__dirname, '..', 'dist', 'index.html')
  : resolveDistIndex();

log('isDev:', isDev, '| DIST_INDEX:', DIST_INDEX);

// ── Settings (stored in Electron userData, never changes) ─────────────────────
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch (_) {}
  return {};
}

function saveSettings(s) {
  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2), 'utf-8');
  } catch (err) { log('Erro ao salvar settings:', err.message); }
}

// ── ERP Folder Structure ───────────────────────────────────────────────────────
// Default: ~/ERP_DADOS  — user can change in Configurações
const DEFAULT_ERP_ROOT = path.join(app.getPath('home'), 'ERP_DADOS');

function getErpRoot() {
  return loadSettings().erpRoot || DEFAULT_ERP_ROOT;
}

function getDbPath() {
  return path.join(getErpRoot(), 'database', 'sistema.json');
}

function getBackupsDir() {
  return path.join(getErpRoot(), 'backups');
}

function ensureFolderStructure(root) {
  const dirs = [
    path.join(root, 'database'),
    path.join(root, 'backups'),
    path.join(root, 'arquivos', 'imagens_produtos'),
    path.join(root, 'arquivos', 'documentos'),
    path.join(root, 'configuracoes'),
  ];
  for (const d of dirs) {
    try { fs.mkdirSync(d, { recursive: true }); } catch (_) {}
  }
  log('Estrutura de pastas criada em:', root);
}

// ── Auto-backup on startup ────────────────────────────────────────────────────
function doAutoBackup() {
  const settings = loadSettings();
  if (!settings.autoBackup) return;
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) return;
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    const backupFile = path.join(getBackupsDir(), `ERP_backup_${stamp}.json`);
    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(dbPath, backupFile);
      log('Auto-backup criado:', backupFile);
    }
  } catch (err) { log('Erro no auto-backup:', err.message); }
}

// ── IPC: data persistence ─────────────────────────────────────────────────────
ipcMain.handle('save-data', (_event, data) => {
  try {
    const p = getDbPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, data, 'utf-8');
    return { ok: true };
  } catch (err) {
    log('Erro save-data:', err.message);
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('load-data', () => {
  try {
    const p = getDbPath();
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
    return null;
  } catch (err) {
    log('Erro load-data:', err.message);
    return null;
  }
});

ipcMain.handle('get-data-path', () => getDbPath());
ipcMain.handle('get-erp-root', () => getErpRoot());

// ── IPC: change storage location ──────────────────────────────────────────────
ipcMain.handle('choose-data-dir', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    title: 'Escolher pasta raiz dos dados ERP',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: getErpRoot(),
    buttonLabel: 'Usar esta pasta',
  });
  if (result.canceled || !result.filePaths.length) return null;

  const newRoot = result.filePaths[0];
  const oldDb = getDbPath();

  // Ensure new structure, then migrate data file if it exists
  ensureFolderStructure(newRoot);
  const newDb = path.join(newRoot, 'database', 'sistema.json');
  if (fs.existsSync(oldDb) && oldDb !== newDb) {
    try { fs.copyFileSync(oldDb, newDb); } catch (_) {}
  }

  const settings = loadSettings();
  settings.erpRoot = newRoot;
  saveSettings(settings);

  win.webContents.send('data-path-changed', newDb);
  log('Pasta ERP alterada para:', newRoot);
  return newRoot;
});

ipcMain.handle('set-data-path', (_event, newRoot) => {
  const s = loadSettings(); s.erpRoot = newRoot; saveSettings(s);
  ensureFolderStructure(newRoot);
  return getDbPath();
});

// ── IPC: backup ───────────────────────────────────────────────────────────────
ipcMain.handle('create-backup', async (event) => {
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      return { ok: false, error: 'Nenhum dado encontrado para fazer backup.' };
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      '_',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
    ].join('').replace('_', '_');

    const defaultName = `ERP_backup_${stamp}.json`;
    const result = await dialog.showSaveDialog(win, {
      title: 'Salvar backup',
      defaultPath: path.join(getBackupsDir(), defaultName),
      filters: [{ name: 'Backup ERP', extensions: ['json'] }],
      buttonLabel: 'Salvar backup',
    });
    if (result.canceled || !result.filePath) return { ok: false, error: 'Cancelado.' };

    fs.mkdirSync(path.dirname(result.filePath), { recursive: true });
    fs.copyFileSync(dbPath, result.filePath);
    log('Backup criado:', result.filePath);
    return { ok: true, filePath: result.filePath };
  } catch (err) {
    log('Erro create-backup:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('create-backup-auto', () => {
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) return { ok: false, error: 'Sem dados.' };

    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
    ].join('-');

    const backupDir = getBackupsDir();
    fs.mkdirSync(backupDir, { recursive: true });
    const dest = path.join(backupDir, `ERP_backup_${stamp}.json`);
    fs.copyFileSync(dbPath, dest);
    log('Backup automático criado:', dest);
    return { ok: true, filePath: dest, filename: path.basename(dest) };
  } catch (err) {
    log('Erro create-backup-auto:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('list-backups', () => {
  try {
    const dir = getBackupsDir();
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json') || f.endsWith('.db'))
      .map(f => {
        const stat = fs.statSync(path.join(dir, f));
        return { filename: f, size: stat.size, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime); // newest first
    return files;
  } catch (err) {
    log('Erro list-backups:', err.message);
    return [];
  }
});

ipcMain.handle('restore-backup', async (event, filename) => {
  try {
    const backupPath = filename.includes(path.sep) || filename.includes('/')
      ? filename  // full path provided
      : path.join(getBackupsDir(), filename);

    if (!fs.existsSync(backupPath)) {
      return { ok: false, error: 'Arquivo de backup não encontrado.' };
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    const choice = await dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Restaurar Backup',
      message: `Restaurar o backup "${path.basename(backupPath)}"?`,
      detail: 'Os dados atuais serão substituídos pelos dados do backup.\nEsta ação não pode ser desfeita.',
      buttons: ['Restaurar', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
    });
    if (choice.response !== 0) return { ok: false, error: 'Cancelado.' };

    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.copyFileSync(backupPath, dbPath);
    log('Backup restaurado:', backupPath);
    return { ok: true };
  } catch (err) {
    log('Erro restore-backup:', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('open-backups-folder', () => {
  const dir = getBackupsDir();
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
  shell.openPath(dir);
});

ipcMain.handle('choose-restore-file', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    title: 'Selecionar backup para restaurar',
    defaultPath: getBackupsDir(),
    filters: [{ name: 'Backup ERP', extensions: ['json', 'db'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// ── IPC: auto-backup setting ──────────────────────────────────────────────────
ipcMain.handle('get-auto-backup', () => !!loadSettings().autoBackup);
ipcMain.handle('set-auto-backup', (_event, enabled) => {
  const s = loadSettings(); s.autoBackup = !!enabled; saveSettings(s);
  return s.autoBackup;
});

// ── IPC: misc ────────────────────────────────────────────────────────────────
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('open-in-explorer', (_event, filePath) => shell.showItemInFolder(filePath));

// ── Menu ──────────────────────────────────────────────────────────────────────
let mainWindow;

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Backup dos Dados',
          accelerator: 'Ctrl+B',
          click: () => mainWindow?.webContents.send('trigger-backup'),
        },
        { type: 'separator' },
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
        { role: 'resetZoom', label: 'Zoom Padrão (Ctrl+0)' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Sistema ERP de Gestão Industrial',
            message: 'Sistema ERP de Gestão Industrial v1.0.0',
            detail: [
              `Pasta de dados: ${getErpRoot()}`,
              `Banco de dados: ${getDbPath()}`,
              `Backups: ${getBackupsDir()}`,
            ].join('\n'),
            buttons: ['OK'],
          }),
        },
        { type: 'separator' },
        {
          label: 'Abrir pasta de dados',
          click: () => shell.openPath(getErpRoot()),
        },
        {
          label: 'Abrir pasta de backups',
          click: () => { try { fs.mkdirSync(getBackupsDir(), { recursive: true }); } catch (_) {} shell.openPath(getBackupsDir()); },
        },
        { type: 'separator' },
        {
          label: 'Ferramentas do Desenvolvedor',
          accelerator: 'Ctrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        {
          label: 'Ver log de erros',
          click: () => {
            const content = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8') : 'Log vazio.';
            dialog.showMessageBox(mainWindow, {
              type: 'info', title: 'Log ERP',
              message: 'Log de inicialização',
              detail: content.slice(-3000),
              buttons: ['OK', 'Abrir arquivo'],
            }).then(r => { if (r.response === 1) shell.openPath(logPath); });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true,
    },
    title: 'Sistema ERP de Gestão Industrial',
    backgroundColor: '#f1f5f9',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  try {
    const iconPath = path.join(app.getAppPath(), 'public', 'icon.png');
    if (fs.existsSync(iconPath)) {
      const { nativeImage } = require('electron');
      mainWindow.setIcon(nativeImage.createFromPath(iconPath));
    }
  } catch (_) {}

  createMenu();

  mainWindow.webContents.on('console-message', (_e, level, msg, line, src) => {
    if (level >= 2) log(`[RENDERER ${level === 3 ? 'ERROR' : 'WARN'}] ${msg} (${src}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    if (code === -3) return;
    log(`did-fail-load: ${code} ${desc} url=${url}`);
    dialog.showMessageBox(mainWindow, {
      type: 'error', title: 'Erro ao carregar',
      message: `Não foi possível carregar: ${desc} (${code})`,
      detail: `URL: ${url}\nArquivo: ${DIST_INDEX}\nExiste: ${fs.existsSync(DIST_INDEX)}\n\nVeja: Ajuda > Ver log de erros`,
      buttons: ['OK'],
    });
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    log('Janela exibida.');
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  if (isDev) {
    log('Dev mode: carregando localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    if (!fs.existsSync(DIST_INDEX)) {
      log('ERRO FATAL: index.html não encontrado:', DIST_INDEX);
      mainWindow.show();
      dialog.showMessageBox(mainWindow, {
        type: 'error', title: 'Instalação incompleta',
        message: 'Os arquivos do sistema não foram encontrados.',
        detail: `Esperado: ${DIST_INDEX}\n\nSolução: Reinstale o aplicativo.\nLog: ${logPath}`,
        buttons: ['OK'],
      });
      return;
    }

    const fileUrl = pathToFileURL(DIST_INDEX).href;
    log('Carregando:', fileUrl);
    mainWindow.loadURL(fileUrl).catch(err => {
      log('loadURL falhou:', err.message, '— tentando loadFile...');
      mainWindow.loadFile(DIST_INDEX).catch(err2 => {
        log('loadFile falhou:', err2.message);
        dialog.showMessageBox(mainWindow, {
          type: 'error', title: 'Erro ao iniciar',
          message: 'Erro ao carregar o aplicativo.',
          detail: `${err2.message}\n\nArquivo: ${DIST_INDEX}\nLog: ${logPath}`,
          buttons: ['OK'],
        });
      });
    });
  }
}

// ── Start ────────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  log('app.whenReady — Electron', process.versions.electron);
  log('userData:', app.getPath('userData'));

  ensureFolderStructure(getErpRoot());
  doAutoBackup();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
