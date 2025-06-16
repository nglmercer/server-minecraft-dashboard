import {
  compressFolder,
  decompressFolder,
  getFolderDetails,
  deletePath,
  StorageManager,
  PathUtils,
  function_with_error_handling,
  serverPathBase,
  backupPathBase
} from '../fileutils.js';
import fs from 'node:fs';
import path from 'node:path';
// ✅ Importar AdmZip al inicio del archivo
import AdmZip from 'adm-zip';

class BackupManager {
  constructor() {
    this.backupsData = new StorageManager("backups.json", "./data");
    
    // Archivos/carpetas que típicamente causan problemas en servidores de Minecraft
    this.problematicFiles = [
      'logs/latest.log',
      'logs/debug.log',
      'session.lock',
      'usercache.json',
      'usernamecache.json',
      '.tmp',
      'crash-reports',
      'logs/*.log.gz',
      'logs/*.log.lck',
      'world/session.lock',
      '**/session.lock',
      'world/data/raids.dat_old',
      'world/data/raids.dat_new',
      '**/level.dat_old',
      '**/level.dat_new',
      'world/**/region/*.mca.tmp*',
      'world/**/entities/*.mca.tmp*',
      'world/**/poi/*.mca.tmp*'
    ];

    // Configuración por defecto para backups
    this.backupConfig = {
      retryAttempts: 3,
      retryDelay: 2000, // 2 segundos - más tiempo entre reintentos
      useZip: true, // Cambiar a ZIP por defecto para mejor manejo de archivos bloqueados
      excludeProblematicFiles: true,
      copyBeforeCompress: true, // Activar por defecto para evitar problemas
      stopServerForBackup: false // Para implementar parada automática
    };
  }

  // Función para sanitizar nombres de archivos
  static sanitizeFilename(filename) {
    let sanitized = filename
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^\.+|\.+$/g, '')
      .replace(/_{2,}/g, '_');

    if (sanitized === '') {
      sanitized = 'backup';
    }

