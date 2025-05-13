import fs from "fs"; // Todavía puede ser necesario para comprobaciones específicas si no están en fileutils
import path from "path";

// --- Importa las utilidades refactorizadas ---
import * as FileUtils from '../fileutils.js'; // Asume que fileutils.js está en la misma carpeta o ajusta la ruta
import { PathUtils, StorageManager } from '../fileutils.js'; // Importa constantes y clases específicas si es necesario

// --- Importa otros módulos necesarios ---
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

// getPlatformInfo puede quedarse como está o moverse a un módulo de utilidades de plataforma
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
            // Puedes lanzar un error aquí o devolver un objeto de error
            return { success: false, error: `Parámetros inválidos. serverName: ${serverName}, coreFileName: ${coreFileName}, serverPort: ${serverPort}` };
        }
        console.log("javaExecutablePath", javaExecutablePath);

        // Ruta base para los servidores desde PathUtils
        const serverBasePath = PathUtils.serverPath;

        // Crear carpeta del servidor usando FileUtils (maneja si ya existe internamente o a través del error)
        // Nota: createFolder ahora devuelve { success, data, error }
        const folderResult = await FileUtils.createFolder(serverBasePath, serverName);
        // Solo falla si NO es un error de "ya existe"
        if (!folderResult.success && !folderResult.error?.includes('ya existe')) {
             throw new Error(`Error al crear la carpeta del servidor '${serverName}': ${folderResult.error}`);
        }

        // Crear archivos usando FileUtils.writeFile
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
    // (Sin cambios en esta lógica interna)
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
    // (Sin cambios en esta lógica interna, pero asegúrate que javaPath sea correcto)
    // Podrías normalizar javaPath aquí si es necesario
    const normalizedJavaPath = path.normalize(javaPath || ''); // Asegura un path válido o vacío
    
    // Determina si javaPath es un directorio (bin) o el ejecutable directamente
    let finalJavaCmd = "java"; // Comando por defecto
    if (normalizedJavaPath) {
        // Intenta detectar si es un directorio o un archivo
        try {
            const stats = fs.statSync(normalizedJavaPath);
            if (stats.isDirectory()) {
                 // Si es un directorio (ej /path/to/jdk/bin), construye la ruta al ejecutable
                 const exe = platformInfo.isWindows ? 'java.exe' : 'java';
                 finalJavaCmd = `"${path.join(normalizedJavaPath, exe)}"`;
            } else if (stats.isFile()) {
                 // Si ya es la ruta al ejecutable
                 finalJavaCmd = `"${normalizedJavaPath}"`;
            }
             // Si no existe o no es ni fichero ni directorio, se usará 'java' (confiando en el PATH)
        } catch (e) {
             // Error al acceder a javaPath, usar 'java' por defecto
             console.warn(`Advertencia: No se pudo acceder a javaExecutablePath '${normalizedJavaPath}'. Se usará 'java' del PATH.`);
        }
    }

    const formattedParameters = formatStartParameters(parameters, platformInfo);
    // Asegúrate de que coreFileName esté entre comillas por si tiene espacios
    const fullParams = `${formattedParameters} -jar "${coreFileName}" nogui`;

    if (platformInfo.isWindows) {
        // Usa %~dp0 para referirse al directorio del script .bat
        return `@echo off\ncd /d "%~dp0"\n${finalJavaCmd} ${fullParams}\npause`;
    } else if (platformInfo.isTermux || platformInfo.isLinux) {
        // Usa $(dirname "$0") para referirse al directorio del script .sh
        // Exportar PATH puede no ser necesario si finalJavaCmd ya es la ruta absoluta o si java está en el PATH global
        // Si javaPath era solo el directorio bin, añadirlo al PATH puede ser útil
        // const exportPathCmd = (normalizedJavaPath && fs.statSync(normalizedJavaPath).isDirectory()) ? `export PATH=${normalizedJavaPath}:$PATH\n` : "";
        // Simplificado: Si se proporciona una ruta válida, usarla. Si no, confiar en 'java' en el PATH.
        return `#!/bin/bash\ncd "$(dirname "$0")"\n${finalJavaCmd} ${fullParams}`;
    }
    // Añade un caso por defecto o lanza un error si la plataforma no es soportada
    console.error("Plataforma no soportada para generar script de inicio:", platformInfo.platform);
    return ""; // O lanzar error
  }
  function generateServerProperties(serverName, port) {
      // (Sin cambios en esta lógica interna)
      return `server-port=${port}\nquery.port=${port}\nmotd=${serverName}\noffline-mode=true\nmotid=Paper\nmotid-message-prefix=[${serverName}]\nonline-mode=false`;
  }

// --- Funciones de Alto Nivel (startJavaServerGeneration, startJavaServerbyFile) ---


function javaversion(obj, number) { // Helper sin cambios
    if (!obj) return number;
    return obj.javaVersionRequired || obj.version || obj.java?.version || number;
}

