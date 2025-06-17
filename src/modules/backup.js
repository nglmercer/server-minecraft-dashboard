// managers/BackupManager.js

import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import stream from 'node:stream';

// Importamos nuestro nuevo servicio de compresión
import * as Compression from './backups/CompressionService.js';

// Asumimos que estas utilidades siguen existiendo
import { getFolderDetails, deletePath, StorageManager, serverPathBase, backupPathBase } from '../fileutils.js';

const pipeline = promisify(stream.pipeline);

export class BackupManager {
  constructor(taskManager) {
    // El taskManager se puede inyectar para emitir eventos de progreso
    this.taskManager = taskManager; 
    
    this.backupsData = new StorageManager("backups.json", "./data");
    
    this.problematicFiles = [
      '**/session.lock', '**/level.dat_old', '**/level.dat_new', '**/*.tmp',
      '**/*.tmp*', 'logs/latest.log', 'logs/debug.log', 'usercache.json',
      'usernamecache.json', '.tmp', 'crash-reports', 'logs/**/*.log.gz', 'logs/**/*.log.lck'
    ];

    this.backupConfig = {
      retryAttempts: 3,
      retryDelay: 2000,
      useZip: true, // .tar.gz es generalmente más rápido
      excludeProblematicFiles: true,
      copyBeforeCompress: true, // Muy recomendado
    };
  }
  
