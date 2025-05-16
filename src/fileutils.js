import fs from 'node:fs';
import path from 'node:path';
import { createGzip, createGunzip } from 'zlib';
import * as tar from 'tar';

// --- Constants from original main file ---
export const ALLOWED_EXTENSIONS = [
    ".txt", ".log", ".json", ".yaml", ".yml", ".ini", ".conf",
    ".properties", ".env", ".csv", ".tsv", ".md", ".xml", ".mcfunction",
    ".sh", ".bash", ".bat", ".zsh", ".ps1",
    "jpg", "png", "jar", ".gz" 
];

// --- Base Path Constants (as defined in your original fileutils.js) ---
// These are used for initialization and as defaults/references in the functions.
export const serverPathBase = path.resolve(process.cwd(), 'servers');
export const backupPathBase = path.resolve(process.cwd(), 'backups');
export const dataPathBase = path.resolve(process.cwd(), 'data'); // For StorageManager default

// --- Initialize Base Directories ---
if (!fs.existsSync(serverPathBase)) {
    fs.mkdirSync(serverPathBase, { recursive: true });
}
if (!fs.existsSync(backupPathBase)) {
    fs.mkdirSync(backupPathBase, { recursive: true });
}
if (!fs.existsSync(dataPathBase)) {
    fs.mkdirSync(dataPathBase, { recursive: true });
}


// --- Error Handling Interceptor ---
export function function_with_error_handling(fn) {
    return async (...args) => {
        try {
            const result = await fn(...args);
            return { success: true, data: result, error: null };
        } catch (error) {
            console.error(`Error in ${fn.name || 'operation'}: ${error.message}`);
            return { success: false, data: null, error: error.message, originalError: error };
        }
    };
}
// --- Internal Helper ---
function _isValidExtensionInternal(rawExtension) {
    if (!rawExtension) return false;
    const extLower = rawExtension.toLowerCase().startsWith('.') ? rawExtension.toLowerCase() : `.${rawExtension.toLowerCase()}`;
    return ALLOWED_EXTENSIONS.some(allowed => {
        const allowedLower = allowed.toLowerCase().startsWith('.') ? allowed.toLowerCase() : `.${allowed.toLowerCase()}`;
        return extLower === allowedLower;
    });
}

export async function checkFileValidity(filePath, options = {}) {
    // Opciones por defecto
    const defaultOptions = {
      allowedExtensions: ALLOWED_EXTENSIONS, // Usar la lista global actualizada
      maxSize: 1024 * 1024, // 1 MB en bytes
      checkContent: true
    };
    const { allowedExtensions, maxSize, checkContent } = { ...defaultOptions, ...options };
  
    const results = {
      isValid: true,
      details: {
        extension: { valid: false, message: '' },
        size: { valid: false, message: '' },
        content: { valid: true, message: '' }
      }
    };
  
    try {
      const ext = path.extname(filePath).toLowerCase(); // ext con punto: ".txt"
      const isAllowed = allowedExtensions.some(allowedExt => {
        const normalizedAllowedExt = allowedExt.startsWith('.') ? allowedExt.toLowerCase() : `.${allowedExt.toLowerCase()}`;
        return ext === normalizedAllowedExt;
      });

      if (!isAllowed) {
        results.details.extension.valid = false;
        results.details.extension.message = `Extensión no permitida: ${ext}`;
        results.isValid = false;
      } else {
        results.details.extension.valid = true;
        results.details.extension.message = `Extensión permitida: ${ext}`;
      }
  
      const stats = fs.statSync(filePath);
      if (stats.size > maxSize) {
        results.details.size.valid = false;
        results.details.size.message = `Tamaño excede el límite: ${stats.size} bytes > ${maxSize} bytes`;
        results.isValid = false;
      } else {
        results.details.size.valid = true;
        results.details.size.message = `Tamaño dentro del límite: ${stats.size} bytes <= ${maxSize} bytes`;
      }
  
      if (checkContent) {
        const buffer = fs.readFileSync(filePath, { encoding: null });
        const sample = buffer.slice(0, 1024).toString('utf8');
        if (!/^[\x20-\x7E\n\r\t]*$/.test(sample)) {
          results.details.content.valid = false;
          results.details.content.message = 'El archivo no parece ser texto plano';
          results.isValid = false;
        } else {
          results.details.content.valid = true;
          results.details.content.message = 'El archivo parece ser texto plano';
        }
      }
  
    } catch (error) {
      results.isValid = false;
      results.details.error = `Error al verificar el archivo: ${error.message}`;
    }
  
    return results;
  }
