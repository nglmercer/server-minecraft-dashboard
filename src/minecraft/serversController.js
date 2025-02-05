import PREDEFINED from "./predefined.js";
import * as COMMONS from "./commons.js";
import * as SERVERS_MANAGER from "./serversManager.js";
import * as FILE_MANAGER from "./fileManager.js";
import * as ERRORS_PARSER from "./minecraftErrorsParser.js";
import MULTILANG from "./multiLanguage.js";
import fs from "fs";
import path from "path";
import treekill from "tree-kill";
import spParser from "minecraft-server-properties";
import { spawn } from "node:child_process";
import mcs from "node-mcstatus";

// Variables globales para gestionar instancias de servidores
globalThis.serversInstances = {};
globalThis.instancesLogs = {};
globalThis.restartAttempts = {};
globalThis.serversToManualRestart = [];

// Helper functions
const getStartFilePath = (serverName) => {
    const platform = process.platform;
    const startFile = platform === "win32" ? "start.bat" : "start.sh";
    return platform === "win32" || platform === "linux" || platform === "android" 
        ? `./servers/${serverName}/${startFile}` 
        : false;
};

export const writeToStdin = (serverName, data) => {
    if (COMMONS.isObjectsValid(serversInstances[serverName])) {
        data = Buffer.from(data, "utf-8").toString();
        writeServerLog(serverName, data + "\n");
        serversInstances[serverName].stdin.write(data + "\n");
        return true;
    }
    return false;
};

const handleServerStd = (serverName, data) => {
    data = data.toString();
    writeServerLog(serverName, data);

    const isAnyErrorsHere = ERRORS_PARSER.checkStringForErrors(data);
    if (isAnyErrorsHere) {
        writeServerLog(serverName, `§c§l${MULTILANG.translateText(currentLanguage, isAnyErrorsHere)}`);
    }

    Object.keys(PREDEFINED.SERVER_STATUS_CHANGE_MARKERS).forEach((key) => {
        if (COMMONS.testForRegexArray(data, PREDEFINED.SERVER_STATUS_CHANGE_MARKERS[key])) {
            SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES[key]);
        }
    });
};

// Exported functions
export const isServerReadyToStart = (serverName) => {
    const serverStarterPath = getStartFilePath(serverName);
    return serverStarterPath && 
           Object.keys(serversConfig).includes(serverName) && 
           serversConfig[serverName].status === PREDEFINED.SERVER_STATUSES.STOPPED && 
           fs.existsSync(serverStarterPath);
};

export const getServerLog = (serverName, linesCountMinus = -100) => {
    if (COMMONS.isObjectsValid(instancesLogs[serverName])) {
        return instancesLogs[serverName].split(/\r?\n/)
            .slice(linesCountMinus)
            .join("\r\n")
            .replaceAll(/</gim, "&lt;")
            .replaceAll(/>/gim, "&gt;");
    }
    return "";
};

export const writeServerLog = (serverName, data) => {
    instancesLogs[serverName] = instancesLogs[serverName] + data;
    return true;
};

export const doServersLogsCleanup = () => {
    Object.keys(instancesLogs).forEach(serverName => {
        instancesLogs[serverName] = instancesLogs[serverName].split(/\r?\n/)
            .slice(PREDEFINED.MAX_SERVER_LOGS_LENGTH_MINUS)
            .join("\r\n");
    });
    return true;
};

export const prepareServerToStart = (serverName) => {
    instancesLogs[serverName] = "";
    const serverStarterPath = getStartFilePath(serverName);
    if (!serverStarterPath) return false;

    const spawnArgs = process.platform === "win32" 
        ? [path.resolve(serverStarterPath)] 
        : ["sh", [path.resolve(serverStarterPath)]];

    SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES.STARTING);
    return { path: serverStarterPath, spawnArgs };
};

export const stopServer = (serverName) => {
    if (SERVERS_MANAGER.isServerExists(serverName) && 
        SERVERS_MANAGER.getServerStatus(serverName) === PREDEFINED.SERVER_STATUSES.RUNNING) {
        writeToStdin(serverName, SERVERS_MANAGER.getServerInfo(serverName).stopCommand);
        return true;
    }
    return false;
};

