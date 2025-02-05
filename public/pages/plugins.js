// Configuración inicial de la UI
KubekUI.setTitle("Kubek | {{sections.plugins}}");

// Constantes para mejorar la mantenibilidad
const UI_SELECTORS = {
  PLUGINS: '#plugins-ui',
  MODS: '#mods-ui'
};

const ITEM_TYPES = {
  PLUGINS: 'plugins',
  MODS: 'mods'
};
selectedServer = window.localStorage.selectedServer;

class KubekPluginsUI {
  /**
   * Descarga un archivo desde una URL y lo sube al servidor.
   * @param {string} itemType - Tipo de archivo (plugin o mod).
   * @param {string} fileUrl - URL del archivo a descargar.
   */
  static async downloadAndUploadFromURL(itemType, fileUrl) {
    const uploadURL = `/${itemType}s/${selectedServer}/from-url`;

    try {
        // Validar la URL
        if (!fileUrl || !fileUrl.startsWith("http")) {
            throw new Error("URL inválida");
        }

        // Enviar la URL al servidor para que descargue el archivo
        KubekRequests.post(uploadURL, (response) => {
            if (response === true) {
                console.log("Archivo descargado y subido correctamente");
                pluginsAndModsController.refresh(itemType); // Actualizar la lista de plugins/mods
            } else {
                console.error("Error en el servidor:", response);
                KubekAlerts.addAlert("Error en el servidor", "error", response, 5000);
            }
        }, { url: fileUrl }); // Enviar la URL en el cuerpo de la solicitud

    } catch (error) {
        console.error("Error en downloadAndUploadFromURL:", error.message, itemType, fileUrl);
        KubekAlerts.addAlert("Error al descargar/subir el archivo", "error", error.message, 5000);
    }
}

  // Método existente para subir archivos locales
  static uploadItem(itemType) {
    const baseelement = `#server-${itemType}`;
    const inputElement = document.querySelector(`${baseelement}-input`);
    const uploadURL = `/${itemType}s/${selectedServer}`;

    inputElement.click();
    inputElement.addEventListener("change", () => {
      const formData = new FormData(document.querySelector(`${baseelement}-form`));
      KubekRequests.post(uploadURL, () => {
        pluginsAndModsController.refresh(itemType);
        console.log("Upload completed:", { uploadURL, selectedServer, formData });
      }, formData);
    });
  }
} 
document.addEventListener('download-request', (e) => {
  const details = e.detail;
  const isplugin_loader = ["Bukkit", "Spigot", "Paper", "Purpur", "Magma", "Velocity", "BungeeCord", "Waterfall", "WaterfallPlus", "BungeeCordPlus", "SpigotPlus", "PaperPlus", "PurpurPlus", "MagmaPlus"];
  const ismod_loader = ["Forge", "Fabric", "neoforge", "ForgePlus", "FabricPlus", "neoforgePlus"];
  if (details && details.files) {
    const ismodorplugin = details.loaders.some(loader => isplugin_loader.includes(loader)) ? "plugin" : "mod" || details.loaders.some(loader => ismod_loader.includes(loader)) ? "mod" : "plugin";
    // details.files is array of strings or objects
    if (Array.isArray(details.files)) {
      console.log("descargar string", details.files);
      KubekPluginsUI.downloadAndUploadFromURL(ismodorplugin, details.files[0]);
    } else {
      console.log("descargar array", details.files[0].url);
      KubekPluginsUI.downloadAndUploadFromURL(ismodorplugin, details.files[0].url);
    }

  }
});
//KubekPluginsUI.downloadAndUploadFromURL("plugin","https://github.com/minekube/connect-java/releases/download/latest/connect-spigot.jar");
 /// Clase principal para gestionar el estado de plugins y mods

class PluginsAndModsManager {
  constructor() {
    this._state = {
      plugins: [],
      mods: []
    };
    this._listeners = new Set();
  }

  // Getters
  get plugins() {
    return [...this._state.plugins];
  }

  get mods() {
    return [...this._state.mods];
  }

  // Gestión de suscripciones
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notifyListeners() {
    this._listeners.forEach(listener => listener(this._state));
  }

