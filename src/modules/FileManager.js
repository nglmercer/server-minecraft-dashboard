import fs from 'fs';
import path from 'path';

const ALLOWED_EXTENSIONS = ['json', 'yaml', 'txt', 'properties', 'sh', 'bat', 'js'];

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

  // Escribir/Actualizar el contenido de un archivo en una carpeta específica
  writeFile(folderName, fileName, content) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }

    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
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
  listFilesInFolder(folderPath) {
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
  }
}
export {
  FileManager,
  FolderManager
}