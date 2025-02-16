class WebDebugger {
  static isEnabled = true;
  static callSites = new Map();
  
  static toggleLogs(enable = !this.isEnabled) {
    this.isEnabled = enable;
  }

  static registerCallSite(file, line) {
    const error = new Error();
    // Agregar marca única para identificación más fácil
    error.isDebugMarker = true;
    this.callSites.set(error, { file, line });
    return error;
  }

  static log(...args) {
    if (!this.isEnabled) return;

    const error = new Error();
    const stackLines = error.stack?.split('\n') || [];
    let callerInfo = { file: 'Unknown', line: '0' };

    // Regex mejorado para múltiples formatos de stack trace
    const stackRegex = /(\S+):(\d+):(\d+)/;
    
    // Buscar primera línea relevante en el stack
    for (const line of stackLines.slice(2)) {
      const match = line.match(stackRegex);
      if (match) {
        callerInfo = { file: match[1], line: match[2] };
        break;
      }
    }

    // Buscar ubicación registrada usando marca
    const registeredSite = Array.from(this.callSites.entries()).find(([key]) => {
      return stackLines.some(line => line.includes(key.stack.split('\n')[0]));
    });

    if (registeredSite) {
      callerInfo = registeredSite[1];
      this.callSites.delete(registeredSite[0]);
    }

    const label = `${callerInfo.file}:${callerInfo.line}`;
    
    console.groupCollapsed(
      `%cDebug [${label}]`, 
      'color: #4CAF50; font-weight: bold; cursor: pointer;'
    );
    
    console.log(`%cCaller: ${label}`, 'color: #9E9E9E; font-size: 0.8em;');
    
    args.forEach(arg => {
      if (arg instanceof Error) {
        console.error('%cError:', 'color: #ff4444;', arg);
      } else if (typeof arg === 'object') {
        console.dir(arg);
      } else {
        console.log(arg);
      }
    });
    
    console.groupEnd();
  }

  static getcallSites() {
    return this.callSites;
  }
}
class DebuggerGroup {
  constructor(name) {
    this.name = name;
    this.isEnabled = true;
    this.callSites = new Map();
  }

  registerCallSite(file, line) {
    const error = new Error();
    this.callSites.set(error, { file, line });
    return error;
  }

  toggle(enable = !this.isEnabled) {
    this.isEnabled = enable;
  }

  log(...args) {
    if (!this.isEnabled) return;

    const error = new Error();
    const stackLines = error.stack?.split('\n') || [];
    let callerInfo = { file: 'Unknown', line: '0' };

    // Extracción de ubicación
    const stackRegex = /(\S+):(\d+):(\d+)/;
    for (const line of stackLines.slice(2)) {
      const match = line.match(stackRegex);
      if (match) {
        callerInfo = { file: match[1], line: match[2] };
        break;
      }
    }

    // Buscar ubicación registrada
    const registeredSite = Array.from(this.callSites.entries()).find(([key]) => {
      return stackLines.some(line => line.includes(key.stack.split('\n')[0]));
    });

    if (registeredSite) {
      callerInfo = registeredSite[1];
      this.callSites.delete(registeredSite[0]);
    }

    const label = `${callerInfo.file}:${callerInfo.line}`;
    
    console.groupCollapsed(
      `%c${this.name} [${label}]`, 
      'color: #4CAF50; font-weight: bold; cursor: pointer;'
    );
    
    console.log(`%cCaller: ${label}`, 'color: #9E9E9E; font-size: 0.8em;');
    
    args.forEach(arg => {
      if (arg instanceof Error) {
        console.error('%cError:', 'color: #ff4444;', arg);
      } else if (typeof arg === 'object') {
        console.dir(arg);
      } else {
        console.log(arg);
      }
    });
    
    console.groupEnd();
  }
}

class DebuggerGroupManager {
  static groups = new Map();

  static create(name) {
    if (!this.groups.has(name)) {
      this.groups.set(name, new DebuggerGroup(name));
    }
    return this.groups.get(name);
  }

  static get(name) {
    return this.groups.get(name);
  }

  static toggleGroup(name, enable) {
    const group = this.groups.get(name);
    if (group) group.toggle(enable);
  }

