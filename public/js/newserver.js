const globalflags = [
    "-XX:+UseG1GC",
    "-XX:MaxGCPauseMillis=200",
    "-XX:G1HeapRegionSize=4M",
    "-XX:InitiatingHeapOccupancyPercent=35",
    "-XX:+ParallelRefProcEnabled",
    "-XX:+PerfDisableSharedMem",
    "-XX:+UseStringDeduplication"
  ].join(" \\\n")
var globalvars = {
    SERVER_NAME_REGEXP: /^[a-zA-Z0-9\-_]{1,20}$/,
    AIKAR_FLAGS: globalflags,
    currentSelectedCore: "",
    currentSelectedVersion: "",
    allServersList: [],
    initialized: false
};
console.log("globalflags",globalflags)
const cleanFolderName = (folderName) => {
    // Expresión regular para eliminar caracteres no válidos
    return folderName.replace(/[^a-zA-Z0-9\-_.]/g, '');
};
//AIKAR_FLAGS: "-XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Xms1G -Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+AlwaysPreTouch -Dusing.aikars.flags=https://mcflags.emc.gs"

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

    document.title = " {{commons.create}} {{commons.server.lowerCase}}";

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
        if (!data || !data.data) return;
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
            });
        });

        coresGrid.selected = "paper";
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
        command += ` ${globalvars.AIKAR_FLAGS}`;
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
        serverName: cleanFolderName(
        document.querySelector('#server_name_input').getInputValues()),
        memory: document.querySelector('#server-mem').value,
        port: document.querySelector('#server-port').value,
        core: globalvars.currentSelectedCore,
        version: document.querySelector('#customselect_versions').getValue(),
        java: document.querySelector('#javas_list').getValue(),
        javaVersion: document.querySelector('#javas_list').getValue(),
        startScript: generateNewServerStart(),
        formData: document.querySelector('#core_upload').getSelectfile(),
        startParameters: generateNewServerStart(),

    };
    const validation = validateNewServerInputs();
    console.log("serverData prepareServerCreation", serverData, validation);
    
    if (validation === true) {
        startServerCreation(serverData);
    } else if (validation === "uploadfile" || !validation) {
        startServerCreation(serverData, serverData.formData);
    }
}
function uploadFile(servername) {
    const inputElement = document.getElementById("g-file-input");
    
    // Remove old listener and add new one
    const oldListener = inputElement.onchange;
    if (oldListener) {
        inputElement.removeEventListener('change', oldListener);
    }
    inputElement.addEventListener("change", () => {
        const formData = new FormData(document.getElementById("g-file-form"));

        console.log("Archivo a enviar:", formData.get("file")); // Asegúrate de que se captura correctamente

    
        const server = servername || window.localStorage.selectedServer; // Define el nombre del servidor
    
        fetch(`/api/filemanager/upload?server=${server}&path=./`, {
            method: "POST",
            body: formData,
        })
        .then((response) => response.json())
        .then((data) => console.log("Archivo subido:", data))
        .catch((error) => console.error("Error al subir archivo:", error));
    });
    
}
// Start server creation process
function startServerCreation(serverData, fileData) {
    const formData = new FormData();
  
    // Verificar si serverData no está vacío antes de iterar
    if (serverData && typeof serverData === "object") {
      Object.entries(serverData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
    }
  
    // Si fileData es un archivo, lo agregamos al FormData
    if (fileData instanceof File) {
      formData.append("server-core-input", fileData, fileData.name);
    }
  
    // Depuración: Ver qué datos están en el FormData antes de enviarlo
    console.log("Datos enviados en FormData:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
  
    // Enviar la petición POST con FormData
    fetch("/api/createserver", {
      method: "POST",
      body: JSON.stringify(serverData),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log("Respuesta del servidor:", data);
        if (data.success) {
          console.log("✅ Servidor creado exitosamente:", data);
        } else {
          console.error("❌ Error en la respuesta:", data.error);
        }
      })
      .catch(error => console.error("❌ Error en la petición:", error));
  }
  
  

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector("#server-port").value = 25565;
    document.querySelector('#core_upload').addEventListener('file-upload', e => {
        const { formData, fileName } = e.detail;
        const file = [...formData.entries()][0][1];
        formData.append("g-file-form", file);
        const serverName = document.querySelector('#server_name_input').getInputValues();
        uploadFile(serverName);
    });
    if (!globalvars.initialized) initializenewServer();

});