// --- File Operation Utilities ---

const _createFileLogic = (basePath, folderName, fileName, content = '') => {
    const folderPath = path.join(basePath, folderName);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const ext = path.extname(fileName).slice(1); // Extensión sin el punto
    if (!_isValidExtensionInternal(ext)) {
        throw new Error(`Extensión no permitida '${ext}'. Extensiones válidas: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    return filePath;
};
export const createFile = function_with_error_handling(_createFileLogic);

const _readFileLogic = (basePath, folderName, fileName) => {
    const filePath = path.join(basePath, folderName, fileName);
    if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }
    return fs.readFileSync(filePath, { encoding: 'utf8' });
};
export const readFile = function_with_error_handling(_readFileLogic);

const _renameFileLogic = (basePath, folderName, fileName, newName) => {
    const currentFolderPath = path.join(basePath, folderName);
    const oldFilePath = path.join(currentFolderPath, fileName); // fileName puede tener subdirectorios

    if (!fs.existsSync(oldFilePath)) {
        throw new Error(`El archivo '${fileName}' no existe en la carpeta '${folderName}'.`);
    }
    
    const fileDirWithinFolderName = path.dirname(fileName); // "subdir" o "."
    const newFilePath = path.join(currentFolderPath, fileDirWithinFolderName, newName);

    if (fs.existsSync(newFilePath)) {
        throw new Error(`El archivo '${newName}' ya existe en '${path.join(folderName, fileDirWithinFolderName)}'.`);
    }
    
    const newFileDirPath = path.dirname(newFilePath);
    if (!fs.existsSync(newFileDirPath)) {
        fs.mkdirSync(newFileDirPath, { recursive: true });
    }

    fs.renameSync(oldFilePath, newFilePath);
    return newFilePath;
};
export const renameFile = function_with_error_handling(_renameFileLogic);

const _readFileByPathLogic = (basePath, relativeFilePath) => {
    const fullPath = path.join(basePath, relativeFilePath);
    if (!relativeFilePath || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        return false; // Mimic original behavior returning false
    }
    return fs.readFileSync(fullPath, { encoding: 'utf8' });
};
export const readFileByPath = function_with_error_handling(_readFileByPathLogic);

const _writeFileLogic = (basePath, folderName, fileName, content) => {
    const folderPath = path.join(basePath, folderName);
    // Ensure parent folder exists
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const ext = path.extname(fileName).slice(1);
    if (!_isValidExtensionInternal(ext)) { // <<< AÑADIR VALIDACIÓN DE EXTENSIÓN
        throw new Error(`Extensión no permitida al escribir. Extensiones válidas: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    const filePath = path.join(folderPath, fileName);
    // No se lanza error si no existe, simplemente se crea/sobrescribe
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    return { result: true, fileName, folderName, content };
};
export const writeFile = function_with_error_handling(_writeFileLogic);

const _deletePathLogic = (basePath, relativePathFragment) => {
    const fullPath = path.join(basePath, relativePathFragment);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`El archivo o directorio '${relativePathFragment}' no existe en la base '${basePath}'.`);
    }
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
        fs.unlinkSync(fullPath);
    }
    return true; // Indicate success
};
export const deletePath = function_with_error_handling(_deletePathLogic);

