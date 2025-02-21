// main.js
import { app, BrowserWindow } from 'electron';
import './src/index.js';

function createWindow() {
  // Crea la ventana principal de Electron
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      // Dependiendo de tus necesidades, puedes ajustar estas opciones:
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Carga la URL donde se está ejecutando el servidor Express
  win.loadURL('http://localhost:3000');

  // Opcional: abre las herramientas de desarrollador
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {

    createWindow();
});

// Cuando se cierren todas las ventanas, finaliza la aplicación
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