    return sanitized;
  }

  // Verificar si un archivo está bloqueado
  async isFileLocked(filePath) {
    try {
      // Primero verificar si el archivo existe
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      // Intentar abrir el archivo para lectura
      const fd = await fs.promises.open(filePath, 'r');
      await fd.close();
      return false;
    } catch (error) {
      if (error.code === 'EBUSY' || error.code === 'EPERM' || error.code === 'EACCES') {
        return true;
      }
      // Para otros errores, asumir que no está bloqueado
      return false;
    }
  }

  // Verificar si el servidor está ejecutándose (método básico)
  async isServerRunning(serverPath) {
    try {
      const sessionLockPath = path.join(serverPath, 'session.lock');
      const worldSessionLockPath = path.join(serverPath, 'world', 'session.lock');
      
      const hasSessionLock = fs.existsSync(sessionLockPath);
      const hasWorldSessionLock = fs.existsSync(worldSessionLockPath);
      
      if (hasSessionLock) {
        const isLocked = await this.isFileLocked(sessionLockPath);
        if (isLocked) return true;
      }
      
      if (hasWorldSessionLock) {
        const isLocked = await this.isFileLocked(worldSessionLockPath);
        if (isLocked) return true;
      }
      
      return false;
    } catch (error) {
      console.warn('No se pudo determinar si el servidor está ejecutándose:', error.message);
      return false;
    }
  }

  // Verificar si hay archivos bloqueados en el directorio
  async hasLockedFiles(dirPath) {
    try {
      const checkFiles = [
        'session.lock',
        'world/session.lock',
        'logs/latest.log',
        'usercache.json'
      ];
      
      for (const file of checkFiles) {
        const filePath = path.join(dirPath, file);
        if (fs.existsSync(filePath)) {
          const isLocked = await this.isFileLocked(filePath);
          if (isLocked) {
            console.log(`📝 Archivo bloqueado detectado: ${file}`);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.warn('Error verificando archivos bloqueados:', error.message);
      return true; // Asumir que hay archivos bloqueados por seguridad
    }
  }

  // Crear copia temporal con mejor manejo de archivos bloqueados
  async createTempCopyWithSkip(sourcePath, tempPath) {
    try {
      await fs.promises.mkdir(tempPath, { recursive: true });
      
      const copyRecursive = async (src, dest) => {
        let stats;
        try {
          stats = await fs.promises.stat(src);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.warn(`Archivo no encontrado, saltando: ${path.relative(sourcePath, src)}`);
            return;
          }
          throw error;
        }
        
        if (stats.isDirectory()) {
          await fs.promises.mkdir(dest, { recursive: true });
          
          let entries;
          try {
            entries = await fs.promises.readdir(src);
          } catch (error) {
            if (error.code === 'EBUSY' || error.code === 'EPERM' || error.code === 'EACCES') {
              console.warn(`Directorio bloqueado, saltando: ${path.relative(sourcePath, src)}`);
              return;
            }
            throw error;
          }
          
          for (const entry of entries) {
            const srcPath = path.join(src, entry);
            const destPath = path.join(dest, entry);
            
            // Verificar si el archivo/carpeta debe ser excluido
            const relativePath = path.relative(sourcePath, srcPath);
            if (this.shouldExcludeFile(relativePath)) {
              console.log(`Excluyendo: ${relativePath}`);
              continue;
            }
            
            // Verificar si el archivo está bloqueado antes de intentar copiarlo
            try {
              const isLocked = await this.isFileLocked(srcPath);
              if (isLocked) {
                console.warn(`Archivo bloqueado, saltando: ${relativePath}`);
                continue;
              }
            } catch (lockError) {
              // Si no podemos verificar el lock, intentar copiar anyway
            }
            
            try {
              await copyRecursive(srcPath, destPath);
            } catch (error) {
              if (error.code === 'EBUSY' || error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOENT') {
                console.warn(`Error copiando archivo, saltando: ${relativePath} - ${error.message}`);
                continue;
              }
              throw error;
            }
          }
        } else {
          // Verificar si el archivo está bloqueado
          const isLocked = await this.isFileLocked(src);
          if (isLocked) {
            console.warn(`Archivo bloqueado, saltando: ${path.relative(sourcePath, src)}`);
            return;
          }
          
          try {
            await fs.promises.copyFile(src, dest);
          } catch (error) {
            if (error.code === 'EBUSY' || error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOENT') {
              console.warn(`No se pudo copiar archivo: ${path.relative(sourcePath, src)} - ${error.message}`);
              return;
            }
            throw error;
          }
        }
      };
      
      await copyRecursive(sourcePath, tempPath);
      return tempPath;
    } catch (error) {
      // Limpiar en caso de error
      try {
        await fs.promises.rm(tempPath, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Error limpiando copia temporal:', cleanupError.message);
      }
      throw error;
    }
  }

  // Verificar si un archivo debe ser excluido
  shouldExcludeFile(relativePath) {
    if (!this.backupConfig.excludeProblematicFiles) return false;
    
    return this.problematicFiles.some(pattern => {
      if (pattern.includes('*')) {
        // Convertir patrón glob a regex básico
        const regexPattern = pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/\\\\]*')
          .replace(/\./g, '\\.');
        
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(relativePath);
      } else {
        return relativePath.toLowerCase().includes(pattern.toLowerCase());
      }
    });
  }

  // Crear backup con manejo de errores mejorado
  async createBackup(folderName, outputFilename = null, options = {}) {
    const config = { ...this.backupConfig, ...options };
    const sanitizedFolderName = BackupManager.sanitizeFilename(folderName);
    const sanitizedOutputFilename = outputFilename 
      ? BackupManager.sanitizeFilename(outputFilename) 
      : `${sanitizedFolderName}.tar.gz`;
    
    const verifyFilename = sanitizedOutputFilename.endsWith('.tar.gz') 
      ? sanitizedOutputFilename 
      : `${sanitizedOutputFilename}.tar.gz`;

    const sourcePath = path.join(serverPathBase, sanitizedFolderName);
    
    // Verificar si el servidor está ejecutándose
    const serverRunning = await this.isServerRunning(sourcePath);
    if (serverRunning) {
      console.warn('⚠️  Servidor ejecutándose detectado. Forzando copyBeforeCompress y useZip.');
      config.copyBeforeCompress = true;
      config.useZip = true; // ZIP maneja mejor archivos bloqueados
    }

    let tempPath = null;
    let attempt = 0;
    
    while (attempt < config.retryAttempts) {
      try {
        attempt++;
        console.log(`🔄 Intento ${attempt}/${config.retryAttempts} de backup para ${sanitizedFolderName}`);
        
        let pathToCompress = sourcePath;
        
        // SIEMPRE crear copia temporal si hay archivos bloqueados detectados
        const hasLockedFiles = await this.hasLockedFiles(sourcePath);
        if (config.copyBeforeCompress || serverRunning || hasLockedFiles) {
          console.log('📁 Creando copia temporal del servidor (detectados archivos bloqueados)...');
          tempPath = path.join(process.cwd(), 'temp', `backup_${Date.now()}_${sanitizedFolderName}`);
          pathToCompress = await this.createTempCopyWithSkip(sourcePath, tempPath);
          console.log('✅ Copia temporal creada');
        }

        // Realizar la compresión
        console.log('🗜️  Comprimiendo backup...');
        const result = await this.compressFolderSafe(pathToCompress, verifyFilename, config);
        
        if (result.success) {
          console.log(`✅ Backup creado exitosamente: ${result.data}`);
          await this.updateBackupsList();
          return result.data;
        } else {
          throw new Error(result.error);
        }
        
      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error.message);
        
        // Si es un error de archivo bloqueado, forzar ZIP y copia temporal
        if (error.code === 'EBUSY' || error.message.includes('EBUSY')) {
          console.log('📝 Detectado error EBUSY, cambiando a modo ZIP con copia temporal...');
          config.useZip = true;
          config.copyBeforeCompress = true;
        }
        
        if (attempt < config.retryAttempts) {
          console.log(`⏳ Esperando ${config.retryDelay}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        } else {
          throw new Error(`Backup falló después de ${config.retryAttempts} intentos: ${error.message}`);
        }
      } finally {
        // Limpiar copia temporal
        if (tempPath) {
          try {
            await fs.promises.rm(tempPath, { recursive: true, force: true });
            console.log('🧹 Copia temporal eliminada');
          } catch (cleanupError) {
            console.warn('⚠️  Error limpiando copia temporal:', cleanupError.message);
          }
          tempPath = null;
        }
      }
    }
  }

  // Compresión segura con manejo de archivos bloqueados
  async compressFolderSafe(sourcePath, outputFilename, config) {
    try {
      // Si se especifica usar ZIP en lugar de tar.gz
      if (config.useZip) {
        return await this.createZipBackup(sourcePath, outputFilename);
      } else {
        // Intentar con tar.gz, pero con manejo de errores mejorado
        try {
          return await compressFolder(path.dirname(sourcePath), path.basename(sourcePath), outputFilename);
        } catch (error) {
          if (error.code === 'EBUSY' || error.message.includes('EBUSY')) {
            console.warn('⚠️  Error EBUSY con tar.gz, cambiando a ZIP...');
            return await this.createZipBackup(sourcePath, outputFilename);
          }
          throw error;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  // Crear backup en formato ZIP (alternativa a tar.gz)
  async createZipBackup(sourcePath, outputFilename) {
    // ✅ Ya no necesitamos require aquí, AdmZip está importado arriba
    try {
      const zip = new AdmZip();
      const zipOutputPath = path.join(backupPathBase, outputFilename.replace('.tar.gz', '.zip'));
      
      const addToZip = async (currentPath, zipPath = '') => {
        const stats = await fs.promises.stat(currentPath);
        
        if (stats.isDirectory()) {
          const entries = await fs.promises.readdir(currentPath);
          
          for (const entry of entries) {
            const fullPath = path.join(currentPath, entry);
            const relativePath = path.relative(sourcePath, fullPath);
            
            if (this.shouldExcludeFile(relativePath)) {
              continue;
            }
            
            try {
              await addToZip(fullPath, path.join(zipPath, entry));
            } catch (error) {
              if (error.code === 'EBUSY' || error.code === 'EPERM') {
                console.warn(`Archivo bloqueado, saltando: ${relativePath}`);
                continue;
              }
              throw error;
            }
          }
        } else {
          try {
            const buffer = await fs.promises.readFile(currentPath);
            zip.addFile(zipPath, buffer);
          } catch (error) {
            if (error.code === 'EBUSY' || error.code === 'EPERM') {
              console.warn(`No se pudo leer archivo bloqueado: ${path.relative(sourcePath, currentPath)}`);
              return;
            }
            throw error;
          }
        }
      };
      
      await addToZip(sourcePath);
      zip.writeZip(zipOutputPath);
      
      return { success: true, data: zipOutputPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Obtener información de una carpeta usando fileutils
  async getFolderInfo(folderName) {
    const result = await getFolderDetails(serverPathBase, folderName);
    if (!result.success) {
      console.error('Error obteniendo información de carpeta:', result.error);
      return null;
    }
    return result.data;
  }

  // Actualizar información de carpetas en el almacenamiento
  async updateFolderInfo(folderName = "backups") {
    try {
      const folderInfo = await this.getFolderInfo(folderName);
      if (folderInfo) {
        this.backupsData.JSONset("backups", folderInfo);
        return folderInfo;
      }
    } catch (error) {
      console.error('Error actualizando información de carpeta:', error.message);
    }
    return null;
  }

  // Restaurar backup usando fileutils
  async restoreBackup(filename, outputFolderName = null) {
    try {
      const sanitizedFilename = BackupManager.sanitizeFilename(filename);
      const sanitizedOutputFolder = outputFolderName 
        ? BackupManager.sanitizeFilename(outputFolderName) 
        : sanitizedFilename.replace('.tar.gz', '').replace('.zip', '');

      // Verificar si es ZIP o tar.gz
      if (sanitizedFilename.endsWith('.zip')) {
        return await this.restoreZipBackup(sanitizedFilename, sanitizedOutputFolder);
      } else {
        const result = await decompressFolder(sanitizedFilename, sanitizedOutputFolder);
        
        if (result.success) {
          console.log(`Backup restaurado exitosamente: ${result.data}`);
          await this.updateFolderInfo();
          return result.data;
        } else {
          console.error('Error restaurando backup:', result.error);
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error('Error en restoreBackup:', error);
      throw error;
    }
  }

  // Restaurar backup ZIP
  async restoreZipBackup(filename, outputFolderName) {
    // ✅ Ya no necesitamos require aquí, AdmZip está importado arriba
    try {
      const zipPath = path.join(backupPathBase, filename);
      const outputPath = path.join(serverPathBase, outputFolderName);
      
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(outputPath, true);
      
      console.log(`Backup ZIP restaurado exitosamente: ${outputPath}`);
      await this.updateFolderInfo();
      return outputPath;
    } catch (error) {
      console.error('Error restaurando backup ZIP:', error);
      throw error;
    }
  }

  // Obtener datos de backups
  getBackupsData() {
    return this.updateBackupsList() || this.backupsData.store;
  }

  // Actualizar lista de backups
  async updateBackupsList() {
    try {
      console.log("updateBackupsList");
      const result = await getFolderDetails(backupPathBase, ".");
      console.log("result.data:", result.data);
      if (result.success || result.data) {
        this.backupsData.JSONset("backupsList", result.data);
        return result.data;
      }
    } catch (error) {
      console.error('Error actualizando lista de backups:', error);
    }
    return null;
  }

  // Eliminar backup usando fileutils
  async deleteBackup(filename) {
    try {
      const sanitizedFilename = BackupManager.sanitizeFilename(filename);
      const result = await deletePath(backupPathBase, sanitizedFilename);
      
      if (result.success) {
        console.log(`Backup eliminado exitosamente: ${sanitizedFilename}`);
        await this.updateBackupsList();
        return true;
      } else {
        console.error('Error eliminando backup:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error en deleteBackup:', error);
      throw error;
    }
  }

  // Configurar opciones de backup
  setBackupConfig(options) {
    this.backupConfig = { ...this.backupConfig, ...options };
  }

  // Obtener configuración actual
  getBackupConfig() {
    return { ...this.backupConfig };
  }

  // Resto de métodos originales...
  async downloadBackup(filename, destinationPath = null) {
    try {
      const sanitizedFilename = BackupManager.sanitizeFilename(filename);
      const backupPath = `${backupPathBase}/${sanitizedFilename}`;
      
      if (!PathUtils.pathExists(backupPath)) {
        throw new Error(`El backup '${sanitizedFilename}' no existe.`);
      }

      const destination = destinationPath || `./${sanitizedFilename}`;
      console.log(`Backup disponible para descarga: ${backupPath}`);
      
      await this.updateBackupsList();
      return backupPath;
    } catch (error) {
      console.error('Error en downloadBackup:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const result = await getFolderDetails(backupPathBase, ".");
      if (result.success && result.data.files) {
        return result.data.files.filter(file => 
          !file.isDirectory && 
          (file.name.endsWith('.tar.gz') || file.name.endsWith('.gz') || file.name.endsWith('.zip'))
        );
      }
      return [];
    } catch (error) {
      console.error('Error listando backups:', error);
      return [];
    }
  }

  async getBackupInfo(filename) {
    try {
      const sanitizedFilename = BackupManager.sanitizeFilename(filename);
      const backups = await this.listBackups();
      return backups.find(backup => backup.name === sanitizedFilename) || null;
    } catch (error) {
      console.error('Error obteniendo información del backup:', error);
      return null;
    }
  }

  async verifyBackup(filename) {
    try {
      const backupInfo = await this.getBackupInfo(filename);
      if (!backupInfo) {
        return { valid: false, error: 'Backup no encontrado' };
      }

      const backupPath = `${backupPathBase}/${filename}`;
      const exists = PathUtils.pathExists(backupPath);
      const isFile = exists ? PathUtils.isFile(backupPath) : false;

      return {
        valid: exists && isFile && backupInfo.size > 0,
        exists,
        isFile,
        size: backupInfo.size,
        modified: backupInfo.modified
      };
    } catch (error) {
      console.error('Error verificando backup:', error);
      return { valid: false, error: error.message };
    }
  }
}

// Crear instancia singleton del BackupManager
const backupManager = new BackupManager();

// Funciones de conveniencia mejoradas
export async function createbackup(folderName, outputFilename, options = {}) {
  return await backupManager.createBackup(folderName, outputFilename, options);
}

export async function restorebackup(filename, outputFolderName) {
  return await backupManager.restoreBackup(filename, outputFolderName);
}

export function getbackupsdata() {
  return backupManager.getBackupsData();
}

export async function deletebackup(filename) {
  return await backupManager.deleteBackup(filename);
}

export async function downloadbackup(filename) {
  return await backupManager.downloadBackup(filename);
}

export async function listbackups() {
  return await backupManager.listBackups();
}

export async function getbackupinfo(filename) {
  return await backupManager.getBackupInfo(filename);
}

export async function verifybackup(filename) {
  return await backupManager.verifyBackup(filename);
}

// Función para configurar opciones de backup
export function setBackupConfig(options) {
  backupManager.setBackupConfig(options);
}

export function getBackupConfig() {
  return backupManager.getBackupConfig();
}
export async function updatebackupslist() {
  return await backupManager.updateBackupsList();
}

// Exportar la clase mejorada
export { BackupManager };

// Ejemplos de uso mejorados:
/*
// Configurar opciones para servidores en ejecución
setBackupConfig({
  copyBeforeCompress: true,
  excludeProblematicFiles: true,
  retryAttempts: 5,
  useZip: false // o true para usar ZIP
});

// Crear backup con servidor ejecutándose
await createbackup("mi_servidor", "mi_servidor_backup.tar.gz", {
  copyBeforeCompress: true
});

// Crear backup en formato ZIP
await createbackup("mi_servidor", "mi_servidor_backup.zip", {
  useZip: true
});

// Backup básico con reintentos automáticos
await createbackup("mi_servidor");
*/