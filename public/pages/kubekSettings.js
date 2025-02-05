ACCOUNT_ITEM = "<div class='item' data-account='$0'><div class='iconBg'><span class='material-symbols-rounded'>person</span></div><span>$0</span></div>";
NEW_ACCOUNT_ITEM = "<div class='item' data-account='newAccItem'><div class='iconBg'><span class='material-symbols-rounded'>add</span></div><span>{{kubekSettings.addNewAccount}}</span></div>";

currentEditorMode = null;
currentConfig = null;

function initializeKubekSettings() {
  KubekUI.setTitle("Kubek | {{sections.kubekSettings}}");

  KubekSettingsUI.refreshLanguagesList(() => {
      KubekSettingsUI.loadConfig();
      KubekSettingsUI.refreshUsersList();
  })
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
KubekSettingsUI = class {
    static usermodeeditor = false;
    static getConfig = (cb = () => {
    }) => {
      var urlink = "/settings";  
      KubekRequests.get(urlink, cb);
      console.log("urlink", urlink);    
    }

    // Загрузить конфиг в интерфейс
    static loadConfig = (cb = () => { }) => {
        this.getConfig((config) => {
          currentConfig = config;
          //const recatogrized = getcategorizeddata(config);
          console.log("config", config, currentConfig);
          if (!config) return;
            const serverPortInput = document.querySelector('#server-port-input');
            serverPortInput.setInputValues(config.webserverPort);
            const ftpLoginInput = document.querySelector('#ftp-login-input');
            ftpLoginInput.setInputValues(config.ftpd.username);
            const ftpPasswordInput = document.querySelector('#ftp-password-input');
            ftpPasswordInput.setInputValues(config.ftpd.password);
            const ftpPortInput = document.querySelector('#ftp-port-input');
            ftpPortInput.setInputValues(config.ftpd.port);
            const authEnabled = document.querySelector('#auth-enabled');
            authEnabled.setInputValues(config.authorization);
            const ftpServerEnabled = document.querySelector('#ftp-server-enabled');
            ftpServerEnabled.setInputValues(config.ftpd.enabled);
            const ipsAccessSwitch = document.querySelector('#ips-access-switch');
            ipsAccessSwitch.setInputValues(config.allowOnlyIPsList);
            const subnetsInput = document.querySelector('#subnets-list');
            subnetsInput.setInputValues(config.IPsAllowed);
            console.log("config.IPsAllowed", config.IPsAllowed);
            selectedLanguage(config.language);
            cb();
        });
    }
    static getelementsType(){
      const sendmapdata = {
          login: "string",
          email: "string",
          permissions: "array",
          password: "string",
          isServersRestricted: "boolean",
          serversAllowed: "array",
          permissionsList: ["file_manager", "manage_servers", "making_servers", "monitor_servers", "manage_java", "manage_plugins", "system_monitoring", "kubek_settings", "accounts"],
          htmlinputs: ["login_username", "login_email", "login_password", "isServersRestricted"],
        };
      return sendmapdata;
    }
    // Сохранить конфигурацию
    static saveConfig = () => {
        let language = getLanguage();
        let serverPort =  document.querySelector('#server-port-input').getInputValues();
        let ftpEnabled = document.querySelector('#ftp-server-enabled').getInputValues();
        let ftpLogin = document.querySelector('#ftp-login-input').getInputValues();
        let ftpPassword = document.querySelector('#ftp-password-input').getInputValues();
        let ftpPort = document.querySelector('#ftp-port-input').getInputValues();
        let authorization = document.querySelector('#auth-enabled').getInputValues();
        let ipsAccess = document.querySelector('#ips-access-switch').getInputValues();
        let subnets = document.querySelector('#subnets-list').getInputValues();
        currentConfig.language = language;
        currentConfig.webserverPort = serverPort;
        currentConfig.ftpd.enabled = ftpEnabled;
        currentConfig.ftpd.username = ftpLogin;
        currentConfig.ftpd.password = ftpPassword;
        currentConfig.ftpd.port = ftpPort;
        currentConfig.authorization = authorization;
        currentConfig.allowOnlyIPsList = ipsAccess;
        currentConfig.IPsAllowed = subnets;
        console.log("currentConfig", currentConfig);
        const componentdata = getAllInputValues();
        console.log("componentdata", componentdata);
        KubekRequests.put("/settings?config=" + Base64.encodeURI(JSON.stringify(currentConfig)), (result) => {
            if (result === true) {
                KubekAlerts.addAlert("{{kubekSettings.configSaved}}", "check", "", 5000);
            } else {
                KubekAlerts.addAlert("{{kubekSettings.configNotSaved}}", "warning", result.toString(), 5000);
            }
          });
          setTimeout(() => {
              window.location.reload();
          }, 1000); 
    }

    static refreshUsersList = () => {
      const accountsListElement = document.getElementById("accounts-list");
      accountsListElement.innerHTML = ""; // Limpiar la lista existente
  
      KubekRequests.get("/accounts", (accounts) => {
          console.log("accounts", accounts);
  
          // Agregar el nuevo elemento de cuenta
          const newAccountItemElement = document.createElement("div");
          newAccountItemElement.innerHTML = NEW_ACCOUNT_ITEM;
          accountsListElement.appendChild(newAccountItemElement);
          if (!accounts || accounts.length < 1) return;
          // Iterar sobre las cuentas y agregar elementos a la lista
          accounts.forEach((account) => {
              const accountItemElement = document.createElement("div");
              accountItemElement.innerHTML = ACCOUNT_ITEM.replaceAll("$0", account);
              accountItemElement.dataset.account = account; // Agregar un atributo "data-account"
              accountsListElement.appendChild(accountItemElement);
          });
  
          // Agregar evento click a los elementos de la lista
          const items = accountsListElement.querySelectorAll(".item");
          items.forEach((item) => {
              item.addEventListener("click", function () {
                  const account = this.dataset.account; // Obtener el valor de "data-account"
                  if (account === "newAccItem") {
                      KubekSettingsUI.showNewUserEditor();
                  } else {
                      KubekSettingsUI.openUserEditorByUsername(account);
                  }
              });
          });
      });
  };
  

    // Открыть редактор в режиме создания нового пользователя
    static showNewUserEditor = () => {
        this.resetUserEditorValues();
        const custom_dialog = document.querySelector('#userModal_dialog');
        custom_dialog.options = [
          {
              label: "{{commons.save}}",
              class: "save-btn",
              callback: () => {
                  console.log("save");
                  this.saveUserdata("new");
              }
          },
          {
              label: "{{commons.cancel}}",
              class: "cancel-btn",
              callback: () => {
                  userModal.hide();
                  console.log("cancel");
              }
          },
        ];
        userModal.show();
        this.resetUserEditorValues();
        currentEditorMode = "new";
        this.usermodeeditor = "new";
    }

    // Получить данные по username и передать их в редактор
    static openUserEditorByUsername = (username) => {
        KubekRequests.get("/accounts/" + username, (data) => {
          console.log("data openUserEditorByUsername", data);
            //this.showExistingUserEditor(data.username, data.email, data.permissions, data.serversAccessRestricted, data.serversAllowed);
            if (!data) return;
            const userModal = document.querySelector('#userModal');
            userModal.show();
            const allelements = this.getelementsType();
            allelements.htmlinputs.forEach(element => {
              const htmlelement = document.querySelector(`#${element}`);
              // data.permissions is array of strings
            //console.log("htmlelement", htmlelement, element);
              if (!data || !htmlelement) return;
              if (element === "login_username") {
                htmlelement.setInputValues(data.username);
              } else if (element === "login_email") {
                htmlelement.setInputValues(data.email);
              } else if (element === "isServersRestricted") {
                htmlelement.setInputValues(data.serversAccessRestricted);
              } else if (element === "login_password") {
                htmlelement.setInputValues(data.secret);
                console.log("secret", data.secret);
              }
            });
            allelements.permissionsList.forEach(element => {
              const htmlelement = document.querySelector(`#${element}`);
              //console.log("htmlelement", htmlelement, element);
              data.permissions.forEach(permission => {
                if (permission === element) {
                  htmlelement.setInputValues(true);
                }
                //console.log("permission", permission, "element", element);
              });
            });

            const custom_dialog = document.querySelector('#userModal_dialog');
            custom_dialog.options = [
              {
                label: "{{commons.save}}",
                class: "save-btn",
                callback: () => {
                  console.log("save");
                  this.saveUserdata("existing");
                }
              },
              {
                label: "{{commons.cancel}}",
                class: "cancel-btn",
                callback: () => {
                  console.log("cancel");
                  userModal.hide();
                }
              },
              {
                label: "{{commons.delete}}",
                class: "delete-btn",
                callback: () => {
                  console.log("delete");
                  KubekRequests.delete("/accounts/" + username, () => {
                      KubekSettingsUI.hideUserEditor();
                      KubekSettingsUI.refreshUsersList();
                  });
                  userModal.hide();
                }
              }
            ];
            console.log("custom_dialog", custom_dialog);
            const select_servers = document.querySelector('#select_servers');
              select_servers.setSelectedValues(data.serversAllowed);
          });
    };
    static resetUserEditorValues = () => {
      const allelements = this.getelementsType();
      allelements.htmlinputs.forEach(element => {
        const htmlelement = document.querySelector(`#${element}`);
        htmlelement.resetInputValues();
      });
      allelements.permissionsList.forEach(element => {

        const htmlelement = document.querySelector(`#${element}`);
        htmlelement.resetInputValues();
      });
    }
    static refreshLanguagesList = (cb) => {
        KubekRequests.get("/rawlanguages", (langs) => {
          console.log("rawlanguages", langs);
          localStorage.setItem("rawlanguages", JSON.stringify(langs));
        });
        KubekRequests.get("/languages", (langs) => {
          console.log("langs", langs);  
          setlangselector(langs);
            cb();
        });
    };
    static saveUserdata(usermode = "new"){
      let reqURL;
      const serversAllowed = getselected_server_dropdown();
      console.log("getAllInputValues", getAllInputValues());
      console.log("getdatabyInputs", getdatabyInputs(sendmapdata.permissionsList));
      const permissions = getdatabyInputs(sendmapdata.permissionsList).allDatakeys;   
      const {login_username, login_email, login_password} = getAllInputValues();
      const existemail = login_email || "";
      if (usermode === "new") {
        if (serversAllowed && serversAllowed.length < 1) {
            reqURL = "/accounts?login=" + login_username + "&email=" + existemail + "&permissions=" + permissions + "&password=" + login_password;
        } else {
            reqURL = "/accounts?login=" + login_username + "&email=" + existemail + "&servers="  + serversAllowed +  "&permissions=" + permissions + "&password=" + login_password;
        }
        if (isvalidUserForm("#login_username") && isvalidUserForm("#login_password")) {
            KubekRequests.put(reqURL, (result) => {
                console.log("result", result);
                if (result === true) {
                    KubekAlerts.addAlert("{{kubekSettings.userAdded}}", "check", login_username, 5000);
                    userModal.hide();
                } else {
                    KubekAlerts.addAlert("{{kubekSettings.userNotAdded}}", "warning", login_username, 5000);
                }
                KubekSettingsUI.refreshUsersList();
            });

        }
        console.log("reqURL", reqURL);
      } else if (usermode === "existing") {
        if (serversAllowed && serversAllowed.length < 1) {
            reqURL = "/accounts/" + login_username + "?email=" + existemail + "&permissions=" + permissions;
        } else {
            reqURL = "/accounts/" + login_username + "?email=" + existemail + "&servers=" + serversAllowed + "&permissions=" + permissions;
        }
        if (login_password !== "") {
            reqURL += "&password=" + login_password;
        } 
      console.log("reqURL to update", reqURL);
      KubekRequests.put(reqURL, (result) => {
          if (result === true) {
              KubekAlerts.addAlert("{{kubekSettings.userSaved}}", "check", login_username, 5000);
          } else {
              KubekAlerts.addAlert("{{kubekSettings.userNotEdited}}", "warning", login_username, 5000);
          }
          KubekSettingsUI.refreshUsersList();
      });
      }

    }
}
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
  var apiget = (url, callback, apiEndpoint = true) => {
    makeAjaxRequest(url, "GET", "", apiEndpoint, callback);
  }
  var languageslink = "/languages";
  apiget(languageslink, (langs) => {
      cb();
      console.log("langs", langs);
      setlangselector(langs);
      return langs;
  });
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
  const objtoarray = Object.values(langs);
  console.log("langs", langs, objtoarray);
  if (!langs.length) {
    langSelector.langs = objtoarray;
  } else {
    langSelector.langs = langs;
  }
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
