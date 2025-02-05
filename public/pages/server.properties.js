KubekUI.setTitle("Kubek | Server.properties");

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

    const blobdata = Base64.encodeURI(JSON.stringify(data.result));
    if (KubekRequests) {
        const serverId = data.server;
        //const url = `/servers/${data.server}/server.properties?server=${data.server}&data=${blobdata}`;
        const url = "/servers/" + serverId + "/server.properties?server=" + serverId + "&data=" + blobdata;
        console.log("url", url, blobdata);
        KubekRequests.put(url, (result) => {
            console.log("result", result);
        });
    }
});
