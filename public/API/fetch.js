class BaseAPI {
    /**
     * @param {string} baseURL - URL base de la API, ej: 'https://miapi.com'
     */
    constructor(baseURL = '') {
      this.baseURL = baseURL;
    }
  
    /**
     * Realiza una petición GET a la API.
     * Si se pasa un callback como segundo parámetro, se ejecuta al obtener la respuesta.
     * @param {string} endpoint - Ruta del recurso, ej: '/users'
     * @param {object|function} [options] - Opciones adicionales para fetch o un callback.
     * @returns {Promise<object>|undefined} Respuesta en JSON o undefined si se usa callback.
     */
    async get(endpoint, options = {}) {
      let cb = null;
      // Si el segundo parámetro es una función, lo consideramos callback
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      
      // Definimos el tipo de respuesta; por defecto es 'json'
      const responseType = options.responseType || 'json';
    
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'GET',
          ...options,
        });
        const result = await this.handleResponse(response, responseType);
        if (cb) {
          cb(result);
          return; // No se retorna nada cuando se usa callback.
        }
        return result;
      } catch (error) {
        if (cb) throw error;
        throw error;
      }
    }
  
    /**
     * Realiza una petición POST a la API.
     * @param {string} endpoint - Ruta del recurso.
     * @param {object} data - Datos a enviar.
     * @param {object|function} [options] - Opciones adicionales para fetch o un callback.
     * @returns {Promise<object>|undefined}
     */
    async post(endpoint, data, options = {}) {
      console.log("post", endpoint, data, options);
      let cb = null;
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
    
      try {
        // Determinar el tipo de contenido apropiado
        let headers = {...(options.headers || {})};
        let body = data;
    
        // Si es FormData, no establecer Content-Type (el navegador lo hace automáticamente)
        if (!(data instanceof FormData)) {
          headers['Content-Type'] = 'application/json';
          // Si data no es un string, convertirlo a JSON
          if (typeof data !== 'string') {
            body = JSON.stringify(data);
          }
        }
    
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers: headers,
          body: body,
          ...(options.fetchOptions || {})
        });
    
        const result = await this.handleResponse(response);
        if (cb) {
          cb(result);
          return;
        }
        return result;
      } catch (error) {
        if (cb) cb(null, error);
        throw error;
      }
    }
    /**
     * Realiza una petición PUT a la API.
     * @param {string} endpoint - Ruta del recurso.
     * @param {object} data - Datos a actualizar.
     * @param {object|function} [options] - Opciones adicionales o callback.
     * @returns {Promise<object>|undefined}
     */
    async put(endpoint, data, options = {}) {
      let cb = null;
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
  
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
          body: JSON.stringify(data),
          ...options,
        });
        const result = await this.handleResponse(response);
        if (cb) {
          cb(result);
          return;
        }
        return result;
      } catch (error) {
        if (cb) throw error;
        throw error;
      }
    }
  
    /**
     * Realiza una petición DELETE a la API.
     * @param {string} endpoint - Ruta del recurso.
     * @param {object|function} [options] - Opciones adicionales o callback.
     * @returns {Promise<object>|undefined}
     */
    async delete(endpoint, options = {}) {
      let cb = null;
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
  
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'DELETE',
          ...options,
        });
        const result = await this.handleResponse(response);
        if (cb) {
          cb(result);
          return;
        }
        return result;
      } catch (error) {
        if (cb) throw error;
        throw error;
      }
    }
  
    /**
     * Maneja la respuesta de la petición.
     * Si la respuesta no es ok, lanza un error.
     * @param {Response} response - Objeto response de fetch.
     * @returns {Promise<object>} - La respuesta en formato JSON.
     */
    async handleResponse(response, responseType = 'json') {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Error ${response.status}: ${response.statusText}`, {
          cause: errorData,
        });
        throw new Error(`HTTP error ${response.status}`);
      }
      // Según el tipo de respuesta, retornamos blob o json
      if (responseType === 'blob') {
        return response.blob();
      }
      return response.json().catch(() => ({}));
    }
    
  }
  // Extiende la clase BaseAPI para centralizar las operaciones de backups.
  class BackupAPI extends BaseAPI {
    constructor(baseURL) {
      // Asumimos que los endpoints de backup están bajo '/api/backups'
      super(`${baseURL}/api/backups`);
    }

    // Crea un backup utilizando POST.
    async createBackup(foldername) {
      const uniqueBackupName = `${foldername}_${new Date().toISOString()}_backup.zip`;
      return this.post('/create', { folderName: foldername, outputFilename: uniqueBackupName });
    }

    // Elimina un backup utilizando POST.
    async deleteBackup(filename) {
      return this.post('/delete', { filename });
    }

    // Restaura un backup utilizando POST.
    async restoreBackup(filename, outputFolderName) {
      return this.post('/restore', { filename, outputFolderName });
    }

    // Descarga un backup. Aquí, como BaseAPI no contempla blobs,
    // se usa fetch directamente para obtener el archivo.
    async downloadBackup(filename) {
      const url = `${this.baseURL}/download/${filename}`;
      try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Error ${response.status}: ${response.statusText} - ${errorData.message || ''}`);
        }
        // Retornamos el blob para que luego puedas manipular la descarga.
        return response.blob();
      } catch (error) {
        console.error("Error durante la descarga:", error);
        throw error;
      }
    }
  }

  class MiAPI extends BaseAPI {
    constructor(baseURL) {
      // Se agrega '/api' al final de la URL base.
      super(`${baseURL}/api`);
    }
  }
  const backupAPI = new BackupAPI(''); 
  const api = new MiAPI('');
  class fileManager {a
    //async post(endpoint, data, options = {}) {
    static uploadFile({server,path,data}, cb) {
      //`/api/filemanager/upload?server=${server}&path=${currentPath}`
      return api.post(`/filemanager/upload?server=${server}&path=${path}`,data, cb);
    }
    static readFilebyPath(server, path, cb) {
      return api.get(`/filemanager/read-file-by-path/${server}/${path}`, cb);
    }
    //"/filemanager/serve-file/:serverName"
    static serveFile(server, path, cb) {
      return api.get(`/filemanager/serve-file/${server}/${path}`, cb);
    }
  }
  // Ejemplo de uso en una clase que administra el servidor:
  class ServerManager {
    // Obtener lista de servidores (usa callback si se provee, o retorna promesa)
    static getServersList(cb) {
      return api.get('/servers', cb);
    }
  
    // Obtener información de un servidor (incluyendo el estado)
    static getServerInfo(server, cb) {
      return api.get(`/servermanager/${server}/info`, cb);
    }
  
    // Verificar si un servidor existe (utilizando callback)
    static isServerExists(server, cb) {
      this.getServersList((sList) => {
        cb(sList.includes(server));
      });
    }
  
    // Obtener log del servidor
    static getServerLog(server, cb) {
      return api.get(`/servermanager/${server}/log`, (log) => {
        cb(log === false ? '' : log);
      });
    }
    static getServerPlayers(server, cb) {
      return api.get(`/servermanager/${server}/players`, (players) => {
        cb(players === false ? '' : players);
      });
    }
    static getServerMetrics(server, cb) {
      return api.get(`/servermanager/${server}/metrics`, (metrics) => {
        cb(metrics === false ? '' : metrics);
      });
    }
    // Enviar comando al servidor (sin callback, se usa la promesa)
    static sendCommandToServer(server, cmd) {
      return api.get(`/servermanager/${server}/send?cmd=${cmd}`);
    }
  
    // Enviar comando desde un input (por ejemplo, si inputElem contiene el comando)
    static sendCommandFromInput(server, inputElem) {
      if (inputElem.length === 1) {
        return this.sendCommandToServer(server, inputElem);
      }
    }
  
    // Iniciar servidor (requiere que se pase el estado actual para la validación)
    static startServer(server, currentServerStatus) {
      if (currentServerStatus === KubekPredefined.SERVER_STATUSES.STOPPED) {
        return api.get(`/servermanager/${server}/start`);
      }
    }
  
    // Reiniciar servidor
    static restartServer(server, currentServerStatus) {
      if (currentServerStatus === KubekPredefined.SERVER_STATUSES.RUNNING) {
        return api.get(`/servermanager/${server}/restart`);
      }
    }
  
    // Detener servidor
    static stopServer(server, currentServerStatus) {
      if (currentServerStatus === KubekPredefined.SERVER_STATUSES.RUNNING) {
        return api.get(`/servermanager/${server}/stop`);
      }
    }
    static createBackup(server) {
      return api.get(`/servermanager/${server}/backup`);
    }
    static getbackupservers(){
      return api.get(`/servermanager/backups`);
    }
  }
 //window.localStorage.selectedServer 
  // Ejemplo de uso directo sin callback (retorna promesa):
