import { logger, Logger, StorageManager, getFileNames } from "../utils/utils.js";

const langIntances = {};
const allLangs = [];
const allStores = [];

async function initializeLangs() {
    if (allLangs.length > 0) return; // Evita inicialización repetida

    const supportLangs = await getFileNames("./data/languages");

    allLangs.push(...supportLangs);
    supportLangs.forEach(lang => {
        const langManager = new StorageManager(`languages/${lang}`, "./data");
        langIntances[lang] = langManager;
    });

    // Llenar allStores después de que langIntances esté listo
    allStores.length = 0; // Evitar duplicados
    allStores.push(...allLangs.map(lang => langIntances[lang].store));
}

function getLangInstance(lang) {
    // Normalizar nombre del archivo (asegurar que sea `.json`)
    const normalizedLang = lang.endsWith(".json") ? lang : `${lang}.json`;
    return langIntances[normalizedLang] || null;
}

function getLangStore(lang) {
    const storeInstance = getLangInstance(lang);
    return storeInstance ? storeInstance.store : null;
}

function getAllLangs() {
    return allStores; // Ya está inicializado en `initializeLangs`
}

// Asegurar que los datos se inicialicen antes de su uso
await initializeLangs();
export {
    getLangInstance,
    getLangStore,
    getAllLangs
};
// Ejemplo de uso
//console.log("getAllLangs", getAllLangs());
//console.log("langIntances", getLangStore("en"));