  static toggleAll(enable) {
    this.groups.forEach(group => group.toggle(enable));
  }
}
class CodeEditor {
    constructor(editorId, initialLanguage = 'plaintext') {
        this.editorElement = document.getElementById(editorId);
        this.initialContent = "";
        this.initialLanguage = initialLanguage;
        this.currentContent = this.initialContent;
        this.currentLanguage = initialLanguage;

        if (this.editorElement) {
            this.initializeEditor();
        }
    }

    initializeEditor() {
        this.editorElement.contentEditable = true;
        this.editorElement.innerHTML = this.initialContent;
        this.editorElement.style.whiteSpace = 'pre-wrap';

        hljs.highlightElement(this.editorElement);

        this.debouncedUpdateHighlight = this.debounce(this.updateHighlight.bind(this), 1000);
        this.editorElement.addEventListener('input', this.debouncedUpdateHighlight);
        this.editorElement.addEventListener('paste', this.handlePaste.bind(this));
    }

    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    saveCursorPosition(element) {
        const selection = window.getSelection();
        let cursorPosition = 0;
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            cursorPosition = preCaretRange.toString().length;
        }
        return cursorPosition;
    }

    restoreCursorPosition(element, cursorPosition) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let currentPosition = 0;
        let targetNode = null;
        let targetOffset = 0;

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const nodeLength = node.length;

            if (currentPosition + nodeLength >= cursorPosition) {
                targetNode = node;
                targetOffset = cursorPosition - currentPosition;
                break;
            }
            currentPosition += nodeLength;
        }

        if (targetNode) {
            const range = document.createRange();
            range.setStart(targetNode, targetOffset);
            range.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    updateHighlight() {
        const cursorPosition = this.saveCursorPosition(this.editorElement);
        this.currentContent = this.editorElement.innerText;

        const result = hljs.highlightAuto(this.currentContent);
        this.editorElement.innerHTML = result.value;
        this.currentLanguage = result.language;

        this.restoreCursorPosition(this.editorElement, cursorPosition);
    }

    handlePaste(event) {
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData('text');

        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
        }

        const inputEvent = new Event('input', { bubbles: true });
        this.editorElement.dispatchEvent(inputEvent);
    }

    getContent() {
        return this.currentContent;
    }

    getLanguage() {
        return this.currentLanguage;
    }

    resetToInitial(initialContent = this.initialContent, initialLanguage = this.initialLanguage) {
        this.currentContent = initialContent;
        this.currentLanguage = initialLanguage;
        this.editorElement.innerHTML = this.initialContent;
        hljs.highlightElement(this.editorElement);
    }

    setContent(content) {
        this.currentContent = content;
        const cursorPosition = this.saveCursorPosition(this.editorElement);
        this.editorElement.innerText = content;

        const result = hljs.highlightAuto(content);
        this.editorElement.innerHTML = result.value;
        this.restoreCursorPosition(this.editorElement, cursorPosition);
    }
}
function returnDialogOptions(labelName, className, callback) {
    return  {
      label: labelName,
      class: className,
      callback: () => {
        callback();
      }
    }
  }
function returnexploreroptions(idName, textName, iconName, callback) {
  return  {
    id: idName,
    text: textName,
    icon: iconName,
    callback: () => {
      callback();
    }
  }
}
class globalconfirmdialog {
    constructor(dialogID,contentID){
        this.dialog = document.getElementById(dialogID);
        this.content = document.getElementById(contentID);
    }
    show(){
        this.dialog.show();
    }
    hide(){
        this.dialog.hide();
    }
    setOptions(options){
        this.content.options = options;
    }
    setInfo(config){
        const {tittle, description} = config;
        this.content.setAttribute('title', tittle);
        this.content.setAttribute('description', description);
    }
}
const globaldialog = new globalconfirmdialog("globaldialog","globalmodal_content");


class KubekUtils {
  // Convertir tamaño de archivo a un formato legible por humanos
  static humanizeFileSize(size) {
      if (size < 1024) {
          size = size + " B";
      } else if (size < 1024 * 1024) {
          size = Math.round((size / 1024) * 10) / 10 + " Kb";
      } else if (size < 1024 * 1024 * 1024) {
          size = Math.round((size / 1024 / 1024) * 10) / 10 + " Mb";
      } else if (size >= 1024 * 1024 * 1024) {
          size = Math.round((size / 1024 / 1024 / 1024) * 10) / 10 + " Gb";
      } else {
          size = size + " ?";
      }
      return size;
  }

