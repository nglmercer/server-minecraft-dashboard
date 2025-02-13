import axios from "axios";
import path from "path";
import * as cheerio from "cheerio";
import { readCoresFile, writeCoresFile, isDataRecent, fetchData, logger } from "../utils/utils.js";
import CORES_URL_GEN from "./coresURLGenerator.js";

const URLS = {
    SPIGOT: "https://getbukkit.org/download/spigot",
    MANIFEST: "https://piston-meta.mojang.com/mc/game/version_manifest.json",
    PURPUR: "https://api.purpurmc.org/v2/purpur/",
    MAGMA: "https://api.magmafoundation.org/api/v2/allVersions"
};

const coresFilePath = path.join(process.cwd(), "cores.json");

const PREDEFINED = {
    SERVER_CORES: {
        vanilla: { name: "vanilla", displayName: "Vanilla", versionsMethod: "vanilla", urlGetMethod: "vanilla" },
        paper: { name: "paper", displayName: "PaperMC", versionsMethod: "paper", urlGetMethod: "paper" },
        waterfall: { name: "waterfall", displayName: "Waterfall (Proxy)", versionsMethod: "paper", urlGetMethod: "paper" },
        velocity: { name: "velocity", displayName: "Velocity (Proxy)", versionsMethod: "paper", urlGetMethod: "paper" },
        purpur: { name: "purpur", displayName: "PurpurMC", versionsMethod: "purpur", urlGetMethod: "purpur" },
        spigot: { name: "spigot", displayName: "Spigot", versionsMethod: "spigot", urlGetMethod: "spigot" }
    }
};
const getSpigotVersions = async () => {
    try {
        const { data } = await axios.get(URLS.SPIGOT, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const $ = cheerio.load(data);
        const versions = [];

        $('.download-pane').each((_, element) => {
            const version = $(element).find('div.col-sm-3 h2').text().trim();
            const size = $(element).find('div.col-sm-2 h3').text().trim();
            const releaseDate = $(element).find('div.col-sm-3:nth-of-type(2) h3').text().trim();
            const downloadLink = $(element).find('a.btn-download').attr('href');

            if (version && downloadLink) {
                versions.push({ version, size, releaseDate, downloadLink });
            }
        });

        //console.log(versions); // Debugging
        return versions;
    } catch (error) {
        console.error('Error obteniendo las versiones:', error);
        return [];
    }
};

const getAllMinecraftVersions = async () => {
    try {
        const manifest = await fetchData(URLS.MANIFEST);
        const versions = {};

        await Promise.all(manifest.versions.map(async ({ id, url }) => {
            try {
                const versionInfo = await fetchData(url);
                if (versionInfo?.downloads?.server) {
                    versions[id] = versionInfo.downloads.server.url;
                }
            } catch (error) {
                logger.error(`Error obteniendo versión ${id}:`, error.message);
            }
        }));
        return versions;
    } catch (error) {
        logger.error("Error obteniendo todas las versiones de Minecraft:", error.message);
        return {};
    }
};

const getVanillaCore = async () => {
    let cachedData = readCoresFile(coresFilePath);
    if (cachedData && isDataRecent(cachedData)) {
        logger.log("Usando datos cacheados");
        return Object.keys(cachedData.versions).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    logger.log("Obteniendo datos de la red");
    const allVersions = await getAllMinecraftVersions();
    writeCoresFile(coresFilePath, { lastUpdated: new Date().toISOString(), versions: allVersions });
    return Object.keys(allVersions).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

const getCoreVersions = async (core) => {
    const coreItem = PREDEFINED.SERVER_CORES[core];
    if (!coreItem) return false;

    switch (coreItem.versionsMethod) {
        case "vanilla": return await getVanillaCore();
        case "externalURL": return await CORES_URL_GEN.getAllCoresByExternalURL(coreItem.versionsUrl, coreItem.name);
        case "paper": return await CORES_URL_GEN.getAllPaperLikeCores(coreItem.name);
        case "purpur": return await fetchData(URLS.PURPUR).then(data => data?.versions.reverse() || []);
        case "magma": return await fetchData(URLS.MAGMA).then(data => data || []);
        case "spigot": return await getSpigotVersions().then(data => data || []);
        default: return false;
    }
};

const getCoreVersionURL = async (core, version) => {
    const coreItem = PREDEFINED.SERVER_CORES[core];
    if (!coreItem || !version) return false;

    switch (coreItem.urlGetMethod) {
        case "vanilla": return (await getAllMinecraftVersions())[version] || false;
        case "externalURL": return await CORES_URL_GEN.getCoreByExternalURL(coreItem.versionsUrl, version);
        case "paper": return await CORES_URL_GEN.getPaperCoreURL(coreItem.name, version);
        case "purpur": return `https://api.purpurmc.org/v2/purpur/${version}/latest/download`;
        case "magma": return `https://api.magmafoundation.org/api/v2/${version}/latest/download`;
        default: return false;
    }
};

const getCoresList = () => PREDEFINED.SERVER_CORES;

export {
    getSpigotVersions,
    getAllMinecraftVersions,
    getVanillaCore,
    getCoreVersions,
    getCoreVersionURL,
    getCoresList
};

//console.log(getCoresList());
//console.log(getCoreVersions("spigot"));
//console.log(getCoreVersionURL("spigot", "1.21",(data)=>{console.log(data)}));
//console.log(getAllMinecraftVersions());
//zconsole.log(getVanillaCore());
//console.log(getSpigotVersions());
