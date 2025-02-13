// fileFolderRegistry.js
import fs from 'fs';
import path from 'path';
import StorageManager from '../utils.js'; // Asegúrate de que este módulo esté correctamente implementado

const ALLOWED_EXTENSIONS = ['json', 'yaml', 'txt', 'properties', 'sh', 'bat', 'js'];

class FileManager {
  constructor(basePath = '.') {
    this.basePath = path.isAbsolute(basePath)
      ? basePath
      : path.join(process.cwd(), basePath);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  _isValidExtension(extension) {
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
  }

  createFile(folderName, fileName, content = '') {
    const folderPath = path.join(this.basePath, folderName);
  
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  
    const ext = path.extname(fileName).slice(1);
    if (!this._isValidExtension(ext)) {
      throw new Error(`Extensión no permitida. Extensiones válidas: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }
  
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    fs.chmodSync(filePath, 0o755); // Asigna permisos después de crear el archivo.
    return filePath;
  }
  
  readFile(folderName, fileName) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }
    return fs.readFileSync(filePath, { encoding: 'utf8' });
  }

  writeFile(folderName, fileName, content) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  }

  deleteFile(folderName, fileName) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }
    fs.unlinkSync(filePath);
  }

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
}

class FolderManager {
  constructor(basePath = '.') {
    this.basePath = path.isAbsolute(basePath)
      ? basePath
      : path.join(process.cwd(), basePath);
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  createFolder(folderName, isSubFolder = false) {
    const folderPath = path.join(this.basePath, folderName);
    if (fs.existsSync(folderPath)) {
      throw new Error(`La carpeta '${folderName}' ya existe.`);
    }
    fs.mkdirSync(folderPath, { recursive: true });

    if (isSubFolder) {
      return {
        name: folderName,
        path: path.relative(process.cwd(), folderPath),
        size: 0,
        modified: new Date().toISOString(),
        isDirectory: true
      };
    }
    return this.getFolderDetails(folderName);
  }

  getFolderDetails(folderName) {
    const folderPath = path.join(this.basePath, folderName);
    if (!fs.existsSync(folderPath)) {
      console.log(`La carpeta '${folderName}' no existe.`);
      return false;
    }
    const stats = fs.statSync(folderPath);
    return {
      name: folderName,
      path: path.relative(process.cwd(), folderPath),
      size: this.getFolderSize(folderPath),
      modified: stats.mtime.toISOString(),
      files: this.listFilesInFolder(folderPath),
    };
  }

  getFolderSize(folderPath) {
    const stats = fs.statSync(folderPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(folderPath);
      return files.reduce((total, file) => {
        const filePath = path.join(folderPath, file);
        const fileStats = fs.statSync(filePath);
        return total + (fileStats.isDirectory() ? 0 : fileStats.size);
      }, 0);
    }
    return stats.size;
  }

  listFilesInFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    return fs.readdirSync(folderPath).map((item) => {
      const itemPath = path.join(folderPath, item);
      const stats = fs.statSync(itemPath);
      return {
        name: item,
        path: path.relative(process.cwd(), itemPath),
        size: stats.size,
        modified: stats.mtime.toISOString(),
        isDirectory: stats.isDirectory(),
      };
    });
  }
}

const storage = new StorageManager('servers.json', './servers');
const folderManager = new FolderManager('./servers');
const fileManager = new FileManager('./servers');

function createserverfolder(directoryname) {
  try {
    const folderDetails = folderManager.createFolder(directoryname);
    console.log(`Carpeta creada:`, folderDetails);
    updatefolderinfo(directoryname);
    return folderDetails;
  } catch (error) {
    return error.message;
  }
}

function createserverfile(directoryname, filename, content) {
  try {
    const filePath = fileManager.createFile(directoryname, filename, content);
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
    const subfolderDetails = folderManager.createFolder(subfolderPath, true);
    updatefolderinfo(directoryname);
    return subfolderDetails;
  } catch (error) {
    return error.message;
  }
}

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
    //console.log(`Archivos en la carpeta '${folderName}':`, files);
    return files;
  } catch (error) {
    console.error(error.message);
  }
}
function getallfolderinfo() {
  try {
    const files = folderManager.getFolderDetails(".");
    console.log(`Archivos en la carpeta:`, files);
    return files;
  } catch (error) {
    console.error(error.message);
  }
}
function existsfolder(folderName) {
  try {
    const files = folderManager.getFolderDetails(folderName);
    console.log(`Existe la carpeta '${folderName}':`, files);
    return files;
  } catch (error) {
    console.error(error.message);
  }
}
export {
  createserverfolder,
  createserverfile,
  createsubfolder,
  getfolderinfo,
  updatefolderinfo,
  getallfolderinfo,
  existsfolder
};
