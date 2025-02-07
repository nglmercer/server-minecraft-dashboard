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
// Función para inicializar el almacenamiento de servidores
function initializeServerStorage(fileName, basePath = '.') {
  const storageManager = new StorageManager(fileName, basePath);

  // Estructura predeterminada para server.json
  const defaultServers = {
    test11123: {
      status: "stopped",
      restartOnError: true,
      maxRestartAttempts: 3,
      game: "minecraft",
      minecraftType: "java",
      stopCommand: "stop"
    },
    test123123123: {
      status: "stopped",
      restartOnError: true,
      maxRestartAttempts: 3,
      game: "minecraft",
      minecraftType: "java",
      stopCommand: "stop"
    }
  };

  // Si el almacenamiento está vacío, inicializamos con la estructura predeterminada
  if (Object.keys(storageManager.getAll()).length === 0) {
    storageManager.JSONset("servers", defaultServers);
  }

  return storageManager;
}
class ServerManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  // Obtener todos los servidores
  getAllServers() {
    return this.storageManager.JSONget("servers") || {};
  }

  // Obtener un servidor específico por su nombre
  getServer(serverName) {
    const servers = this.getAllServers();
    return servers[serverName];
  }

  // Agregar o actualizar un servidor
  addOrUpdateServer(serverName, serverConfig) {
    const servers = this.getAllServers();
    servers[serverName] = serverConfig;
    this.storageManager.JSONset("servers", servers);
  }

  // Eliminar un servidor
  removeServer(serverName) {
    const servers = this.getAllServers();
    if (servers[serverName]) {
      delete servers[serverName];
      this.storageManager.JSONset("servers", servers);
    }
  }

  // Actualizar una propiedad específica de un servidor
  updateServerProperty(serverName, property, value) {
    const servers = this.getAllServers();
    if (servers[serverName]) {
      servers[serverName][property] = value;
      this.storageManager.JSONset("servers", servers);
    }
  }

  // Actualizar una propiedad anidada de un servidor
  updateNestedServerProperty(serverName, path, value) {
    const servers = this.getAllServers();
    if (servers[serverName]) {
      const keys = path.split('.');
      let current = servers[serverName];

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      this.storageManager.JSONset("servers", servers);
    }
  }

  // Cambiar el estado de un servidor
  changeServerStatus(serverName, status) {
    this.updateServerProperty(serverName, "status", status);
  }
}
// Inicializar el almacenamiento
const storageManager = initializeServerStorage("server.json");

// Crear el gestor
const serverManager = new ServerManager(storageManager);

// Obtener todos los servidores
console.log(serverManager.getAllServers());

// Obtener un servidor específico
console.log(serverManager.getServer("test11123"));

// Agregar un nuevo servidor
serverManager.addOrUpdateServer("newServer", {
  status: "running",
  restartOnError: false,
  maxRestartAttempts: 5,
  game: "minecraft",
  minecraftType: "bedrock",
  stopCommand: "quit"
});
console.log(serverManager.getAllServers());

// Actualizar una propiedad específica de un servidor
serverManager.updateServerProperty("test11123", "status", "running");
console.log(serverManager.getServer("test11123"));

// Actualizar una propiedad anidada
serverManager.updateNestedServerProperty("test11123", "maxRestartAttempts", 5);
console.log(serverManager.getServer("test11123"));

// Cambiar el estado de un servidor
serverManager.changeServerStatus("test123123123", "stopped");
console.log(serverManager.getServer("test123123123"));

// Eliminar un servidor
serverManager.removeServer("test123123123");
console.log(serverManager.getAllServers());