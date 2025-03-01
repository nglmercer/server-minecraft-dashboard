import { fileManager, ServerManager} from '../API/fetch.js';

/**
 * Global variable to store the currently loaded server settings
 * @type {Object|null}
 */
let loadedSettings = null;


class ServerSettingsUI {

    static loadSettings = () => {
        let selectedServer = window.localStorage.selectedServer;
        if (!selectedServer) return;
        ServerManager.getServerInfo(selectedServer, (serverSettings) => {
            loadedSettings = serverSettings;
            
            // Update restart on error toggle
            const restartToggle = document.querySelector('#restart-on-error');
            restartToggle.setInputValues(serverSettings.restartOnError !== false);
            
            // Update other settings
            document.querySelector("#stop-command").setInputValues("stop");
            document.querySelector('#restart-attempts').setInputValues(serverSettings.maxRestartAttempts);
        });
    }

    static loadStartScript = () => {
      let selectedServer = window.localStorage.selectedServer;
      fileManager.readFilebyPath(selectedServer, "/start.sh", (data) => {
            console.log("Loading start script:", data);
            if (!data || !data.data) return;
            document.querySelector('#start-script').setInputValues(data.data);
        });
        fileManager.readFilebyPath(selectedServer, "/start.bat", (data) => {
          console.log("Loading start script:", data);
          if (!data || !data.data) return;
          document.querySelector('#start-script').setInputValues(data.data);
      });
    }


    static writeSettings = () => {
        // Gather current values from UI
        loadedSettings.maxRestartAttempts = document.querySelector('#restart-attempts').getInputValues();
        loadedSettings.restartOnError = document.querySelector('#restart-on-error').getInputValues();
        loadedSettings.stopCommand = document.querySelector("#stop-command").getInputValues();
        const startScript = document.querySelector('#start-script').getInputValues();
        console.log("startScript", startScript);
/*         KubekRequests.put(`/servers/${selectedServer}/info?data=${encodedSettings}`, (settingsResult) => {
            KubekRequests.put(`/servers/${selectedServer}/startScript?data=${encodedScript}`, (scriptResult) => {
                if (settingsResult !== false && scriptResult !== false) {
                    KubekAlerts.addAlert("{{fileManager.writeEnd}}", "check", "", 5000);
                }
            });
        }); */
    }

}
function returnDialogOptions(labelName, className, callback) {
  return  {
    label: labelName,
    class: className,
    callback: () => {
      callback();
    }
  }
}
// Event listener for restart-on-error toggle
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("serverSettingsSaveBtn").addEventListener('click', () => {
    console.log("saveServerSettings");
    ServerSettingsUI.writeSettings();
  });
  const restartOnErrorSwitch = document.querySelector('#restart-on-error');
  restartOnErrorSwitch.addEventListener('input-change', (e) => {
      console.log("Restart on error setting changed:", e.detail);
      const restartAttemptsRow = document.querySelector('#restart-attempts-tr');
      restartAttemptsRow.classList.toggle('hidden', !e.detail.value);
  });
    const deleteServerDialog = document.querySelector('#deletedialog');
    const deleteServerBtn = document.querySelector('#deleteServerBtn');
  
    deleteServerBtn.addEventListener('click', ()=>{
      deleteServerDialog.show();
    });
    const dialogcontent = document.querySelector('#deletedialog_content');
    dialogcontent._title = localStorage.getItem("selectedServer");
    dialogcontent._description = "{{serverSettings.deleteServer}}";
    dialogcontent.options = [
      returnDialogOptions("{{commons.delete}}", "delete-btn",async () => {
        deleteServerDialog.hide();
        const response = await awaitRequests.delete("/filemanager/servers/" + selectedServer);
        console.log("response deleteServer", response);
      }),
      returnDialogOptions("{{commons.cancel}}", "cancel-btn", () => {
        deleteServerDialog.hide();
      })
    ];
    
    
    ServerSettingsUI.loadSettings();
    ServerSettingsUI.loadStartScript();
    
});

/**
 * Sets values for all custom inputs based on a data object
 * @param {Object} dataObject - Object containing input values keyed by input id/name
 */
function setAllInputValues(dataObject) {
    const inputs = document.querySelectorAll('custom-input');
    inputs.forEach(input => {
        const id = input.getAttribute('id');
        const name = input.getAttribute('name');
        const value = dataObject[id] || dataObject[name];
        
        if (value !== undefined) {
            input.setInputValues(value);
        }
    });
}

/**
 * Collects values from all custom inputs into an object
 * @returns {Object} Object containing all input values keyed by input id
 */
function getAllInputValues() {
    const allData = {};
    const inputs = document.querySelectorAll('custom-input');
    
    inputs.forEach((input) => {
        const id = input.getAttribute('id');
        allData[id] = input.getInputValues();
    });
    
    return allData;
}


async function getelementStore(element) {
    try {
      const result = await localStorage.getItem(element);
      return JSON.parse(result);
      console.log("element", element,JSON.parse(result));
    } catch (error) {
      return false;
    }
    return JSON.parse(localStorage.getItem(element));
  }
async function getTranslatestore(lang = "en") {
  let objfind = [];
  const datarray = await getelementStore("rawlanguages");
  console.log("datarray", datarray, lang);
  if (!datarray) return [];
  for (const [key, value] of Object.entries(datarray)) {
    if (value.translations && value.info){
      console.log("value.translations", value,lang);
      if (value.info.code === lang){
        objfind = value.translations;
        break;
      }
    }
  }
  if (objfind.length <= 0 && datarray.length > 0) {
    objfind = datarray[0].translations;
  }
  return objfind;
}


