import { app, BrowserWindow } from 'electron';
import {
    main,
    gracefulShutdown
} from './index.js'
let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Cargar una URL externa (como Google)
  mainWindow.loadURL('http://localhost:3000/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};


app.whenReady().then(()=>{
  createWindow();
  main().catch(async err => {
      console.error("[MAIN] ❌ Error no manejado en la ejecución principal:", err);
  });
});
app.on('window-all-closed', () => {
  gracefulShutdown();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
