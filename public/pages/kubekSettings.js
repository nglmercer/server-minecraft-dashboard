var ACCOUNT_ITEM = "<div class='item' data-account='$0'><div class='iconBg'><span class='material-symbols-rounded'>person</span></div><span>$0</span></div>";
var NEW_ACCOUNT_ITEM = "<div class='item' data-account='newAccItem'><div class='iconBg'><span class='material-symbols-rounded'>add</span></div><span>{{kubekSettings.addNewAccount}}</span></div>";

var currentEditorMode = null;
var currentConfig = null;

function initializeKubekSettings() {
  let allservers = [];
  // Обновляем список серверов
  KubekServers.getServersList((servers) => {
    console.log("servers getServersList", servers);
    if (!servers) return;
      servers.forEach(server => {
          console.log("server getServersList", server);
          const select_servers = document.querySelector('#select_servers');
         const optionserver = {
            label: server,
            value: server
         }
          allservers.push(optionserver);

          select_servers.setOptions(allservers);
      })
  });

}
const userModal = document.querySelector('#userModal');
const dropdown_component = document.querySelector('dropdown-component');
dropdown_component.toggleDropdown();

const sendmapdata = {
    login: "string",
    email: "string",
    permissions: "array",
    password: "string",
    isServersRestricted: "boolean",
    serversAllowed: "array",
    permissionsList: ["file_manager", "manage_servers", "making_servers", "monitor_servers", "manage_java", "manage_plugins", "system_monitoring", "kubek_settings", "accounts"],
};

(async () => {
    console.log("getparsedtranslations();", await getparsedtranslations("kubekSettings","userEditor", "es"));
})();

const selected_server_dropdown = document.querySelector('#selected_server_dropdown');
function getselected_server_dropdown() {
    const data = document.querySelector('#select_servers').getValue();
    console.log("data", data);
    return data;
}
function getAllInputValues() {
    const allData = {};
    const inputs = document.querySelectorAll('custom-input');
    
    inputs.forEach((input) => {
    const id = input.getAttribute('id');
    const value = input.getInputValues();
    allData[id] = value;
    });
    
    return allData;
}

function getdatabyInputs(inputs, isTrue = true) {
    const allData = {};
    let allDatakeys = [];
    inputs.forEach(input => {
        allData[input] = document.querySelector(`#${input}`).getInputValues();
    });
    /*array de los keys de los inputs*/
    if (allData) {
        for (const [key, value] of Object.entries(allData)) {
            if (value || value === isTrue) {
                allDatakeys.push(key);
            }
        }
        return { allData, allDatakeys };
    }
}
function isvalidUserForm(elementname) {
    const usernameForm = document.querySelector(elementname)
    const isvalid = usernameForm.getvalidation();
    console.log("isvalid", isvalid);
    return isvalid;
}

document.querySelector('#isServersRestricted').addEventListener('input-change', (e) => {
    console.log("restrict_servers_access", e.detail);
    if (e.detail.value === true) {
    document.querySelector('#selected_server_dropdown').show();
    } else {
    document.querySelector('#selected_server_dropdown').hide();
    }
});
function setAllInputValues(dataObject) {
  const inputs = document.querySelectorAll('custom-input');
  
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    const name = input.getAttribute('name');
    
    // Buscar el valor en el objeto usando id o name como clave
    const value = dataObject[id] || dataObject[name];
    
    if (value !== undefined) {
      input.setInputValues(value);
    }
  });
}