  async createBackup(folderName, outputFilename = null, options = {}) {
    const config = { ...this.backupConfig, ...options };

    // --- INICIO DE LA CORRECCIÓN ---
    // Detecta si 'folderName' ya es una ruta absoluta (como la que envía TaskManager)
    const isAbsolutePath = path.isAbsolute(folderName);
    
    // Si es una ruta absoluta, úsala directamente. Si no, úsala como nombre de carpeta.
    const sourcePath = isAbsolutePath ? folderName : path.join(serverPathBase, folderName);
    
    // El nombre de la carpeta para el archivo de salida debe basarse en el nombre base, no en la ruta completa.
    const baseFolderName = isAbsolutePath ? path.basename(folderName) : folderName;
    const sanitizedFolderName = BackupManager.sanitizeFilename(baseFolderName);
    // --- FIN DE LA CORRECCIÓN ---

    // Verificar si la carpeta de origen existe antes de continuar
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`La carpeta de origen no existe: ${sourcePath}`);
    }

    const extension = config.useZip ? '.zip' : '.tar.gz';
    let finalOutputFilename = outputFilename
      ? BackupManager.sanitizeFilename(outputFilename)
      : `${sanitizedFolderName}-backup-${new Date().toISOString().replace(/[:.]/g, '-')}${extension}`;
      
    if (!finalOutputFilename.endsWith(extension)) {
      finalOutputFilename = finalOutputFilename.replace(/\.(zip|tar\.gz)$/, '') + extension;
    }
    
    const outputPath = path.join(backupPathBase, finalOutputFilename);

    const serverRunning = await this.isServerRunning(sourcePath);
    if (serverRunning && !config.copyBeforeCompress) {
        console.warn('⚠️ Servidor en ejecución. Se recomienda `copyBeforeCompress: true` para evitar corrupción.');
    }
    
    let tempPath = null;
    // El resto de la función puede permanecer igual, ya que ahora 'sourcePath' es correcto.
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${config.retryAttempts} de backup para ${baseFolderName}`);

        let pathToCompress = sourcePath;
        if (config.copyBeforeCompress) {
          console.log('📁 Creando copia temporal del servidor...');
          // Usamos 'baseFolderName' para que el nombre de la carpeta temporal sea limpio
          tempPath = path.join(process.cwd(), 'temp', `backup_${Date.now()}_${baseFolderName}`);
          await this.createTempCopyWithSkip(sourcePath, tempPath); 
          pathToCompress = tempPath;
          console.log('✅ Copia temporal creada en:', pathToCompress);
        }

        console.log('🗜️ Iniciando compresión por stream...');
        const ignoreList = config.excludeProblematicFiles ? this.problematicFiles : [];
        
        if (config.useZip) {
          await Compression.compressZipStream(pathToCompress, outputPath, ignoreList);
        } else {
          await Compression.compressTarGzStream(pathToCompress, outputPath, ignoreList);
        }

        console.log(`✅ Backup creado exitosamente: ${outputPath}`);
        await this.updateBackupsList();
        
        // Limpiamos aquí después del éxito, antes de salir del bucle
        if (tempPath) {
          console.log('🧹 Limpiando copia temporal...');
          await fs.promises.rm(tempPath, { recursive: true, force: true });
          tempPath = null; // Evita que el finally lo borre de nuevo
        }

        return { success: true, data: outputPath };

      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error.message);
        // Limpia la copia temporal también en caso de fallo
        if (tempPath) {
          await fs.promises.rm(tempPath, { recursive: true, force: true }).catch(err => {
              console.warn('⚠️ Error limpiando copia temporal tras fallo:', err.message);
          });
          tempPath = null;
        }
        if (attempt >= config.retryAttempts) {
          throw new Error(`Backup falló después de ${config.retryAttempts} intentos: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      } 
      // El 'finally' ya no es estrictamente necesario si limpiamos en try/catch
    }
  }
  async restoreBackup(filename, outputFolderName = null) {
    const sanitizedFilename = BackupManager.sanitizeFilename(filename);
    const backupPath = path.join(backupPathBase, sanitizedFilename);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`El archivo de backup no existe: ${backupPath}`);
    }

    const sanitizedOutputFolder = outputFolderName
      ? BackupManager.sanitizeFilename(outputFolderName)
      : sanitizedFilename.replace(/\.(tar\.gz|zip)$/, '');
      
    const outputPath = path.join(serverPathBase, sanitizedOutputFolder);

    try {
      console.log(`Restaurando '${sanitizedFilename}' en '${outputPath}'...`);
      await fs.promises.mkdir(outputPath, { recursive: true });

      // Delegamos la lógica de descompresión al servicio
      if (sanitizedFilename.endsWith('.zip')) {
        await Compression.decompressZipStream(backupPath, outputPath);
      } else if (sanitizedFilename.endsWith('.tar.gz')) {
        await Compression.decompressTarGzStream(backupPath, outputPath);
      } else {
        throw new Error(`Formato de archivo no soportado: ${sanitizedFilename}`);
      }

      console.log(`✅ Backup restaurado exitosamente en: ${outputPath}`);
      // await this.updateFolderInfo(); // Asumo que actualiza la lista de servidores
      return { success: true, data: outputPath };

    } catch (error) {
      // Aquí capturaríamos el error de archivo corrupto y lo reportaríamos de forma amigable.
      console.error('Error restaurando el backup:', error);
      // Podrías verificar si el error es el que viste
      if (error.code === 'Z_BUF_ERROR') {
          throw new Error(`Fallo al restaurar: El archivo '${sanitizedFilename}' parece estar corrupto o incompleto.`);
      }
      throw error; // Re-lanzar otros errores
    }
  }
  // --- MÉTODOS AUXILIARES (Algunos sin cambios, otros con pequeñas mejoras) ---

  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') return 'invalid_name';
    return filename.trim().replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+|\.+$/g, '').replace(/_{2,}/g, '_') || 'backup';
  }

  _globToRegex(globPattern) {
    const regexString = globPattern.replace(/\./g, '\\.').replace(/\*\*/g, '(.+)').replace(/\*/g, '([^/\\\\]*)');
    return `^${regexString}$`;
  }
  
  // Es muy robusta para manejar archivos bloqueados.
  async createTempCopyWithSkip(source, dest) {
    // Tu implementación de `createTempCopyWithSkip` es bastante robusta y puede permanecer aquí,
    // ya que está muy ligada a la lógica de "backup". He simplificado un poco el manejo de errores.
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(source, entry.name);
        const destPath = path.join(dest, entry.name);
        const relativePath = path.relative(source, srcPath).replace(/\\/g, '/');

        if (this.backupConfig.excludeProblematicFiles && this.problematicFiles.some(p => new RegExp(this._globToRegex(p)).test(relativePath))) {
            continue;
        }

        if (entry.isDirectory()) {
            await this.createTempCopyWithSkip(srcPath, destPath);
        } else {
            try {
                await fs.promises.copyFile(srcPath, destPath, fs.constants.COPYFILE_FICLONE);
            } catch (error) {
                if (['EBUSY', 'EPERM', 'ENOENT'].includes(error.code)) {
                    console.warn(`Saltando archivo bloqueado/no encontrado: ${relativePath}`);
                } else {
                    throw error;
                }
            }
        }
    }
}

  
  //<editor-fold desc="Pega aquí el resto de tus métodos sin cambiar">
  async isFileLocked(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const fd = await fs.promises.open(filePath, 'r');
      await fd.close();
      return false;
    } catch (error) {
      return ['EBUSY', 'EPERM', 'EACCES'].includes(error.code);
    }
  }

  async isServerRunning(serverPath) {
    const sessionLockPath = path.join(serverPath, 'session.lock');
    if (!fs.existsSync(sessionLockPath)) return false;
    try {
      // Intentar abrir con 'r+' falla si está bloqueado
      const fd = fs.openSync(sessionLockPath, 'r+');
      fs.closeSync(fd);
      return false;
    } catch (error) {
      return ['EBUSY', 'EPERM', 'EACCES'].includes(error.code);
    }
  }
  

  // Crear un transform stream que procesa por chunks y controla memoria
  createMemoryControlledTransform() {
    let currentMemoryUsage = 0;
    
    return new Transform({
      highWaterMark: this.bufferSize,
      transform(chunk, encoding, callback) {
        currentMemoryUsage += chunk.length;
        
        // Si excedemos el límite de memoria, pausar temporalmente
        if (currentMemoryUsage > this.memoryLimit) {
          setImmediate(() => {
            currentMemoryUsage -= chunk.length;
            this.push(chunk);
            callback();
          });
        } else {
          this.push(chunk);
          callback();
        }
      }
    });
  }

  // Verificar si un archivo está bloqueado con timeout
  async isFileLocked(filePath, timeout = 1000) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(true), timeout);
      
      fs.open(filePath, 'r', (err, fd) => {
        clearTimeout(timer);
        if (err) {
          resolve(err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES');
        } else {
          fs.close(fd, () => resolve(false));
        }
      });
    });
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
      
      const checks = await Promise.all(
        checkFiles.map(async (file) => {
          const filePath = path.join(dirPath, file);
          try {
            await fs.promises.access(filePath);
            return await this.isFileLocked(filePath);
          } catch {
            return false;
          }
        })
      );
      
      return checks.some(locked => locked);
    } catch (error) {
      console.warn('Error verificando archivos bloqueados:', error.message);
      return true;
    }
  }

  // Verificar si un archivo debe ser excluido
  shouldExcludeFile(relativePath) {
    if (!this.backupConfig.excludeProblematicFiles) return false;
    
    return this.problematicFiles.some(pattern => {
      if (pattern.includes('*')) {
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

  // Obtener el tamaño total de un directorio de forma eficiente
  async getDirectorySize(dirPath) {
    let totalSize = 0;
    
    const calculateSize = async (currentPath) => {
      try {
        const stats = await fs.promises.stat(currentPath);
        
        if (stats.isDirectory()) {
          const entries = await fs.promises.readdir(currentPath);
          const tasks = entries.map(entry => {
            const fullPath = path.join(currentPath, entry);
            const relativePath = path.relative(dirPath, fullPath);
            
            if (this.shouldExcludeFile(relativePath)) {
              return Promise.resolve(0);
            }
            
            return calculateSize(fullPath);
          });
          
          const sizes = await Promise.all(tasks);
          return sizes.reduce((sum, size) => sum + size, 0);
        } else {
          return stats.size;
        }
      } catch (error) {
        console.warn(`Error calculando tamaño de ${currentPath}:`, error.message);
        return 0;
      }
    };
    
    return await calculateSize(dirPath);
  }

  // Crear backup optimizado con tar streams
  async createTarGzBackupStream(sourcePath, outputPath, config) {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const gzip = zlib.createGzip({ 
        level: config.compressionLevel,
        chunkSize: this.chunkSize
      });
      
      let processedFiles = 0;
      let totalSize = 0;
      let processedSize = 0;
      
      // Configurar tar stream con opciones optimizadas
      const tarStream = tar.create({
        gzip: false, // Manejamos gzip por separado para mejor control
        cwd: path.dirname(sourcePath),
        portable: true,
        noMtime: false,
        filter: (path, stat) => {
          const relativePath = path.replace(/^\.\//, '');
          if (this.shouldExcludeFile(relativePath)) {
            return false;
          }
          
          // Reportar progreso
          if (config.progressCallback) {
            processedFiles++;
            if (stat.isFile()) {
              processedSize += stat.size;
              config.progressCallback({
                type: 'progress',
                processedFiles,
                processedSize,
                totalSize,
                currentFile: relativePath
              });
            }
          }
          
          return true;
        }
      }, [path.basename(sourcePath)]);

      // Pipeline optimizado con control de memoria
      const memoryTransform = this.createMemoryControlledTransform();
      
      pipeline(tarStream, memoryTransform, gzip, output)
        .then(() => {
          resolve({
            success: true,
            data: outputPath,
            stats: { processedFiles, processedSize }
          });
        })
        .catch(reject);

      // Calcular tamaño total para progreso
      if (config.progressCallback) {
        this.getDirectorySize(sourcePath).then(size => {
          totalSize = size;
          config.progressCallback({
            type: 'start',
            totalSize,
            message: 'Iniciando backup...'
          });
        });
      }
    });
  }

  // Crear backup ZIP optimizado con chunks
  async createZipBackupStream(sourcePath, outputPath, config) {
    return new Promise(async (resolve, reject) => {
      try {
        const output = createWriteStream(outputPath);
        const zip = new AdmZip();
        
        let processedFiles = 0;
        let processedSize = 0;
        const totalSize = await this.getDirectorySize(sourcePath);
        
        const addToZipRecursive = async (currentPath, zipPath = '') => {
          const stats = await fs.promises.stat(currentPath);
          
          if (stats.isDirectory()) {
            const entries = await fs.promises.readdir(currentPath);
            
            // Procesar archivos en lotes para controlar memoria
            for (let i = 0; i < entries.length; i += this.maxConcurrentFiles) {
              const batch = entries.slice(i, i + this.maxConcurrentFiles);
              
              await Promise.all(batch.map(async (entry) => {
                const fullPath = path.join(currentPath, entry);
                const relativePath = path.relative(sourcePath, fullPath);
                
                if (this.shouldExcludeFile(relativePath)) {
                  return;
                }
                
                try {
                  await addToZipRecursive(fullPath, path.join(zipPath, entry));
                } catch (error) {
                  if (error.code === 'EBUSY' || error.code === 'EPERM') {
                    console.warn(`Archivo bloqueado, saltando: ${relativePath}`);
                  } else {
                    throw error;
                  }
                }
              }));
            }
          } else {
            try {
              // Leer archivo por chunks para archivos grandes
              if (stats.size > this.bufferSize) {
                const chunks = [];
                const readStream = createReadStream(currentPath, { 
                  highWaterMark: this.chunkSize 
                });
                
                for await (const chunk of readStream) {
                  chunks.push(chunk);
                }
                
                const buffer = Buffer.concat(chunks);
                zip.addFile(zipPath, buffer);
              } else {
                const buffer = await fs.promises.readFile(currentPath);
                zip.addFile(zipPath, buffer);
              }
              
              processedFiles++;
              processedSize += stats.size;
              
              if (config.progressCallback) {
                config.progressCallback({
                  type: 'progress',
                  processedFiles,
                  processedSize,
                  totalSize,
                  currentFile: path.relative(sourcePath, currentPath)
                });
              }
            } catch (error) {
              if (error.code === 'EBUSY' || error.code === 'EPERM') {
                console.warn(`No se pudo leer archivo bloqueado: ${path.relative(sourcePath, currentPath)}`);
              } else {
                throw error;
              }
            }
          }
        };
        
        if (config.progressCallback) {
          config.progressCallback({
            type: 'start',
            totalSize,
            message: 'Iniciando backup ZIP...'
          });
        }
        
        await addToZipRecursive(sourcePath);
        
        // Escribir ZIP de forma optimizada
        const zipBuffer = zip.toBuffer();
        output.write(zipBuffer);
        output.end();
        
        resolve({
          success: true,
          data: outputPath,
          stats: { processedFiles, processedSize }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  // Restaurar backup TAR.GZ con streaming
  async restoreTarGzBackupStream(backupPath, outputPath, config) {
    return new Promise((resolve, reject) => {
      const input = createReadStream(backupPath);
      const gunzip = zlib.createGunzip({
        chunkSize: this.chunkSize
      });
      
      let processedFiles = 0;
      let processedSize = 0;
      
      const extractStream = tar.extract({
        cwd: path.dirname(outputPath),
        strict: false,
        onentry: (entry) => {
          processedFiles++;
          processedSize += entry.size || 0;
          
          if (config.progressCallback) {
            config.progressCallback({
              type: 'progress',
              processedFiles,
              processedSize,
              currentFile: entry.path
            });
          }
        }
      });

      const memoryTransform = this.createMemoryControlledTransform();
      
      pipeline(input, memoryTransform, gunzip, extractStream)
        .then(() => {
          resolve({
            success: true,
            data: outputPath,
            stats: { processedFiles, processedSize }
          });
        })
        .catch(reject);
    });
  }

  // Restaurar backup ZIP con chunks
  async restoreZipBackupStream(backupPath, outputPath, config) {
    return new Promise(async (resolve, reject) => {
      try {
        const zip = new AdmZip(backupPath);
        const entries = zip.getEntries();
        
        let processedFiles = 0;
        let processedSize = 0;
        const totalFiles = entries.length;
        
        if (config.progressCallback) {
          config.progressCallback({
            type: 'start',
            totalFiles,
            message: 'Iniciando restauración ZIP...'
          });
        }
        
        // Procesar entradas en lotes
        for (let i = 0; i < entries.length; i += this.maxConcurrentFiles) {
          const batch = entries.slice(i, i + this.maxConcurrentFiles);
          
          await Promise.all(batch.map(async (entry) => {
            if (entry.isDirectory) {
              const dirPath = path.join(outputPath, entry.entryName);
              await fs.promises.mkdir(dirPath, { recursive: true });
            } else {
              const filePath = path.join(outputPath, entry.entryName);
              const dirPath = path.dirname(filePath);
              
              await fs.promises.mkdir(dirPath, { recursive: true });
              
              // Para archivos grandes, extraer por chunks
              if (entry.header.size > this.bufferSize) {
                const writeStream = createWriteStream(filePath);
                const data = entry.getData();
                
                for (let offset = 0; offset < data.length; offset += this.chunkSize) {
                  const chunk = data.slice(offset, offset + this.chunkSize);
                  writeStream.write(chunk);
                }
                
                writeStream.end();
              } else {
                await fs.promises.writeFile(filePath, entry.getData());
              }
              
              processedFiles++;
              processedSize += entry.header.size;
              
              if (config.progressCallback) {
                config.progressCallback({
                  type: 'progress',
                  processedFiles,
                  processedSize,
                  totalFiles,
                  currentFile: entry.entryName
                });
              }
            }
          }));
        }
        
        resolve({
          success: true,
          data: outputPath,
          stats: { processedFiles, processedSize }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Resto de métodos optimizados...
  async getFolderInfo(folderName) {
    const result = await getFolderDetails(serverPathBase, folderName);
    if (!result.success) {
      console.error('Error obteniendo información de carpeta:', result.error);
      return null;
    }
    return result.data;
  }

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

  getBackupsData() {
    return this.updateBackupsList() || this.backupsData.store;
  }

  async updateBackupsList() {
    try {
      const result = await getFolderDetails(backupPathBase, ".");
      if (result.success || result.data) {
        this.backupsData.JSONset("backupsList", result.data);
        return result.data;
      }
    } catch (error) {
      console.error('Error actualizando lista de backups:', error);
    }
    return null;
  }

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

  setBackupConfig(options) {
    this.backupConfig = { ...this.backupConfig, ...options };
  }

  getBackupConfig() {
    return { ...this.backupConfig };
  }

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

// Funciones de conveniencia
export async function createbackup(folderName, outputFilename, options = {}) {
  return await backupManager.createBackup(folderName, outputFilename, options);
}

export async function restorebackup(filename, outputFolderName, options = {}) {
  return await backupManager.restoreBackup(filename, outputFolderName, options);
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

export function setBackupConfig(options) {
  backupManager.setBackupConfig(options);
}

export function getBackupConfig() {
  return backupManager.getBackupConfig();
}

export async function updatebackupslist() {
  return await backupManager.updateBackupsList();
}