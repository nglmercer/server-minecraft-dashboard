/**
 * Global variable to store the currently loaded server settings
 * @type {Object|null}
 */
let loadedSettings = null;

/**
 * Class responsible for managing server settings in the UI
 */
class KubekServerSettingsUI {
    /**
     * Loads server settings from the backend and updates the UI
     * Fetches settings like restart behavior, stop command, and max restart attempts
     */
    static loadSettings = () => {
        let selectedServer = window.localStorage.selectedServer;
        if (!selectedServer) return;
        KubekRequests.get(`/servers/${selectedServer}/info`, (serverSettings) => {
            loadedSettings = serverSettings;
            
            // Update restart on error toggle
            const restartToggle = document.querySelector('#restart-on-error');
            restartToggle.setInputValues(serverSettings.restartOnError !== false);
            
            // Update other settings
            document.querySelector("#stop-command").setInputValues(serverSettings.stopCommand);
            document.querySelector('#restart-attempts').setInputValues(serverSettings.maxRestartAttempts);
        });
    }

    /**
     * Loads the server's start script and updates the UI
     */
    static loadStartScript = () => {
      let selectedServer = window.localStorage.selectedServer;

        KubekRequests.get(`/servers/${selectedServer}/startScript`, (data) => {
            console.log("Loading start script:", data);
            document.querySelector('#start-script').setInputValues(data.startScript);
        });
    }

    /**
     * Saves both server settings and start script to the backend
     * Shows a success message if both operations complete successfully
     */
    static writeSettings = () => {
        // Gather current values from UI
        loadedSettings.maxRestartAttempts = document.querySelector('#restart-attempts').getInputValues();
        loadedSettings.restartOnError = document.querySelector('#restart-on-error').getInputValues();
        loadedSettings.stopCommand = document.querySelector("#stop-command").getInputValues();
        const startScript = document.querySelector('#start-script').getInputValues();

        // Save settings and start script
        const encodedSettings = Base64.encodeURI(JSON.stringify(loadedSettings));
        const encodedScript = Base64.encodeURI(startScript);

        KubekRequests.put(`/servers/${selectedServer}/info?data=${encodedSettings}`, (settingsResult) => {
            KubekRequests.put(`/servers/${selectedServer}/startScript?data=${encodedScript}`, (scriptResult) => {
                if (settingsResult !== false && scriptResult !== false) {
                    KubekAlerts.addAlert("{{fileManager.writeEnd}}", "check", "", 5000);
                }
            });
        });
    }

    /**
     * Shows a confirmation dialog for server deletion
     * Executes the delete request if confirmed
     */
    static deleteServer = () => {
        console.log("Initiating server deletion for:", selectedServer);
        KubekNotifyModal.create(
            selectedServer,
            "{{serverSettings.deleteServer}}",
            "{{commons.delete}}",
            "delete",
            () => KubekRequests.delete(`/servers/${selectedServer}`, () => {}),
            KubekPredefined.MODAL_CANCEL_BTN
        );
    }
}

// Event listener for restart-on-error toggle
document.addEventListener('DOMContentLoaded', () => {
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
    translatedialog();
    async function translatedialog(){
      const dialogcontent = document.querySelector('#deletedialog_content');
      dialogcontent._title = localStorage.getItem("selectedServer");
      dialogcontent._description = "{{serverSettings.deleteServer}}";
      dialogcontent.options = [
        {
          label: "{{commons.delete}}",
          class: "delete-btn",
          callback: () => {
            deleteServerDialog.hide();
            KubekRequests.delete("/servers/" + selectedServer, () => {});
          }
        },
        {
          label: "{{commons.cancel}}",
          class: "cancel-btn",
          callback: () => {
            deleteServerDialog.hide();
          }
        }
        
      ];
    }
    KubekUI.setTitle("Kubek | {{sections.serverSettings}}");
    KubekServerSettingsUI.loadSettings();
    KubekServerSettingsUI.loadStartScript();
    
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


