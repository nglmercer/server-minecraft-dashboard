function initializedSectionSystemMonitor() {
    KubekUI.setTitle("Kubek | {{sections.systemMonitor}}");
    KubekHardware.getSummary((data) => {
        console.log("KubekHardware data ", data);
        systemMonitor(data);
    });
}
function systemMonitor(data) {
    const systemMonitor = document.querySelector('system-monitor');
    console.log("systemMonitor", data);
    if (!data) return;
    systemMonitor.renderdata(data);
}
initializedSectionSystemMonitor();
