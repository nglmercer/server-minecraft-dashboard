import TASK_MANAGER from "../taskManager.js";
import * as CORES_MANAGER from "./coresManager.js";
import * as JAVA_MANAGER from "./javaManager.js";
import * as DOWNLOADS_MANAGER from "../downloadsManager.js";
import * as SERVERS_MANAGER from "./serversManager.js";
import { logger, LanguageManager } from "../utils.js";
import { configManager } from "../configuration.js";
import fs from "fs";
import path from "path";
import colors from "colors";

// Función para obtener información sobre la plataforma
export const getPlatformInfo = () => {
  const isTermux = process.platform === 'android' || fs.existsSync('/data/data/com.termux');
  const isWindows = process.platform === "win32";
  const isLinux = process.platform === "linux";
  return {
    isTermux,
    isWindows,
    isLinux,
    startScript: isWindows ? "start.bat" : "start.sh",
    platform: process.platform
  };
};

const PREDEFINED = {
  SERVER_STATUSES: {
    STOPPED: "stopped",
    RUNNING: "running",
    STARTING: "starting",
    STOPPING: "stopping"
  },
  TASKS_TYPES: {
    DOWNLOADING: "downloading",
    INSTALLING: "installing",
    ZIPPING: "zipping",
    UNPACKING: "unpacking",
    UPDATING: "updating",
    RESTARTING: "restarting",
    CREATING: "creating",
    DELETION: "deletion",
    COMMON: "common",
    UNKNOWN: "unknown"
  },
  SERVER_CREATION_STEPS: {
    SEARCHING_CORE: "searchingCore",
    CHECKING_JAVA: "checkingJava",
    DOWNLOADING_JAVA: "downloadingJava",
    UNPACKING_JAVA: "unpackingJava",
    DOWNLOADING_CORE: "downloadingCore",
    CREATING_BAT: "creatingBat",
    COMPLETION: "completion",
    COMPLETED: "completed",
    FAILED: "failed"
  }
};

export async function prepareJavaForServer(javaVersion, cb) {
  try {
    let javaExecutablePath = "";
    let javaDownloadURL = "";
    let isJavaNaN = isNaN(parseInt(javaVersion));

    if (isJavaNaN && fs.existsSync(javaVersion)) {
      javaExecutablePath = javaVersion;
    } else if (!isJavaNaN) {
      // Si se pasa una versión de Java, no hacer nada
    } else {
      cb(false);
      return;
    }

    if (!isJavaNaN) {
      javaExecutablePath = JAVA_MANAGER.getJavaPath(javaVersion);
      if (javaExecutablePath === false) {
        let javaVerInfo = JAVA_MANAGER.getJavaInfoByVersion(javaVersion);
        javaDownloadURL = javaVerInfo.url;
        console.log(javaDownloadURL, javaVerInfo);

        await DOWNLOADS_MANAGER.addDownloadTask(javaDownloadURL, javaVerInfo.downloadPath, (javaDlResult) => {
          if (javaDlResult === true) {
            DOWNLOADS_MANAGER.unpackArchive(javaVerInfo.downloadPath, javaVerInfo.unpackPath, (javaUnpackResult) => {
              if (javaUnpackResult === true) {
                javaExecutablePath = JAVA_MANAGER.getJavaPath(javaVersion);
                cb(javaExecutablePath);
              } else {
                logger.warning(LanguageManager.translateText(configManager.mainConfig.language, "{{console.javaUnpackFailed}}"));
                cb(false);
              }
            }, true);
          } else {
            logger.warning(LanguageManager.translateText(configManager.mainConfig.language, "{{console.javaDownloadFailed}}"));
            cb(false);
          }
        });
      } else {
        cb(javaExecutablePath);
      }
    } else {
      cb(javaExecutablePath);
    }
  } catch (error) {
    console.error("Error in prepareJavaForServer:", error);
    cb(false);
  }
}

