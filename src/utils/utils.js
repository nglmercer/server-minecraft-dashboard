import fs from "fs";
import path, { join } from "path";
import axios from "axios";
import colors from "colors";
import stripAnsi from "strip-ansi";
import { fileURLToPath } from "url";
import { createRequire } from 'module';
import { readdir } from "fs/promises";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CORES_CACHE_FILE_PATH = path.join(process.cwd(), "data", "cores.json"); // Más organizado en 'data'
const cacheDir = path.dirname(CORES_CACHE_FILE_PATH);
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}
class StorageManager {
  constructor(fileName, basePath = '.') {
    // Usar la función getBasePath para determinar la ruta correcta
    const resolvedBasePath = getBasePath();
    
    // Resolver la ruta del almacenamiento
    this.storePath = path.isAbsolute(basePath) 
      ? basePath 
      : path.join(resolvedBasePath, basePath);

    // Crear directorio si no existe
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    this.fileName = fileName;
    this.filePath = path.join(this.storePath, this.fileName);

    // Cargar o inicializar el store
    this._loadStore();
  }

  _loadStore() {
    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, { encoding: 'utf8' });
        this.store = JSON.parse(data);
      } catch (error) {
        console.error('Error al cargar store:', error);
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
      console.error('Error al guardar store:', error);
    }
  }

  set(key, value) {
    const keyStr = String(key);
    const valueStr = value === undefined ? "undefined" : 
      (typeof value === "string" ? value : JSON.stringify(value));
    
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
        console.error('Error al parsear JSON:', error);
        return this.store[keyStr];
      }
    }
    return this.store[keyStr];
  }

  JSONset(key, value) {
    this.store[key] = value;
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
    this.store = store;
    this._saveStore();
  }
}
function getBasePath() {
  if (process.env.NODE_ENV === 'development') {
    // En desarrollo, usar la ruta del proyecto
    return process.cwd();
  } else {
    // En producción (build), usar la ruta de recursos de la app
    return process.cwd();
    return path.join(process.resourcesPath, 'app');
    // Alternativa si los archivos están en el directorio de la app:
    // return app.getAppPath();
  }
}
// Ejemplo de uso:e
const storage = new StorageManager('store.json', './data');
/* // Guardar valores
storage.set('nombre', 'Juan');
storage.set(123, { edad: 30, ciudad: 'Madrid' });
storage.set('algo', undefined);
storage.set(undefined, undefined);
storage.set(null, null);
storage.set(true, true);
storage.set([], []);
storage.set({}, {});
storage.JSONset(false,{
    "name":"name"
})
// Recuperar valores
console.log(storage.get('nombre'));   // "Juan"
console.log(storage.get('123'));      // '{"edad":30,"ciudad":"Madrid"}'
console.log(storage.get('algo'));     // "undefined"

// Listar todas las claves
console.log(storage.keys());          // ["nombre", "123", "algo"]

// Eliminar una clave
storage.remove('nombre');
console.log(storage.keys());          // ["123", "algo"] */

// Limpiar el almacenamiento
//storage.clear();
//console.log(storage.getAll());          // []

class Logger {
    constructor() {
        this.LOGS_DIR = path.join(process.cwd(), "logs");
        this.ensureLogsDirExists();
    }

    // Crear directorio de logs si no existe
    ensureLogsDirExists() {
        if (!fs.existsSync(this.LOGS_DIR)) {
            fs.mkdirSync(this.LOGS_DIR, { recursive: true });
        }
    }

    // Formatear la hora actual
    getTimeFormatted() {
        const dateTime = new Date();
        return `[${dateTime.getHours().toString().padStart(2, "0")}:${dateTime.getMinutes().toString().padStart(2, "0")}:${dateTime.getSeconds().toString().padStart(2, "0")}.${dateTime.getMilliseconds().toString().padStart(3, "0")}]`;
    }

    // Obtener el nombre del archivo de log
    getLastLogFileName() {
        const dateTime = new Date();
        return `${dateTime.getDate().toString().padStart(2, "0")}-${(dateTime.getMonth() + 1).toString().padStart(2, "0")}-${dateTime.getFullYear()}.log`;
    }

    // Escribir una línea en el archivo de log
    async writeLineToLog(line) {
        const fileName = this.getLastLogFileName();
        const filePath = path.join(this.LOGS_DIR, fileName);

        try {
            await fs.promises.appendFile(filePath, `${line}\n`);
        } catch (err) {
            console.error(colors.red(`Error writing to log file: ${err.message}`));
        }
    }

    // Función auxiliar para formatear y registrar mensajes
    async logMessage(level, colorFn, ...text) {
      const preparedText = `${this.getTimeFormatted()} ${level ? `[${level}] ` : ""}${text.join(" ")}`;
      
      // Mostrar en consola con color
      console.log(colorFn ? colorFn(preparedText) : preparedText);
  
      // Escribir en el log sin colores
      await this.writeLineToLog(stripAnsi(preparedText));
  }

