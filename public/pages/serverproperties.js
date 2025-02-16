var serverPropertiesElement = document.querySelector('server-properties');
serverPropertiesElement.setAttribute('server-id', window.localStorage.selectedServer);
serverPropertiesElement.addEventListener('save-success', (e) => {
    // Show success message
    //KubekAlerts.addAlert("Save successful", "check", "", 5000);
    const details = e.detail;
    console.log("details", details);
});
const savePropertiesBtn = document.querySelector('#save-properties');
savePropertiesBtn.addEventListener('click', async () => {
    const data = await serverPropertiesElement.getPropertiesToSave();
    console.log("data", data);
    if (Object.keys(data).length === 0) {
        console.log("saveResult is empty");
        return;
    }
        // convertir data.result el objeto a un string type server.properties
    const serverProperties = Object.entries(data.result).map(([key, value]) => `${key}=${value}`).join('\n');
    console.log("serverProperties", serverProperties);
    const savefetch = await awaitfilemanager.writeFilebyName(window.localStorage.selectedServer, "server.properties", serverProperties);
    console.log("savefetch", savefetch);
});