export async function startJavaServerGeneration(serverName, core, coreVersion, startParameters, javaExecutablePath, serverPort, cb) {
  console.log("[DEBUG] Starting server generation with params:", {
    serverName,
    core,
    coreVersion,
    startParameters,
    javaExecutablePath,
    serverPort
  });

  let coreDownloadURL = "";
  let coreFileName = core + "-" + coreVersion + ".jar";
  console.log("[DEBUG] Core filename:", coreFileName);

  let creationTaskID = TASK_MANAGER.addNewTask({
    type: PREDEFINED.TASKS_TYPES.CREATING,
    serverName: serverName,
    core: core,
    coreVersion: coreVersion,
    startParameters: startParameters,
    javaExecutablePath: javaExecutablePath,
    currentStep: null
  });

  console.log("[DEBUG] Creation task ID:", creationTaskID);

  if (SERVERS_MANAGER.isServerExists(serverName)) {
    console.log("[DEBUG] Server already exists:", serverName);
    cb(false);
    return false;
  }

  if (javaExecutablePath !== false) {
    let serverDirectoryPath = "./servers/" + serverName;
    console.log("[DEBUG] Server directory path:", serverDirectoryPath);
    fs.mkdirSync(serverDirectoryPath, { recursive: true });

    if (core.match(/\:\/\//gim) === null && fs.existsSync("./servers/" + serverName + path.sep + core)) {
      console.log("[DEBUG] Using local core file");
      const task = TASK_MANAGER.getTaskData(creationTaskID);
      if (!task) return;

      TASK_MANAGER.updateTask(creationTaskID, {
        currentStep: PREDEFINED.SERVER_CREATION_STEPS.COMPLETED
      });

      serversConfig[serverName] = {
        status: PREDEFINED.SERVER_STATUSES.STOPPED,
        restartOnError: true,
        maxRestartAttempts: 3,
        game: "minecraft",
        minecraftType: "java",
        stopCommand: "stop"
      };

      configManager.writeServersConfig(serversConfig);
      writeJavaStartFiles(serverName, core, startParameters, javaExecutablePath, serverPort);
      logger.log(LanguageManager.translateText(configManager.mainConfig.language, "{{console.serverCreatedSuccess}}", colors.cyan(serverName)));
      cb(true);
    } else {
      console.log("[DEBUG] Attempting to download core");
      TASK_MANAGER.updateTask(creationTaskID, {
        currentStep: PREDEFINED.SERVER_CREATION_STEPS.SEARCHING_CORE
      });

      CORES_MANAGER.getCoreVersionURL(core, coreVersion, (url) => {
        console.log("[DEBUG] Retrieved core URL:", url);
        coreDownloadURL = url;

        if (!url) {
          console.error("[ERROR] Core URL is undefined");
          TASK_MANAGER.updateTask(creationTaskID, {
            currentStep: PREDEFINED.SERVER_CREATION_STEPS.FAILED
          });
          logger.warning(LanguageManager.translateText(configManager.mainConfig.language, "{{console.coreDownloadFailed}}"));
          cb(false);
          return;
        }

        TASK_MANAGER.updateTask(creationTaskID, {
          currentStep: PREDEFINED.SERVER_CREATION_STEPS.CHECKING_JAVA
        });

        TASK_MANAGER.updateTask(creationTaskID, {
          currentStep: PREDEFINED.SERVER_CREATION_STEPS.DOWNLOADING_CORE
        });

        DOWNLOADS_MANAGER.addDownloadTask(coreDownloadURL, serverDirectoryPath + path.sep + coreFileName, (coreDlResult) => {
          if (coreDlResult === true) {
            TASK_MANAGER.updateTask(creationTaskID, {
              currentStep: PREDEFINED.SERVER_CREATION_STEPS.COMPLETED
            });

            serversConfig[serverName] = {
              status: PREDEFINED.SERVER_STATUSES.STOPPED,
              restartOnError: true,
              maxRestartAttempts: 3,
              game: "minecraft",
              minecraftType: "java",
              stopCommand: "stop"
            };

            configManager.writeServersConfig(serversConfig);
            writeJavaStartFiles(serverName, coreFileName, startParameters, javaExecutablePath, serverPort);
            logger.log(LanguageManager.translateText(configManager.mainConfig.language, "{{console.serverCreatedSuccess}}", colors.cyan(serverName)));
            cb(true);
          } else {
            TASK_MANAGER.updateTask(creationTaskID, {
              currentStep: PREDEFINED.SERVER_CREATION_STEPS.FAILED
            });
            logger.warning(LanguageManager.translateText(configManager.mainConfig.language, "{{console.coreDownloadFailed}}"));
            cb(false);
          }
        });
      });
    }
  }
}

export const writeJavaStartFiles = (serverName, coreFileName, startParameters, javaExecutablePath, serverPort) => {
  const platformInfo = getPlatformInfo();
  let fullStartParameters = "-Dfile.encoding=UTF-8 " + startParameters + " -jar " + coreFileName + " nogui";
  let fullJavaExecutablePath = path.resolve(javaExecutablePath);

  const serverDir = path.join("./servers", serverName);
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }

  // Escribir EULA
  fs.writeFileSync(path.join(serverDir, "eula.txt"), "eula=true");

  // Escribir archivo de inicio según la plataforma
  if (platformInfo.isTermux) {
    const startScript = `#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
export LD_LIBRARY_PATH=/data/data/com.termux/files/usr/lib
"${fullJavaExecutablePath}" ${fullStartParameters}`;
    fs.writeFileSync(path.join(serverDir, "start.sh"), startScript);
    fs.chmodSync(path.join(serverDir, "start.sh"), '755');
  } else if (platformInfo.isWindows) {
    fs.writeFileSync(
      path.join(serverDir, "start.bat"),
      `@echo off\nchcp 65001>nul\ncd servers\ncd ${serverName}\n"${fullJavaExecutablePath}" ${fullStartParameters}`
    );
  } else if (platformInfo.isLinux) {
    fs.writeFileSync(
      path.join(serverDir, "start.sh"),
      `cd servers\ncd ${serverName}\n"${fullJavaExecutablePath}" ${fullStartParameters}`
    );
    fs.chmodSync(path.join(serverDir, "start.sh"), '755');
  }

  fs.writeFileSync(
    "./servers/" + serverName + "/server.properties",
    "server-port=" +
    serverPort +
    "\nquery.port=" +
    serverPort +
    "\nenable-query=true\nonline-mode=false" +
    "\nmotd=\u00A7f" +
    serverName
  );

  return true;
};

export const writeBedrockStartFiles = (serverName) => {
  const platformInfo = getPlatformInfo();

  const serverDir = path.join("./servers", serverName);
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }

  // Escribir EULA
  fs.writeFileSync(path.join(serverDir, "eula.txt"), "eula=true");

  if (platformInfo.isTermux) {
    const startScript = `#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
export LD_LIBRARY_PATH=.
/bedrock_server`;
    fs.writeFileSync(path.join(serverDir, "start.sh"), startScript);
    fs.chmodSync(path.join(serverDir, "start.sh"), '755');
  } else if (platformInfo.isWindows) {
    fs.writeFileSync(
      path.join(serverDir, "start.bat"),
      "pushd %~dp0\nbedrock_server.exe\npopd"
    );
  } else if (platformInfo.isLinux) {
    fs.writeFileSync(
      path.join(serverDir, "start.sh"),
      "LD_LIBRARY_PATH=. ./bedrock_server"
    );
    fs.chmodSync(path.join(serverDir, "start.sh"), '755');
  }

  return true;
};