import fs from 'fs';
import path from 'path';
import { createGzip, createGunzip } from 'zlib';
import * as tar from 'tar';
const ALLOWED_EXTENSIONS = 
['json', 'yaml', 'txt', 'properties', 'sh', 'bat', 'js', 'jpg', 'png','jar','.gz'];


class FileManager {
  constructor(basePath = '.') {
    this.basePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  // Validar si la extensión es permitida
  _isValidExtension(extension) {
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
  }

  // Crear un archivo en una carpeta específica
  createFile(folderName, fileName, content = '') {
    const folderPath = path.join(this.basePath, folderName);
    // Crear la carpeta si no existe
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const ext = path.extname(fileName).slice(1); // Obtener la extensión sin el punto
    if (!this._isValidExtension(ext)) {
      throw new Error(`Extensión no permitida. Extensiones válidas: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }
    
    const filePath = path.join(folderPath, fileName);
  //debug create file  console.log("folderPath filePath", folderPath, filePath,fileName);

    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    return filePath;
  }

  // Leer el contenido de un archivo en una carpeta específica
  readFile(folderName, fileName) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`,filePath);
    }

    return fs.readFileSync(filePath, { encoding: 'utf8' });
  }
  renameFile(folderName, fileName, newName) {
      const folderPath = path.join(this.basePath, folderName);
      const oldFilePath = path.join(folderPath, fileName);
      
      // Mantener la subcarpeta del archivo original
      const fileDir = path.dirname(fileName); 
      const newFilePath = path.join(folderPath, fileDir, newName);

      if (!fs.existsSync(oldFilePath)) {
        throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
      }

      // Evitar sobrescribir archivos existentes
      if (fs.existsSync(newFilePath)) {
        throw new Error(`El archivo '${newName}' ya existe en '${fileDir}'.`);
      }

      fs.renameSync(oldFilePath, newFilePath);
      return newFilePath;
  }


  readFilebyPath(filePath) {
    const fileInfo = path.join(this.basePath, filePath);
    console.log("readFilebyPath", fileInfo);
    if (!filePath) return false;
    // Check if the path exists
    if (!fs.existsSync(fileInfo)) {
        return false;
    }

    // Check if the path is a directory
    const stats = fs.statSync(fileInfo);
    if (stats.isDirectory()) {
        return false;
    }

    // Read the file
    return fs.readFileSync(fileInfo, { encoding: 'utf8' });
  }
  // Escribir/Actualizar el contenido de un archivo en una carpeta específica
  writeFile(folderName, fileName, content) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }

    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    return {
      result: true,
      fileName: fileName,
      folderName: folderName,
      content: content
    }
  }

  // Eliminar un archivo en una carpeta específica
  deleteFile(folderName, fileName) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo o directorio '${fileName}' no existe en la carpeta '${folderName}'.`);
    }

    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
        // Eliminar directorio
        fs.rmSync(filePath, { recursive: true, force: true });
    } else {
        // Eliminar archivo
        fs.unlinkSync(filePath);
    }
}

  // Listar todos los archivos en una carpeta específica
  listFiles(folderName) {
    const folderPath = path.join(this.basePath, folderName);

    if (!fs.existsSync(folderPath)) {
      throw new Error(`La carpeta '${folderName}' no existe.`);
    }

    return fs.readdirSync(folderPath).filter((item) => {
      const itemPath = path.join(folderPath, item);
      return fs.statSync(itemPath).isFile();
    });
  }
  compressFile(fileName, outputPath = null) {
    const filePath = path.join(this.basePath, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe.`);
    }

    const compressedFileName = `${fileName}.gz`;
    const outputFolder = outputPath ? path.join(this.basePath, outputPath) : this.basePath;
    
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    const compressedFilePath = path.join(outputFolder, compressedFileName);
    const fileStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(compressedFilePath);
    const gzip = zlib.createGzip();

    fileStream.pipe(gzip).pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(compressedFilePath));
      writeStream.on('error', reject);
    });
  }

  // Descomprimir un archivo
  decompressFile(compressedFileName, outputPath = null) {
    const compressedFilePath = path.join(this.basePath, compressedFileName);
    if (!fs.existsSync(compressedFilePath)) {
      throw new Error(`El archivo comprimido '${compressedFileName}' no existe.`,compressedFilePath);
    }

    if (!compressedFileName.endsWith('.gz')) {
      throw new Error(`El archivo '${compressedFileName}' no es un archivo comprimido válido.`);
    }

    const originalFileName = compressedFileName.replace('.gz', '');
    const outputFolder = outputPath ? path.join(this.basePath, outputPath) : this.basePath;

    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    const decompressedFilePath = path.join(outputFolder, originalFileName);
    const fileStream = fs.createReadStream(compressedFilePath);
    const writeStream = fs.createWriteStream(decompressedFilePath);
    const gunzip = zlib.createGunzip();

    fileStream.pipe(gunzip).pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(decompressedFilePath));
      writeStream.on('error', reject);
    });
  }
}

