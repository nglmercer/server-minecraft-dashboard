/* import PREDEFINED from "./predefined.js"; // Importa constantes predefinidas
import * as COMMONS from "./commons.js";      // Importa funciones comunes
import { createRequire } from 'module';       // Importa createRequire para usar require en ES modules
const require = createRequire(import.meta.url);

// Carga el archivo package.json para obtener la versión actual del proyecto
const packageJSON = require("./../package.json");

// Variable global para almacenar en caché la información de actualizaciones
globalThis.cachedUpdate = null;

// Función para obtener los lanzamientos (releases) de GitHub
export const getGitHubReleases = (cb) => {
    COMMONS.getDataByURL(PREDEFINED.UPDATES_URL_API, cb); // Usa la URL de la API de actualizaciones
};

// Obtener la última versión disponible en GitHub
export const getLatestVersionOnGitHub = (cb) => {
    getGitHubReleases((ghReleases) => {
        if (ghReleases !== false) {
            // Verifica si los datos de los lanzamientos son válidos
            if (typeof ghReleases !== "undefined" && 
                typeof ghReleases[0] !== "undefined" && 
                typeof ghReleases[0].tag_name !== "undefined") {
                // Devuelve la información de la última versión
                cb({
                    version: ghReleases[0].tag_name.replace("v", ""), // Elimina la "v" del tag
                    url: ghReleases[0].html_url,                     // URL del lanzamiento
                    body: ghReleases[0].body                         // Descripción del lanzamiento
                });
            } else {
                cb(false); // Si no hay datos válidos, devuelve false
            }
        } else {
            cb(false); // Si no se pudieron obtener los lanzamientos, devuelve false
        }
    });
};

// Verificar si hay actualizaciones disponibles
export const checkForUpdates = (cb) => {
    getLatestVersionOnGitHub((ghLatestVer) => {
        saveUpdateToCache(ghLatestVer); // Guarda la información en caché
        if (ghLatestVer !== false) {
            // Compara la versión actual con la última versión en GitHub
            if (packageJSON.version !== ghLatestVer.version) {
                cb(ghLatestVer.url); // Si hay una nueva versión, devuelve la URL
            } else {
                cb(false); // Si no hay actualizaciones, devuelve false
            }
        } else {
            cb(false); // Si no se pudo obtener la última versión, devuelve false
        }
    });
};

// Guardar la información de la actualización en caché
export const saveUpdateToCache = (latVer) => {
    if (latVer !== false && packageJSON.version !== latVer.version) {
        // Si hay una nueva versión, guarda los detalles en caché
        cachedUpdate = {
            hasUpdate: true, // Indica que hay una actualización disponible
            version: {
                current: packageJSON.version, // Versión actual del proyecto
                new: latVer.version           // Nueva versión disponible
            },
            url: latVer.url,  // URL de la actualización
            body: latVer.body // Descripción de la actualización
        };
        return;
    }
    // Si no hay actualizaciones, guarda en caché que no hay ninguna
    cachedUpdate = {
        hasUpdate: false
    };
};

// Obtener la información de la actualización almacenada en caché
export const getCachedUpdate = () => {
    if (cachedUpdate === null) {
        return false; // Si no hay datos en caché, devuelve false
    }
    return cachedUpdate; // Devuelve la información almacenada en caché
}; */