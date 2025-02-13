var globalvars = {
    SERVER_NAME_REGEXP: /^[a-zA-Z0-9\-_]{1,20}$/,
    AIKAR_FLAGS : "--add-modules=jdk.incubator.vector -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20",
    currentSelectedCore: "",
    currentSelectedVersion: "",
    allServersList: [],
    initialized: false
}
/**    // Regular expression for validating server names (1-20 alphanumeric, hyphen, underscore)
    const SERVER_NAME_REGEXP = /^[a-zA-Z0-9\-_]{1,20}$/;

    // Aikar's recommended JVM flags for Minecraft servers
    const AIKAR_FLAGS = "--add-modules=jdk.incubator.vector -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20";

    // Global state variables
    let currentSelectedCore = "";
    let globalvars.currentSelectedVersion = "";
    let allServersList = []; */
function initializenewServer() {
    initialized = true;

    // Core category selection handler
    document.querySelectorAll(".new-server-container #core-category .item").forEach(element => {
        element.addEventListener("click", function() {
            if (!this.classList.contains("active")) {
                // Remove active class from all items
                document.querySelectorAll(".new-server-container #core-category .item.active").forEach(activeElement => {
                    activeElement.classList.remove("active");
                });
                
                this.classList.add("active");
                const isList = this.dataset.item === "list";
                
                // Toggle visibility of core selection sections
                document.querySelector(".new-server-container #cores-versions-parent").style.display = 
                    isList ? "block" : "none";
                document.querySelector("#cores-grids").style.display = 
                    isList ? "block" : "none";
                document.querySelector("#core_upload").style.display = 
                    isList ? "none" : "block";
                
                validateNewServerInputs();
            }
        });
    });

    KubekUI.setTitle("Kubek | {{commons.create}} {{commons.server.lowerCase}}");

    // Populate server list
    document.querySelectorAll("#servers-list-sidebar .sidebar-item span:last-child").forEach(element => {
    globalvars.allServersList.push(element.textContent);
    });

    // Initial data loading
    refreshServerCoresList(() => {
        refreshCoreVersionsList(() => {
            refreshJavaList(() => {});
        });
    });

    // Set default port

    // Get and configure memory settings
    KubekRequests.get("/hardware/usage", usage => {
        if (!usage) return;
        const totalMemory = Math.ceil(Math.round(usage.ram.total / 1024 / 1024) / 512) * 512;
        const totalDigit = (totalMemory / 1024).toFixed(1) / 2;
        const maxMemory = (totalMemory / 1024).toFixed(1);
        
        const memInput = document.querySelector(".new-server-container #server-mem");
        memInput.value = totalDigit;
        memInput.max = maxMemory;
        
        validateNewServerInputs();
    });

// Handle file uploads


}
// Validate form inputs
function validateNewServerInputs() {
    const inputs = {
        serverName: document.querySelector('#server_name_input').getInputValues(),
        coreGrid: document.querySelector('#cores-grids').selected,
        coreUpload: document.querySelector('#core_upload').style.display !== "none",
        version: document.querySelector('#customselect_versions').getSelectedOptions(),
        java: document.querySelector('#javas_list').getSelectedOptions(),
        memory: document.querySelector('#server-mem').value,
        port: document.querySelector('#server-port').value
    };

    if (!inputs.serverName || !inputs.java) return false;
    if (inputs.coreUpload) return "uploadfile";
    if (!inputs.version) return false;
    return true;
}

// Refresh list of available server cores
function refreshServerCoresList(cb = () => {}) {
    globalvars.currentSelectedCore = "";
    globalvars.currentSelectedVersion = "";
    
    KubekCoresManager.getList(data => {
        console.log("data", data);
        const cores = data.data;
        const coresGrid = document.querySelector('#cores-grids');
        const coreEntries = Object.entries(cores).map(([key, value]) => ({
            id: key,
            title: value.displayName,
            img: `/assets/icons/cores/${key}.png`
        }));

        coresGrid.data = coreEntries;
        coresGrid.addEventListener('change', e => {
            globalvars.currentSelectedCore = e.detail.selected;
            refreshCoreVersionsList(() => {
                validateNewServerInputs();
                KubekUI.hidePreloader();
            });
        });

        coresGrid.selected = "vanilla";
        cb(true);
    });
}

