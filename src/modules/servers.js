import fs from 'fs';
import path from 'path';

const ALLOWED_EXTENSIONS = ['json', 'yaml', 'txt', 'properties', 'sh', 'bat', 'js', 'jpg', 'png'];


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

    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    return filePath;
  }

  // Leer el contenido de un archivo en una carpeta específica
  readFile(folderName, fileName) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }

    return fs.readFileSync(filePath, { encoding: 'utf8' });
  }
  readFilebyPath(filePath) {
    const fileInfo = path.join(this.basePath, filePath);
    console.log("readFilebyPath", fileInfo);

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
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }

    fs.unlinkSync(filePath);
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

  // Listar archivos y subcarpetas dentro de una carpeta específica (superficialmente)
/*   listFilesInFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    return fs.readdirSync(folderPath).map((item) => {
      const itemPath = path.join(folderPath, item);
      const stats = fs.statSync(itemPath);
      return {
        name: item,
        path: path.relative(process.cwd(), itemPath), // Ruta relativa

        size: stats.size,
        modified: stats.mtime.toISOString(), // Fecha de la última modificación
        isDirectory: stats.isDirectory(), // Indicar si es un directorio
      };
    });
  } */
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
}
import StorageManager from '../utils.js';

// Configuración inicial
const storage = new StorageManager('servers.json', './servers');
const folderManager = new FolderManager('./servers');
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
    console.log(`Archivos en la subcarpeta '${folderName}':`, files);
    return files;
  } catch (error) {
    console.error(error.message);
  }
}
function readfilebyname(folderName, fileName) {
  try {
    let file = fileManager.readFilebyPath(filePath);
    console.log("readfilebyname", file);
    if (file === false) {
      file = folderManager.getFolderDetails(folderName);
      console.log("readfilebyname", file);

    }
    console.log("readfilebyname", file);
    return file;
  } catch (error) {
    console.error(error.message);
  }
}
function readfilebypath(filePath) {
  try {
    let file = fileManager.readFilebyPath(filePath);
    console.log("readfilebyname", file);
    if (file === false) {
      file = folderManager.getFolderDetails(filePath);
      console.log("readfilebyname", file);

    }
    console.log("readfilebyname", file);
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
  writeFilebyName
}