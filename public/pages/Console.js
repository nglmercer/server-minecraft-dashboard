class UpdateConsole {
    constructor(element = 'game-console') {
        this.consoleElement = document.querySelector(element);
    }
    updatelog(log) {
        this.consoleElement.refreshConsoleLog(log);
    }
    fetchConsoleLogs(server) {
        let url = `/api/servermanager/${server}/log`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
            //    console.log("data", data);
                this.updatelog(data.data);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }
}
const updateConsole = new UpdateConsole();

setInterval(() => {
    updateConsole.fetchConsoleLogs(window.localStorage.selectedServer);
}, 500);
class UsageGraph {
    constructor(element = 'kubek-circle-progress') {
        this.usageElement = document.querySelector(element);
    }
    updateusage(action, value) {
        const actions = {
            "setvalue": "value",
            "setactivecolor": "active-color"
        }
        this.usageElement.setAttribute(actions[action], value);

    }
}
const cpubarUsage = new UsageGraph("#cpu-bar");
const rambarUsage = new UsageGraph("#ram-bar");

setInterval(() => {
    initConsole();
}, 4000);
async function initConsole() {
    KubekHardware.getUsage((usage) => {
    //    console.log("usage", usage);
        if (!usage || !usage.cpu || !usage.ram) {
            return;
        }
        cpubarUsage.updateusage("setvalue", usage.cpu);
        rambarUsage.updateusage("setvalue", usage.ram.percent);
        rambarUsage.updateusage("setactivecolor", KubekUtils.getProgressGradientColor(usage.ram.percent));
        cpubarUsage.updateusage("setactivecolor", KubekUtils.getProgressGradientColor(usage.cpu));
        const ramusagecontainer = document.querySelector("#ram-usage-text");
        if (ramusagecontainer) {
            ramusagecontainer.textContent = KubekUtils.humanizeFileSize(usage.ram.used) + " / " + KubekUtils.humanizeFileSize(usage.ram.total);
        }
    });

}
initConsole();
const inputCommandelement = document.querySelector('input-command');
//console.log("inputCommandelement", inputCommandelement);
inputCommandelement.addEventListener('command', (e) => {
    const detail = e.detail;
    console.log("detail",);
    KubekServers.sendCommandToServer(window.localStorage.selectedServer, detail.command);
});
//    "/api/servermanager/test1231/log"
