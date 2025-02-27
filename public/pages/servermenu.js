import {
    BaseAPI,
    MiAPI,
    api,
    ServerManager
  } from '../API/fetch.js';
var selectedServer = window.localStorage.selectedServer || "";

function loadServersList() {
    ServerManager.getServersList(data => {
        if (!data.data) return;
        console.log("servers getServersList", data.data);
        setServertoselect(data.message);
    });

}
ServerManager.getServersList((servers) => {
    console.log('Lista de servidores:', servers);
  });

function setServertoselect(servers) {
    const allserver = [];
    const sidebar = document.querySelector('#serverMenu') || document.querySelector('server-menu');
    const serversarray = Object.keys(servers).map(key => ( servers[key] ));
    console.log("serversArray", serversarray);
    serversarray.forEach(data => {
        let key = data?.name ? data.name : data;
        const serverInfo = {
            title: key,
            icon: `../assets/kubek_icon.png`,
            version: getServerFile(data.files).name,
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
}

// crear una function para obtener el archivo que termina en .jar de un array de archivos
function getServerFile(files) {
    let serverFile = files.find(file => file.name.endsWith('.jar'));
    return serverFile;
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