const _listFilesLogic = (basePath, folderName) => {
    const folderPath = path.join(basePath, folderName);
    if (!fs.existsSync(folderPath)) {
        throw new Error(`La carpeta '${folderName}' no existe.`);
    }
    return fs.readdirSync(folderPath).filter((item) => {
        const itemPath = path.join(folderPath, item);
        return fs.statSync(itemPath).isFile();
    });
};
export const listFiles = function_with_error_handling(_listFilesLogic);

const _compressFileLogic = async (basePath, relativeFilePath, outputSubPath = null) => {
    const fullFilePath = path.join(basePath, relativeFilePath);
    if (!fs.existsSync(fullFilePath)) {
        throw new Error(`El archivo '${relativeFilePath}' no existe.`);
    }

    const compressedFileName = `${path.basename(relativeFilePath)}.gz`;
    // Output path logic: if outputSubPath is given, it's relative to basePath. Otherwise, next to original.
    const outputDir = outputSubPath ? path.join(basePath, outputSubPath) : path.dirname(fullFilePath);
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const compressedFilePath = path.join(outputDir, compressedFileName);
    const fileStream = fs.createReadStream(fullFilePath);
    const writeStream = fs.createWriteStream(compressedFilePath);
    const gzip = createGzip();

    fileStream.pipe(gzip).pipe(writeStream);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(compressedFilePath));
        writeStream.on('error', reject); // Interceptor will catch this
    });
};
export const compressFile = function_with_error_handling(_compressFileLogic);

const _decompressFileLogic = async (basePath, relativeCompressedFilePath, outputSubPath = null) => {
    const fullCompressedFilePath = path.join(basePath, relativeCompressedFilePath);
    if (!fs.existsSync(fullCompressedFilePath)) {
        throw new Error(`El archivo comprimido '${relativeCompressedFilePath}' no existe.`);
    }
    if (!relativeCompressedFilePath.endsWith('.gz')) {
        throw new Error(`El archivo '${relativeCompressedFilePath}' no es un archivo comprimido válido.`);
    }

    const originalFileName = path.basename(relativeCompressedFilePath, '.gz');
    const outputDir = outputSubPath ? path.join(basePath, outputSubPath) : path.dirname(fullCompressedFilePath);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const decompressedFilePath = path.join(outputDir, originalFileName);
    const fileStream = fs.createReadStream(fullCompressedFilePath);
    const writeStream = fs.createWriteStream(decompressedFilePath);
    const gunzip = createGunzip();

    fileStream.pipe(gunzip).pipe(writeStream);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(decompressedFilePath));
        writeStream.on('error', reject);
    });
};
export const decompressFile = function_with_error_handling(_decompressFileLogic);


// --- Folder Operation Utilities (Derived from FolderManager) ---

const _getFolderSizeLogic = (folderPath) => { // Expects absolute folderPath
    const stats = fs.statSync(folderPath);
    if (stats.isDirectory()) {
        const files = fs.readdirSync(folderPath);
        return files.reduce((total, file) => {
            const filePath = path.join(folderPath, file);
            const fileStats = fs.statSync(filePath);
            return total + (fileStats.isDirectory() ? 0 : fileStats.size);
        }, 0);
    }
    return stats.size; // Should not happen if called for a folder
};
// Not wrapped with interceptor as it's a helper, or can be if used directly

const _listDirectoryContentsLogic = (currentPath) => {
    if (!fs.existsSync(currentPath)) {
        return [];
    }
    return fs.readdirSync(currentPath).map((item) => {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);
        
        // Path logic from original listFilesInFolder (FolderManager)
        const relativeToProcessCwd = path.relative(process.cwd(), itemPath);
        const pathParts = relativeToProcessCwd.split(path.sep);
        let displayPath = relativeToProcessCwd;

        if (pathParts.length >= 2) {
            const baseSegmentsForRelative = pathParts.slice(0, 2); // e.g. ['servers', 'serverName']
            const dynamicBasePath = path.join(process.cwd(), ...baseSegmentsForRelative);
            displayPath = path.relative(dynamicBasePath, itemPath);
        }
        
        return {
            name: item,
            path: displayPath,
            size: stats.isDirectory() ? _getFolderSizeLogic(itemPath) : stats.size, // Get size for subfolders too
            modified: stats.mtime.toISOString(),
            isDirectory: stats.isDirectory(),
        };
    });
};
// Not wrapped with interceptor as it's a helper, or can be if used directly

