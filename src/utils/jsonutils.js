import fs from "fs";
import path from "path";
import colors from "colors";
import stripAnsi from "strip-ansi";
import { fileURLToPath } from "url";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJSON = require("../../package.json");
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

    // Registrar mensajes de error
    error(...text) {
        return this.logMessage("ERR", colors.red, ...text);
    }

    // Mostrar mensaje de bienvenida de Kubek
    kubekWelcomeMessage() {
        console.log("");
        console.log(colors.cyan("your logo ASCII art here"));
        console.log("");
        console.log(colors.inverse(`${packageJSON.name} ${packageJSON.version}`));
        console.log(colors.inverse(packageJSON.repository.url.split("+")[1]));
        console.log("");
    }
}
class StorageManager {
  /**
   * Crea una instancia del StorageManager.
   * @param {string} fileName - El nombre del archivo donde se almacenarán los datos (por ejemplo, 'store.json').
   * @param {string} basePath - La ruta donde se creará o buscará el archivo. Si es relativa se usa process.cwd().
   */
  constructor(fileName, basePath = '.') {
    // Resuelve la ruta absoluta del directorio base.
    this.storePath = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);

    // Si el directorio no existe, se crea (incluyendo subdirectorios necesarios).
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    this.fileName = fileName;
    this.filePath = path.join(this.storePath, this.fileName);

    // Si el archivo existe, carga el contenido; de lo contrario, inicializa un objeto vacío.
    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, { encoding: 'utf8' });
        this.store = JSON.parse(data);
      } catch (error) {
        // Si ocurre algún error al parsear (archivo corrupto, por ejemplo), se reinicia el store.
        this.store = {};
        this._saveStore();
      }
    } else {
      this.store = {};
      this._saveStore();
    }
  }

  /**
   * Método privado para guardar el objeto store en el archivo.
   */
  _saveStore() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), { encoding: 'utf8' });
  }

  /**
   * Asigna un valor a una clave.
   * Si la clave ya existe, se reemplaza el valor.
   * @param {*} key - La clave a almacenar (se convertirá a string).
   * @param {*} value - El valor a almacenar (se convierte a string; si no es string se usa JSON.stringify,
   *                     y si es undefined se almacena la cadena "undefined").
   */
  set(key, value) {
    const keyStr = String(key);
    const valueStr =
      value === undefined ? "undefined" : (typeof value === "string" ? value : JSON.stringify(value));

    this.store[keyStr] = valueStr;
    this._saveStore();
  }

  /**
   * Recupera el valor asociado a la clave.
   * @param {*} key - La clave a buscar (se convierte a string).
   * @returns {string|undefined} - El valor almacenado o undefined si la clave no existe.
   */
  get(key) {
    const keyStr = String(key);
    return this.store[keyStr];
  }
  JSONget(key) {
    const keyStr = String(key);
    if (this.store[keyStr] && typeof this.store[keyStr] === "string") {
      return JSON.parse(this.store[keyStr]);
    }
    return this.store[keyStr];
  }
  JSONset(key,value){
    this.store[key] = value;
    this._saveStore();
  }
  /**
   * Elimina la clave y su valor asociado.
   * @param {*} key - La clave a eliminar (se convierte a string).
   */
  remove(key) {
    const keyStr = String(key);
    if (Object.prototype.hasOwnProperty.call(this.store, keyStr)) {
      delete this.store[keyStr];
      this._saveStore();
    }
  }

  /**
   * Elimina todas las claves y valores almacenados.
   */
  clear() {
    this.store = {};
    this._saveStore();
  }

  /**
   * Retorna un array con todas las claves almacenadas.
   * @returns {string[]} - Array de claves.
   */
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
export {Logger, StorageManager};