    // Registrar mensajes de log
    log(...text) {
        return this.logMessage("", null, ...text);
    }

    // Registrar mensajes de advertencia
    warning(...text) {
        return this.logMessage("WARN", colors.yellow, ...text);
    }
    warn(...text) {
        return this.logMessage("WARN", colors.yellow, ...text);
    }
    // Registrar mensajes de error
    error(...text) {
        return this.logMessage("ERR", colors.red, ...text);
    }
    info(...text) {
        return this.logMessage("INFO", colors.blue, ...text);
    }
    // Mostrar mensaje de bienvenida
    WelcomeMessage() {
        console.log("");
        console.log(colors.cyan("your logo ASCII art here"));
        console.log("");
    }
}
const getDataByURL = async (url, cb) => {
  if (cb) {
    axios
    .get(url)
    .then(function (response) {
        cb(response.data);
    })
    .catch(function (error) {
        cb(false);
        return console.error(error.data);
    });
  }
  try {
      const response = await axios.get(url);
      return response.data;
  } catch (error) {
      logger.warning(`Failed to fetch data from ${url}:`, error.message);
      return null;
  }
};

const isObjectsValid = (...objects) => {
  let validCount = 0;
  let summCount = objects.length;
  objects.forEach(function (obj) {
      if (typeof obj !== "undefined" && obj !== null) {
          validCount++;
      }
  });
  return summCount === validCount;
};
const downloadFileFromUrl = (fileConfig) => {
  const { url, filePath, cb } = fileConfig;

  // This function will either call the provided cb or resolve/reject the promise
  let resolvePromise, rejectPromise;
  let promise;

  if (typeof cb !== 'function') {
    promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
  }

  const handleResult = (success, messageOrError) => {
    if (typeof cb === 'function') {
      cb(success, messageOrError);
    } else if (promise) { // If cb is not a function, we are in promise mode
      if (success) {
        resolvePromise({ success: true, message: messageOrError === true ? "File downloaded successfully." : messageOrError });
      } else {
        rejectPromise({ success: false, message: messageOrError instanceof Error ? messageOrError.message : messageOrError });
      }
    } else {
      // Fallback if neither cb nor promise (should not happen with current logic but good for safety)
      if (success) {
        console.log("Download successful (no callback/promise handler):", messageOrError);
      } else {
        console.error("Download error (no callback/promise handler):", messageOrError);
      }
    }
  };

  try {
    // Validación de parámetros
    if (!isObjectsValid(url, filePath)) {
      handleResult(false, "Parámetros inválidos");
      return promise; // Return the promise if in promise mode, otherwise undefined (cb was called)
    }

    // Validación de URL
    if (!isValidUrl(url)) {
      handleResult(false, "URL inválida");
      return promise;
    }


    // fs.mkdirSync can throw, so it's better to wrap it or handle its potential error
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    } catch (dirError) {
        handleResult(false, `Error creando directorio: ${dirError.message}`);
        return promise;
    }


    // Descargar archivo
    axios({
      method: "get",
      url: url,
      responseType: "stream"
    })
    .then(response => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        handleResult(true, true); // true indicates generic success
      });
      writer.on("error", err => {
        // Attempt to delete the partially downloaded file, but don't let this error mask the original
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            // Log the unlink error, but report the original write error
            console.error(`Error al intentar eliminar ${filePath} después de un error de escritura: ${unlinkErr.message}`);
          }
          handleResult(false, `Error de escritura: ${err.message}`);
        });
      });
    })
    .catch(error => {
      // This catch is for axios request errors (e.g., network issue, 404)
      handleResult(false, `Error en la descarga: ${error.message}`);
    });

  } catch (error) {
    // This catch is for synchronous errors in the try block (e.g., path.join, initial validations if not returned)
    handleResult(false, `Error inesperado: ${error.message}`);
  }

  return promise; // If cb was provided, promise is undefined. If not, it's the Promise object.
};
export const isValidUrl = (url) => {
  if (!url || typeof url !== "string") {
      console.warn("isValidUrl: Invalid URL:", url);
      return false;
  }
  try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
      return false;
  }
};
const makeBaseDirs = (ArrayBasedirs = []) => {
  if (!Array.isArray(ArrayBasedirs)) return [];
  ArrayBasedirs.forEach(function (dir) {
      if (!fs.existsSync("./" + dir)) {
          fs.mkdirSync("./" + dir);
      }
  });
};
const testForRegexArray = (text, regexArray) => {
  let testResult = false;
  if (!regexArray || !Array.isArray(regexArray)) return text;
  regexArray.forEach((regexpItem) => {
      if (typeof regexpItem == "object" && text.match(regexpItem) !== null) {
          testResult = true;
      } else if (typeof regexpItem == "string" && regexpItem === text) {
          testResult = true;
      }
  });
  return testResult;
};
function generateSecureID(length = 18) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
  ).join('');
}
const logger = new Logger();
function detectUserLocale() {
  // Idioma predeterminado
  const defaultLocale = "en";
  return storage.get("lang") || defaultLocale;
}
const moveUploadedFile = (server, sourceFile, filePath, cb) => { 
  if (isObjectsValid(server, sourceFile.name)) {
      let uploadPath;
      uploadPath = "./servers/" + server + filePath;
      fs.mkdirSync(path.dirname(uploadPath), {recursive: true});
      sourceFile.mv(uploadPath, function (err) {
          if (err) {
              return cb(err);
          }

          cb(true);
      });
  } else {
      cb(400);
  }
}
const isBase64Valid = (str) => {
  try {
      // Verifica si la cadena es Base64 válida
      return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (err) {
      return false;
  }
};

function getImageBase64(input) {
  // Caso 1: Si es una ruta de archivo válida
  if (typeof input === "string" && fs.existsSync(input)) {
      try {
          const imageBuffer = fs.readFileSync(input);
          return imageBuffer.toString("base64");
      } catch (error) {
          console.error(`Error al leer el archivo: ${input}`, error);
          return null;
      }
  }

  // Caso 2: Si es un buffer
  if (Buffer.isBuffer(input)) {
      return input.toString("base64");
  }

  // Caso 3: Si es una cadena Base64 válida
  if (typeof input === "string" && isBase64Valid(input)) {
      return input; // Ya está en Base64, no es necesario convertirlo
  }

  // Caso por defecto
  return null;
}
const getPlatformInfo = () => {
  const isTermux = process.platform === 'android' || fs.existsSync('/data/data/com.termux');
  const isWindows = process.platform === "win32";
  const isLinux = process.platform === "linux";
  
  return {
      isTermux,
      isWindows, 
      isLinux,
      startScript: isWindows ? "start.bat" : "start.sh"
  };
};
const getSafeFilename = (url) => {
  if (!url || typeof url !== "string") {
      console.warn("isValidUrl: Invalid URL:", url);
      return false;
  }
  const parsed = new URL(url);
  return parsed.pathname
      .split("/")
      .pop()
      .replace(/[^a-z0-9\.]/gi, "_");
};
const fileExists = (filePath) => {
    return fs.existsSync(filePath);
};
const fetchData = async (url, config = {}) => {
  try {
      const response = await axios.get(url, config);
      return response.data;
  } catch (error) {
      logger.warning(`Fallo al obtener datos de ${url}:`, error.isAxiosError ? error.message : error);
      // Podrías querer devolver null, undefined, o relanzar un error más específico
      return null;
  }
};
const readCoresFile = () => {
  if (fs.existsSync(CORES_CACHE_FILE_PATH)) {
      try {
          const fileContent = fs.readFileSync(CORES_CACHE_FILE_PATH, "utf-8");
          return JSON.parse(fileContent);
      } catch (error) {
          logger.error(`Error al leer el archivo de caché de cores (${CORES_CACHE_FILE_PATH}):`, error);
          return null;
      }
  }
  return null;
};

const writeCoresFile = (data) => {
  try {
      fs.writeFileSync(CORES_CACHE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
      logger.error(`Error al escribir en el archivo de caché de cores (${CORES_CACHE_FILE_PATH}):`, error);
  }
};

const isDataRecent = (data, maxAgeInMs = 24 * 60 * 60 * 1000) => { // 1 día por defecto
  if (!data || !data.lastUpdated) return false;
  const now = new Date();
  const lastUpdated = new Date(data.lastUpdated);
  return (now - lastUpdated) < maxAgeInMs;
};
async function getFileNames(directoryPath) {
  try {
    // Resolver la ruta absoluta basada en el entorno
    const basePath = getBasePath();
    const fullPath = path.isAbsolute(directoryPath) 
      ? directoryPath 
      : path.join(basePath, directoryPath);
    
    console.log(`Intentando leer directorio: ${fullPath}`);
    
    // Verificar si el directorio existe
    if (!fs.existsSync(fullPath)) {
      console.warn(`Directorio no encontrado: ${fullPath}`);
      return [];
    }
    
    const files = await readdir(fullPath, { withFileTypes: true });
    return files
      .filter(file => file.isFile())
      .map(file => file.name);
  } catch (error) {
    console.error("Error al leer la carpeta:", error);
    return [];
  }
}
export { 
  StorageManager, 
  storage, 
  getDataByURL,
  Logger,
  logger, 
  isObjectsValid, 
  generateSecureID, 
  detectUserLocale,
  testForRegexArray, 
  moveUploadedFile,
  getImageBase64,
  getPlatformInfo,
  downloadFileFromUrl,
  getSafeFilename,
  makeBaseDirs,
  fileExists,
  fetchData,
  isDataRecent,
  writeCoresFile,
  readCoresFile,
  getFileNames
};
export default StorageManager;