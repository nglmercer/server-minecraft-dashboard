function initializedSectionSystemMonitor() {
    KubekHardware.getSummary((data) => {
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

document.addEventListener('section-changed', (e) => {
    const page = e.detail;
});
