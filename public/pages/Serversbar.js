var selectedServer = window.localStorage.selectedServer || "";
function loadServersList() {
    KubekServers.getServersList(data => {
        let servers = data.data?.files;
        const allserver = [];
        if (!servers) return;
        console.log("servers getServersList", servers);
        servers.forEach(data => {
            let serverItem = data?.name ? data.name : data;
            if (serverItem.includes(".json")) return;
            console.log("serverItem", serverItem);
            const sidebar = document.querySelector('server-menu') || document.getElementById("main-menu-sidebar");
            setTimeout(() => {
                sidebar.setActiveElement(window.localStorage.selectedServer);
            }, 1000);
            const parsedserver = {
              title: serverItem,
            //  icon: `/api/servers/${serverItem}/icon`
                icon: `../assets/kubek_icon.png`
            }
            allserver.push(parsedserver);
            sidebar.setServersList(allserver);
            console.log("sidebar", sidebar, parsedserver, allserver);
            uiDebugger.log('loadServersList, getServersList',serverItem, servers);
            const isActive = serverItem === localStorage.selectedServer ? " active" : "";
            const serverElement = document.createElement("div");
            serverElement.className = `server-item sidebar-item${isActive}`;
            serverElement.onclick = () => {
                console.log("serverElement.onclick", serverItem, localStorage.selectedServer);
            //    localStorage.selectedServer = serverItem;
            //    location.reload();
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
function loadSelectedServer () {
    if (typeof window.localStorage.selectedServer !== "undefined") {
        selectedServer = window.localStorage.selectedServer;
        loadServerByName(selectedServer, (result) => {
            uiDebugger.log('loadSelectedServer, loadServerByName',selectedServer, result);
            if (result === false) {
                KubekServers.getServersList((data) => {
                    let list = data.data
                    console.log("list", list);
                    if (!list) return;
            //        window.localStorage.selectedServer = list[0];
                    uiDebugger.log('loadSelectedServer, getServersList',selectedServer, list);
                });
            }
        });
    } else {
        KubekServers.getServersList((data) => {
            let list = data.data
            uiDebugger.log('loadSelectedServer, getServersList',selectedServer, list);
            if (!list) return;
        //    window.localStorage.selectedServer = list[0];
        });
    }
}
function loadServerByName(server, callback = () => {}) {
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
loadServersList();
loadSelectedServer();