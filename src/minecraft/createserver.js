import fs from "fs";
import path from "path";
import * as FileUtils from '../fileutils.js';
import { PathUtils, StorageManager } from '../fileutils.js';
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
  getJavaPath,
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

export const getPlatformInfo = () => {
  const isTermuxAndroid = process.platform === "android" || fs.existsSync("/data/data/com.termux"); // Renamed for clarity
  const isWindows = process.platform === "win32";
  const isLinux = process.platform === "linux" && !isTermuxAndroid; // Ensure Linux isn't also Termux
  return {
    isTermux: isTermuxAndroid, // Keep original name for compatibility if used elsewhere
    isWindows,
    isLinux,
    startScript: isWindows ? "start.bat" : "start.sh",
    platform: process.platform,
  };
};

async function writeStartFiles(config) {
  let { serverName, coreFileName, startParameters = "-Xms1G -Xmx2G", serverPort, coreVersion, javaExecutablePath } = config;

  try {
    if (!serverName || !coreFileName || !serverPort) {
      return { success: false, error: `Parámetros inválidos. serverName: ${serverName}, coreFileName: ${coreFileName}, serverPort: ${serverPort}` };
    }
    console.log("javaExecutablePath para script:", javaExecutablePath);

    const serverBasePath = PathUtils.serverPath;

    const folderResult = await FileUtils.createFolder(serverBasePath, serverName);
    if (!folderResult.success && folderResult.error && !folderResult.error.includes('ya existe')) {
      throw new Error(`Error al crear la carpeta del servidor '${serverName}': ${folderResult.error}`);
    }

    const eulaContent = "eula=true";
    const eulaResult = await FileUtils.writeFile(serverBasePath, serverName, "eula.txt", eulaContent);
    if (!eulaResult.success) throw new Error(`Error al escribir eula.txt: ${eulaResult.error}`);

    const platformInfo = getPlatformInfo();
    const scriptName = platformInfo.startScript;
    const scriptContent = generateStartScript(platformInfo, javaExecutablePath, coreFileName, startParameters);
    console.log("scriptContent", scriptContent);
    const scriptResult = await FileUtils.writeFile(serverBasePath, serverName, scriptName, scriptContent);
    if (!scriptResult.success) throw new Error(`Error al escribir ${scriptName}: ${scriptResult.error}`);

    const propertiesContent = generateServerProperties(serverName, serverPort);
    const propertiesResult = await FileUtils.writeFile(serverBasePath, serverName, "server.properties", propertiesContent);
    if (!propertiesResult.success) throw new Error(`Error al escribir server.properties: ${propertiesResult.error}`);


    console.log(`✅ Archivos de inicio creados para '${serverName}'.`);
    return { success: true, path: path.join(serverBasePath, serverName) };

  } catch (error) {
    console.error("❌ Error en writeStartFiles:", error.message);
    return { success: false, error: error.message };
  }
}

function formatStartParameters(parameters, platformInfo) {
  if (!platformInfo.isWindows) return parameters;
  if (Array.isArray(parameters)) {
    return parameters.join(" ^\n");
  }
  if (typeof parameters === "string") {
    return parameters.replace(/\\?\n/g, " ^\n").trim(); // Adjusted regex for Windows line breaks
  }
  return "";
}

function generateStartScript(platformInfo, javaPath, coreFileName, parameters) {
  const normalizedJavaPath = path.normalize(javaPath || '');

  let finalJavaCmd = "java";
  if (normalizedJavaPath) {
    try {
      // Check if path exists before calling statSync to avoid ENOENT error
      if (fs.existsSync(normalizedJavaPath)) {
        const stats = fs.statSync(normalizedJavaPath);
        if (stats.isDirectory()) {
          const exe = platformInfo.isWindows ? 'java.exe' : 'java';
          finalJavaCmd = `"${path.join(normalizedJavaPath, exe)}"`;
        } else if (stats.isFile()) {
          finalJavaCmd = `"${normalizedJavaPath}"`;
        }
      } else {
        console.warn(`Advertencia: javaExecutablePath '${normalizedJavaPath}' no existe. Se usará 'java' del PATH.`);
      }
    } catch (e) {
      console.warn(`Advertencia: No se pudo acceder a javaExecutablePath '${normalizedJavaPath}'. Error: ${e.message}. Se usará 'java' del PATH.`);
    }
  }
  const encondingParams = "-Dfile.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Dsun.stderr.encoding=UTF-8";
  const formattedParameters = formatStartParameters(parameters, platformInfo);
  const fullParams = `${formattedParameters} ${encondingParams} -jar "${coreFileName}" nogui`;

  if (platformInfo.isWindows) {
    return `@echo off\ncd /d "%~dp0"\n${finalJavaCmd} ${fullParams}\npause`;
  } else if (platformInfo.isTermux || platformInfo.isLinux) {
    return `#!/bin/bash\ncd "$(dirname "$0")"\n${finalJavaCmd} ${fullParams}`;
  }
  console.error("Plataforma no soportada para generar script de inicio:", platformInfo.platform);
  return "";
}

