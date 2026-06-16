const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

// Root path of the app — reliable both in dev and in packaged .exe
const APP_ROOT = isDev
  ? path.join(__dirname, '..')           // project root in dev
  : path.join(process.resourcesPath, 'app'); // resources/app/ in packaged build

const DIST_INDEX = path.join(APP_ROOT, 'dist', 'index.html');

// ── Settings file ────────────────────────────────────────────────────────────
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (_) {}
  return {};
}

function saveSettings(settings) {
  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// ── Data file path management ────────────────────────────────────────────────
const DEFAULT_DATA_DIR = app.getPath('userData');
const DATA_FILENAME = 'fabrica-erp-data.json';

function getDataPath() {
  const settings = loadSettings();
  return path.join(settings.dataDir || DEFAULT_DATA_DIR, DATA_FILENAME);
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('save-data', (_event, data) => {
  try {
    const dataPath = getDataPath();
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, data, 'utf-8');
    return { ok: true };
  } catch (err) {
    console.error('Failed to save data:', err);
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('load-data', () => {
  try {
    const dataPath = getDataPath();
    if (fs.existsSync(dataPath)) {
      return fs.readFileSync(dataPath, 'utf-8');
    }
    return null;
  } catch (err) {
    console.error('Failed to load data:', err);
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

  try {
    if (fs.existsSync(oldPath)) fs.copyFileSync(oldPath, newPath);
  } catch (err) {
    console.error('Failed to copy data:', err);
  }

  const settings = loadSettings();
  settings.dataDir = newDir;
  saveSettings(settings);
  win.webContents.send('data-path-changed', newPath);
  return newPath;
});

ipcMain.handle('set-data-path', (_event, newDir) => {
  const settings = loadSettings();
  settings.dataDir = newDir;
  saveSettings(settings);
  return getDataPath();
});

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('open-in-explorer', (_event, filePath) => {
  shell.showItemInFolder(filePath);
});

// ── Menu ─────────────────────────────────────────────────────────────────────
function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
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
          label: 'Sobre o FabricaERP',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre o FabricaERP',
              message: 'FabricaERP v1.0.0',
              detail: `Sistema de gestão para fábrica de bolsas e acessórios.\n\nDados salvos em:\n${getDataPath()}`,
              buttons: ['OK'],
            });
          },
        },
        { type: 'separator' },
        {
          label: 'Ferramentas do Desenvolvedor',
          accelerator: 'Ctrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        {
          label: 'Diagnóstico — Caminhos',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Diagnóstico',
              message: 'Informações do aplicativo',
              detail: [
                `Versão: ${app.getVersion()}`,
                `Modo: ${isDev ? 'Desenvolvimento' : 'Produção'}`,
                `Pasta do app: ${APP_ROOT}`,
                `Arquivo HTML: ${DIST_INDEX}`,
                `HTML existe: ${fs.existsSync(DIST_INDEX)}`,
                `Dados em: ${getDataPath()}`,
                `userData: ${app.getPath('userData')}`,
                `resourcesPath: ${process.resourcesPath}`,
              ].join('\n'),
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ── Window ────────────────────────────────────────────────────────────────────
let mainWindow;

function showLoadError(detail) {
  dialog.showMessageBox({
    type: 'error',
    title: 'FabricaERP — Erro ao carregar',
    message: 'Não foi possível carregar o sistema.',
    detail: [
      detail,
      '',
      `Caminho esperado: ${DIST_INDEX}`,
      `Arquivo existe: ${fs.existsSync(DIST_INDEX)}`,
      '',
      'Solução: Abra o menu Ajuda > Ferramentas do Desenvolvedor (Ctrl+Shift+I)',
      'para ver detalhes do erro no Console.',
    ].join('\n'),
    buttons: ['OK'],
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true, // always allow, opened via Ctrl+Shift+I
    },
    title: 'FabricaERP',
    backgroundColor: '#f1f5f9',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  createMenu();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Verify file exists before loading
    if (!fs.existsSync(DIST_INDEX)) {
      mainWindow.show();
      showLoadError('O arquivo index.html não foi encontrado. A instalação pode estar corrompida.');
      return;
    }

    mainWindow.loadFile(DIST_INDEX).catch(err => {
      console.error('loadFile failed:', err);
      showLoadError(`Erro ao carregar arquivo: ${err.message}`);
    });
  }

  // Catch failed loads (wrong path, CSP errors, etc.)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // -3 = ERR_ABORTED (user navigated away / reload), ignore
    if (errorCode === -3) return;
    console.error('did-fail-load:', errorCode, errorDescription, validatedURL);
    showLoadError(`Erro ${errorCode}: ${errorDescription}\nURL: ${validatedURL}`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
