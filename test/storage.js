import fs from "fs";
import path from "path";
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
class ConfigManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  // Obtener toda la configuración
  getConfig() {
    return this.storageManager.JSONget("config");
  }

  // Obtener una propiedad específica de la configuración
  getConfigProperty(property) {
    const config = this.getConfig();
    return config[property];
  }

  // Actualizar una propiedad específica de la configuración
  updateConfigProperty(property, value) {
    const config = this.getConfig();
    config[property] = value;
    this.storageManager.JSONset("config", config);
  }

  // Actualizar una propiedad anidada (por ejemplo, ftpd.port)
  updateNestedConfigProperty(path, value) {
    const config = this.getConfig();
    const keys = path.split('.');
    let current = config;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    this.storageManager.JSONset("config", config);
  }

  // Eliminar una propiedad específica de la configuración
  removeConfigProperty(property) {
    const config = this.getConfig();
    delete config[property];
    this.storageManager.JSONset("config", config);
  }
}
// Función para inicializar el objeto en el almacenamiento
function initializeStorage(fileName, basePath = '.') {
  const storageManager = new StorageManager(fileName, basePath);

  // Objeto predeterminado
  const defaultConfig = {
    language: "es",
    eulaAccepted: true,
    ftpd: {
      enabled: true,
      username: "kubek",
      password: "kubek",
      port: 21
    },
    authorization: false,
    allowOnlyIPsList: false,
    IPsAllowed: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "100.64.0.0/10", "127.0.0.1/32"],
    telegramBot: {
      enabled: false,
      token: "",
      chatIds: []
    },
    webserverPort: 3000,
    configVersion: 2
  };

  // Si el almacenamiento está vacío, inicializamos con el objeto predeterminado
  if (Object.keys(storageManager.getAll()).length === 0) {
    storageManager.JSONset("config", defaultConfig);
  }

  return storageManager;
}
// Inicializar el almacenamiento
const storageManager = initializeStorage("mainconfig.json");

// Crear el gestor
const configManager = new ConfigManager(storageManager);

// Obtener toda la configuración
console.log(configManager.getConfig());

// Obtener una propiedad específica
console.log(configManager.getConfigProperty("language")); // Output: "es"

// Actualizar una propiedad
configManager.updateConfigProperty("language", "en");
console.log(configManager.getConfigProperty("language")); // Output: "en"

// Actualizar una propiedad anidada
configManager.updateNestedConfigProperty("ftpd.port", 22);
console.log(configManager.getConfigProperty("ftpd").port); // Output: 22

// Eliminar una propiedad
configManager.removeConfigProperty("telegramBot");
console.log(configManager.getConfig()); // El objeto ya no tendrá la propiedad "telegramBot"
