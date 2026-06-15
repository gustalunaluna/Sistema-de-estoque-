const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

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
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre o FabricaERP',
              message: 'FabricaERP v1.0.0',
              detail: 'Sistema de gestão para fábrica de bolsas e acessórios.\n\nDesenvolvido para controle de estoque, fichas técnicas e produção.',
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1350,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
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
