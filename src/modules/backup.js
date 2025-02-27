import fs from 'fs';
import path from 'path';
import { createGzip, createGunzip } from 'zlib';
import * as tar from 'tar';

class FolderManager {
  constructor(basePath = '.') {
    this.basePath = path.isAbsolute(basePath) 
        ? basePath 
        : path.resolve(process.cwd(), basePath);
        
    if (!fs.existsSync(this.basePath)) {
        fs.mkdirSync(this.basePath, { recursive: true });
    }
}

  getFolderSize(folderPath) {
    const stats = fs.statSync(folderPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(folderPath);
      return files.reduce((total, file) => {
        const filePath = path.join(folderPath, file);
        const fileStats = fs.statSync(filePath);
        return total + (fileStats.isDirectory() ? 0 : fileStats.size); // Ignorar subdirectorios
      }, 0);
    }
    return stats.size;
  }

  getFolderDetails(folderName) {
    const folderPath = path.join(this.basePath, folderName);
    if (!fs.existsSync(folderPath)) {
      throw new Error(`La carpeta '${folderName}' no existe.`);
    }
    const stats = fs.statSync(folderPath);
    return {
      name: folderName,
      path: path.relative(process.cwd(), folderPath), // Ruta relativa
      size: this.getFolderSize(folderPath),
      modified: stats.mtime.toISOString(), // Fecha de la última modificación
      files: this.listFilesInFolder(folderPath), // Listar archivos y subcarpetas
    };
  }

  listFilesInFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    
    return fs.readdirSync(folderPath).map((item) => {
      const itemPath = path.join(folderPath, item);
      const stats = fs.statSync(itemPath);
      const relativePath = path.relative(process.cwd(), itemPath);
      const pathParts = relativePath.split(path.sep);
      
      if (pathParts.length >= 2) {
        const baseSegments = pathParts.slice(0, 2);
        const basePath = path.join(process.cwd(), ...baseSegments);
        return {
          name: item,
          path: path.relative(basePath, itemPath),
          size: stats.size,
          modified: stats.mtime.toISOString(),
          isDirectory: stats.isDirectory(),
        };
      } else {
        return {
          name: item,
          path: relativePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          isDirectory: stats.isDirectory(),
        };
      }
    });
  }

  async compressFolder(folderName, outputFileName = null) {
    const folderPath = path.join(this.basePath, folderName);
    if (!fs.existsSync(folderPath)) {
      throw new Error(`La carpeta ${folderName} no existe.`);
    }
    
    // Si no se especifica nombre de salida, se utiliza folderName.tar.gz
    if (!outputFileName) {
      outputFileName = folderName + '.tar.gz';
    }
    
    const outputPath = path.join(this.basePath, outputFileName);
    const outputDir = path.dirname(outputPath);
    console.log(`Comprimiendo carpeta: ${folderPath}...`, outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const gzip = createGzip();
  
      tar.c(
        {
          cwd: folderPath,
          portable: true,
        },
        ['.']
      )
        .pipe(gzip)
        .pipe(output)
        .on('finish', () => {
          console.log(`Carpeta comprimida en: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  async decompressFolder(compressedFileName, outputFolderName = null) {
    const compressedFilePath = path.join(this.basePath, compressedFileName);
    if (!fs.existsSync(compressedFilePath)) {
      throw new Error(`El archivo comprimido ${compressedFileName} no existe.`);
    }
    
    if (!outputFolderName) {
      outputFolderName = path.basename(compressedFileName, '.tar.gz');
    }
    const outputFolderPath = path.join(this.basePath, outputFolderName);
    
    if (!fs.existsSync(outputFolderPath)) {
      fs.mkdirSync(outputFolderPath, { recursive: true });
    }
    return new Promise((resolve, reject) => {
      fs.createReadStream(compressedFilePath)
        .pipe(createGunzip())
        .pipe(
          tar.x({
            cwd: outputFolderPath,
          })
        )
        .on('finish', () => {
          console.log(`Archivo descomprimido en: ${outputFolderPath}`);
          resolve(outputFolderPath);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  async deleteFile(filename) {
    const filePath = path.join(this.basePath, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo ${filename} no existe.`);
    }
    
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  async downloadFile(filename) {
    const filePath = path.join(this.basePath, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo ${filename} no existe.`);
    }
    
    const outputPath = path.join(this.basePath, filename);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(fs.createWriteStream(outputPath))
        .on('finish', () => {
          console.log(`Archivo descargado en: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
  static sanitizeFilename(filename) {
    let sanitized = filename
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters with underscores
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .replace(/_{2,}/g, '_'); // Replace multiple underscores with one

    if (sanitized === '') {
      sanitized = 'backup'; // Default if sanitized is empty
    }

    return sanitized;
  }
}

import StorageManager from '../utils.js';
const backupsdata = new StorageManager("backups.json", "./data");
// Se usa la carpeta base del proyecto
const folderManager = new FolderManager('.');

// Para obtener información de una carpeta
function getfolderinfo(folderName) {
  try {
    const files = folderManager.getFolderDetails(folderName);
    return files;
  } catch (error) {
    console.error(error.message);
  }
}

function updatefolderinfo(folderName = "./backups") {
  try {
    const files = getfolderinfo(folderName);
    backupsdata.JSONset("backups", files);
    return files;
  } catch (error) {
    console.error(error.message);
  }
}

async function createbackup(folderName, outputFilename) {
  try {
    const sanitizedFolderName = FolderManager.sanitizeFilename(folderName);
    const sanitizedOutputFilename = outputFilename 
      ? FolderManager.sanitizeFilename(outputFilename) 
      : `${sanitizedFolderName}.tar.gz`;

    const result = await folderManager.compressFolder(
      `servers/${sanitizedFolderName}`, 
      `backups/${sanitizedOutputFilename}`
    );
    return result;
  } catch (e) {
    console.error(e);
  }
}

async function restorebackup(filename, outputFolderName) {
  try {
    const sanitizedFilename = FolderManager.sanitizeFilename(filename);
    const sanitizedOutputFolder = outputFolderName 
      ? FolderManager.sanitizeFilename(outputFolderName) 
      : path.basename(sanitizedFilename, '.tar.gz');

    const result = await folderManager.decompressFolder(
      `backups/${sanitizedFilename}`, 
      `servers/${sanitizedOutputFolder}`
    );
    updatefolderinfo();
    return result;
  } catch (e) {
    console.error(e);
  }
}

function getbackupsdata() {
  return backupsdata.JSONget("backups") || updatefolderinfo()|| backupsdata.store;
}

async function deletebackup(filename) {
  try {
    const sanitizedFilename = FolderManager.sanitizeFilename(filename);
    const result = await folderManager.deleteFile(`backups/${sanitizedFilename}`);
    updatefolderinfo();
    return result;
  } catch (e) {
    console.error(e);
  }
}

async function downloadbackup(filename) {
  try {
    const sanitizedFilename = FolderManager.sanitizeFilename(filename);
    const result = await folderManager.downloadFile(`backups/${sanitizedFilename}`);
    updatefolderinfo();
    return result;
  } catch (e) {
    console.error(e);
  }
}


// Ejemplo de uso:
// createbackup("test123", "test123.tar.gz");
// restorebackup("test123.tar.gz", "test123_restore");

export {
  createbackup,
  restorebackup,
  getbackupsdata,
  deletebackup,
  downloadbackup
};