  // Convertir segundos a un formato legible por humanos
  static humanizeSeconds(seconds) {
      let hours = Math.floor(seconds / (60 * 60));
      let minutes = Math.floor((seconds % (60 * 60)) / 60);
      seconds = Math.floor(seconds % 60);

      return (
          this.padZero(hours) + "{{commons.h}} " +
          this.padZero(minutes) + "{{commons.m}} " +
          this.padZero(seconds) + "{{commons.s}}"
      );
  }

  // Añadir un cero delante de un número (para fechas)
  static padZero(number) {
      return (number < 10 ? "0" : "") + number;
  }

  // Seleccionar un color de degradado según una fracción
  static pickGradientFadeColor(fraction, color1, color2, color3) {
      let fade = fraction * 2;

      if (fade >= 1) {
          fade -= 1;
          color1 = color2;
          color2 = color3;
      }

      let diffRed = color2.red - color1.red;
      let diffGreen = color2.green - color1.green;
      let diffBlue = color2.blue - color1.blue;

      let gradient = {
          red: parseInt(Math.floor(color1.red + diffRed * fade), 10),
          green: parseInt(Math.floor(color1.green + diffGreen * fade), 10),
          blue: parseInt(Math.floor(color1.blue + diffBlue * fade), 10),
      };

      return `rgb(${gradient.red}, ${gradient.green}, ${gradient.blue})`;
  }

  // Obtener un color de degradado basado en el progreso
  static getProgressGradientColor(progress) {
      let color1 = { red: 46, green: 204, blue: 113 };
      let color2 = { red: 241, green: 196, blue: 15 };
      let color3 = { red: 231, green: 76, blue: 60 };

      return this.pickGradientFadeColor(progress / 100, color1, color2, color3);
  }

  // Generar un UUID v4
  static uuidv4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
          let r = Math.random() * 16 | 0; // Generar un número aleatorio entre 0 y 15
          let v = c === "x" ? r : (r & 0x3 | 0x8); // Usar 4 para la posición fija de versión y ajustar los bits de "y"
          return v.toString(16); // Convertir a hexadecimal
      });
  }


  // Obtener el nombre del archivo desde una ruta
  static pathFilename(path) {
      let rgx = /\\|\//gm;
      let spl = path.split(rgx);
      return spl[spl.length - 1];
  }

  // Obtener la extensión de un archivo desde una ruta
  static pathExt(path) {
      let spl = path.split(".");
      return spl[spl.length - 1];
  }

  // Hacer que los enlaces en un texto sean clicables
  static linkify(inputText) {
      let replacedText;
      let replacePattern1, replacePattern2, replacePattern3;

      // URLs que comienzan con http://, https:// o ftp://
      replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
      replacedText = inputText.replace(
          replacePattern1,
          '<a href="$1" target="_blank">$1</a>'
      );

      // URLs que comienzan con "www." (sin // delante)
      replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
      replacedText = replacedText.replace(
          replacePattern2,
          '$1<a href="http://$2" target="_blank">$2</a>'
      );

      // Convertir direcciones de correo electrónico en enlaces mailto
      replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
      replacedText = replacedText.replace(
          replacePattern3,
          '<a href="mailto:$1">$1</a>'
      );

      return replacedText;
  }
}
class KubekPredefined {
  // Права
  static PERMISSIONS = {
      DEFAULT: "default",
      ACCOUNTS: "accounts",
      FILE_MANAGER: "file_manager",
      MANAGE_SERVERS: "manage_servers",
      MAKING_SERVERS: "making_servers",
      MONITOR_SERVERS: "monitor_servers",
      MANAGE_JAVA: "manage_java",
      MANAGE_PLUGINS: "manage_plugins"
  };

  // См. название :)
  static API_ENDPOINT = "/api";

  // Переводы статусов серверов
  static SERVER_STATUSES_TRANSLATE = {
      "stopped": "{{serverStatus.stopped}}",
      "starting": "{{serverStatus.starting}}",
      "stopping": "{{serverStatus.stopping}}",
      "running": "{{serverStatus.running}}"
  }

