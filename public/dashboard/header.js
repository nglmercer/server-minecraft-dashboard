import { fileManager, ServerManager} from '../API/fetch.js';
import { PREDEFINED } from './constants.js';
const uploadServerIconBtn = document.getElementById('uploadServerIconBtn');
uploadServerIconBtn.addEventListener('click', () => {
    uploadServerIcon();
});
const Eula_dialog = document.querySelector("#Eula_dialog");
Eula_dialog.options = [
    {
        label: "{{commons.iAccept}}",
        class: "save-btn",
        callback: () => {
            console.log("accept");
            KubekRequests.get("/kubek/eula/accept", () => {
                window.location.reload();
            });
        }
    }
    ];	
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let act = urlParams.get("act");
let currentServerStatus = "stopped";
function uploadServerIcon() {
    const inputElement = document.getElementById("g-file-input");
    
    // Limitar a solo archivos de imagen
    inputElement.accept = "image/*";
    
    inputElement.click();
    
    // Remove old listener and add new one
    const oldListener = inputElement.onchange;
    if (oldListener) {
      inputElement.removeEventListener('change', oldListener);
    }
    
    const iconPath = "./";
    inputElement.addEventListener("change", (event) => {
      const file = inputElement.files[0];
      
      // Verificar si es una imagen
      if (!file.type.startsWith('image/')) {
        alert("Por favor, selecciona solo archivos de imagen.");
        return;
      }
      
      // Determinar la extensión correcta basada en el tipo de archivo
      let fileExtension = "png"; // Por defecto
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        fileExtension = "jpg";
      } else if (file.type === "image/png") {
        fileExtension = "png";
      } else if (file.type === "image/gif") {
        fileExtension = "gif";
      } else if (file.type === "image/webp") {
        fileExtension = "webp";
      }
      
      // Crear un nuevo nombre de archivo
      const newFileName = `icon.${fileExtension}`;
      
      // Crear un nuevo objeto File con el nuevo nombre
      const renamedFile = new File([file], newFileName, {
        type: file.type,
        lastModified: file.lastModified
      });
      
      const formData = new FormData();
      formData.append("file", renamedFile);
      
      console.log("Archivo a enviar:", formData.get("file")); // Debería mostrar el archivo renombrado
      
      const server = window.localStorage.selectedServer;
      fileManager.uploadFile({
        server,
        path: iconPath,
        data: formData
      }, (success) => {
        console.log("uploadFile", success);
      });
    });
  }
function getSeverIcon() {
    const server = window.localStorage.selectedServer;
    const iconPath = "/icon.png";
    //const serverName = req.params.serverName;
    //static serveFile(serverName, cb) {
    //return api.get(`/filemanager/serve-file/${serverName}`, cb);}

    const iconFile = fileManager.serveFile(server, iconPath,{ responseType: 'blob' })  .then(blob => {
        // blob es el objeto obtenido
        const iconElement = document.querySelector('#server-icon');
        iconElement.src = URL.createObjectURL(blob); //window.location.origin + "/api/filemanager/serve-file/" + server + "/icon.png";
      })
      .catch(error => console.error("Error al cargar el icono:", error));
}
getSeverIcon();

function setServerStatus(status) {
    const statusElement = document.querySelector('status-element');
    
    if (!PREDEFINED.SERVER_STATUSES_TRANSLATE[status]) {
        return false;
    }

    currentServerStatus = status;
  //  console.log("status", status, PREDEFINED.SERVER_STATUSES_TRANSLATE[status]);
//    WebDebugger.log("status", status, PREDEFINED.SERVER_STATUSES_TRANSLATE[status]);
    const actionButtons = document.querySelector('action-buttons');
    actionButtons.hideAllButtons();

    // Show relevant buttons based on status
    switch (status) {
      case PREDEFINED.SERVER_STATUSES.STARTING:
      case PREDEFINED.SERVER_STATUSES.STOPPING:
          statusElement.updateStatus(status, PREDEFINED.SERVER_STATUSES_TRANSLATE[status]);
          actionButtons.showButton('more-server-actions');
          break;

      case PREDEFINED.SERVER_STATUSES.RUNNING:
          statusElement.updateStatus(status, PREDEFINED.SERVER_STATUSES_TRANSLATE[status]);
          actionButtons.showButton('restart-server');
          actionButtons.showButton('stop-server');
          actionButtons.showButton('more-server-actions');
          break;

      case PREDEFINED.SERVER_STATUSES.STOPPED:
          actionButtons.showButton('start-server');
          statusElement.updateStatus(status, PREDEFINED.SERVER_STATUSES_TRANSLATE[status]);
          break;
  }

    return true;
}
function loadServerByName(server, callback = () => {}) {
    ServerManager.getServerInfo(server, (data) => {
        if (data && data.data) {
            //console.log("data getServerInfo", data);
            // Update server title
            const captionElement = document.querySelector('.content-header > .caption');
            if (captionElement) {
                captionElement.textContent = server;
            }

            // Update server status
            setServerStatus(data.data);

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
setInterval(loadServerByName, 1000, window.localStorage.selectedServer);
const actionButtons = document.querySelector('action-buttons');
actionButtons.addButton({
    id: 'start-server',
    label: '{{commons.start}}',
    icon: 'play_arrow',
    action: 'start-server'
});
actionButtons.addButton({
    id: 'stop-server',
    label: '{{commons.stop}}',
    icon: 'stop',
    action: 'stop-server'
});
actionButtons.addButton({
    id: 'restart-server',
    label: '{{commons.restart}}',
    icon: 'restart_alt',
    iconOnly: true,
    action: 'restart-server'
});
actionButtons.addButton({
    id: 'more-server-actions',
    label: '{{commons.more}}',
    icon: 'more_horiz',
    iconOnly: true,
    action: 'more-server-actions'   
});
actionButtons.hideButton('more-server-actions');
actionButtons.hideButton('kill-server');
actionButtons.hideButton('restart-server');
actionButtons.hideButton('stop-server');
actionButtons.addEventListener('button-clicked', (e) => {
    const {action, id} = e.detail;
    console.log("button-clicked", e.detail);
    currentServerStatus = action;
    if (action === 'start-server') {
        ServerManager.startServer(window.localStorage.selectedServer);
    } else if (action === 'stop-server') {
        ServerManager.stopServer(window.localStorage.selectedServer);
    } else if (action === 'restart-server') {
        ServerManager.restartServer(window.localStorage.selectedServer);
    } else if (action === "more-server-actions") {
        showServerPopup(e);
    }

});
let initpopup = false;
function showServerPopup(e) {
    const popupElement = document.querySelector('#server-popup');
    const buttonElement = e.target;

    popupElement.showAtElement(buttonElement);
    if (!initpopup) initPoup(popupElement);
    initpopup = true;
}
function initPoup(popupElement) {
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

    // Add force quit button to popup
    popupElement.addOption(
        `${hoverStyles}<div class="dropdown-item">
            <span class="material-symbols-rounded">dangerous</span>
            <span class="default-font">Force Quit</span>
        </div>`,
        () => {
            popupElement.hide();
            if (currentServerStatus !== PREDEFINED.SERVER_STATUSES.STOPPED) {
                ServerManager.killServer(window.localStorage.selectedServer);
            }
        }
    );
}