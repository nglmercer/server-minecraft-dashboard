import { logger, getDataByURL } from '../utils/utils.js';

class CoreDownloader {
    /**
     * Obtiene la URL de descarga de un core basado en PaperMC.
     * @param {string} core - Tipo de core (paper, folia, etc.).
     * @param {string} version - Versión del core.
     * @returns {Promise<string | false>} - URL de descarga o `false` si falla.
     */
    static async getPaperCoreURL(core, version) {
        try {
            const baseUrl = `https://api.papermc.io/v2/projects/${core}/versions/${version}`;
            logger.log("[INFO] PaperCore First Step URL", baseUrl);

            const data = await getDataByURL(baseUrl);
            if (!data || !data.builds?.length) {
                logger.warning("[WARNING] No builds found for PaperMC");
                return false;
            }

            // Obtener la última build disponible
            const latestBuild = Math.max(...data.builds);
            const buildUrl = `${baseUrl}/builds/${latestBuild}`;
            const buildData = await getDataByURL(buildUrl);

            if (!buildData || !buildData.downloads?.application?.name) {
                logger.warning("[WARNING] No application download found for PaperMC");
                return false;
            }

            // Construir la URL final de descarga
            const fileName = buildData.downloads.application.name;
            const downloadURL = `${buildUrl}/downloads/${fileName}`;

            logger.log("[INFO] PaperMC Download URL:", downloadURL);
            return downloadURL;
        } catch (error) {
            logger.error("[ERROR] Failed to fetch Paper core URL:", error);
            return false;
        }
    }

    /**
     * Obtiene la URL de descarga de Purpur.
     * @param {string} version - Versión del core.
     * @returns {Promise<string>} - URL de descarga.
     */
    static async getPurpurCoreURL(version) {
        return `https://api.purpurmc.org/v2/purpur/${version}/latest/download`;
    }

    /**
     * Obtiene la URL de descarga de Magma.
     * @param {string} version - Versión del core.
     * @returns {Promise<string>} - URL de descarga.
     */
    static async getMagmaCoreURL(version) {
        return `https://api.magmafoundation.org/api/v2/${version}/latest/download`;
    }

    /**
     * Obtiene la URL de un core desde una API externa.
     * @param {string} url - URL de la API externa.
     * @param {string} version - Versión del core.
     * @returns {Promise<string | false>} - URL de descarga o `false` si falla.
     */
    static async getCoreByExternalURL(url, version) {
        try {
            const data = await getDataByURL(url);
            if (!data || !data[version]) {
                logger.warning("External API response invalid or missing version");
                return false;
            }
            return data[version];
        } catch (error) {
            logger.error("Error fetching external core URL:", error);
            return false;
        }
    }

    /**
     * Obtiene todas las versiones de cores basados en Paper.
     * @param {string} core - Tipo de core (paper, folia, etc.).
     * @returns {Promise<string[] | false>} - Lista de versiones o `false` si falla.
     */
    static async getAllPaperLikeCores(core = "paper") {
        try {
            const url = `https://api.papermc.io/v2/projects/${core}`;
            const data = await getDataByURL(url);

            if (!data || !data.versions) {
                logger.warning("Failed to fetch Paper-based core list");
                return false;
            }

            logger.log("PaperCore Version Data", data, core, url);
            return data.versions.reverse();
        } catch (error) {
            logger.error("Error fetching Paper core versions:", error);
            return false;
        }
    }

    /**
     * Obtiene todas las versiones de Magma.
     * @returns {Promise<string[] | false>} - Lista de versiones o `false` si falla.
     */
    static async getAllMagmaCores() {
        try {
            const data = await getDataByURL("https://api.magmafoundation.org/api/v2/allVersions");
            if (!data) {
                logger.warning("Failed to fetch Magma versions");
                return false;
            }
            return data;
        } catch (error) {
            logger.error("Error fetching Magma versions:", error);
            return false;
        }
    }

    /**
     * Obtiene todas las versiones de Purpur.
     * @returns {Promise<string[] | false>} - Lista de versiones o `false` si falla.
     */
    static async getAllPurpurCores() {
        try {
            const data = await getDataByURL("https://api.purpurmc.org/v2/purpur/");
            if (!data || !data.versions) {
                logger.warning("Failed to fetch Purpur versions");
                return false;
            }
            return data.versions.reverse();
        } catch (error) {
            logger.error("Error fetching Purpur versions:", error);
            return false;
        }
    }

    /**
     * Obtiene todas las versiones desde una API externa.
     * @param {string} url - URL de la API externa.
     * @param {string} name - Nombre del core.
     * @returns {Promise<string[] | false>} - Lista de versiones o `false` si falla.
     */
    static async getAllCoresByExternalURL(url, name) {
        try {
            logger.log("Fetching external cores", url, name);
            const data = await getDataByURL(url);

            if (!data || typeof data !== 'object') {
                logger.warning("Invalid external core API response", url, data);
                return false;
            }

            const resultList = Object.keys(data);
            logger.log("External core versions retrieved", url, resultList, name);
            return resultList;
        } catch (error) {
            logger.error("Error fetching external core versions:", error);
            return false;
        }
    }
}

export default CoreDownloader;