  // Статусы серверов
  static SERVER_STATUSES = {
      STOPPED: "stopped",
      RUNNING: "running",
      STARTING: "starting",
      STOPPING: "stopping"
  }

  // Базовые типы задач
  static TASKS_TYPES = {
      DOWNLOADING: "downloading",
      INSTALLING: "installing",
      ZIPPING: "zipping",
      UNPACKING: "unpacking",
      UPDATING: "updating",
      RESTARTING: "restarting",
      CREATING: "creating",
      DELETION: "deletion",
      COMMON: "common",
      UNKNOWN: "unknown"
  }

  // Шаги создания сервера
  static SERVER_CREATION_STEPS = {
      SEARCHING_CORE: "searchingCore",
      CHECKING_JAVA: "checkingJava",
      DOWNLOADING_JAVA: "downloadingJava",
      UNPACKING_JAVA: "unpackingJava",
      DOWNLOADING_CORE: "downloadingCore",
      CREATING_BAT: "creatingBat",
      COMPLETION: "completion",
      COMPLETED: "completed",
      FAILED: "failed",
  }

  // REGEX для авторизации
  static PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,64}$/g;
  static LOGIN_REGEX = /^[a-zA-Z0-9_.-]{3,16}$/g;
  static EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;

  static MODAL_CANCEL_BTN = '<button class="dark-btn" onclick="KubekNotifyModal.destroyAllModals()">{{commons.close}}</button>';
}
let currentServerStatus = KubekPredefined.SERVER_STATUSES.STOPPED;
function getSelectedServer() {
    return window.localStorage.selectedServer;
}
// init logs
var uiDebugger = DebuggerGroupManager.create('UI');   
 uiDebugger.registerCallSite('kukeb-ui.js', 0).stack
 class KubekServerHeaderUI {
  /**
   * Refreshes the server header information
   * @param {Function} callback - Callback function to execute after refresh
   */
  static refreshServerHeader(callback) {
      this.loadServerByName(selectedServer, callback);
  }

  /**
   * Loads server information by server name and updates the UI
   * @param {string} server - Name of the server to load
   * @param {Function} callback - Callback function to execute after loading
   */
  static loadServerByName(server, callback = () => {}) {
      KubekServers.getServerInfo(server, (data) => {
          if (data && data.data) {
              //console.log("data getServerInfo", data);
              // Update server title
              const captionElement = document.querySelector('.content-header > .caption');
              if (captionElement) {
                  captionElement.textContent = server;
              }

              // Update server status
              this.setServerStatus(data.data);

              // Update server icon
              const iconElement = document.querySelector('.content-header .icon-bg img');
              if (iconElement) {
                //  iconElement.src = `/api/servers/${server}/icon?${Date.now()}`;
                iconElement.src = `../assets/kubek_icon.png `;
              }

              callback(true);
          } else {
              callback(false);
          }
      });
  }

  /**
   * Updates the server status in the header and shows/hides relevant buttons
   * @param {string} status - The new server status
   * @returns {boolean} - Success status of the update
   */
  static setServerStatus(status) {
      const statusElement = document.querySelector('status-element');
      
      if (!KubekPredefined.SERVER_STATUSES_TRANSLATE[status]) {
          return false;
      }

      currentServerStatus = status;
      WebDebugger.log("status", status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
      WebDebugger.toggleLogs(false);
      const actionButtons = document.querySelector('action-buttons');
      actionButtons.hideAllButtons();

      // Show relevant buttons based on status
      switch (status) {
        case KubekPredefined.SERVER_STATUSES.STARTING:
        case KubekPredefined.SERVER_STATUSES.STOPPING:
            statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
            actionButtons.showButton('more-server-actions');
            break;

        case KubekPredefined.SERVER_STATUSES.RUNNING:
            statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
            actionButtons.showButton('restart-server');
            actionButtons.showButton('stop-server');
            actionButtons.showButton('more-server-actions');
            break;

        case KubekPredefined.SERVER_STATUSES.STOPPED:
            actionButtons.showButton('start-server');
            statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
            break;
    }

      return true;
  }
}

class KubekAlerts {
    static stylesInjected = false;

    static injectStyles() {
        if (this.stylesInjected) return;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: translateY(0) translateX(-50%);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px) translateX(-50%);
                }
            }

            .animate__animated {
                animation-duration: 0.5s;
                animation-fill-mode: both;
            }

            .animate__faster {
                animation-duration: 0.3s !important;
            }

            .animate__fadeIn {
                animation-name: fadeIn;
            }

            .animate__fadeOut {
                animation-name: fadeOut;
            }

            .alert {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 12px;
                background: #1a1a1a;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                max-width: 90%;
                width: max-content;
                z-index: 1000;
                cursor: pointer;
                transition: 0.2s all ease;
            }

            .alert:hover {
            }

            .icon-bg {
                background: rgba(255, 255, 255, 0.1);
                padding: 8px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .icon-bg span {
                font-size: 20px;
                display: block;
                width: 24px;
                height: 24px;
            }

            .content-2 {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .caption {
                font-weight: 500;
                font-size: 14px;
                line-height: 1.4;
            }

            .description {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.4;
            }
        `;

        document.head.appendChild(style);
        this.stylesInjected = true;
    }

    static addAlert(
        text,
        icon = "info",
        description = "",
        duration = 5000,
        iconClasses = "",
        callback = () => {}
    ) {
        this.injectStyles();
        const newID = this.generateAlertID();
        
        const alertHTML = `
            <div id="alert-${newID}" class="alert animate__animated animate__fadeIn animate__faster">
                ${this.buildIconSection(icon, iconClasses)}
                ${this.buildContentSection(text, description)}
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHTML);
        const alertElement = document.getElementById(`alert-${newID}`);
        
        alertElement.addEventListener('click', () => this.handleAlertClick(alertElement, callback));
        
        if (duration > 0) {
            this.setAutoDismiss(alertElement, duration);
        }
    }

    static buildIconSection(icon, iconClasses) {
        const classes = iconClasses ? `icon-bg ${iconClasses}` : 'icon-bg';
        return `
            <div class="${classes}">
                <span class="material-symbols-rounded">${icon}</span>
            </div>
        `;
    }

    static buildContentSection(text, description) {
        return description 
            ? `<div class="content-2">
                <div class="caption">${text}</div>
                <div class="description">${description}</div>
               </div>`
            : `<div class="caption">${text}</div>`;
    }

    static handleAlertClick(alertElement, callback) {
        alertElement.remove();
        callback();
    }

    static setAutoDismiss(alertElement, duration) {
        setTimeout(() => {
            alertElement.classList.add('animate__fadeOut');
            alertElement.addEventListener('animationend', () => alertElement.remove());
        }, duration);
    }

    static generateAlertID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static removeAllAlerts() {
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
    }
}

