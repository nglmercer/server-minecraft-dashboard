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
  
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'GET',
          ...options,
        });
        const result = await this.handleResponse(response);
        if (cb) {
          cb(result);
          return; // No se retorna nada cuando se usa callback.
        }
        return result;
      } catch (error) {
        // Si se usa callback, puedes optar por manejar el error aquí o dejar que se propague.
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
      let cb = null;
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
  
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
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
    async handleResponse(response) {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${response.statusText}`, {
          cause: errorData,
        });
      }
      return response.json().catch(() => ({}));
    }
  }
  
  class MiAPI extends BaseAPI {
    constructor(baseURL) {
      // Se agrega '/api' al final de la URL base.
      super(`${baseURL}/api`);
    }
  }
  
  // Instanciación correcta de la API
  const api = new MiAPI('');
  
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
  api.get(`/servermanager/${window.localStorage.selectedServer}/log`)
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
  
  // Ejemplo de uso con callback:
  ServerManager.getServersList((servers) => {
    console.log('Lista de servidores:', servers);
  });
export {
  BaseAPI,
  MiAPI,
  api,
  ServerManager
}