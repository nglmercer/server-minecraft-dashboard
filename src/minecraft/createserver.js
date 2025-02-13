
import fs from "fs";
import path from "path";
import {
  createserverfolder,
  createserverfile,
  createsubfolder,
  updatefolderinfo
} from "../modules/fileFolderRegistry.js";

import {
  gameVersionToJava,
  isTermux,
  getArchitecture,
  installJavaTermux,
  checkJavaVersionTermux,
  getDownloadableJavaVersions,
  getLocalJavaVersions,
  getJavaInfoByVersion,
  verifyJavaInstallation,
  prepareJavaForServer,
  isJavaVersionCompatible,
  generateserverrequirements
} from "./javaManager.js";

import {
  getSpigotVersions,
  getVanillaCore,
  getCoreVersions,
  getCoreVersionURL,
  getCoresList
} from "./coredownloader.js";

import { TASK_MANAGER, addDownloadTask, unpackArchive } from "../modules/taskmanager.js";
import {
  FileManager,
  FolderManager
} from "../modules/FileManager.js";
export const getPlatformInfo = () => {
  const isTermux = process.platform === "android" || fs.existsSync("/data/data/com.termux");
  const isWindows = process.platform === "win32";
  const isLinux = process.platform === "linux";
  return {
    isTermux,
    isWindows,
    isLinux,
    startScript: isWindows ? "start.bat" : "start.sh",
    platform: process.platform,
  };
};
export class ServerManager {
  constructor(basePath = "./servers") {
    this.fileManager = new FileManager(basePath);
  }

  writeStartFiles(config) {
    let { serverName, coreFileName, startParameters = "-Xms1G -Xmx2G", serverPort,coreVersion } = config;
      try {
          if (!serverName || !coreFileName || !serverPort) {
              throw new Error("Parámetros inválidos.");
          }
          const javaExecutablePath = getJavaInfoByVersion(gameVersionToJava(coreVersion)).javaBinPath;
          // Crear carpeta del servidor si no existe
          createserverfolder(serverName);

          // Crear archivos usando createserverfile
          createserverfile(serverName, "eula.txt", "eula=true");

          const platformInfo = getPlatformInfo();
          const scriptName = platformInfo.startScript;
          const scriptContent = this.generateStartScript(platformInfo, javaExecutablePath, coreFileName, startParameters);
          
          createserverfile(serverName, scriptName, scriptContent);
          createserverfile(serverName, "server.properties", this.generateServerProperties(serverName, serverPort));

          console.log(`✅ Archivos de inicio creados para '${serverName}'.`,javaExecutablePath);
          return true;
      } catch (error) {
          console.error("❌ Error:", error.message);
          return false;
      }
  }

  generateStartScript(platformInfo, javaPath, coreFileName, parameters) {
    const fullJavaPath = (platform) => platform.isWindows ? `"${javaPath}\\java.exe"` : `"${javaPath}/java"`;
    const fullParams = `${parameters} -jar "${coreFileName}" nogui`;
    if (platformInfo.isWindows) {
      return `@echo off\n${fullJavaPath(platformInfo)} ${fullParams}`;
    } else 
    if (platformInfo.isTermux || platformInfo.isLinux) {
        // Agrega el export del PATH; en este ejemplo, se asume que javaPath es el directorio del ejecutable.
        return `#!/bin/bash\nexport PATH=$PATH:${javaPath}\ncd "$(dirname "$0")"\n${fullJavaPath(platformInfo)} ${fullParams}`;
    } 
  }

  getChangeDirectoryCommand(serverName) {
    const serverPath = path.join("servers", serverName);
    return `if not exist "${serverPath}" mkdir "${serverPath}"\ncd "${serverPath}"`;
  }
  generateServerProperties(serverName, port) {
    return `server-port=${port}\nquery.port=${port}\nmotd=${serverName}\noffline-mode=false\nmotid=Paper\nmotid-message-prefix=[${serverName}]`;
}
}

const newServerManager = new ServerManager();

export async function startJavaServerGeneration(params, cb) {
  let { serverName, core, coreVersion, startParameters, serverPort } = params;
  const javaRequirements = await generateserverrequirements(params);

  if (!javaRequirements || !javaRequirements.installed) {
    console.log("No se encontraron versiones de Java compatibles en este sistema. Instalando Java", javaRequirements.javaVersionRequired);
    await prepareJavaForServer(javaRequirements.javaVersionRequired);
  }
  
  const coreFileName = `${core}-${coreVersion}.jar`;
  const serverDirectoryPath = `./servers/${serverName}`;
  fs.mkdirSync(serverDirectoryPath, { recursive: true });
  
  try {
    const coreDownloadURL = await getCoreVersionURL(core, coreVersion);
    if (!coreDownloadURL) {
      console.error("[ERROR] Failed to retrieve download URL");
      cb(false);
      return;
    }

    const coreFilePath = path.join(serverDirectoryPath, coreFileName);
    await addDownloadTask(coreDownloadURL, coreFilePath);

    newServerManager.writeStartFiles({ serverName, coreFileName, startParameters, serverPort,coreVersion });

    console.log(`✅ Core descargado exitosamente: ${coreFilePath}`);
    cb(true);
  } catch (error) {
    console.error("[ERROR] Failed to download core:", error);
    cb(false);
  }
}

// Ejemplo de uso:
/* const configserver = {
  serverName: "melserver",  // Nombre del servidor
  core: "paper",          // Tipo de core
  coreVersion: "1.21",    // Versión del core
  startParameters: "-Xms2G -Xmx4G",
  serverPort: 25565,
};

startJavaServerGeneration(configserver, (result) => {
  if (result) {
    console.log("✅ Servidor creado exitosamente.");
  } else {
    console.log("❌ Error al crear el servidor.");
  }
});
 */