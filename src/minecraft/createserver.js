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

async function writeStartFiles(config) {
  let { serverName, coreFileName, startParameters = "-Xms1G -Xmx2G", serverPort, coreVersion, javaExecutablePath } = config;

  try {
    if (!serverName || !coreFileName || !serverPort) {
      return { success: false, error: `Parámetros inválidos. serverName: ${serverName}, coreFileName: ${coreFileName}, serverPort: ${serverPort}` };
    }
    console.log("javaExecutablePath", javaExecutablePath);

    const serverBasePath = PathUtils.serverPath;

    const folderResult = await FileUtils.createFolder(serverBasePath, serverName);
    if (!folderResult.success && !folderResult.error?.includes('ya existe')) {
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
    return { success: true, path: path.join(serverBasePath, serverName) }; // Devuelve éxito

  } catch (error) {
    console.error("❌ Error en writeStartFiles:", error.message);
    return { success: false, error: error.message }; // Devuelve fracaso
  }
}

function formatStartParameters(parameters, platformInfo) {
  if (!platformInfo.isWindows) return parameters;
  if (Array.isArray(parameters)) {
    return parameters.join(" ^\n");
  }
  if (typeof parameters === "string") {
    return parameters.replace(/\\+\n/g, " ^\n").trim();
  }
  return "";
}

function generateStartScript(platformInfo, javaPath, coreFileName, parameters) {
  const normalizedJavaPath = path.normalize(javaPath || '');

  let finalJavaCmd = "java";
  if (normalizedJavaPath) {
    try {
      const stats = fs.statSync(normalizedJavaPath);
      if (stats.isDirectory()) {
        const exe = platformInfo.isWindows ? 'java.exe' : 'java';
        finalJavaCmd = `"${path.join(normalizedJavaPath, exe)}"`;
      } else if (stats.isFile()) {
        finalJavaCmd = `"${normalizedJavaPath}"`;
      }
    } catch (e) {
      console.warn(`Advertencia: No se pudo acceder a javaExecutablePath '${normalizedJavaPath}'. Se usará 'java' del PATH.`);
    }
  }

  const formattedParameters = formatStartParameters(parameters, platformInfo);
  const fullParams = `${formattedParameters} -jar "${coreFileName}" nogui`;

  if (platformInfo.isWindows) {
    return `@echo off\ncd /d "%~dp0"\n${finalJavaCmd} ${fullParams}\npause`;
  } else if (platformInfo.isTermux || platformInfo.isLinux) {
    return `#!/bin/bash\ncd "$(dirname "$0")"\n${finalJavaCmd} ${fullParams}`;
  }
  console.error("Plataforma no soportada para generar script de inicio:", platformInfo.platform);
  return "";
}
function generateServerProperties(serverName, port) {
  return `server-port=${port}\nquery.port=${port}\nmotd=${serverName}\noffline-mode=true\nmotid=Paper\nmotid-message-prefix=[${serverName}]\nonline-mode=false`;
}


function javaversion(obj, number) {
  if (!obj) return number;
  return obj.javaVersionRequired || obj.version || obj.java?.version || number;
}

export async function startJavaServerGeneration({ serverName, coreName, coreVersion, startParameters, serverPort, javaVersion }, cb) {
  try {
    const javaRequirements = await generateserverrequirements(coreVersion);
    console.log("Java requirements:", javaRequirements);

    const requiredJavaVersion = javaversion(javaRequirements, javaVersion);
    console.log("Required Java version:", requiredJavaVersion);

    let javaInfo = getJavaInfoByVersion(requiredJavaVersion);
    let javaExecutablePath = javaInfo?.javaBinPath || javaInfo?.javaPath;

    if (!javaInfo || !javaInfo.installed && !isJavaVersionCompatible(javaInfo.version, requiredJavaVersion)) {
      console.log(`Java ${requiredJavaVersion} no encontrado o no compatible. Intentando preparar...`);
      const preparationResult = await prepareJavaForServer(requiredJavaVersion);
      if (!preparationResult.success) {
        throw new Error(`Falló la preparación de Java ${requiredJavaVersion}: ${preparationResult.error}`);
      }
      javaInfo = getJavaInfoByVersion(requiredJavaVersion);
      javaExecutablePath = javaInfo?.javaBinPath || javaInfo?.javaPath;
      if (!javaExecutablePath) {
        throw new Error(`No se encontró la ruta del ejecutable de Java ${requiredJavaVersion} después de la preparación.`);
      }
      console.log(`Java ${requiredJavaVersion} preparado exitosamente en: ${javaExecutablePath}`);
    } else {
      console.log(`Java ${requiredJavaVersion} encontrado en: ${javaExecutablePath}`);
    }


    const coreFileName = `${coreName}-${coreVersion}.jar`;
    const serverDirectoryPath = path.join(PathUtils.serverPath, serverName);

    const folderResult = await FileUtils.createFolder(PathUtils.serverPath, serverName);
    if (!folderResult.success && !folderResult.error?.includes('ya existe')) {
      throw new Error(`Error al asegurar la carpeta del servidor '${serverName}': ${folderResult.error}`);
    }

    const coreDownloadURL = await getCoreVersionURL(coreName, coreVersion);
    if (!coreDownloadURL) {
      throw new Error("No se pudo obtener la URL de descarga del core.");
    }

    const coreFilePath = path.join(serverDirectoryPath, coreFileName);

    if (!FileUtils.pathExists(coreFilePath)) {
      console.log(`Descargando core ${coreFileName} desde ${coreDownloadURL}...`);
      await addDownloadTask(coreDownloadURL, coreFilePath); // Asume que addDownloadTask maneja errores internamente o lanza
      console.log(`✅ Core descargado exitosamente: ${coreFilePath}`);
    } else {
      console.log(`ℹ️ Usando core existente: ${coreFilePath}`);
    }


    const writeResult = await writeStartFiles({
      serverName,
      coreFileName,
      startParameters,
      serverPort,
      coreVersion,
      javaExecutablePath
    });

    if (!writeResult.success) {
      throw new Error(`Error al escribir los archivos de inicio: ${writeResult.error}`);
    }

    console.log(`✅ Proceso de generación para '${serverName}' completado.`);
    cb(true);

  } catch (error) {
    console.error(`[ERROR] Falla en startJavaServerGeneration para '${serverName}':`, error.message);
    cb(false);
  }
}


export async function startJavaServerbyFile({ serverName, startParameters, serverPort, fileName, javaVersion }, cb) {
  try {
    const serverFolderPath = path.join(PathUtils.serverPath, serverName);
    const coreFilePath = path.join(serverFolderPath, fileName);

    if (!FileUtils.pathExists(coreFilePath) || !FileUtils.isFile(coreFilePath)) {
      throw new Error(`El archivo core '${fileName}' no existe o no es un archivo válido en '${serverFolderPath}'.`);
    }
    console.log(`ℹ️ Usando archivo core existente: ${coreFilePath}`);

    const requiredJavaVersion = javaVersion;
    console.log("Required Java version (from input):", requiredJavaVersion);

    let javaInfo = getJavaInfoByVersion(requiredJavaVersion);
    let javaExecutablePath = javaInfo?.javaBinPath || javaInfo?.javaPath;

    if (!javaInfo || !javaInfo.installed || !isJavaVersionCompatible(javaInfo.version, requiredJavaVersion)) {
      console.log(`Java ${requiredJavaVersion} no encontrado o no compatible. Intentando preparar...`);
      const preparationResult = await prepareJavaForServer(requiredJavaVersion);
      if (!preparationResult.success) {
        throw new Error(`Falló la preparación de Java ${requiredJavaVersion}: ${preparationResult.error}`);
      }
      javaInfo = getJavaInfoByVersion(requiredJavaVersion);
      javaExecutablePath = javaInfo?.javaBinPath || javaInfo?.javaPath;
      if (!javaExecutablePath) {
        throw new Error(`No se encontró la ruta del ejecutable de Java ${requiredJavaVersion} después de la preparación.`);
      }
      console.log(`Java ${requiredJavaVersion} preparado exitosamente en: ${javaExecutablePath}`);
    } else {
      console.log(`Java ${requiredJavaVersion} encontrado en: ${javaExecutablePath}`);
    }


    const writeResult = await writeStartFiles({
      serverName,
      coreFileName: fileName,
      startParameters,
      serverPort,
      coreVersion: null,
      javaExecutablePath
    });

    if (!writeResult.success) {
      throw new Error(`Error al escribir los archivos de inicio: ${writeResult.error}`);
    }

    console.log(`✅ Proceso de inicio por archivo para '${serverName}' completado.`);
    cb(true);

  } catch (error) {
    console.error(`[ERROR] Falla en startJavaServerbyFile para '${serverName}':`, error.message);
    cb(false);
  }
}

// Ejemplo de uso (sin cambios)
/* const configserver = {
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
}); */