export async function startJavaServerGeneration({ serverName, coreName, coreVersion, startParameters, serverPort, javaVersion }, cb) {
    try {
        const javaRequirements = await generateserverrequirements(coreVersion);
        console.log("Java requirements:", javaRequirements); // Log para depuración

        const requiredJavaVersion = javaversion(javaRequirements, javaVersion);
        console.log("Required Java version:", requiredJavaVersion);

        // Verifica si Java está instalado y es compatible
        let javaInfo = getJavaInfoByVersion(requiredJavaVersion);
        let javaExecutablePath = javaInfo?.javaBinPath || javaInfo?.javaPath;

        if (!javaInfo || !javaInfo.installed || !isJavaVersionCompatible(javaInfo.version, requiredJavaVersion)) {
             console.log(`Java ${requiredJavaVersion} no encontrado o no compatible. Intentando preparar...`);
             const preparationResult = await prepareJavaForServer(requiredJavaVersion);
             if (!preparationResult.success) {
                 throw new Error(`Falló la preparación de Java ${requiredJavaVersion}: ${preparationResult.error}`);
             }
             // Re-obtener info de Java después de la preparación
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
        // Usa la ruta base de PathUtils
        const serverDirectoryPath = path.join(PathUtils.serverPath, serverName);

        // Asegurar que el directorio exista (createFolder ya lo hace, pero una comprobación extra no daña)
         const folderResult = await FileUtils.createFolder(PathUtils.serverPath, serverName);
         if (!folderResult.success && !folderResult.error?.includes('ya existe')) {
             throw new Error(`Error al asegurar la carpeta del servidor '${serverName}': ${folderResult.error}`);
         }

        const coreDownloadURL = await getCoreVersionURL(coreName, coreVersion);
        if (!coreDownloadURL) {
            throw new Error("No se pudo obtener la URL de descarga del core.");
        }

        const coreFilePath = path.join(serverDirectoryPath, coreFileName);

        // Verifica si el archivo ya existe para evitar descargarlo de nuevo
        if (!FileUtils.pathExists(coreFilePath)) {
             console.log(`Descargando core ${coreFileName} desde ${coreDownloadURL}...`);
             await addDownloadTask(coreDownloadURL, coreFilePath); // Asume que addDownloadTask maneja errores internamente o lanza
             console.log(`✅ Core descargado exitosamente: ${coreFilePath}`);
        } else {
             console.log(`ℹ️ Usando core existente: ${coreFilePath}`);
        }


        // Escribir archivos de inicio usando el método refactorizado
        const writeResult = await writeStartFiles({
            serverName,
            coreFileName,
            startParameters,
            serverPort,
            coreVersion,
            javaExecutablePath // Pasa la ruta encontrada o preparada
        });

        if (!writeResult.success) {
             throw new Error(`Error al escribir los archivos de inicio: ${writeResult.error}`);
        }

        console.log(`✅ Proceso de generación para '${serverName}' completado.`);
        cb(true);

    } catch (error) {
        console.error(`[ERROR] Falla en startJavaServerGeneration para '${serverName}':`, error.message);
        // console.error(error.stack); // Descomentar para stack trace completo
        cb(false);
    }
}


export async function startJavaServerbyFile({ serverName, startParameters, serverPort, fileName, javaVersion }, cb) {
     try {
         const serverFolderPath = path.join(PathUtils.serverPath, serverName);
         const coreFilePath = path.join(serverFolderPath, fileName); // fileName es el nombre del core JAR existente

         // Validar que el archivo core exista usando FileUtils
         if (!FileUtils.pathExists(coreFilePath) || !FileUtils.isFile(coreFilePath)) {
             throw new Error(`El archivo core '${fileName}' no existe o no es un archivo válido en '${serverFolderPath}'.`);
         }
         console.log(`ℹ️ Usando archivo core existente: ${coreFilePath}`);

         // --- Lógica de Java similar a startJavaServerGeneration ---
         // Asumiendo que javaVersion es la versión *requerida* por el JAR existente
         const requiredJavaVersion = javaVersion; // O determinarla de alguna manera si es posible
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
         // --- Fin Lógica de Java ---


         // Escribir archivos de inicio usando el método refactorizado
         const writeResult = await writeStartFiles({
             serverName,
             coreFileName: fileName, // Usa el nombre de archivo proporcionado
             startParameters,
             serverPort,
             coreVersion: null, // La versión del core no es relevante aquí ya que el archivo ya existe
             javaExecutablePath // Pasa la ruta encontrada o preparada
         });

         if (!writeResult.success) {
             throw new Error(`Error al escribir los archivos de inicio: ${writeResult.error}`);
         }

         console.log(`✅ Proceso de inicio por archivo para '${serverName}' completado.`);
         cb(true);

     } catch (error) {
         console.error(`[ERROR] Falla en startJavaServerbyFile para '${serverName}':`, error.message);
         // console.error(error.stack); // Descomentar para stack trace completo
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