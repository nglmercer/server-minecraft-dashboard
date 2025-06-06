const langInstances = {};
const allLangs = [];
const allStores = [];

async function initializeLangs() {
  if (allLangs.length > 0) return;

  return []
}

function getLangInstance(lang) {
  if (!lang || !lang.endsWith(".json")) {
    lang = lang + ".json";
  }
  return langInstances[lang] || null;
}

function getLangStore(lang) {
  const storeInstance = getLangInstance(lang);
  return storeInstance ? storeInstance.store : null;
}

function getAllLangs() {
  return allStores;
}

function translateText(lang, text, ...placers) {
  text = text.toString();
  return text;
  const store = getLangStore(lang);
  if (!store) {
    console.warn(`Store no encontrado para idioma: ${lang}`);
    return text;
  }

  // Buscar marcadores de traducción
  let matches = text.match(/\{{[0-9a-zA-Z\-_.]+\}}/gm);
  if (matches) {
    matches.forEach(match => {
      let keyPath = match.replace(/[\{\}]/g, "").split(".");
      let category = keyPath[0];
      let key = keyPath[1];
      let modificator = keyPath[2];

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

  // Reemplazar placeholders
  placers.forEach((replacement, i) => {
    text = text.replace(`%${i}%`, replacement);
  });

  return text;
}
initializeLangs();
export {
    getLangInstance,
    getLangStore,
    getAllLangs,
    translateText,
    initializeLangs
  };
// Ejemplo de uso
//console.log("getAllLangs", getAllLangs());
//console.log("langIntances", getLangStore("en"));
