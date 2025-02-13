import CORES_URL_GEN from "./coresURLGenerator.js";
import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
const PREDEFINED = {
    SERVER_CORES: {
        vanilla: {
            name: "vanilla",
            displayName: "Vanilla",
            versionsMethod: "vanilla",
            versionsUrl: "https://cdn.seeeroy.ru/Kubek/vanilla.json",
            urlGetMethod: "vanilla"
        },
        paper: {
            name: "paper",
            displayName: "PaperMC",
            versionsMethod: "paper",
            urlGetMethod: "paper"
        },
        waterfall: {
            name: "waterfall",
            displayName: "Waterfall (Proxy)",
            versionsMethod: "paper",
            urlGetMethod: "paper"
        },
        velocity: {
            name: "velocity",
            displayName: "Velocity (Proxy)",
            versionsMethod: "paper",
            urlGetMethod: "paper"
        },
        purpur: {
            name: "purpur",
            displayName: "PurpurMC",
            versionsMethod: "purpur",
            urlGetMethod: "purpur"
        },
        spigot: {
            name: "spigot",
            displayName: "Spigot",
            versionsMethod: "externalURL",
            versionsUrl: "https://cdn.seeeroy.ru/Kubek/spigots.json",
            urlGetMethod: "externalURL"
        }
    },
}
export const getCoreVersions = async (core, cb) => {
    if (typeof PREDEFINED.SERVER_CORES[core] !== "undefined") {
        let coreItem = PREDEFINED.SERVER_CORES[core];
        if (!coreItem) {
            cb(false);
            console.log("coreItem false", coreItem);
            return;
        }
        const name = coreItem.name || coreItem.versionsMethod;
        switch (coreItem.versionsMethod) {
            case "vanilla":
                getvanillacore(cb);
                break;
            case "externalURL":
                CORES_URL_GEN.getAllCoresByExternalURL(coreItem.versionsUrl, cb, name);
                console.log("coreItem.versionsUrl", coreItem.versionsUrl);
                break;
            case "paper":
                CORES_URL_GEN.getAllPaperLikeCores(cb, coreItem.name, name);
                console.log("paper", coreItem, cb, "getAllPaperLikeCores");
                break;
            case "purpur":
                CORES_URL_GEN.getAllPurpurCores(cb, name);
                console.log("Purpur");
                break;
            case "magma":
                CORES_URL_GEN.getAllMagmaCores(cb, name);
                console.log("Magma");
                break;
            default:
                cb(false);
                break;
        }
    } else {
        cb(false);
    }
};
export const getCoreVersionURL = async (core, version, cb) => {
    if (typeof PREDEFINED.SERVER_CORES[core] !== "undefined" && version !== "undefined") {
        let coreItem = PREDEFINED.SERVER_CORES[core];
        if (!coreItem) {
            cb(false);
            console.log("coreItem false", coreItem);
            return;
        }
        switch (coreItem.urlGetMethod) {
            case "vanilla":
                const allVersions = await getAllMinecraftVersions();
                cb(allVersions[version]);
                break;
            case "externalURL":
                CORES_URL_GEN.getCoreByExternalURL(coreItem.versionsUrl, version, cb);
                console.log("externalURL", coreItem.versionsUrl, version);
                break;
            case "paper":
                CORES_URL_GEN.getPaperCoreURL(coreItem.name, version, cb);
                console.log("Paper", coreItem.name, version);
                break;
            case "purpur":
                CORES_URL_GEN.getPurpurCoreURL(version, cb);
                console.log("Purpur", version);
                break;
            case "magma":
                CORES_URL_GEN.getMagmaCoreURL(version, cb);
                console.log("Magma", version);
                break;
            default:
                cb(false);
                break;
        }
    } else {
        cb(false);
    }
};
export const getCoresList = () => {
    return PREDEFINED.SERVER_CORES;
};

const manifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest.json';
const coresFilePath = path.join(process.cwd(), 'cores.json');

// Función para verificar si el archivo existe
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Función para leer el archivo cores.json
function readCoresFile() {
    if (fileExists(coresFilePath)) {
        const data = fs.readFileSync(coresFilePath, 'utf8');
        return JSON.parse(data);
    }
    return null;
}

// Función para escribir en el archivo cores.json
function writeCoresFile(data) {
    fs.writeFileSync(coresFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Función para verificar si los datos son recientes (menos de un día)
function isDataRecent(data) {
    const now = new Date();
    const lastUpdated = new Date(data.lastUpdated);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return (now - lastUpdated) < oneDayInMs;
}

// Función para obtener todas las versiones de Minecraft y sus URLs de descarga
async function getAllMinecraftVersions() {
    return new Promise((resolve, reject) => {
        https.get(manifestUrl, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const manifest = JSON.parse(data);
                const versions = {};
                let pendingRequests = manifest.versions.length;

                if (pendingRequests === 0) resolve(versions);

                manifest.versions.forEach((version) => {
                    https.get(version.url, (versionRes) => {
                        let versionData = '';

                        versionRes.on('data', (chunk) => {
                            versionData += chunk;
                        });

                        versionRes.on('end', () => {
                            try {
                                const versionInfo = JSON.parse(versionData);
                                if (versionInfo.downloads && versionInfo.downloads.server) {
                                    versions[version.id] = versionInfo.downloads.server.url;
                                }
                            } catch (error) {
                                console.error(`Error parsing version ${version.id}:`, error.message);
                            }

                            pendingRequests--;
                            if (pendingRequests === 0) resolve(versions);
                        });
                    }).on('error', (err) => {
                        console.error(`Error fetching version details for ${version.id}:`, err.message);
                        pendingRequests--;
                        if (pendingRequests === 0) resolve(versions);
                    });
                });
            });
        }).on('error', (err) => {
            reject(`Error fetching version manifest: ${err.message}`);
        });
    });
}

// Función principal para obtener las versiones de Minecraft
export async function getvanillacore(cb) {
    let cachedData = readCoresFile();

    if (cachedData && isDataRecent(cachedData)) {
        console.log('Usando datos cacheados');
        let sortedCachedData = Object.keys(cachedData.versions)
            .filter(version => version.length <= 7) // Filtra los que tienen más de 9 caracteres
            .sort((a, b) => a.length - b.length || a.localeCompare(b));
        cb(sortedCachedData);
        return;
    }

    console.log('Obteniendo datos de la red');
    const allVersions = await getAllMinecraftVersions();
    let sortedAllVersions = Object.keys(allVersions)
        .filter(version => version.length <= 7) // Filtra los que tienen más de 9 caracteres
        .sort((a, b) => a.length - b.length || a.localeCompare(b));

    const newData = {
        lastUpdated: new Date().toISOString(),
        versions: allVersions
    };
    writeCoresFile(newData);
    cb(sortedAllVersions);
}

//getAllMinecraftVersions().then(console.log).catch(console.error);