let refreshIntervals = {};
let isItFirstLogRefresh = false;
let previousConsoleUpdateLength = 0;
let timeStampRegexp = /\[[0-9]{2}\:[0-9]{2}\:[0-9]{2}\]/gm;

class KubekRefresher {
    // Добавить рефреш-интервал
    static addRefreshInterval = (interval, handler, name) => {
        refreshIntervals[name] = setInterval(handler, interval);
    }

    // Удалить рефреш-интервал
    static removeRefreshInterval = (name) => {
        clearInterval(refreshIntervals[name]);
    }

    // Добавить интервал обновления server header (каждые 2 секунды)
    static addRefreshServerHeaderInterval = () => {

    };

    // Добавить интервал обновления использования рес-ов (каждые 4 сек)
    static addRefreshUsageInterval = () => {
    }

}

// Constants
 const FILE_NAME_REGEXP = /^[\w,\s-]+\.[A-Za-z]{1,15}$/gi;

let currentPath = "/";
let currentEditorLang = "plaintext";
let currentDataParts = [];
let currentChunkID = null;
let currentChunkWriting = null;

const editableExtensions = [
    "txt", "log", "yml", "xml", "cfg", "conf", "config",
    "json", "yaml", "properties", "sh", "bat","gz"
];

// Initialize on DOM load
const hoverStyles = `
    <style>
        .dropdown-item {
            background: var(--bg-dark-accent);
            border-radius: 8px;
            padding: 4px 8px;
            display: flex;
            flex-direction: row;
            align-items: center;
            cursor: pointer;
            height: 48px;
            font-size: 12pt;
            width: 100%;
        }
        .dropdown-item:hover {
            background: #2e3e53;
        }
    </style>
    `;

