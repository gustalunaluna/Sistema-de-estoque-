const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

// ── Settings file (stores user preferences like data path) ──────────────────
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

ipcMain.handle('get-data-path', () => {
  return getDataPath();
});

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

  // Copy existing data to new location
  try {
    if (fs.existsSync(oldPath)) {
      fs.copyFileSync(oldPath, newPath);
    }
  } catch (err) {
    console.error('Failed to copy data:', err);
  }

  // Save new setting
  const settings = loadSettings();
  settings.dataDir = newDir;
  saveSettings(settings);

  // Notify renderer
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
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ── Window ────────────────────────────────────────────────────────────────────
let mainWindow;

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
      devTools: isDev,
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
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

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
