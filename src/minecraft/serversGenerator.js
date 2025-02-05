import TASK_MANAGER from "../taskManager.js";
import * as CORES_MANAGER from "./coresManager.js";
import * as JAVA_MANAGER from "./javaManager.js";
import * as DOWNLOADS_MANAGER from "../downloadsManager.js";
import * as SERVERS_MANAGER from "./serversManager.js";
import {logger, LanguageManager} from "../utils.js";

import fs from "fs";
import path from "path";
import colors from "colors";
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
    },
}
const configManager = {
    mainConfig: {
        language: "en"
    },
    serversConfig_serverName: {
        status: PREDEFINED.SERVER_STATUSES.STOPPED,
        restartOnError: true,
        maxRestartAttempts: 3,
        game: "minecraft",
        minecraftType: "java",
        stopCommand: "stop"
    }
}
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

// startJavaServerGeneration // GENERATE JAVA SERVER
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

    // Создаём задачу на создание сервера
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

    // Если сервер с таким названием уже существует - не продолжаем
    if (SERVERS_MANAGER.isServerExists(serverName)) {
        console.log("[DEBUG] Server already exists:", serverName);
        cb(false);
        return false;
    }

    if (javaExecutablePath !== false) {
        // Создаём весь путь для сервера
        let serverDirectoryPath = "./servers/" + serverName;
        console.log("[DEBUG] Server directory path:", serverDirectoryPath);
        
        fs.mkdirSync(serverDirectoryPath, {recursive: true});
        
        console.log("[DEBUG] Checking core path conditions:");
        console.log("[DEBUG] core.match(/\\:\\/\\//gim):", core.match(/\:\/\//gim));
        console.log("[DEBUG] Local core path:", "./servers/" + serverName + path.sep + core);
        console.log("[DEBUG] fs.existsSync result:", fs.existsSync("./servers/" + serverName + path.sep + core));

        if (core.match(/\:\/\//gim) === null && fs.existsSync("./servers/" + serverName + path.sep + core)) {
            console.log("[DEBUG] Using local core file");
            const task = TASK_MANAGER.getTaskData(creationTaskID);
            if (!task) return;
            
            TASK_MANAGER.updateTask(creationTaskID, {
                currentStep: PREDEFINED.SERVER_CREATION_STEPS.COMPLETED
            });
            
            // Добавляем новый сервер в конфиг
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
            console.log("[DEBUG] Core:", core);
            console.log("[DEBUG] Core version:", coreVersion);

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
                
                console.log("[DEBUG] Starting core download:");
                console.log("[DEBUG] Download URL:", coreDownloadURL);
                console.log("[DEBUG] Download path:", serverDirectoryPath + path.sep + coreFileName);

                DOWNLOADS_MANAGER.addDownloadTask(coreDownloadURL, serverDirectoryPath + path.sep + coreFileName, (coreDlResult) => {
                    console.log("[DEBUG] Download result:", coreDlResult,coreDownloadURL, serverDirectoryPath + path.sep + coreFileName);
                    
                    if (coreDlResult === true) {
                        TASK_MANAGER.updateTask(creationTaskID, {
                            currentStep: PREDEFINED.SERVER_CREATION_STEPS.COMPLETED
                        });
                        
                        // Добавляем новый сервер в конфиг
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
const isTermux = () => {
    return process.platform === 'android' || fs.existsSync('/data/data/com.termux');
};

// Escribir archivos de inicio para servidor Java
export const writeJavaStartFiles = (serverName, coreFileName, startParameters, javaExecutablePath, serverPort) => {
    let fullStartParameters = "-Dfile.encoding=UTF-8 " + startParameters + " -jar " + coreFileName + " nogui";
    let fullJavaExecutablePath = path.resolve(javaExecutablePath);
    
    // Asegurar que el directorio existe
    const serverDir = path.join("./servers", serverName);
    if (!fs.existsSync(serverDir)){
        fs.mkdirSync(serverDir, { recursive: true });
    }

    // Escribir EULA
    fs.writeFileSync(path.join(serverDir, "eula.txt"), "eula=true");

    // Escribir archivo de inicio según la plataforma
    if (isTermux()) {
        // Script de inicio para Termux
        const startScript = `#!/data/data/com.termux/files/usr/bin/bash
        cd "$(dirname "$0")"
        export LD_LIBRARY_PATH=/data/data/com.termux/files/usr/lib
        "${fullJavaExecutablePath}" ${fullStartParameters}`;
        
        fs.writeFileSync(path.join(serverDir, "start.sh"), startScript);
        // Hacer ejecutable el script
        fs.chmodSync(path.join(serverDir, "start.sh"), '755');
    } else if (process.platform === "win32") {
        // Windows
        fs.writeFileSync(
            path.join(serverDir, "start.bat"),
            `@echo off\nchcp 65001>nul\ncd servers\ncd ${serverName}\n"${fullJavaExecutablePath}" ${fullStartParameters}`
        );
    } else if (process.platform === "linux") {
        // Linux
        fs.writeFileSync(
            path.join(serverDir, "start.sh"),
            `cd servers\ncd ${serverName}\n"${fullJavaExecutablePath}" ${fullStartParameters}`
        );
        // Hacer ejecutable el script
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
    const serverDir = path.join("./servers", serverName);
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(serverDir)){
        fs.mkdirSync(serverDir, { recursive: true });
    }

    // Escribir EULA
    fs.writeFileSync(path.join(serverDir, "eula.txt"), "eula=true");

    if (isTermux()) {
        // Script de inicio para Termux
        const startScript = `#!/data/data/com.termux/files/usr/bin/bash
            cd "$(dirname "$0")"
            export LD_LIBRARY_PATH=.
            ./bedrock_server`;
        
        fs.writeFileSync(path.join(serverDir, "start.sh"), startScript);
        // Hacer ejecutable el script
        fs.chmodSync(path.join(serverDir, "start.sh"), '755');
    } else if (process.platform === "win32") {
        fs.writeFileSync(
            path.join(serverDir, "start.bat"),
            "pushd %~dp0\nbedrock_server.exe\npopd"
        );
    } else if (process.platform === "linux") {
        fs.writeFileSync(
            path.join(serverDir, "start.sh"),
            "LD_LIBRARY_PATH=. ./bedrock_server"
        );
        // Hacer ejecutable el script
        fs.chmodSync(path.join(serverDir, "start.sh"), '755');
    }

    return true;
};
