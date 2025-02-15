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
function translateText(lang, text, ...placers) {
    text = text.toString();

    const store = getLangStore(lang);
    if (!store) {
        return text; // Retorna el texto original si no hay traducciones disponibles
    }

    // Buscar marcadores de traducción usando expresión regular
    let matches = text.match(/\{{[0-9a-zA-Z\-_.]+\}}/gm);
    if (matches) {
        matches.forEach(match => {
            let keyPath = match.replace(/[\{\}]/g, "").split(".");
            let category = keyPath[0];
            let key = keyPath[1];
            let modificator = keyPath[2];

            // Buscar la traducción
            let translation = store?.translations?.[category]?.[key];
            if (translation) {
                if (modificator === "upperCase") {
                    translation = translation.toUpperCase();
                } else if (modificator === "lowerCase") {
                    translation = translation.toLowerCase();
                }
                text = text.replace(match, translation);
            }
        });
    }

    // Reemplazar los placeholders (%0%, %1%, etc.) con los valores proporcionados
    placers.forEach((replacement, i) => {
        text = text.replace(`%${i}%`, replacement);
    });

    return text;
}

// Asegurar que los datos se inicialicen antes de su uso
await initializeLangs();
export {
    getLangInstance,
    getLangStore,
    getAllLangs,
    translateText
};
// Ejemplo de uso
//console.log("getAllLangs", getAllLangs());
//console.log("langIntances", getLangStore("en"));
