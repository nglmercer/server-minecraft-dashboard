import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJSON = require("./../package.json");
import { logger, getDataByURL } from "./utils.js";
import PREDEFINED from "./predefined.js";
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;
import fs from "fs";
import os from "os";
import { configManager } from "./configuration.js";
let usersConfig = globalThis.usersConfig;
let serversConfig = globalThis.serversConfig;

// Función personalizada para obtener ID en Termux
const getTermuxMachineId = () => {
    try {
        // Intentar usar Android ID si está disponible
        const androidIdPath = '/data/data/com.termux/files/usr/tmp/android_id';
        if (fs.existsSync(androidIdPath)) {
            return fs.readFileSync(androidIdPath, 'utf8').trim();
        }

        // Fallback: Usar una combinación de información del sistema
        const hostname = os.hostname();
        const platform = os.platform();
        const release = os.release();
        const uniqueString = `${hostname}-${platform}-${release}`;
        
        // Crear un hash simple de la información
        let hash = 0;
        for (let i = 0; i < uniqueString.length; i++) {
            const char = uniqueString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    } catch (error) {
        console.error('Error getting machine ID:', error);
        return 'fallback-id-' + Date.now();
    }
};
export const getUniqueID = () => {
    try {
        // Intentar usar machineIdSync primero
        return machineIdSync();
    } catch (error) {
        // Si falla, usar la implementación personalizada para Termux
        return getTermuxMachineId();
    }
};

// El resto de tu código permanece igual
export const collectStats = () => {
    let uniqueID = getUniqueID();
    let cpuCommon = os.cpus();
    let usersCount = usersConfig ? Object.keys(usersConfig).length : 0;
    let serversCount = serversConfig ? Object.keys(serversConfig).length : 0;
    let javasInstalled = getAllJavaInstalled();
    let cpuProps = {};

    let platformProps = {
        name: os.type(),
        release: os.release(),
        arch: process.arch,
        version: os.version(),
    };
    if (cpuCommon && cpuCommon.length > 0) {
        cpuProps = {
            model: cpuCommon[0]?.model,
            speed: cpuCommon[0]?.speed,
            cores: cpuCommon?.length,
        };
    } else {
        cpuProps = cpuCommon;
    }
    
    return {
        platform: platformProps,
        totalRAM: Math.round(os.totalmem() / 1024 / 1024),
        cpu: cpuProps,
        uniqueID: uniqueID,
        language: configManager.mainConfig?.language,
        version: packageJSON.version,
        javas: JSON.stringify(javasInstalled),
        serversCount: serversCount,
        authEnabled: configManager.mainConfig?.authorization,
        usersCount: usersCount,
        tgbotEnabled: configManager.mainConfig?.telegramBot.enabled,
        ftpdEnabled: configManager.mainConfig?.ftpd.enabled,
        uptime: Math.round(process.uptime())
    };
};


// Получить все установленные версии Java
export const getAllJavaInstalled = () => {
    if (process.platform === "win32") {
        let directories = [
            "C:/Program Files",
            "C:/Program Files(x86)",
            "C:/Program Files (x86)",
        ];
        let tree = [
            "Java",
            "JDK",
            "OpenJDK",
            "OpenJRE",
            "Adoptium",
            "JRE",
            "AdoptiumJRE",
            "Temurin",
        ];
        let javas = [];
        directories.forEach(function (mainDir) {
            tree.forEach(function (inner) {
                let directory = mainDir + "/" + inner;
                if (fs.existsSync(directory)) {
                    fs.readdirSync(directory).forEach(function (jvs) {
                        if (fs.existsSync(directory + "/" + jvs + "/bin/java.exe")) {
                            javas.push(directory + "/" + jvs + "/bin/java.exe");
                        }
                    });
                }
            });
        });
        return javas;
    }
    return ["java"];
};
// Отправить статистику на сервер
export const sendStatsToServer = (statsData, isOnStart, cb = () => {
}) => {
    let statsResultURL = PREDEFINED.STATS_SEND_URL + encodeURIComponent(JSON.stringify(statsData)) + "&start=" + isOnStart;

    getDataByURL(statsResultURL, (stResult) => {
        if(stResult === false){
            logger.warning("Oops! An error occurred while sending statistics:", stResult.toString());
            cb(false);
            return;
        }
        cb(true);
    });
};