export const startServer = (serverName) => {
    if (!isServerReadyToStart(serverName)) return false;

    const startProps = prepareServerToStart(serverName);
    if (!startProps) return false;

    const [command, args] = startProps.spawnArgs.length === 1 
        ? [startProps.spawnArgs[0], []] 
        : [startProps.spawnArgs[0], startProps.spawnArgs[1]];

    serversInstances[serverName] = spawn(command, args, { shell: true });
    addInstanceCloseEventHandler(serverName);
    addInstanceStdEventHandler(serverName);
    return true;
};

export const restartServer = (serverName) => {
    serversToManualRestart.push(serverName);
    stopServer(serverName);
    return true;
};

export const addInstanceCloseEventHandler = (serverName) => {
    serversInstances[serverName].on("close", (code) => {
        SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES.STOPPED);

        if (code != null && code > 1 && code !== 127) {
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.stopCode}}", code));
            if (serversConfig[serverName].restartOnError) {
                if (restartAttempts[serverName] >= serversConfig[serverName].maxRestartAttempts) {
                    writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.restartFailed}}", restartAttempts[serverName]));
                } else {
                    restartAttempts[serverName] = (restartAttempts[serverName] || 0) + 1;
                    writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.restartAttempt}}", restartAttempts[serverName]));
                    startServer(serverName);
                }
            }
        } else if (code === 1 || code === 127) {
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.killed}}"));
        } else {
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.gracefulShutdown}}"));
            if (serversToManualRestart.includes(serverName)) {
                startServer(serverName);
                serversToManualRestart.splice(serversToManualRestart.indexOf(serverName), 1);
            }
        }
    });
};

export const addInstanceStdEventHandler = (serverName) => {
    serversInstances[serverName].stdout.on("data", (data) => handleServerStd(serverName, data));
    serversInstances[serverName].stderr.on("data", (data) => handleServerStd(serverName, data));
};

export const killServer = (serverName) => {
    if (serversInstances[serverName] && COMMONS.isObjectsValid(serversInstances[serverName], serversInstances[serverName].pid)) {
        treekill(serversInstances[serverName].pid, () => {});
        return true;
    }
    return false;
};

export const getStartScript = (serverName) => {
    if (SERVERS_MANAGER.isServerExists(serverName)) {
        const startFilePath = getStartFilePath(serverName);
        const startFileData = fs.readFileSync(startFilePath).toString().split("\n");
        return startFileData[startFileData.length - 1];
    }
    return false;
};

export const setStartScript = (serverName, data) => {
    if (SERVERS_MANAGER.isServerExists(serverName)) {
        const startFilePath = getStartFilePath(serverName);
        const startFileData = fs.readFileSync(startFilePath).toString().split("\n");
        startFileData[startFileData.length - 1] = data;
        fs.writeFileSync(startFilePath, startFileData.join("\n"));
        return true;
    }
    return false;
};

export const getServerProperties = (serverName) => {
    const spFilePath = `./servers/${serverName}/server.properties`;
    if (fs.existsSync(spFilePath)) {
        const spFileData = fs.readFileSync(spFilePath).toString();
        const parsed = spParser.parse(spFileData);
        if (parsed['generator-settings']) {
            parsed['generator-settings'] = JSON.stringify(parsed['generator-settings']);
        }
        return parsed;
    }
    return false;
};

export const saveServerProperties = (serverName, data) => {
    const parsed = JSON.parse(data);
    let result = "";
    for (const [key, value] of Object.entries(parsed)) {
        const stringValue = value === null ? "" : value.toString();
        result += `\n${key}=${stringValue}`;
    }
    FILE_MANAGER.writeFile(serverName, "/server.properties", result);
    return true;
};

export const queryServer = (serverName, cb) => {
    const spData = getServerProperties(serverName);
    if (COMMONS.isObjectsValid(spData['server-port']) && COMMONS.isObjectsValid(serversInstances[serverName])) {
        const chkPort = spData['server-port'];
        const chkOptions = { query: false };
        mcs.statusJava("127.0.0.1", chkPort, chkOptions)
            .then(cb)
            .catch((error) => {
                console.error(error);
                cb(false);
            });
    } else {
        cb(false);
    }
};