function resetAllInputValues() {
  const inputs = document.querySelectorAll('custom-input');
  inputs.forEach((input) => {
    input.resetInputValues();
  });
}
var makeAjaxRequest = (url, type, data = "", apiEndpoint = true, cb = () => {}) => {
  if (apiEndpoint) {
      url = KubekPredefined.API_ENDPOINT + url;
  }

  const options = {
      method: type.toUpperCase(),
      headers: {}
  };

  if (data !== "") {
      options.body = data; // Para enviar datos en la solicitud
      // Si necesitas enviar JSON, descomenta la línea siguiente
      // options.headers["Content-Type"] = "application/json";
  }

  fetch(url, options)
      .then(response => {
          if (!response.ok) {
              if (response.status === 403) {
                  KubekAlerts.addAlert(
                      "{{commons.failedToRequest}}", 
                      "warning", 
                      "{{commons.maybeUDoesntHaveAccess}}", 
                      5000
                  );
              }
              throw new Error(`${response.statusText} (status: ${response.status})`);
          }
          return response.json(); // O response.text(), según la respuesta esperada
      })
      .then(data => cb(data))
      .catch((error) => {
          cb(false, error.message, error);
      });
};

function refreshLanguagesList(cb) {

};
async function getparsedtranslations(element,subelement, lang = "en") {	
  const translationsraw = await localStorage.getItem("rawlanguages");
  let alltranslations = [];
  for (const [key, value] of Object.entries(JSON.parse(translationsraw))) {
      const langmaped = {
          lang: value.info.code,
          code: value.info.code,
          id: value.info.id,
          translation: value.translations
          
      }
      alltranslations.push(langmaped);
  }
  console.log("alltranslations", alltranslations);
  if (!element && !subelement || !element) return alltranslations;
  if (alltranslations.length < 1) return alltranslations;
  if (!subelement && element) return alltranslations.find(item => item.lang === lang).translation[element];
  if (subelement && element) {
      if (alltranslations.find(item => item.lang === lang).translation[element]) {
          return alltranslations.find(item => item.lang === lang).translation[element][subelement];
      } else {
          return alltranslations.find(item => item.lang === lang).translation[element];
      }
  }
}
function getrawlanguages() {
  try {
    fetch("/api/rawlanguages")
      .then(response => response.json())
      .then(data => {console.log("rawlanguages", data); localStorage.setItem("rawlanguages", JSON.stringify(data.data))})
      .catch(error => console.error("Error al obtener rawlanguages:", error));
  } catch (error) {
    console.error("Error al obtener rawlanguages:", error);
  }
}
getrawlanguages();
var langSelector = document.querySelector('language-selector');
var objlang = {
  en: {
    code: "en",
    id: "en",
    displayName: "English",
    displayNameEnglish: "English",
    author: "Seeroy"
  },
  es: {
    code: "es",
    id: "es",
    displayName: "Español",
    displayNameEnglish: "Spanish",
    author: "melser"
  },
};
langSelector.langs = Object.values(objlang);
function setlangselector(langs = []) {
  const alllangsParsed = {};
  const keylangs = [];
  if (Array.isArray(langs)) {
    langs.forEach(lang => {
      if (!lang.info) return;
      const langmaped = {
        lang: lang.info.code,
        code: lang.info.code,
        displayName: lang.info.displayName,
        displayNameEnglish: lang.info.displayNameEnglish,
        author: lang.info.author,
        id: lang.info.id,
        translation: lang.translations
      }
      alllangsParsed[lang.info.code] = langmaped;
      keylangs.push(lang.info.code);
    });
  }
  console.log("alllangsParsed", alllangsParsed,keylangs);
 const objtoarray = Object.values(alllangsParsed);
    langSelector.langs = objtoarray;
}
function selectedLanguage(value) {
  langSelector.selected = value;
  localStorage.setItem("userlang", value);
}
if(!localStorage.getItem("userlang")) localStorage.setItem("userlang", "en");
function getLanguage() {
  const selectedLang = langSelector.selected;
  localStorage.setItem("userlang", selectedLang);
  return selectedLang;
}
// Listen for language changes
langSelector.addEventListener('language-change', (event) => {
  console.log('Selected language:', event.detail.langCode);
  console.log('Language data:', event.detail.language);
});
initializeKubekSettings();