const _getFolderDetailsLogic = (basePath, folderName) => {
    const folderPath = path.join(basePath, folderName);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        throw new Error(`La carpeta '${folderName}' no existe o no es un directorio.`);
    }
    const stats = fs.statSync(folderPath);
    return {
        name: folderName,
        path: path.relative(process.cwd(), folderPath),
        size: _getFolderSizeLogic(folderPath),
        modified: stats.mtime.toISOString(),
        files: _listDirectoryContentsLogic(folderPath), // list all contents
    };
};
export const getFolderDetails = function_with_error_handling(_getFolderDetailsLogic);


const _createFolderLogic = (basePath, folderNamePath, isSubFolder = false) => { // folderNamePath can be 'newFolder' or 'existing/newSubFolder'
    const folderPath = path.join(basePath, folderNamePath);
    if (fs.existsSync(folderPath)) {
        // To match original behavior, let's check if it's for subfolder details return
        if (!isSubFolder) throw new Error(`La carpeta '${folderNamePath}' ya existe.`);
        // If it exists and isSubFolder is true, original would proceed to return details.
        // However, original createFolder threw error. Let's stick to that for create.
        // If the goal is to get details of existing, use getFolderDetails.
        throw new Error(`La carpeta '${folderNamePath}' ya existe.`);
    }
    fs.mkdirSync(folderPath, { recursive: true });

    if (isSubFolder) { // Return minimal info for subfolder creation, as per original
        const stats = fs.statSync(folderPath);
        return {
            name: path.basename(folderNamePath),
            path: path.relative(process.cwd(), folderPath), // Path relative to cwd
            size: 0, // New folder
            modified: stats.mtime.toISOString(),
            isDirectory: true
        };
    }
    // For top-level folder creation, return full details
    return _getFolderDetailsLogic(basePath, folderNamePath);
};
export const createFolder = function_with_error_handling(_createFolderLogic);


const _deleteServerFolderLogic = (serversBasePath, serverName) => {
    const serverPathToDelete = path.join(serversBasePath, serverName);
    if (!fs.existsSync(serverPathToDelete)) {
        return false; // Mimic original behavior
    }
    if (!fs.statSync(serverPathToDelete).isDirectory()) {
        throw new Error(`'${serverName}' no es un directorio.`);
    }
    fs.rmSync(serverPathToDelete, { recursive: true, force: true });
    return true;
};
export const deleteServerFolder = function_with_error_handling(_deleteServerFolderLogic);


const _getBackupFolderPathLogic = () => { // Simple helper
    // backupPathBase is already initialized and ensured to exist
    return backupPathBase;
};
export const getBackupFolderPath = function_with_error_handling(_getBackupFolderPathLogic); // Wrap in case of future changes