class KubekFileManagerUI {
    static async refreshDir(saveScroll = true) {
        try {
            let response = await awaitfilemanager.readDirectory(currentPath);
                                       // Sort data to put directories on top
            let data = response.data?.files;

                if (data && data.length > 0) {
                data = sortToDirsAndFiles(data);
            }

            const scrollData = saveScroll ? 
                document.querySelector(".fm-container").scrollTop : 0;
            const tableListElement = document.querySelector("#fm-table tbody");

            tableListElement.innerHTML = "";
            console.log("currentPath", currentPath, "data", data);
            const explorer = document.querySelector('file-explorer');
            explorer.data = data;
            
            document.getElementById('path-display').textContent = `Current Path: ${currentPath}`;

            document.getElementById("fm-table").scrollTop = scrollData;
        } catch (error) {
            console.error("Error:", error);
        }
    }
    static selectedServer = window.localStorage.selectedServer || "";
    static initaddeventlisteners() {
        const explorer = document.querySelector('file-explorer');
        explorer.addEventListener('item-dblclick', (e) => {
            explorer.setAttribute('current-path', currentPath);
            console.log('Double click en:', e.detail);
            if (!e.detail.item) { this.upperDir(); return; }
                const { path, name, type } = e.detail.item;
                explorer.setAttribute('current-path', currentPath);
                const verifycurrentpath = currentPath.endsWith("/") ? currentPath : currentPath + "/";
                console.log("verify", editableExtensions.includes(KubekUtils.pathExt(name)),"e",e.detail, currentPath, type, name, verifycurrentpath);
                if (type === 'directory') {
                    currentPath = verifycurrentpath + name;

                    KubekFileManagerUI.refreshDir();
                } else if (type === 'file' && 
                         editableExtensions.includes(KubekUtils.pathExt(name))) {
                            const filetoedit = verifycurrentpath + name
                            console.log("filetoedit", filetoedit);
                            newFileEditor.editFile(e.detail.item, filetoedit);
                }
        });

        explorer.addEventListener('item-contextmenu', (e) => {
            const verifycurrentpath = currentPath.endsWith("/") ? currentPath : currentPath + "/";
            const baseOptions = [
                returnexploreroptions('delete','{{commons.delete}}','delete', () => {
                        const path = verifycurrentpath + e.detail.item.name;
                        const Deletedialog = new globalconfirmdialog("globaldialog","globalmodal_content");
                        Deletedialog.setInfo({tittle: "{{commons.delete}}", description: "{{fileManager.areYouWantToDelete}} " + KubekUtils.pathFilename(path)});
                        Deletedialog.show();
                        const options = [
                            returnDialogOptions("{{commons.delete}}", "delete-btn",async () => {
                                const result = await KubekFileManagerUI.deleteFile(path);
                                if (result){
                                    console.log("result", result);
                                    KubekAlerts.addAlert(
                                        "{{commons.actionFailed}}", 
                                        "warning",
                                        "{{commons.delete}} " + KubekUtils.pathFilename(path),
                                        4000,
                                        "colored"
                                    );
                                    KubekFileManagerUI.refreshDir();
                                }
                            }),
                            returnDialogOptions("{{commons.cancel}}", "cancel-btn", () => {
                                Deletedialog.hide();
                            })
                        ];
                        Deletedialog.setOptions(options);
                    }),
                    returnexploreroptions('rename', '{{commons.rename}}', 'bookmark_manager', () => {
                        const path = verifycurrentpath + e.detail.item.name;
                        console.log("rename", e.detail, path);
                        editNameModal.editFile(e.detail.item.name, path);
                    })
            ];
            const downloadOptions = returnexploreroptions('download', '{{commons.download}}', 'download', () => {
                    const path = verifycurrentpath + e.detail.item.name;
                    console.log("download", e.detail, path);
                //    KubekFileManagerUI.downloadFile(path);
                })
            if (!e.detail.item) return;
            console.log('Posición y datos:', e.detail.x, e.detail.y, e.detail);
            const options = [...baseOptions];
            if (e.detail.item.type === 'file' || !e.detail.item.isDirectory) {
                options.push(downloadOptions);
            }
            const popupOptions = options.map(option => ({
                html: `${hoverStyles}
                    <div class="dropdown-item">
                        <span class="material-symbols-rounded">${option.icon}</span>
                        <span class="default-font">${option.text}</span>
                    </div>
                `,
                callback: () => option.callback(e.target)
            }));
            setPopupOptions(popupOptions);
            openPopup(e.detail.target);
            console.log("dataTarget baseOptions", baseOptions, e.target);
        });
    }