function generateServerProperties(serverName, port) {
  return `server-port=${port}\nquery.port=${port}\nmotd=${serverName}\noffline-mode=true\nonline-mode=false`; // Removed motid and motid-message-prefix as they are PaperMC specific and not universally supported
}

function javaVersionFromResult(obj, defaultVersion) {
  if (!obj) return defaultVersion;
  return obj.javaVersionRequired || obj.version || obj.java?.version || defaultVersion;
}

/**
 * Ensures the required Java version is installed and ready, or prepares it.
 * @param {string|number} requiredJavaVersion - The Java version needed.
 * @returns {Promise<string>} Path to the Java executable.
 * @throws {Error} If Java preparation fails or executable path is not found.
 */
export async function ensureJavaVersionReady(requiredJavaVersion) {
  console.log(`Verificando/Preparando Java ${requiredJavaVersion}...`);
  let javaInfo = getJavaInfoByVersion(requiredJavaVersion); // From javaManager.js
  let javaExecutablePath;

  // First, check if a suitable Java is already easily found and verified
  // For Termux, javaInfo.installed relies on checkJavaVersionTermux, which is a dpkg -l check
  // For non-Termux, we rely on getJavaPath and verifyJavaInstallation
  let preExistingPath = getJavaPath(requiredJavaVersion); // From javaManager.js
  if (preExistingPath && await verifyJavaInstallation(requiredJavaVersion, preExistingPath)) { // From javaManager.js
      console.log(`Java ${requiredJavaVersion} ya está disponible y verificado en: ${preExistingPath}`);
      return preExistingPath;
  }

  // If not found or not verified, proceed to preparation
  console.log(`Java ${requiredJavaVersion} no encontrado, no verificado, o no compatible. Intentando preparar...`);
  // prepareJavaForServer is async and from javaManager.js
  const preparationResult = await prepareJavaForServer(requiredJavaVersion);

  if (!preparationResult.success) {
    throw new Error(`Falló la preparación de Java ${requiredJavaVersion}: ${preparationResult.error}`);
  }

  javaExecutablePath = preparationResult.path;
  if (!javaExecutablePath) { // Should ideally not happen if success is true
    throw new Error(`No se encontró la ruta del ejecutable de Java ${requiredJavaVersion} después de la preparación exitosa, pero la ruta está vacía.`);
  }

  // Final verification of the path obtained from preparation
  if (!await verifyJavaInstallation(requiredJavaVersion, javaExecutablePath)) {
      throw new Error(`Java ${requiredJavaVersion} preparado en ${javaExecutablePath}, pero falló la verificación final.`);
  }

  console.log(`Java ${requiredJavaVersion} preparado y verificado exitosamente. Ruta: ${javaExecutablePath}`);
  return javaExecutablePath;
}


export async function startJavaServerGeneration({ serverName, coreName, coreVersion, startParameters, serverPort, javaVersion }, cb) {
  try {
    const javaRequirements = await generateserverrequirements(coreVersion);
    console.log("Java requirements para el core:", javaRequirements);

    const requiredJavaVersion = javaVersionFromResult(javaRequirements, javaVersion);
    if (!requiredJavaVersion) {
        throw new Error("No se pudo determinar la versión de Java requerida. Proporcione 'javaVersion' o asegúrese que 'generateserverrequirements' la devuelva.");
    }
    console.log("Versión de Java requerida determinada:", requiredJavaVersion);

    const javaExecutablePath = await ensureJavaVersionReady(requiredJavaVersion);

    const coreFileName = `${coreName}-${coreVersion}.jar`;
    const serverDirectoryPath = path.join(PathUtils.serverPath, serverName);

    // Ensure server directory exists (writeStartFiles also does this, but good for download path)
    const folderResult = await FileUtils.createFolder(PathUtils.serverPath, serverName);
    if (!folderResult.success && folderResult.error && !folderResult.error.includes('ya existe')) {
      throw new Error(`Error al asegurar la carpeta del servidor '${serverName}': ${folderResult.error}`);
    }

    const coreDownloadURL = await getCoreVersionURL(coreName, coreVersion);
    if (!coreDownloadURL) {
      throw new Error("No se pudo obtener la URL de descarga del core.");
    }

    const coreFilePath = path.join(serverDirectoryPath, coreFileName);

    if (!FileUtils.pathExists(coreFilePath) || !FileUtils.isFile(coreFilePath)) { // Also check if it's a file
      console.log(`Descargando core ${coreFileName} desde ${coreDownloadURL}...`);
      // Assuming addDownloadTask throws on failure or returns a status
      const downloadStatus = await addDownloadTask(coreDownloadURL, coreFilePath, `Descargando ${coreFileName}`);
      // Check download status if addDownloadTask returns an object with success property
      if (downloadStatus && typeof downloadStatus.success === 'boolean' && !downloadStatus.success) {
          throw new Error(`Falló la descarga del core: ${downloadStatus.error || 'Error desconocido'}`);
      }
      console.log(`✅ Core descargado exitosamente: ${coreFilePath}`);
    } else {
      console.log(`ℹ️ Usando core existente: ${coreFilePath}`);
    }

    const writeResult = await writeStartFiles({
      serverName,
      coreFileName,
      startParameters,
      serverPort,
      coreVersion, // May not be strictly needed by writeStartFiles but kept for consistency
      javaExecutablePath
    });

    if (!writeResult.success) {
      throw new Error(`Error al escribir los archivos de inicio: ${writeResult.error}`);
    }

    console.log(`✅ Proceso de generación para '${serverName}' completado.`);
    if (cb && typeof cb === 'function') cb(true);
    return { success: true, path: writeResult.path };


  } catch (error) {
    console.error(`[ERROR] Falla en startJavaServerGeneration para '${serverName}':`, error.message, error.stack);
    if (cb && typeof cb === 'function') cb(false);
    return { success: false, error: error.message };
  }
}


