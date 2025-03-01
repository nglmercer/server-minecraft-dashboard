import { serverHardware, ServerManager} from '../API/fetch.js';
import { unitUtils} from '../utils/unit.js';
class UpdateConsole {
    constructor(element = 'game-console') {
        this.consoleElement = document.querySelector(element);
    }
    updatelog(log) {
        this.consoleElement.refreshConsoleLog(log);
    }
    fetchConsoleLogs(server) {
      ServerManager.getServerLog(server, (data) => {
      //  console.log("data getServerLog", data);
        if (!data.data) return;
        this.updatelog(data.data);
      });
    }
}
const updateConsole = new UpdateConsole();

setInterval(() => {
    updateConsole.fetchConsoleLogs(window.localStorage.selectedServer);
}, 500);
class UsageGraph {
    constructor(element = 'kubek-circle-progress') {
        this.usageElement = document.querySelector(element);
    }
    updateusage(action, value) {
        const actions = {
            "setvalue": "value",
            "setactivecolor": "active-color"
        }
        this.usageElement.setAttribute(actions[action], value);

    }
}
const cpubarUsage = new UsageGraph("#cpu-bar");
const rambarUsage = new UsageGraph("#ram-bar");

setInterval(() => {
    initConsole();
}, 4000);
async function initConsole() {
    return new Promise((resolve, reject) => {
      serverHardware.getUsage((usage) => {
        try {
          // Early return if usage data is invalid
          if (!usage || !usage.cpu || !usage.ram) {
            console.log("Invalid usage data received");
            return resolve();
          }
  
          console.log("usage", usage);
          
          // Handle RAM usage display
          if (usage.ram?.rawmemInfo) {
            const usedRam = getUsedRam(usage.ram.rawmemInfo);
            updateRamUsageDisplay(usedRam.percent, usedRam.used, usedRam.total);
          } else {
            updateRamUsageDisplay(usage.ram.percent, usage.ram.used, usage.ram.total);
          }
          
          // Handle CPU usage display
          cpubarUsage.updateusage("setvalue", usage.cpu);
          cpubarUsage.updateusage("setactivecolor", unitUtils.getProgressGradientColor(usage.cpu));
          
          resolve();
        } catch (error) {
          console.error("Error in initConsole:", error);
          reject(error);
        }
      });
    });
  }
  
  /**
   * Updates the RAM usage display elements
   * @param {number} percent - RAM usage percentage
   * @param {number} used - Used RAM in bytes
   * @param {number} total - Total RAM in bytes
   */
  function updateRamUsageDisplay(percent, used, total) {
    rambarUsage.updateusage("setvalue", percent);
    rambarUsage.updateusage("setactivecolor", unitUtils.getProgressGradientColor(percent));
    
    const ramusagecontainer = document.querySelector("#ram-usage-text");
    if (ramusagecontainer && used !== undefined && total !== undefined) {
      ramusagecontainer.textContent = `${unitUtils.humanizeFileSize(used)} / ${unitUtils.humanizeFileSize(total)}`;
    }
  }
  
  /**
   * Calculates RAM usage metrics from raw memory information
   * @param {Object} data - Raw memory information object
   * @returns {Object} Object containing percent, used and total RAM values
   */
  function getUsedRam(data) {
    if (!data) {
      return {
        percent: 0,
        used: 0,
        total: 0
      };
    }
    
    const used = data.active || data.used;
    const total = data.total || data.available;
    
    return {
      percent: Math.round((used / total) * 100),
      used: used,
      total: total
    };
  }
initConsole();
const inputCommandelement = document.querySelector('input-command');
//console.log("inputCommandelement", inputCommandelement);
inputCommandelement.addEventListener('command', (e) => {
    const detail = e.detail;
    console.log("detail",);
    ServerManager.sendCommandToServer(window.localStorage.selectedServer, detail.command);
});
//    "/api/servermanager/test1231/log"