    static newDirectory() {
        KubekNotifyModal.askForInput(
            "{{fileManager.newDirectory}}",
            "create_new_folder",
            (txt) => {
                KubekFileManagerUI.newDirectory(currentPath, txt, () => {
                    KubekFileManagerUI.refreshDir();
                });
            },
            "",
            "{{commons.input}}",
            "",
            "text"
        );
    }

    static upperDir() {
        const pathParts = currentPath.split("/");
        pathParts.pop();
        pathParts.pop();
        currentPath = pathParts.join("/") + "/";
        KubekFileManagerUI.refreshDir(false);
        console.log("currentPath", currentPath);
    }

    static uploadFile() {
        const inputElement = document.getElementById("g-file-input");
        inputElement.click();
        
        // Remove old listener and add new one
        const oldListener = inputElement.onchange;
        if (oldListener) {
            inputElement.removeEventListener('change', oldListener);
        }
        inputElement.addEventListener("change", () => {
            const formData = new FormData(document.getElementById("g-file-form"));

            console.log("Archivo a enviar:", formData.get("file")); // Asegúrate de que se captura correctamente

        
            const server = window.localStorage.selectedServer; // Define el nombre del servidor
        
            fetch(`/api/filemanager/upload?server=${server}&path=${currentPath}`, {
                method: "POST",
                body: formData,
            })
            .then((response) => response.json())
            .then((data) => console.log("Archivo subido:", data))
            .catch((error) => console.error("Error al subir archivo:", error));
        });
        
    }
    static renameFile(path, newName) {
        console.log("rename", path, newName);
        return awaitRequests.get("/fileManager/rename?server=" + getselectedserver() + "&path=" + path + "&newName=" + newName);
    }
    static deleteFile(path) {
        return awaitRequests.get("/fileManager/delete?server=" + getselectedserver() + "&path=" + path);
    }
    static editFile(path) {
        const fileExt = KubekUtils.pathExt(path);
        const languageMap = {
            'xml': 'xml',
            'yml': 'yaml',
            'yaml': 'yaml',
            'css': 'css',
            'js': 'javascript',
            'json': 'json',
            'properties': 'ini'
        };
        
        currentEditorLang = languageMap[fileExt] || "plaintext";

        KubekFileManagerUI.readFile(path, (data) => {
        });
    }

    static async readFile(path, cb) {
        const response = await awaitfilemanager.readFile(path);
        console.log("readFile", path, response);
        cb(response.data);
    }
}

class newFileEditor {
    static lasteditfile;
    static lastfilenameTOEDIT;
    static async editFile(file, path) {
        const generateoptions = newFileEditor.generateoptions();
        newFileEditor.setOptions(generateoptions);
        newFileEditor.setTittle(file.name);
        newFileEditor.setFileContent(path);
        newFileEditor.show();
        this.show();
    }
    static generateoptions() {
        const options = [
            returnDialogOptions('Guardar', 'save-btn', async () => {
                    newFileEditor.hide();
                    if (newFileEditor.lasteditfile){
                        const contentTOSAVE =  newFileEditor.lasteditfile.getContent();
                        console.log("contentTOSAVE", contentTOSAVE);
                        const savefetch = await awaitfilemanager.writeFilebyName(window.localStorage.selectedServer, newFileEditor.lastfilenameTOEDIT, contentTOSAVE);
                        console.log("savefetch", savefetch);
                    }
                }),
            returnDialogOptions('borrar', 'delete-btn', () => {
                newFileEditor.hide();
            }),
            returnDialogOptions('Cancelar', 'cancel-btn', () => {
                newFileEditor.hide();
            })
        ];
        return options;
    }
    static show(){
        const dialogElement = document.querySelector('#File_editor_dialog');
        dialogElement.show();
    }
    static hide(){
        const dialogElement = document.querySelector('#File_editor_dialog');
        dialogElement.hide();
    }
    static async setOptions(options) {
        const dialogElement = document.querySelector('#File_editor_content');
        dialogElement.options = options;
    }
    static setTittle(tittle) {
        const dialogElement = document.querySelector('#File_editor_content');
        dialogElement.setAttribute('tittle', tittle);
        dialogElement.setAttribute('description', tittle);
    }
    static setFileContent(path){
        let filepath = typeof path !== 'string' ? path.path : path;
            if (!path || !path.includes('/')){
                filepath = '/'+path;
            }
            newFileEditor.readFile(filepath, (data) => {
                const fileditor = new CodeEditor('File_Editor', '# Initial code here', 'yaml');
                newFileEditor.lasteditfile = fileditor;
                newFileEditor.lastfilenameTOEDIT = filepath;
                fileditor.setContent(data);
            });
    }