export async function startJavaServerbyFile({ serverName, startParameters, serverPort, fileName, javaVersion }, cb) {
  try {
    const serverFolderPath = path.join(PathUtils.serverPath, serverName);
    const coreFilePath = path.join(serverFolderPath, fileName);

    // Ensure server directory exists first
    const folderResult = await FileUtils.createFolder(PathUtils.serverPath, serverName);
    if (!folderResult.success && folderResult.error && !folderResult.error.includes('ya existe')) {
      throw new Error(`Error al asegurar la carpeta del servidor '${serverName}': ${folderResult.error}`);
    }

    if (!FileUtils.pathExists(coreFilePath) || !FileUtils.isFile(coreFilePath)) {
      throw new Error(`El archivo core '${fileName}' no existe o no es un archivo válido en '${serverFolderPath}'.`);
    }
    console.log(`ℹ️ Usando archivo core existente: ${coreFilePath}`);

    if (!javaVersion) {
        throw new Error("La 'javaVersion' es requerida para startJavaServerbyFile.");
    }
    const requiredJavaVersion = javaVersion;
    console.log("Versión de Java requerida (desde entrada):", requiredJavaVersion);

    const javaExecutablePath = await ensureJavaVersionReady(requiredJavaVersion);

    const writeResult = await writeStartFiles({
      serverName,
      coreFileName: fileName,
      startParameters,
      serverPort,
      coreVersion: null, // Not applicable here, or could try to parse from fileName
      javaExecutablePath
    });

    if (!writeResult.success) {
      throw new Error(`Error al escribir los archivos de inicio: ${writeResult.error}`);
    }

    console.log(`✅ Proceso de inicio por archivo para '${serverName}' completado.`);
    if (cb && typeof cb === 'function') cb(true);
    return { success: true, path: writeResult.path };

  } catch (error) {
    console.error(`[ERROR] Falla en startJavaServerbyFile para '${serverName}':`, error.message, error.stack);
    if (cb && typeof cb === 'function') cb(false);
    return { success: false, error: error.message };
  }
}


// Ejemplo de uso (sin cambios)
/*
const configserver = {
  serverName: "melserver",
  coreName: "paper",
  coreVersion: "1.21",
  startParameters: "-Xms2G -Xmx4G",
  serverPort: 25565,
  javaVersion: 21 // Opcional si javaManager puede determinarlo desde coreVersion
};

startJavaServerGeneration(configserver, (result) => {
  if (result) {
    console.log("✅ Servidor creado exitosamente.");
  } else {
    console.log("❌ Error al crear el servidor.");
  }
});

const configFile = {
  serverName: "melserverfile",
  fileName: "mycustomserver.jar", // Asegúrate que este archivo exista en servers/melserverfile/
  startParameters: "-Xms1G -Xmx1G",
  serverPort: 25566,
  javaVersion: 17 // Requerido para este método
};

// Para probar startJavaServerbyFile, primero necesitas crear la carpeta y colocar el JAR:
// 1. mkdir -p servers/melserverfile
// 2. cp path/to/your/mycustomserver.jar servers/melserverfile/mycustomserver.jar

startJavaServerbyFile(configFile, (result) => {
  if (result) {
    console.log("✅ Servidor por archivo creado exitosamente.");
  } else {
    console.log("❌ Error al crear el servidor por archivo.");
  }
});
*/