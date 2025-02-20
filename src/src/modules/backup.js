import fs from 'fs';
import path from 'path';
import { createGzip, createGunzip } from 'zlib';
import * as tar from 'tar';

class FolderManager {
    constructor(basePath = '.') {
      this.basePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);
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
        
        // Construimos una base que está 2 niveles más profunda que la raíz actual
        // Asumiendo que itemPath ya está dentro de esa estructura
        const relativePath = path.relative(process.cwd(), itemPath);
        const pathParts = relativePath.split(path.sep);
        
        if (pathParts.length >= 2) {
          // Tomamos los dos primeros segmentos del path relativo
          const baseSegments = pathParts.slice(0, 2);
          const basePath = path.join(process.cwd(), ...baseSegments);
          
          return {
            name: item,
            path: path.relative(basePath, itemPath), // Ruta relativa desde 2 niveles adentro
            size: stats.size,
            modified: stats.mtime.toISOString(),
            isDirectory: stats.isDirectory(),
          };
        } else {
          // Si no hay suficientes niveles, usar la ruta original
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
      
      if (!outputFileName) {
        outputFileName = folderName + '.tar.gz';
      }
      
      // Si se pasa una ruta absoluta, la usamos directamente
      const outputPath = this.basePath + "/" + outputFileName;
    
      // (Opcional: Verificar que el directorio de outputPath exista o crearlo)
      const outputDir = path.dirname(outputPath);
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
      
      // Si no se especifica, usamos el nombre de la carpeta original (quitando la extensión .tar.gz)
      if (!outputFolderName) {
        outputFolderName = path.basename(compressedFileName, '.tar.gz');
      }
      const outputFolderPath = path.join(this.basePath, outputFolderName);
      
      // Crear la carpeta de destino si no existe
      if (!fs.existsSync(outputFolderPath)) {
        fs.mkdirSync(outputFolderPath, { recursive: true });
      }
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(compressedFilePath)
          .pipe(createGunzip()) // Usamos createGunzip de node:zlib para descomprimir
          .pipe(
            tar.x({
              cwd: outputFolderPath, // Extraer en la carpeta de destino
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
      
      // Si se pasa una ruta absoluta, la usamos directamente
      const outputPath = this.basePath + "/" + filename;
    
      // (Opcional: Verificar que el directorio de outputPath exista o crearlo)
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
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
      
      // Si se pasa una ruta absoluta, la usamos directamente
      const outputPath = this.basePath + "/" + filename;
    
      // (Opcional: Verificar que el directorio de outputPath exista o crearlo)
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
  }
  import StorageManager from '../utils.js';
  const backupsdata = new StorageManager("backups.js","./data")
  const folderManager = new FolderManager("./")
  function getfolderinfo(folderName) {
    try {
      const files = folderManager.getFolderDetails(folderName);
     // console.log(`Archivos en la subcarpeta '${folderName}':`, files);
      return files;
    } catch (error) {
      console.error(error.message);
    }
  }
  function updatefolderinfo(folderName = "./backups") {
    try {
      const files = getfolderinfo(folderName);
      backupsdata.JSONset("backups", files);
    } catch (error) {
      console.error(error.message);
    }
}
async function createbackup(folderName, outputFilename) {
    try {
      const result = await folderManager.compressFolder("./servers/" + folderName, "./backups/" + outputFilename);
      updatefolderinfo();
      return result;
    } catch(e) {
      console.error(e);
    }
  }
  
async function restorebackup(filename,outputFolderName) {
    try {
        const result = await folderManager.decompressFolder("./backups/"+filename,"./servers/"+outputFolderName)
        updatefolderinfo()
        return result;
    } catch(e) {
        console.error(e)
    }
}
function getbackupsdata(){
    return backupsdata.JSONget("backups")
}
async function deletebackup(filename){
    try {
        const result = await folderManager.deleteFile("./backups/"+filename)
        updatefolderinfo()
        return result;
    } catch(e) {
        console.error(e)
    }
}
async function downloadbackup(filename){
    try {
        const result = await folderManager.downloadFile("./backups/"+filename)
        updatefolderinfo()
        return result;
    } catch(e) {
        console.error(e)
    }
}
//createbackup("test123", "test123.tar.gz")

//restorebackup("test123.tar.gz", "test1234")
// generateServerFolderBackup("test123", "test123.tar.gz");
export {
    createbackup,
    restorebackup,
    getbackupsdata,
    deletebackup
}