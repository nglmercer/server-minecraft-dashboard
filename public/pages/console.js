var cpuElem = document.querySelector("#cpu-bar");
cpuElem.setAttribute("value", 55);
cpuElem.setAttribute("active-color", "#007bff");
var ramElem = document.getElementById("ram-bar");
ramElem.setAttribute("value", 55);
ramElem.setAttribute("active-color", "#007bff");

function changeProgressvalue(element, value, action = "setvalue") {
    const elements = {
        "cpu": cpuElem,
        "ram": ramElem
    };
    const actions = {
        "setvalue": "value",
        "setactivecolor": "active-color"
    }
    if (typeof elements[element] !== "undefined") {
        if (typeof actions[action] !== "undefined") {
            elements[element].setAttribute(actions[action], value);
        }
    }
}
KubekConsoleUI = class {
    // Обновить progress бары использования рес-ов
    static refreshUsageItems(cpu, ram, ramElem) {
        changeProgressvalue("cpu", cpu);
        changeProgressvalue("ram", ram);
        changeProgressvalue("ram", KubekUtils.getProgressGradientColor(ram), "setactivecolor");
        changeProgressvalue("cpu", KubekUtils.getProgressGradientColor(cpu), "setactivecolor");
        const ramusagecontainer = document.querySelector("#ram-usage-text");
        if (ramusagecontainer) {
            ramusagecontainer.textContent = KubekUtils.humanizeFileSize(ramElem.used) + " / " + KubekUtils.humanizeFileSize(ramElem.total);
        }
    }
}

async function initConsole() {
    KubekUI.setTitle("Kubek | {{sections.console}}");
    KubekHardware.getUsage((usage) => {
        console.log("usage", usage);
        if (!usage || !usage.cpu || !usage.ram) {
            return;
        }
        KubekConsoleUI.refreshUsageItems(usage.cpu, usage.ram.percent, usage.ram);
    });

}
    initConsole();
    var inputCommandelement = document.querySelector('input-command');
    console.log("inputCommandelement", inputCommandelement);
    inputCommandelement.addEventListener('command', (e) => {
        const detail = e.detail;
        console.log("detail",);
        KubekServers.sendCommandToServer(selectedServer, detail.command);
    });