  // Métodos para actualizar el estado
  setPlugins(plugins) {
    this._state.plugins = [...plugins];
    this._notifyListeners();
  }

  setMods(mods) {
    this._state.mods = [...mods];
    this._notifyListeners();
  }

  // Métodos asíncronos para obtener datos
  async fetchPlugins() {
    return new Promise((resolve) => {
      KubekPlugins.getPluginsList((plugins) => {
        if (plugins) {
          this.setPlugins(plugins);
        }
        resolve(plugins);
      });
    });
  }

  async fetchMods() {
    return new Promise((resolve) => {
      KubekPlugins.getModsList((mods) => {
        if (mods) {
          this.setMods(mods);
        }
        resolve(mods);
      });
    });
  }
}

// Controlador principal para la lógica de negocio
class PluginsAndModsController {
  constructor() {
    this.manager = new PluginsAndModsManager();
    this.pluginsUI = document.querySelector(UI_SELECTORS.PLUGINS);
    this.modsUI = document.querySelector(UI_SELECTORS.MODS);
    this.initializeUI();
  }

  validateItemType(type) {
    const normalizedType = type.toLowerCase().trim();
    if (normalizedType.includes('plugin')) return ITEM_TYPES.PLUGINS;
    if (normalizedType.includes('mod')) return ITEM_TYPES.MODS;
    throw new Error(`Invalid item type: ${type}`);
  }

  async refresh(type) {
    const validType = this.validateItemType(type);
    try {
      if (validType === ITEM_TYPES.PLUGINS) {
        const plugins = await this.manager.fetchPlugins();
        console.log('Fetched plugins:', plugins);
      } else {
        const mods = await this.manager.fetchMods();
        console.log('Fetched mods:', mods);
      }
      this.updateUI(validType);
    } catch (error) {
      console.error(`Error refreshing ${validType}:`, error);
    }
  }

  updateUI(type) {
    const validType = this.validateItemType(type);
    const ui = validType === ITEM_TYPES.PLUGINS ? this.pluginsUI : this.modsUI;
    
    if (!ui) {
      console.error(`UI element for ${validType} not found`);
      return;
    }

    const items = validType === ITEM_TYPES.PLUGINS ? 
      this.manager.plugins : 
      this.manager.mods;

    console.log(`Updating ${validType} UI with:`, items);
    ui.setElementList(items);
    ui.renderAllLists(validType);
  }

  deleteItem(item, itemType) {
    const validType = this.validateItemType(itemType);
    const itemPath = `/${validType}/${item}`;

    KubekFileManager.delete(itemPath, (success) => {
      if (success) {
        const ui = validType === ITEM_TYPES.PLUGINS ? this.pluginsUI : this.modsUI;
        ui.removeElement(item);
        console.log(`${validType} item deleted:`, item);
      }
    });
  }

  toggleItem(item, itemType, newName) {
    const validType = this.validateItemType(itemType);
    
    if (newName) {
      const filePath = `/${validType}/${item}`;
      KubekFileManager.renameFile(filePath, newName, (success) => {
        if (success) {
          console.log(`${validType} item renamed:`, { from: item, to: newName });
          this.refresh(validType);
        }
      });
    }
  }

  initializeUI() {
    [ITEM_TYPES.PLUGINS, ITEM_TYPES.MODS].forEach(type => {
      const ui = type === ITEM_TYPES.PLUGINS ? this.pluginsUI : this.modsUI;
      
      if (ui) {
        ui.setType(type);
        ui.renderAllLists(type);

        // Configurar event listeners
        ['toggle', 'delete'].forEach(eventName => {
          ui.addEventListener(eventName, event => {
            const { item, type: eventType, newName } = event.detail;
            
            if (eventName === 'delete') {
              this.deleteItem(item, eventType);
            } else if (eventName === 'toggle') {
              this.toggleItem(item, eventType, newName);
            }
          });
        });
      }
    });
  }
}

// Inicialización
const pluginsAndModsController = new PluginsAndModsController();
pluginsAndModsController.refresh(ITEM_TYPES.PLUGINS);
pluginsAndModsController.refresh(ITEM_TYPES.MODS);