const _compressFolderLogic = async (sourceFolderBasePath, folderToCompressName, outputFileName = null) => {
    const fullSourceFolderPath = path.join(sourceFolderBasePath, folderToCompressName);
    if (!fs.existsSync(fullSourceFolderPath) || !fs.statSync(fullSourceFolderPath).isDirectory()) {
        throw new Error(`La carpeta '${folderToCompressName}' no existe en '${sourceFolderBasePath}'.`);
    }

    const actualOutputFileName = outputFileName || `${folderToCompressName}.tar.gz`;
    const backupDir = _getBackupFolderPathLogic(); // Gets absolute backup path
    const outputPath = path.join(backupDir, actualOutputFileName);

    const outputDirForFile = path.dirname(outputPath);
    if (!fs.existsSync(outputDirForFile)) {
        fs.mkdirSync(outputDirForFile, { recursive: true });
    }
    
    return new Promise((resolve, reject) => {
        const outputStream = fs.createWriteStream(outputPath);
        const gzipStream = createGzip();

        tar.c(
            {
                cwd: fullSourceFolderPath, // Change working directory to the folder to compress
                gzip: false, // We will pipe to gzip manually for more control if needed, or use tar's gzip
                portable: true,
            },
            ['.'] // Archive all contents of cwd (fullSourceFolderPath)
        )
        .pipe(gzipStream)
        .pipe(outputStream)
        .on('finish', () => {
            console.log(`Carpeta comprimida en: ${outputPath}`);
            resolve(outputPath);
        })
        .on('error', (err) => {
            console.error(`Error al comprimir la carpeta ${folderToCompressName}:`, err);
            reject(err);
        });
    });
};
export const compressFolder = function_with_error_handling(_compressFolderLogic);

const _decompressFolderLogic = async (compressedFileNameInBackup, outputFolderNameInServers = null) => {
    const backupDir = _getBackupFolderPathLogic();
    const fullCompressedFilePath = path.join(backupDir, compressedFileNameInBackup);

    if (!fs.existsSync(fullCompressedFilePath)) {
        throw new Error(`El archivo comprimido '${compressedFileNameInBackup}' no existe en '${backupDir}'.`);
    }

    const actualOutputFolderName = outputFolderNameInServers || path.basename(compressedFileNameInBackup, '.tar.gz');
    const outputFolderPath = path.join(serverPathBase, actualOutputFolderName); // Decompress into servers base

    if (!fs.existsSync(outputFolderPath)) {
        fs.mkdirSync(outputFolderPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        fs.createReadStream(fullCompressedFilePath)
            .pipe(createGunzip())
            .pipe(
                tar.x({
                    cwd: outputFolderPath, // Extract in the target folder
                })
            )
            .on('finish', () => {
                console.log(`Archivo descomprimido en: ${outputFolderPath}`);
                resolve(outputFolderPath);
            })
            .on('error', (err) => {
                console.error(`Error al descomprimir ${compressedFileNameInBackup}:`, err);
                reject(err);
            });
    });
};
export const decompressFolder = function_with_error_handling(_decompressFolderLogic);


// --- Existing content from your fileutils.js ---

// --- Funciones de Validación Individuales --- (Copied from your fileutils.js)
export function isValidFilenamePattern(filename, patternRegex = /^[a-zA-Z0-9_.-]+$/) {
    if (!filename) {
        return false;
    }
    const regex = (typeof patternRegex === 'string') ? new RegExp(patternRegex) : patternRegex;
    return regex.test(filename);
}
export function isValidDirectoryName(directoryName, patternRegex = /^([a-zA-Z]:)?[\\/][\w\s\-\\.]+([\\/][\w\s\-\\.]+)*$/) {
    if (!directoryName) {
        return false;
    }
    const regex = (typeof patternRegex === 'string') ? new RegExp(patternRegex) : patternRegex;
    const isValid = regex.test(directoryName);
    console.log("regex",regex,directoryName,isValid);
    return isValid;
}
export function pathExists(filePath) {
    if (!filePath) return false;
    return fs.existsSync(filePath);
}
export function isFile(filePath) {
    if (!filePath || !pathExists(filePath)) {
        return false;
    }
    try {
        return fs.statSync(filePath).isFile();
    } catch (error) {
        return false;
    }
}
export function getFileExtension(filePath) {
    if (!filePath) {
        return null;
    }
    const ext = path.extname(filePath);
    return ext ? ext.toLowerCase() : null;
}
export function isAllowedFileType(filePath, allowedExtensions) {
    if (!Array.isArray(allowedExtensions) || allowedExtensions.length === 0) {
        return false; // Or true if no restrictions, depends on desired behavior
    }
    const fileExt = getFileExtension(filePath);
    if (fileExt === null && !allowedExtensions.includes('')) { // Handle files with no extension
        return false;
    }

    const normalizedAllowedExtensions = allowedExtensions.map(ext =>
        ext.startsWith('.') ? ext.toLowerCase() : (ext === '' ? '' : `.${ext.toLowerCase()}`)
    );
    
    return normalizedAllowedExtensions.includes(fileExt || '');
}