// Refresh versions for selected core
function refreshCoreVersionsList(cb = () => {}) {
    globalvars.currentSelectedVersion = "";
    
    KubekCoresManager.getCoreVersions(globalvars.currentSelectedCore, data => {
        const versions = data.data;
        console.log("versions", versions);
        if (!versions) return cb(false);
        
        const versionSelect = document.querySelector('#customselect_versions');
        versionSelect.setOptions(versions.map(ver => ({
            label: ver,
            value: ver
        })));
        
        cb(true);
    });
}

// Refresh available Java versions
function refreshJavaList(cb) {
    const placeholder = document.querySelector("#java-list-placeholder");
    const javaList = document.querySelector("#javas-list");
    
    placeholder.style.display = "block";
    javaList.style.display = "none";

    KubekJavaManager.getAllJavas(data => {
        const javas = data.data;
        if (!javas) return;
        console.log("javas", javas);
        const parseJavaOptions = data => Object.entries(data).flatMap(([state, items]) =>
            items.map(item => ({
                label: item.includes("java") ? item : `java-${item}`,
                value: item,
                state: state === "installed" ? "(installed)" : ""
            }))
        );

        document.querySelector('#javas_list').setOptions(parseJavaOptions(javas));
        localStorage.setItem("javas", JSON.stringify(javas));
        
        placeholder.style.display = "none";
        javaList.style.display = "block";
        cb(true);
    });
}

// Generate server start command
function generateNewServerStart() {
    let command = `-Xmx${document.querySelector('#server-mem').value * 1024}M`;
    if (document.querySelector('#add-aikar-flags').checked) {
        command += ` ${encodeURIComponent(globalvars.AIKAR_FLAGS)}`;
    }
    return command;
}

// Prepare server creation process
function prepareServerCreation() {
    const btn = document.querySelector(".new-server-container #create-server-btn");
    btn.querySelector(".text").textContent = "{{newServerWizard.creationStartedShort}}";
    btn.querySelector(".material-symbols-rounded:not(.spinning)").style.display = "none";
    btn.querySelector(".material-symbols-rounded.spinning").style.display = "block";

    const serverData = {
        serverName: document.querySelector('#server_name_input').getInputValues(),
        memory: document.querySelector('#server-mem').value,
        port: document.querySelector('#server-port').value,
        core: globalvars.currentSelectedCore,
        version: document.querySelector('#customselect_versions').getValue(),
        java: document.querySelector('#javas_list').getValue(),
        startScript: generateNewServerStart(),
        formData: document.querySelector('#core_upload').getSelectfile()
    };
    console.log("serverData prepareServerCreation", serverData);
    const validation = validateNewServerInputs();
    if (validation === true) {
        startServerCreation(serverData);
    } else if (validation === "uploadfile") {
        const fileData = serverData.formData;
        sendServerData(serverData.serverName, fileData.formData, fileData.fileName, serverData);
    }
}

// Start server creation process
function startServerCreation({ serverName, core, version, startScript, java, port }, fileData) {
    const serverData = new URLSearchParams({
        serverName: serverName,
        core: core,
        coreVersion: version,
        startParameters: startScript,
        javaVersion: java,
        port: port,
        fileName: fileData?.name || core
    });

    fetch(`/api/createserver?${serverData.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelector(".new-server-container #after-creation-text").textContent = 
                    "{{newServerWizard.creationCompleted}}";
            } else {
                console.error("Error:", data.error);
            }
        })
        .catch(error => console.error("Fetch error:", error));
}

// Send server data to backend
function sendServerData(serverName, fileData, fileName, serverData) {
    const formData = new FormData();
    
    if (fileData instanceof FormData) {
        const file = [...fileData.entries()][0][1];
        formData.append('server-core-input', file, fileName || file.name);
    } else if (fileData instanceof File) {
        formData.append('server-core-input', fileData, fileName || fileData.name);
    }

    if (serverData) {
        Object.entries(serverData).forEach(([key, value]) => {
            if (key !== 'formData') formData.append(key, value);
        });
    }

    KubekRequests.post("/cores/" + serverName, response => {
        if (serverData) startServerCreation(serverData, response.sourceFile);
    }, formData);
}
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector("#server-port").value = 25565;
    document.querySelector('#core_upload').addEventListener('file-upload', e => {
        const { formData, fileName } = e.detail;
        sendServerData(
            document.querySelector('#server_name_input').getInputValues(),
            formData,
            fileName,
            null
        );
    });
    if (!globalvars.initialized) initializenewServer();

});