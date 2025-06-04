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

class BackupManager {
  constructor() {
    // Usar StorageManager de fileutils.js para gestionar datos de backups
    this.backupsData = new StorageManager("backups.json", "./data");
  }

  // Función para sanitizar nombres de archivos
  static sanitizeFilename(filename) {
    let sanitized = filename
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Reemplazar caracteres inválidos con guiones bajos
      .replace(/^\.+|\.+$/g, '') // Eliminar puntos al inicio/final
      .replace(/_{2,}/g, '_'); // Reemplazar múltiples guiones bajos con uno

    if (sanitized === '') {
      sanitized = 'backup'; // Valor por defecto si el sanitizado está vacío
    }

    return sanitized;
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

  // Crear backup usando fileutils
  async createBackup(folderName, outputFilename = null) {
    try {
      const sanitizedFolderName = BackupManager.sanitizeFilename(folderName);
      const sanitizedOutputFilename = outputFilename 
        ? BackupManager.sanitizeFilename(outputFilename) 
        : `${sanitizedFolderName}.tar.gz`;
      const verifyfilename = sanitizedOutputFilename.endsWith('.tar.gz') ? sanitizedOutputFilename : `${sanitizedOutputFilename}.tar.gz`;
      // Usar compressFolder de fileutils.js
      const result = await compressFolder(
        serverPathBase, // Base path para servidores
        sanitizedFolderName, // Carpeta a comprimir
        verifyfilename // Nombre del archivo de salida
      );

      if (result.success) {
        console.log(`Backup creado exitosamente: ${result.data}`);
        // Actualizar información después de crear backup
        await this.updateBackupsList();
        return result.data;
      } else {
        console.error('Error creando backup:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error en createBackup:', error);
      throw error;
    }
  }

  // Restaurar backup usando fileutils
  async restoreBackup(filename, outputFolderName = null) {
    try {
      const sanitizedFilename = BackupManager.sanitizeFilename(filename);
      const sanitizedOutputFolder = outputFolderName 
        ? BackupManager.sanitizeFilename(outputFolderName) 
        : sanitizedFilename.replace('.tar.gz', '');

      // Usar decompressFolder de fileutils.js
      const result = await decompressFolder(
        sanitizedFilename, // Archivo comprimido en backups/
        sanitizedOutputFolder // Carpeta de salida en servers/
      );

      if (result.success) {
        console.log(`Backup restaurado exitosamente: ${result.data}`);
        // Actualizar información después de restaurar
        await this.updateFolderInfo();
        return result.data;
      } else {
        console.error('Error restaurando backup:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error en restoreBackup:', error);
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
      const result = await getFolderDetails(backupPathBase, ".");
      if (result.success) {
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
      
      // Usar deletePath de fileutils.js
      const result = await deletePath(backupPathBase, sanitizedFilename);
      
      if (result.success) {
        console.log(`Backup eliminado exitosamente: ${sanitizedFilename}`);
        // Actualizar lista después de eliminar
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

  // Descargar backup (copiar a ubicación específica)
  async downloadBackup(filename, destinationPath = null) {
    try {
      const sanitizedFilename = BackupManager.sanitizeFilename(filename);
      const sourcePath = `${sanitizedFilename}`;
      
      // Si no se especifica destino, usar la carpeta actual
      const destination = destinationPath || `./${sanitizedFilename}`;
      
      // Verificar que el archivo existe en backups
      const backupPath = `${backupPathBase}/${sanitizedFilename}`;
      if (!PathUtils.pathExists(backupPath)) {
        throw new Error(`El backup '${sanitizedFilename}' no existe.`);
      }

      // Para "descargar", podemos copiar el archivo a la ubicación deseada
      // o simplemente retornar la ruta del archivo para que el sistema lo maneje
      console.log(`Backup disponible para descarga: ${backupPath}`);
      
      await this.updateBackupsList();
      return backupPath;
    } catch (error) {
      console.error('Error en downloadBackup:', error);
      throw error;
    }
  }

  // Listar todos los backups disponibles
  async listBackups() {
    try {
      const result = await getFolderDetails(backupPathBase, ".");
      if (result.success && result.data.files) {
        return result.data.files.filter(file => 
          !file.isDirectory && 
          (file.name.endsWith('.tar.gz') || file.name.endsWith('.gz'))
        );
      }
      return [];
    } catch (error) {
      console.error('Error listando backups:', error);
      return [];
    }
  }

  // Obtener información detallada de un backup específico
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

  // Verificar integridad de backup
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

// Funciones de conveniencia que mantienen la interfaz original
export async function createbackup(folderName, outputFilename) {
  return await backupManager.createBackup(folderName, outputFilename);
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

// Funciones adicionales
export async function listbackups() {
  return await backupManager.listBackups();
}

export async function getbackupinfo(filename) {
  return await backupManager.getBackupInfo(filename);
}

export async function verifybackup(filename) {
  return await backupManager.verifyBackup(filename);
}

// Exportar la clase para uso directo si es necesario
export { BackupManager };

// Ejemplos de uso:
/*
// Crear backup
await createbackup("mi_servidor", "mi_servidor_backup.tar.gz");

// Restaurar backup
await restorebackup("mi_servidor_backup.tar.gz", "mi_servidor_restaurado");

// Listar backups
const backups = await listbackups();
console.log('Backups disponibles:', backups);

// Obtener información de backup específico
const info = await getbackupinfo("mi_servidor_backup.tar.gz");
console.log('Información del backup:', info);

// Verificar integridad del backup
const verification = await verifybackup("mi_servidor_backup.tar.gz");
console.log('Verificación:', verification);

// Eliminar backup
await deletebackup("mi_servidor_backup.tar.gz");
*/