/*   api.get(`/servermanager/${window.localStorage.selectedServer}/log`)
    .then((data) => console.log(data))
    .catch((error) => console.error(error)); */
  
  // Ejemplo de uso con callback:
  class serverHardware {
    // Получить суммарную информацию о hardware
    static getSummary(cb){
      return  api.get("/hardware/summary", cb);
    }

    // Получить информацию об использовании ЦПУ, памяти и тд
    static getUsage(cb){
      return  api.get("/hardware/usage", cb);
    }
}

  ServerManager.getServersList((servers) => {
    console.log('Lista de servidores:', servers);
  });
  ServerManager.getServerMetrics(window.localStorage.selectedServer, (metrics) => {
    console.log('Métricas del servidor:', metrics);
  });
  ServerManager.getServerPlayers(window.localStorage.selectedServer, (players) => {
    console.log('Jugadores del servidor:', players);
  });
  function createBackup(servername) {
    return backupAPI.createBackup(servername);
  }
  function deleteBackup(filename) {
    return backupAPI.deleteBackup(filename);
  }
  function restoreBackup(filename, outputFolderName) {
    return backupAPI.restoreBackup(filename, outputFolderName);
  }
  function downloadBackup(filename) {
    return backupAPI.downloadBackup(filename);
  } 
export {
  BaseAPI,
  MiAPI,
  api,
  ServerManager,
  serverHardware,
  createBackup,
  deleteBackup,
  restoreBackup,
  downloadBackup,
  fileManager
}