// src/modules/ConfigManager.js
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_CONFIG = {
  stopCommand: "stop",
  onError: "restart", // 'restart' o 'do_nothing'
  periodicRestart: {
    enabled: true,
    schedule: "0 4 * * *", // Cron format: 4 AM every day
    preRestartCommands: [
      "say Server restarting in 5 minutes!",
      "save-all"
    ]
  },
  periodicBackup: {
    enabled: false,
    schedule: "0 5 * * *" // Cron format: 5 AM every day
  }
};

class ConfigManager {
  /**
   * Carga la configuración para un servidor. Si no existe, la crea.
   * @param {string} serverFolderPath - La ruta a la carpeta del servidor.
   * @returns {Promise<object>} La configuración del servidor.
   */
  static async loadConfig(serverFolderPath) {
    const configPath = path.join(serverFolderPath, 'config.json');
    try {
      // Intentamos leer el archivo existente
      const fileContent = await fs.readFile(configPath, 'utf8');
      const userConfig = JSON.parse(fileContent);
      // Fusionamos la configuración del usuario con la por defecto para asegurar que todas las claves existan
      // Nota: Esto es una fusión superficial. Para una anidada, se necesitaría una función de 'deep merge'.
      return {
        ...DEFAULT_CONFIG,
        ...userConfig,
        periodicRestart: { ...DEFAULT_CONFIG.periodicRestart, ...userConfig.periodicRestart },
        periodicBackup: { ...DEFAULT_CONFIG.periodicBackup, ...userConfig.periodicBackup }
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // El archivo no existe, lo creamos con la configuración por defecto
        console.log(`No se encontró config.json para ${path.basename(serverFolderPath)}. Creando uno nuevo.`);
        await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
        return DEFAULT_CONFIG;
      }
      // Otro error de lectura o parseo
      console.error(`Error al cargar o parsear config.json en ${serverFolderPath}:`, error);
      // Devolvemos la configuración por defecto como fallback seguro
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Guarda la configuración de un servidor.
   * @param {string} serverFolderPath 
   * @param {object} config 
   */
  static async saveConfig(serverFolderPath, config) {
    const configPath = path.join(serverFolderPath, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
  }
}

export { ConfigManager, DEFAULT_CONFIG };