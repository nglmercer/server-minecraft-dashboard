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
    constructor(editorId, initialContent = '', initialLanguage = 'plaintext') {
      this.editorElement = document.getElementById(editorId);
      this.initialContent = initialContent;
      this.initialLanguage = initialLanguage;
      this.currentContent = initialContent;
      this.currentLanguage = initialLanguage;
        if (this.editorElement) {
      this.initializeEditor();
        }
    }
  
    initializeEditor() {
      // Set initial content
      // set editable content
      this.editorElement.contentEditable = true;
      this.editorElement.innerHTML = this.initialContent;
      this.editorElement.style.whiteSpace = 'pre-wrap'; // O 'pre-line'
      // Highlight initial code
      hljs.highlightElement(this.editorElement);
  
      // Debounce function to limit the frequency of updates
      this.debouncedUpdateHighlight = this.debounce(this.updateHighlight.bind(this), 1000);
  
      // Listen for input events
      this.editorElement.addEventListener('input', this.debouncedUpdateHighlight);
  
      // Handle paste event to preserve spaces and line breaks
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
        console.log(`Cursor restored to position: ${cursorPosition}`);
      } else {
        console.error('Cursor position could not be restored');
      }
    }
  
    updateHighlight(currentContent) {
        // Save the current cursor position
        const cursorPosition = this.saveCursorPosition(this.editorElement);
        console.log(`Cursor position before update: ${cursorPosition}`);
      
        // Get the code content with line breaks
        this.currentContent = currentContent || this.editorElement.innerText
      
        // Highlight the code
        const result = hljs.highlightAuto(this.currentContent);
        console.log(`Language detected: ${result.language}`, result.value);
        this.editorElement.innerHTML = result.value;
        this.currentLanguage = result.language;
      
        // Restore the cursor position
        this.restoreCursorPosition(this.editorElement, cursorPosition);
      }
    handlePaste(event) {
      event.preventDefault(); // Prevent default paste behavior
  
      // Get pasted text
      const text = (event.clipboardData || window.clipboardData).getData('text');
  
      // Insert the pasted text at the cursor position
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents(); // Remove any selected text
        range.insertNode(document.createTextNode(text)); // Insert the pasted text
      }
  
      // Trigger input event to update highlighting
      const inputEvent = new Event('input', { bubbles: true });
      this.editorElement.dispatchEvent(inputEvent);
    }
  
    getContent() {
      return this.currentContent;
    }
  
    getLanguage() {
      return this.currentLanguage;
    }
  
    resetToInitial() {
      this.currentContent = this.initialContent;
      this.currentLanguage = this.initialLanguage;
      this.editorElement.innerHTML = this.initialContent;
      hljs.highlightElement(this.editorElement);
    }
  }

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
selectedServer = window.localStorage.selectedServer || "";
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
                  iconElement.src = `/api/servers/${server}/icon?${Date.now()}`;
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
class KubekUI {
    // Cargar sección en bloque - Reemplazamos $.get por fetch
    static loadSection = (name, container = "body", cb = () => {}) => {
        fetch(`/sections/${name}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(code => {
                console.log("Loading section:", name, container);
                //$(container).append(code);
                //container.appendChild(code);
                //document.querySelector(container).appendChild(code);
                cb();
            })
            .catch(error => {
                console.error('Error loading section:', error);
            });
    }

    static showPreloader() {

    }

    static hidePreloader() {

    }

    static changeItemByPage = (page) => {
        this.setAllSidebarItemsUnactive();
        this.setActiveItemByPage(page);
    }

    static loadSelectedServer = () => {
        if (typeof window.localStorage.selectedServer !== "undefined") {
            selectedServer = window.localStorage.selectedServer;
            KubekServerHeaderUI.loadServerByName(selectedServer, (result) => {
                uiDebugger.log('loadSelectedServer, loadServerByName',selectedServer, result);
                if (result === false) {
                    KubekServers.getServersList((list) => {
                        window.localStorage.selectedServer = list[0];
                        uiDebugger.log('loadSelectedServer, getServersList',selectedServer, list);
                    });
                }
            });
        } else {
            KubekServers.getServersList((list) => {
                uiDebugger.log('loadSelectedServer, getServersList',selectedServer, list);
                window.localStorage.selectedServer = list[0];
            });
        }
    }

    static loadServersList() {
            KubekServers.getServersList(data => {
                let servers = data.data?.files;
                const allserver = [];
                if (!servers) return;
                console.log("servers getServersList", servers);
                servers.forEach(data => {
                    let serverItem = data?.name ? data.name : data;
                    const sidebar = document.querySelector('server-menu') || document.getElementById("main-menu-sidebar");
                    setTimeout(() => {
                        sidebar.setActiveElement(window.localStorage.selectedServer);
                    }, 1000);
                    const parsedserver = {
                      title: serverItem,
                      icon: `/api/servers/${serverItem}/icon`
                    }
                    allserver.push(parsedserver);
                    sidebar.setServersList(allserver);
                    console.log("sidebar", sidebar, parsedserver, allserver);
                    uiDebugger.log('loadServersList, getServersList',serverItem, servers);
                    const isActive = serverItem === localStorage.selectedServer ? " active" : "";
                    const serverElement = document.createElement("div");
                    serverElement.className = `server-item sidebar-item${isActive}`;
                    serverElement.onclick = () => {
                        localStorage.selectedServer = serverItem;
                        location.reload();
                    };
                    serverElement.innerHTML = `
                        <div class="icon-circle-bg">
                            <img style="width: 24px; height: 24px;" alt="${serverItem}" src="/api/servers/${serverItem}/icon">
                        </div>
                        <span>${serverItem}</span>
                    `;
                    sidebar.appendChild(serverElement);
                });
            });

    }

    static connectionLost() {
       // KubekAlerts.addAlert("{{commons.connectionLost}}", "warning", moment().format("DD.MM / HH:MM:SS"), 6000);
        this.showPreloader();
    }

    static connectionRestored() {
       // KubekAlerts.addAlert("{{commons.connectionRestored}}", "check", moment().format("DD.MM / HH:MM:SS"), 3000);
        setTimeout(() => {
          //console.log("connectionRestored");
        }, 1000);
    }

    static toggleSidebar() {
        const sidebar = document.querySelector(".main-layout .sidebar");
        const blurScreen = document.querySelector(".blurScreen");

        if (window.matchMedia("(max-width: 1360px)").matches && sidebar) {
            if (sidebar.classList.contains("minimized")) {
                sidebar.classList.remove("minimized");
                if (blurScreen) blurScreen.style.display = "block";
            } else {
                sidebar.classList.add("minimized");
                if (blurScreen) blurScreen.style.display = "none";
            }
        }
    }

    static setTitle(title) {
        document.title = title;
    }
    static refreshConsoleLog = () => {
      let consoleTextElem = document.querySelector('game-console');
      if (consoleTextElem) {
          //console.log("consoleTextElem", consoleTextElem, typeof consoleTextElem);
          KubekServers.getServerLog(selectedServer, (data) => {
              if (!data) return;
              let log = data.data;
              //console.log("getServerLog", selectedServer, {data});
              consoleTextElem.refreshConsoleLog(log);
          });
      }
  }
}
 setInterval(() => {
  KubekUI.refreshConsoleLog();
}, 1000); 
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

const animateCSSJ = (element, animation, fast = true, prefix = "animate__") => {
    return new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        if (fast) {
            node.classList.add(`${prefix}animated`, animationName, `${prefix}faster`);
        } else {
            node.classList.add(`${prefix}animated`, animationName);
        }

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName, `${prefix}faster`);
            resolve("Animation ended");
        }

        node.addEventListener("animationend", handleAnimationEnd, { once: true });
    });
};
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
        this.addRefreshInterval(1500, () => {
            KubekServerHeaderUI.refreshServerHeader(() => {
            });
        }, "serverHeader");
    };

    // Добавить интервал обновления server log (каждые 650 мсек)
    static addRefreshServerLogInterval = () => {
        this.addRefreshInterval(650, () => {
            this.refreshConsoleLog();
        }, "serverConsole");
    };

    // Добавить интервал обновления использования рес-ов (каждые 4 сек)
    static addRefreshUsageInterval = () => {
        this.addRefreshInterval(5000, () => {
            if (typeof KubekConsoleUI !== "undefined") {
                KubekHardware.getUsage((usage) => {
                    if (!usage) return;
                    KubekConsoleUI.refreshUsageItems(usage.cpu, usage.ram.percent, usage.ram);
                });
            }
        }, "usage");
    }

    // Обновить текст в консоли
    static refreshConsoleLog = () => {
        let consoleTextElem = document.querySelector('game-console');
        if (consoleTextElem) {
            //console.log("consoleTextElem", consoleTextElem, typeof consoleTextElem);
            KubekServers.getServerLog(selectedServer, (data) => {
                if (!data) return;
                //console.log("getServerLog", selectedServer, {data});
                consoleTextElem.refreshConsoleLog(data.serverLog);
            });
        }
    }

    // Интервал обновления списка задач
    static addRefreshTasksInterval = () => {
        this.addRefreshInterval(500, () => {
            KubekTasksUI.refreshTasksList();
        }, "tasksList");
    }
}
if (!window.location.href.includes("login")) {
    KubekRefresher.addRefreshServerHeaderInterval();
    KubekRefresher.addRefreshUsageInterval();
    KubekUI.loadServersList(); 
}
 KubekRefresher.addRefreshServerLogInterval();
KubekRefresher.addRefreshTasksInterval(); 
// Constants
 const FILE_NAME_REGEXP = /^[\w,\s-]+\.[A-Za-z]{1,15}$/gi;

let currentPath = "/";
let currentEditorLang = "plaintext";
let currentDataParts = [];
let currentChunkID = null;
let currentChunkWriting = null;

const editableExtensions = [
    "txt", "log", "yml", "xml", "cfg", "conf", "config",
    "json", "yaml", "properties", "sh", "bat"
];

// Initialize on DOM load
    KubekUI.setTitle("Kubek | {{sections.fileManager}}");
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
                if (data.length > 0) {
                data = sortToDirsAndFiles(data);
            }

            let bindEvent = window.matchMedia("(min-width: 320px)").matches && 
                            window.matchMedia("(max-width: 480px)").matches ? "click" : "dblclick";

            // Save scroll position if needed
            const scrollData = saveScroll ? 
                document.querySelector(".fm-container").scrollTop : 0;
            const tableListElement = document.querySelector("#fm-table tbody");

            tableListElement.innerHTML = "";
            console.log("currentPath", currentPath, "data", data);
            const explorer = document.querySelector('file-explorer');
            explorer.data = data;
            
            document.getElementById('path-display').textContent = `Current Path: ${currentPath}`;
            // Bind breadcrumb events
            this.bindBreadcrumbClicks();

            document.getElementById("fm-table").scrollTop = scrollData;
        } catch (error) {
            console.error("Error:", error);
        }
    }
    static selectedServer = window.localStorage.selectedServer;
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
                            //KubekFileManagerUI.editFile(filetoedit);
                }
        });

        explorer.addEventListener('item-contextmenu', (e) => {
            const verifycurrentpath = currentPath.endsWith("/") ? currentPath : currentPath + "/";
            const baseOptions = [
                {
                    id: 'delete',
                    text: '{{commons.delete}}',
                    icon: 'delete',
                    callback: (dataTarget) => {
                        console.log('delete', dataTarget);
                        const path = verifycurrentpath + e.detail.item.name;
                        KubekNotifyModal.create(
                            "{{commons.delete}}", 
                            "{{fileManager.areYouWantToDelete}} " + KubekUtils.pathFilename(path),
                            "{{commons.delete}}", 
                            "delete",
                            () => {
                                KubekFileManagerUI.delete(path, (result) => {
                                    if (result === false) {
                                        KubekAlerts.addAlert(
                                            "{{commons.actionFailed}}", 
                                            "warning",
                                            "{{commons.delete}} " + KubekUtils.pathFilename(path),
                                            4000,
                                            "colored"
                                        );
                                    }
                                    KubekFileManagerUI.refreshDir();
                                });
                            },
                            KubekPredefined.MODAL_CANCEL_BTN
                        );
                    }
                },
                {
                    id: 'rename',
                    text: '{{commons.rename}}',
                    icon: 'bookmark_manager',
                    callback: (dataTarget) => {
                        console.log(dataTarget, e.detail.item, dataTarget);
                        const path = verifycurrentpath + e.detail.item.name;
                        KubekNotifyModal.askForInput(
                            "{{commons.rename}}",
                            "bookmark_manager",
                            (txt) => {
                                console.log("rename", path, txt);
                                KubekFileManagerUI.renameFile(path, txt, () => {
                                    KubekFileManagerUI.refreshDir();
                                });
                            },
                            "",
                            "{{fileManager.enterName}}",
                            KubekUtils.pathFilename(e.detail.item.name),
                            "text"
                        );
                    }
                }
            ];
            console.log('Click derecho en:', e.detail.item);
            if (!e.detail.item) return;
            console.log('Posición:', e.detail.x, e.detail.y);
            const options = [...baseOptions];

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
            console.log("dataTarget", baseOptions, e.target);
        });
    }


    static bindBreadcrumbClicks() {
        const breadcrumbLinks = document.querySelectorAll("#fm-breadcrumb a:not(:last-child)");
        
        breadcrumbLinks.forEach(link => {
            link.addEventListener("click", function() {
                if (this.textContent === this.selectedServer) {
                    KubekFileManagerUI.refreshDir(false);
                    return;
                }

                const currentIndex = Array.from(breadcrumbLinks).indexOf(this);
                
                breadcrumbLinks.forEach((item, index) => {
                    if (item.textContent !== this.selectedServer && index <= currentIndex) {
                        path += item.textContent + "/";
                    }
                });

                KubekFileManagerUI.refreshDir(false);
            });
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
            KubekRequests.post(
                `/fileManager/upload?server=${this.selectedServer}&path=${currentPath}`,
                () => { KubekFileManagerUI.refreshDir(); },
                formData
            );
        });
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
            const codeEdit = document.getElementById("code-edit");
            codeEdit.textContent = data;
            this.formatCode(false);
            
            document.querySelector(".blurScreen").style.display = "block";
            document.querySelector(".fileEditor input").value = KubekUtils.pathFilename(path);
            document.querySelector(".fileEditor").style.display = "block";
        });
    }

    static  async writeFile() {
        const inputElement = document.querySelector(".fileEditor input");
        if (!inputElement.value || !FILE_NAME_REGEXP.test(inputElement.value)) {
            return false;
        }
        const currentPathfile = currentPath.endsWith("/") ? currentPath : currentPath + "/";
        const path = currentPathfile + inputElement.value;
        const data = document.getElementById("code-edit").textContent;
        
        this.closeEditor();
        currentDataParts = data.match(/[\s\S]{1,500}/g) || [];
        currentChunkWriting = -1;
        try {
            const resultId = await awaitfilemanager.startChunkyFileWrite(path);
            currentChunkID = resultId.id
            console.log("Starting write for", currentChunkID, path,resultId);
            this.writeNextChunk();
            return true;
        } catch (error) {
            console.error("Error starting chunk write:", error, currentChunkID, path);
            return false;
        }
    }

    static writeNextChunk() {
        currentChunkWriting++;
        if (currentDataParts[currentChunkWriting]) {
            console.log("Writing chunk", currentChunkWriting, "to ID", currentChunkID);
            KubekFileManagerUI.addChunkWrite(
                currentChunkID,
                Base64.encodeURI(currentDataParts[currentChunkWriting]),
                () => { this.writeNextChunk(); }
            );
        } else {
            KubekFileManagerUI.endChunkWrite(currentChunkID, () => {
                console.log("Write of", currentChunkID, "ended");
                currentChunkID = null;
                currentDataParts = null;
                currentChunkWriting = null;
                KubekAlerts.addAlert("{{fileManager.writeEnd}}", "check", "", 4000);
                this.refreshDir();
            });
        }
    }

    static formatCode(saveCaret = true) {
        const codeEdit = document.getElementById("code-edit");
        let restore;
        
        if (saveCaret) {
            restore = saveCaretPosition(codeEdit);
        }

        const result = hljs.highlight(codeEdit.textContent, {
            language: currentEditorLang
        });
        
        codeEdit.innerHTML = result.value;
        
        if (saveCaret) {
            restore();
        }
    }

    static closeEditor() {
        document.querySelector(".fileEditor").style.display = "none";
        document.querySelector(".fileEditor input").value = "";
        document.getElementById("code-edit").textContent = "";
        document.querySelector(".blurScreen").style.display = "none";
    }
    static async readFile(path, cb) {
        const response = await awaitfilemanager.readFile(path);
        console.log("readFile", path, response);
        cb(response.data);
    }
}

class newFileEditor {
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
            {
                label: 'Guardar',
                class: "save-btn",
                callback: () => {
                    newFileEditor.hide();
                }
            },
            {
                label: 'borrar',
                class: "delete-btn",
                callback: () => {
                    newFileEditor.hide();
                }
            },
            {
                label: 'Cancelar',
                class: "cancel-btn",
                callback: () => {
                    newFileEditor.hide();
                }
            }
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
        const contentFile = newFileEditor.readFile(filepath, (data) => {
            const fileditor = new CodeEditor('File_Editor', '# Initial code here', 'yaml');

            fileditor.updateHighlight(data);
        }
        );
    }
    static async readFile(path, cb) {
        const response = await awaitfilemanager.readFile(path);
        console.log("readFile", path, response);
        cb(response.data);
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

function saveCaretPosition(context) {
    let selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        let range = selection.getRangeAt(0);
        range.setStart(context, 0);
        let len = range.toString().length;

        return function restore() {
            let pos = getTextNodeAtPosition(context, len);
            selection.removeAllRanges();
            let range = new Range();
            range.setStart(pos.node, pos.position);
            selection.addRange(range);

        }
    } else {
        return function restore() {
        }
    }
}

function getTextNodeAtPosition(root, index) {
    const NODE_TYPE = NodeFilter.SHOW_TEXT;
    let treeWalker = document.createTreeWalker(root, NODE_TYPE, function next(elem) {
        if (index > elem.textContent.length) {
            index -= elem.textContent.length;
            return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT;
    });
    let c = treeWalker.nextNode();
    return {
        node: c ? c : root,
        position: index
    };
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