// --- Función Combinada de Validación --- (Copied from your fileutils.js)
export function validateFileAttributes(filePath, allowedExtensions, options = {}) {
    const defaults = {
        filenamePatternRegex: /^[a-zA-Z0-9_.-]+$/,
        checkPathExists: true,
        checkIsFile: true,
    };
    const config = { ...defaults, ...options };

    const results = {
        filePath: filePath,
        filename: path.basename(filePath),
        extension: getFileExtension(filePath),
        isValid: true,
        errors: [],
        checks: {
            pathExists: null,
            isFile: null,
            validFilenamePattern: false,
            allowedFileType: false,
        }
    };

    if (!filePath) {
        results.isValid = false;
        results.errors.push("La ruta del archivo está vacía.");
        results.checks.validFilenamePattern = false;
        results.checks.allowedFileType = false;
        if (config.checkPathExists) results.checks.pathExists = false;
        if (config.checkIsFile) results.checks.isFile = false;
        return results;
    }

    if (config.checkPathExists) {
        if (pathExists(filePath)) {
            results.checks.pathExists = true;
            if (config.checkIsFile) {
                if (isFile(filePath)) {
                    results.checks.isFile = true;
                } else {
                    // Allow validation if path is a directory and we are not strictly checking for file
                    // This part might need adjustment based on how it's used.
                    // For now, if checkIsFile is true, a directory is an error.
                    results.isValid = false;
                    results.errors.push(`La ruta '${filePath}' existe pero no es un archivo.`);
                    results.checks.isFile = false;
                }
            }
        } else {
            results.isValid = false;
            results.errors.push(`La ruta del archivo '${filePath}' no existe.`);
            results.checks.pathExists = false;
            if (config.checkIsFile) results.checks.isFile = false; // If path doesn't exist, it's not a file
        }
    }
    
    const filename = results.filename;
    // Validate filename pattern only if we have a filename (not just a path ending in /)
    if (filename) {
        if (isValidFilenamePattern(filename, config.filenamePatternRegex)) {
            results.checks.validFilenamePattern = true;
        } else {
            results.isValid = false;
            const patternString = config.filenamePatternRegex.toString();
            results.errors.push(`El nombre de archivo '${filename}' no cumple con el patrón '${patternString}'.`);
            results.checks.validFilenamePattern = false;
        }
    } else if (filePath && filePath.endsWith(path.sep)) { // It's a directory path
        // Filename pattern might not apply directly to directory paths ending with separator
        // Depending on use case, you might want to validate the last segment or skip
    } else if (filePath) { // Path doesn't end with separator but basename is empty (e.g. "/")
        results.isValid = false;
        results.errors.push(`La ruta '${filePath}' no tiene un nombre de archivo válido.`);
        results.checks.validFilenamePattern = false;
    }


    // Only check allowed file type if it's supposed to be a file or if path exists and is a file
    if (results.checks.isFile === true || (!config.checkIsFile && results.checks.pathExists === true)) {
      if (isAllowedFileType(filePath, allowedExtensions)) {
          results.checks.allowedFileType = true;
      } else {
          results.isValid = false;
          const ext = results.extension;
          if (ext !== null) { // Check ext !== null to avoid error for extensionless files if they are allowed
              results.errors.push(`El tipo de archivo '${ext}' no está permitido. Permitidos: ${allowedExtensions.join(', ')}.`);
          } else if (!allowedExtensions.includes('')) { // If no extension and '' is not in allowed extensions
              results.errors.push(`El archivo '${filename || filePath}' no tiene extensión o no es un tipo permitido. Permitidos: ${allowedExtensions.join(', ')}.`);
          }
          results.checks.allowedFileType = false;
      }
    } else if (config.checkIsFile && results.checks.isFile === false && results.checks.pathExists === true) {
        // It's a directory, so file type check might not be relevant or should pass vacuously
        // results.checks.allowedFileType = true; // Or false, depending on strictness
    }


    return results;
}

