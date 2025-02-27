
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
import exp from "constants";
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
    let { serverName, coreFileName, startParameters = "-Xms1G -Xmx2G", serverPort,coreVersion,javaExecutablePath } = config;
      try {
          if (!serverName || !coreFileName || !serverPort) {
              throw new Error("Parámetros inválidos.",serverName,coreFileName,serverPort);
          }
          console.log("javaExecutablePath",javaExecutablePath)
          // Crear carpeta del servidor si no existe
          createserverfolder(serverName);

          // Crear archivos usando createserverfile
          createserverfile(serverName, "eula.txt", "eula=true");

          const platformInfo = getPlatformInfo();
          const scriptName = platformInfo.startScript;
          const scriptContent = this.generateStartScript(platformInfo, javaExecutablePath, coreFileName, startParameters);
          console.log("scriptContent",scriptContent)
          createserverfile(serverName, scriptName, scriptContent);
          createserverfile(serverName, "server.properties", this.generateServerProperties(serverName, serverPort));

          console.log(`✅ Archivos de inicio creados para '${serverName}'.`,javaExecutablePath);
          return true;
      } catch (error) {
          console.error("❌ Error:", error.message);
          return false;
      }
  }
  formatStartParameters(parameters,platformInfo) {
    if (!platformInfo.isWindows) return parameters;
    if (Array.isArray(parameters)) {
      // Une cada parámetro usando " ^\n" como separador
      return parameters.join(" ^\n");
    }
    if (typeof parameters === "string") {
      // Reemplaza cualquier secuencia de backslash seguido de salto de línea por " ^\n"
      return parameters.replace(/\\+\n/g, " ^\n").trim();
    }
    return "";
  }
  generateStartScript(platformInfo, javaPath, coreFileName, parameters) {
    const fullJavaPath = (platform) => 
      platform.isWindows 
        ? `"${path.join(javaPath, 'java.exe')}"` 
        : `"${path.join(javaPath, 'java')}"`;
  
    const formattedParameters = this.formatStartParameters(parameters,platformInfo);
    const fullParams = `${formattedParameters} -jar "${coreFileName}" nogui`;
  
    if (platformInfo.isWindows) {
      return `@echo off\ncd /d "%~dp0"\n${fullJavaPath(platformInfo)} ${fullParams}\npause`;
    } else if (platformInfo.isTermux || platformInfo.isLinux) {
      //      return `#!/bin/bash\nexport PATH=$PATH:${javaPath}\ncd "$(dirname "$0")"\n${fullJavaPath(platformInfo)} ${fullParams}`;
      return `#!/bin/bash\nexport PATH=$PATH:${javaPath}\ncd "$(dirname "$0")"\njava ${fullParams}`;
    }
  }

  getChangeDirectoryCommand(serverName) {
    const serverPath = path.join("servers", serverName);
    return `if not exist "${serverPath}" mkdir "${serverPath}"\ncd "${serverPath}"`;
  }
  generateServerProperties(serverName, port) {
    return `server-port=${port}\nquery.port=${port}\nmotd=${serverName}\noffline-mode=true\nmotid=Paper\nmotid-message-prefix=[${serverName}]\nonline-mode=false`;
}
}

const newServerManager = new ServerManager();

export async function startJavaServerGeneration(params, cb) {
  let { serverName, core, coreVersion, startParameters, serverPort,javaVersion } = params;
  const javaRequirements = await generateserverrequirements(params);
  //console.log("javaRequirements",javaRequirements) works
  if (!javaRequirements || !javaRequirements.installed) {
    console.log("No se encontraron versiones de Java compatibles en este sistema. Instalando Java", javaRequirements.javaVersionRequired);
    await prepareJavaForServer( javaRequirements.javaVersionRequired || javaVersion);
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
   // console.log("coreFilePath",coreFilePath,serverDirectoryPath,coreFileName) works
    await addDownloadTask(coreDownloadURL, coreFilePath);
    const javaExecutablePath = getJavaInfoByVersion(gameVersionToJava(coreVersion)).javaBinPath || getJavaInfoByVersion(gameVersionToJava(coreVersion)).javaPath;

    newServerManager.writeStartFiles({ serverName, coreFileName, startParameters, serverPort,coreVersion,javaExecutablePath });

    console.log(`✅ Core descargado exitosamente: ${coreFilePath}`);
    cb(true);
  } catch (error) {
    console.error("[ERROR] Failed to download core:", error);
    cb(false);
  }
}
export async function startJavaServerbyFile(params, cb) {
  let { serverName, startParameters, serverPort, fileName,javaVersion } = params;
  const serverFolderPath = path.join("./servers", serverName);
  const existFile = fs.existsSync(serverFolderPath + "/" + fileName);
  if (!existFile) {
    console.log("El archivo no existe en el servidor", serverFolderPath + "/" + fileName);
    return cb(false);
  }
  const javaRequirements = await verifyJavaInstallation(javaVersion);
  //console.log("javaRequirements",javaRequirements) works
  if (!javaRequirements) {
    console.log("No se encontraron versiones de Java compatibles en este sistema. Instalando Java", javaRequirements, javaVersion);
    await prepareJavaForServer(javaVersion);
  }
  const coreFileName = fileName;
  const coreFilePath = path.join(serverFolderPath, fileName);
  const javaExecutablePath = getJavaInfoByVersion(javaVersion).javaBinPath || getJavaInfoByVersion(javaVersion).javaPath;
  newServerManager.writeStartFiles({ serverName, coreFilePath,coreFileName, startParameters, serverPort,javaExecutablePath });
  console.log(`✅ Core descargado exitosamente: ${coreFilePath}`);
  cb(true);
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