class FolderManager {
  constructor(basePath = '.') {
    this.basePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  // Crear una nueva carpeta o subcarpeta
  createFolder(folderName, isSubFolder = false) {
    const folderPath = path.join(this.basePath, folderName);
    if (fs.existsSync(folderPath)) {
      throw new Error(`La carpeta '${folderName}' ya existe.`);
    }
    fs.mkdirSync(folderPath, { recursive: true });

    // Si es una subcarpeta, no devolvemos detalles adicionales
    if (isSubFolder) {
      return {
        name: folderName,
        path: path.relative(process.cwd(), folderPath),
        size: 0,
        modified: new Date().toISOString(),
        isDirectory: true
      };
    }

    // Devolver detalles actualizados de la carpeta principal
    return this.getFolderDetails(folderName);
  }

  // Obtener detalles actualizados de una carpeta
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

  // Obtener el tamaño de una carpeta (en bytes)
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

  deleteserver(serverName) {
    const serverPath = path.join(this.basePath, serverName);
    if (!fs.existsSync(serverPath)) {
      return false;
    }
    fs.rmSync(serverPath, { recursive: true, force: true });
    return true;
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
    const outputPath = this.getBackupfolderInfo() + "/" + outputFileName;
  
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
    const compressedFilePath = path.join(this.getBackupfolderInfo(), compressedFileName);
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
  getBackupfolderInfo() {
    const backupFolderPath = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupFolderPath)) {
      fs.mkdirSync(backupFolderPath, { recursive: true });
    }
    return backupFolderPath;
  }
}
import StorageManager from '../utils.js';

// Configuración inicial
const storage = new StorageManager('servers.json', './servers');
const folderManager = new FolderManager('./servers');
async function generateServerFolderBackup(folderName, outputPath = null) {
  try {
    const backup = await folderManager.compressFolder(folderName, outputPath);
    console.log("backup", backup);
  } catch (error) {
    console.error(error);
  }
} 
//  generateServerFolderBackup("test123", "test123.tar.gz");
async function uncompressServerFolderBackup(compressedFileName, outputFolderName = null) {
  try {
    const backup = await folderManager.decompressFolder(compressedFileName, outputFolderName);
    console.log("backup", backup);
  } catch (error) {
    console.error(error);
  }
}
 uncompressServerFolderBackup("test123.tar.gz", "test1234");
folderManager.getBackupfolderInfo();
const fileManager = new FileManager('./servers');
function createserverfolder(directoryname) {
  try {
    const folderDetails = folderManager.createFolder(directoryname);
    console.log(`Carpeta creada:`. folderDetails);
    updatefolderinfo(directoryname);
    return folderDetails;
  } catch (error) {
    return error.message;
  }
}
function createserverfile(directoryname, filename, content) {
//  console.log("createserverfile", directoryname, filename, content);
  try {
    const filePath = fileManager.createFile(
      path.join(directoryname), // Ruta relativa a la subcarpeta
      filename,
      content
    );
    console.log(`Archivo creado: ${filePath}`);
    updatefolderinfo(directoryname);
    return filePath;
  } catch (error) {
    return error.message;
  }
}
function createsubfolder(directoryname, subfoldername) {
  try {
    const subfolderPath = path.join(directoryname, subfoldername);
    // Crear la subcarpeta y obtener detalles básicos
    const subfolderDetails = folderManager.createFolder(subfolderPath, true); // isSubFolder = true
    updatefolderinfo(directoryname);

    return subfolderDetails;
  } catch (error) {
    return error.message;
  }
}
//metodo para agregar la informacion de cada carpeta de ./servers ---> nueva_carpeta <---- nueva_carpeta/subcarpeta agregara la clave con la informacion del archivo
function updatefolderinfo(folderName) {
    if (folderName.includes("/")) {
      folderName = folderName.split("/")[0];
    }
    try {
      const files = getfolderinfo(folderName);
      storage.JSONset(folderName, files);
    } catch (error) {
      console.error(error.message);
    }
}
function getfolderinfo(folderName) {
  try {
    const files = folderManager.getFolderDetails(folderName);
   // console.log(`Archivos en la subcarpeta '${folderName}':`, files);
    return files;
  } catch (error) {
    console.error(error.message);
  }
}
function readfilebyname(folderName, fileName) {
  try {
    let file = fileManager.readFilebyPath(filePath);
    //console.log("readfilebyname", file);
    if (file === false) {
      file = folderManager.getFolderDetails(folderName);
    //  console.log("readfilebyname", file);

    }
    //console.log("readfilebyname", file);
    return file;
  } catch (error) {
    console.error(error.message);
  }
}
function readfilebypath(filePath) {
  try {
    let file = fileManager.readFilebyPath(filePath);
    //console.log("readfilebyname", file);
    if (file === false) {
      file = folderManager.getFolderDetails(filePath);
     // console.log("readfilebyname", file);

    }
    //console.log("readfilebyname", file);
    return file;
  } catch (error) {
    console.error(error.message);
  }
}
function writeFilebyName(folderName, fileName, content) {
  try {
    let file = fileManager.writeFile(folderName, fileName,content);
    console.log("writeFilebyName", file);
    if (file === false) {
      file = folderManager.getFolderDetails(folderName);
      console.log("writeFilebyName", file);
    }
    console.log("writeFilebyName", file);
    return file;
  } catch (error) {
    console.error(error.message);
  }
}
function renamefile(server, sourceFile, newName) {
  try {
    console.log("renamefile", server, sourceFile, newName);
    const result = fileManager.renameFile(server, sourceFile, newName);
    return result; 
  }
catch (error) {
    console.error(error);
    return false;
  }
}
function deletefile(server, sourceFile) {
  try {
    let result = fileManager.deleteFile(server, sourceFile);
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}
function deleteserver(serverName) {
  try {
    console.log("deleteserver", serverName);
    if (!serverName) return false;
    let result = folderManager.deleteserver(serverName);
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}
/* createserverfolder("nueva_carpeta1");
createsubfolder("nueva_carpeta1", "subcarpeta");
getfolderinfo("nueva_carpeta1/subcarpeta");
createserverfile("nueva_carpeta1/subcarpeta", "server123.js", JSON.stringify({ key: 'value' })); */
export {
  createserverfolder,
  createserverfile,
  createsubfolder,
  getfolderinfo,
  updatefolderinfo,
  readfilebyname,
  readfilebypath,
  writeFilebyName,
  renamefile,
  deletefile,
  deleteserver,
  generateServerFolderBackup,
  uncompressServerFolderBackup
}