// StorageManager Class (Copied from your fileutils.js)
export class StorageManager {
    constructor(fileName, basePath = '.') {
      this.storePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);
  
      if (!fs.existsSync(this.storePath)) {
        fs.mkdirSync(this.storePath, { recursive: true });
      }
  
      this.fileName = fileName;
      this.filePath = path.join(this.storePath, this.fileName);
  
      if (fs.existsSync(this.filePath)) {
        try {
          const data = fs.readFileSync(this.filePath, { encoding: 'utf8' });
          this.store = JSON.parse(data);
        } catch (error) {
          console.warn(`Warning: Could not parse ${this.filePath}. Initializing with empty store. Error: ${error.message}`);
          this.store = {};
          this._saveStore();
        }
      } else {
        this.store = {};
        this._saveStore();
      }
    }
  
    _saveStore() {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), { encoding: 'utf8' });
      } catch (error) {
        console.error(`Error saving store to ${this.filePath}: ${error.message}`);
      }
    }
  
    set(key, value) {
      const keyStr = String(key);
      const valueStr = value === undefined ? "undefined" : (typeof value === "string" ? value : JSON.stringify(value));
      this.store[keyStr] = valueStr;
      this._saveStore();
    }
  
    get(key) {
      const keyStr = String(key);
      return this.store[keyStr];
    }
  
    JSONget(key) {
      const keyStr = String(key);
      if (this.store[keyStr] && typeof this.store[keyStr] === "string") {
        try {
          return JSON.parse(this.store[keyStr]);
        } catch (error) {
          console.warn(`Warning: Could not parse stored JSON for key '${keyStr}'. Returning raw string. Error: ${error.message}`);
          return this.store[keyStr]; 
        }
      }
      return this.store[keyStr]; // Return as is if not a string or already an object
    }
  
    JSONset(key, value) { // Assumes value is already a JS object/array to be stringified or is fine as is
      this.store[String(key)] = value; // Store the object directly
      this._saveStore();
    }
  
    remove(key) {
      const keyStr = String(key);
      if (Object.prototype.hasOwnProperty.call(this.store, keyStr)) {
        delete this.store[keyStr];
        this._saveStore();
      }
    }
  
    clear() {
      this.store = {};
      this._saveStore();
    }
  
    keys() {
      return Object.keys(this.store);
    }
  
    getAll() {
      return this.store;
    }
  
    setAll(store) {
      if (typeof store === 'object' && store !== null) {
        this.store = store;
        this._saveStore();
      } else {
        console.error("Error: setAll expects an object.");
      }
    }
}
  
// PathUtils Object (Copied from your fileutils.js)
export const PathUtils = {
    isValidFilenamePattern,
    isValidDirectoryName,
    pathExists,
    isFile,
    getFileExtension,
    isAllowedFileType,
    validateFileAttributes,
    serverPath: serverPathBase, 
    backupPath: backupPathBase, 
    binariesPath: path.resolve(process.cwd(), 'binaries'),
    dataPath: dataPathBase,
    dataPathBase,
    checkFileValidity
};
// Ensure binariesPath also exists if needed by application logic
const binariesPathConst = PathUtils.binariesPath;
if (!fs.existsSync(binariesPathConst)) {
    fs.mkdirSync(binariesPathConst, { recursive: true });
}