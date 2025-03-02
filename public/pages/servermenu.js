import {
    BaseAPI,
    MiAPI,
    api,
    ServerManager,
    createBackup,
    deleteBackup,
    restoreBackup,
    downloadBackup
  } from '../API/fetch.js';
  function openPopup(element, popupId = "custom-popup") {
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
function setPopupOptions(popupOptions, popupId = "custom-popup"){
    const popupElement = document.querySelector(popupId);
    popupElement.options = popupOptions;
}
var selectedServer = window.localStorage.selectedServer || "";

function loadServersList() {
    ServerManager.getServersList(data => {
        if (!data.data && !data.data.message) return;
        console.log("servers getServersList", data.data);
        setServertoselect(data.message);
    });

}
ServerManager.getServersList((servers) => {
    console.log('Lista de servidores:', servers);
  });
  const hoverStyles = `
  <style>
      .dropdown-item {
          background: #222c3a;
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
function setServertoselect(servers) {
    const allserver = [];
    const sidebar = document.querySelector('#serverMenu') || document.querySelector('server-menu');
    const serversarray = Object.keys(servers).map(key => ( servers[key] ));
    console.log("serversArray", serversarray);
    serversarray.forEach( data => {
        let key = data?.name ? data.name : data;
        const serverInfo = {
            title: key,
            icon: `../assets/kubek_icon.png`,
            version: getServerFile(data.files)?.name,
            status: 'running',
            ...data
        }
        allserver.push(serverInfo);
        sidebar.addServerContent(key, `<status-element status="STOPPED" id="${key}_status"></status-element>`);
        ServerManager.getServerMetrics(key, (data) => {
            const metrics = data.data;
            console.log('Métricas del servidor:', metrics);
            const statusElement = document.querySelector(`#${key}_status`);
            if (statusElement) {
                statusElement.updateStatus(metrics.status);
            }
        });
        ServerManager.getServerPlayers(key, (data) => {
            const players = data.data;
            console.log('Jugadores del servidor:', players);
        });
    });
    sidebar.setServersList(allserver);
    sidebar.addEventListener('server-change', (event) => {
        window.localStorage.selectedServer = event.detail.server;
    });
    sidebar.setActiveElement(window.localStorage.selectedServer);

    serverMenu.addEventListener('server-change', (e) => {
        window.localStorage.selectedServer = e.detail.server;
        location.href = '/dashboard/index.html';
      });
      serverMenu.addEventListener('server-contextmenu', (e) => {
        console.log("server-contextmenu", e);
        openPopup(e.originalTarget  || e.target);
        console.log(e.detail);
        const baseOptions = [
            // CREATEBACKUP
            returnexploreroptions('create-backup', '{{commons.create}} {{commons.backup}}', 'backup', () => {
                const path = e.detail.server;
                console.log("create-backup", e.detail, path);
                createBackup(path).then(response => {
                    console.log('Backup creado:', response);
                })
                .catch(error => console.error('Error al crear backup:', error));
            //    createBackup(e.detail);
            }),
            returnexploreroptions('restore-backup', '{{commons.restore}} {{commons.backup}}', 'restore', () => {
                const path = e.detail.server;
                console.log("restore-backup", e.detail, path);
            //    restoreBackup(e.detail, window.localStorage.selectedServer);
            }),
            returnexploreroptions('delete-backup', '{{commons.delete}} {{commons.backup}}', 'delete', () => {
                const path = e.detail.server;
                console.log("delete-backup", e.detail, path);
            //    deleteBackup(e.detail);
            }),
            returnexploreroptions('download-backup', '{{commons.download}} {{commons.backup}}', 'download', () => {
                const path = e.detail.server;
                downloadBackup(path).then(blob => {
                    // Crea un URL para el blob y lanza la descarga
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'miBackup.zip';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  })
                  .catch(error => console.error('Error al descargar backup:', error));
                console.log("download-backup", e.detail, path);
            //    downloadBackup(e.detail);
            }),
        ];
        const popupOptions = baseOptions.map(option => ({
            html: `${hoverStyles}
                <div class="dropdown-item">
                    <span class="material-symbols-rounded">${option.icon}</span>
                    <span class="default-font">${option.text}</span>
                </div>
            `,
            callback: (e) => option.callback(e)
        }));
        setPopupOptions(popupOptions);
      });
}

// crear una function para obtener el archivo que termina en .jar de un array de archivos
function getServerFile(files) {
    try {
        let serverFile = files.find(file => file.name.endsWith('.jar'));
        return serverFile;
    } catch (error) {
        console.error("Error al obtener el archivo del servidor:", error);
        return false;
    }
}
function loadSelectedServer () {
    if (typeof window.localStorage.selectedServer !== "undefined") {
        selectedServer = window.localStorage.selectedServer;
        loadServerByName(selectedServer, (result) => {
            uiDebugger.log(selectedServer, result);
            if (result === false) {
                ServerManager.getServersList((data) => {
                    let list = data.data
                    console.log("list", list);
                    if (!list) return;
                    uiDebugger.log(selectedServer, list);
                });
            }
        });
    } else {
        ServerManager.getServersList((data) => {
            let list = data.data
            uiDebugger.log(selectedServer, list);
            if (!list) return;
        });
    }
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
        //  this.setServerStatus(data.data);

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
loadServersList();
loadSelectedServer();