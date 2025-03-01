import { serverHardware } from '../API/fetch.js';
function initializedSectionSystemMonitor() {
    serverHardware.getSummary((data) => {
        systemMonitor(data);
    });
}
function systemMonitor(data) {
    const systemMonitor = document.querySelector('system-monitor');
    console.log("###systemMonitor", data, systemMonitor);
    if (!data) return;
    systemMonitor.renderdata(data);
}
initializedSectionSystemMonitor();