    static async readFile(path, cb) {
        const response = await awaitfilemanager.readFile(path);
        console.log("readFile", path, response);
        cb(response.data);
    }
}
class editNameModal {
    static editFile(file, path) {
        const fileElement = document.querySelector('#EditName_Input');
        fileElement.value = file;
        // el simbolo de salto de linea es el caracter \n
        editNameModal.setTittle("archivo : \n"+ file + "\nubicacion : \n" + path);
        editNameModal.setFileContent(path);
        editNameModal.setOptions(editNameModal.generateoptions(path));
        console.log("fileElement", fileElement);
        editNameModal.show();
    }
    static show(){
        const dialogcontent = document.querySelector('#EditName_dialog');
        dialogcontent.show();
    }
    static hide(){
        const dialogcontent = document.querySelector('#EditName_dialog');
        dialogcontent.hide();
    }
    static async setOptions(options) {
        const dialogcontent = document.querySelector('#EditName_content');
        dialogcontent.options = options;
    }
    static setTittle(tittle) {
        const dialogcontent = document.querySelector('#EditName_content');
        dialogcontent.setAttribute('tittle', tittle);
        dialogcontent.setAttribute('description', tittle);
    }
    static setFileContent(path){
        let filepath = typeof path !== 'string' ? path.path : path;
            if (!path || !path.includes('/')){
                filepath = '/'+path;
            }
    }
    static generateoptions(path) {
        const options = [
            returnDialogOptions("{{commons.save}}", "save-btn", () => {
                const filenewname = document.querySelector('#EditName_Input').value;
                console.log("filenewname", filenewname, path);
                KubekFileManagerUI.renameFile(path, filenewname, () => {
                    KubekFileManagerUI.refreshDir()
                });
                editNameModal.hide();
                KubekFileManagerUI.refreshDir()
            }),
            returnDialogOptions("{{commons.cancel}}", "cancel-btn", () => {
                editNameModal.hide();
            })
        ];
        return options;
    }
}
function sortToDirsAndFiles(data) {
    let dirs = [];
    let files = [];
    data.forEach(function (item) {
        if (item.type === "directory" || item.isDirectory) {
            dirs.push(item);
        } else {
            files.push(item);
        }
    });
    let datanew = [];
    dirs.forEach(function (item) {
        datanew.push(item);
    });
    files.forEach(function (item) {
        datanew.push(item);
    });
    return datanew;
}



function openPopup(element, popupId = "#fm-popup") {
    const popupElement = document.querySelector(popupId);
    if (!popupElement) return;
    if (typeof element === "string") {
        const buttonElement  = document.querySelector(element);
            popupElement.showAtElement(buttonElement);
    } else {
        const buttonElement = element;
        popupElement.showAtElement(buttonElement);
    }
}


function setPopupOptions(popupOptions){
    const popupElement = document.querySelector('#fm-popup');
    popupElement.options = popupOptions;
}
function gettemplatebutton(text, icon) {
    return `${hoverStyles}
        <div class="dropdown-item">
            <span class="material-symbols-rounded">${icon}</span>
            <span class="default-font">${text}</span>
        </div>
    `;
}