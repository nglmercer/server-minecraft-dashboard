class KubekRequests {
    static selectedServer = window.localStorage.selectedServer;
    // Hacer una solicitud AJAX con las configuraciones necesarias
    static makeAjaxRequest = (url, type, data = "", apiEndpoint = true, cb = () => {}) => {
        if (apiEndpoint) {
            url = KubekPredefined.API_ENDPOINT + url;
        }

        const options = {
            method: type.toString().toUpperCase(),
            headers: {}
        };

        if (data !== "") {
            // Si los datos son un objeto FormData, no configuramos Content-Type automáticamente
            if (data instanceof FormData) {
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
            }
        }

        fetch(url, options)
            .then(async (response) => {
                if (!response.ok) {
                    if (response.status === 403) {
                        KubekAlerts.addAlert("{{commons.failedToRequest}}", "warning", "{{commons.maybeUDoesntHaveAccess}}", 5000);
                    }
                    cb(false, response.statusText, await response.text());
                } else {
                    const responseData = await response.json();
                    cb(responseData);
                }
            })
            .catch((error) => {
                cb(false, error.message, error);
            });
    };

    static get = (url, cb, apiEndpoint = true) => {
        this.makeAjaxRequest(url, "GET", "", apiEndpoint, cb);
    };

    static post = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "POST", data, apiEndpoint, cb);
    };

    static put = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "PUT", data, apiEndpoint, cb);
    };

    static delete = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "DELETE", data, apiEndpoint, cb);
    };

    static head = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "HEAD", data, apiEndpoint, cb);
    };

    static options = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "OPTIONS", data, apiEndpoint, cb);
    };
}
class awaitRequests {
    static selectedServer = window.localStorage.selectedServer;

    // Realizar una solicitud AJAX y retornar una Promesa
    static makeAjaxRequest = async (url, type, data = "", apiEndpoint = true) => {
        if (apiEndpoint) {
            url = KubekPredefined.API_ENDPOINT + url;
        }

        const options = {
            method: type.toUpperCase(),
            headers: {}
        };

        if (data !== "") {
            if (data instanceof FormData) {
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
            }
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                if (response.status === 403) {
                    KubekAlerts.addAlert(
                        "{{commons.failedToRequest}}",
                        "warning",
                        "{{commons.maybeUDoesntHaveAccess}}",
                        5000
                    );
                }
                
                const errorText = await response.text();
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.statusText = response.statusText;
                error.body = errorText;
                throw error;
            }
            
            return await response.json();
            
        } catch (error) {
            throw error; // Propagamos el error para manejo externo
        }
    };

    static get = (url, apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "GET", "", apiEndpoint);
    };

    static post = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "POST", data, apiEndpoint);
    };

    static put = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "PUT", data, apiEndpoint);
    };

    static delete = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "DELETE", data, apiEndpoint);
    };

    static head = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "HEAD", data, apiEndpoint);
    };

    static options = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "OPTIONS", data, apiEndpoint);
    };
}
class KubekBase {
    static get(url, cb, apiEndpoint = true) {
        KubekRequests.get(url, cb, apiEndpoint);
    }

    static post(url, cb, data = "", apiEndpoint = true) {
        KubekRequests.post(url, cb, data, apiEndpoint);
    }

    static put(url, cb, data = "", apiEndpoint = true) {
        KubekRequests.put(url, cb, data, apiEndpoint);
    }

    static delete(url, cb, data = "", apiEndpoint = true) {
        KubekRequests.delete(url, cb, data, apiEndpoint);
    }

    static head(url, cb, data = "", apiEndpoint = true) {
        KubekRequests.head(url, cb, data, apiEndpoint);
    }

    static options(url, cb, data = "", apiEndpoint = true) {
        KubekRequests.options(url, cb, data, apiEndpoint);
    }
}
class awaitBase {
    static get(url, apiEndpoint = true) {
        return awaitRequests.get(url, apiEndpoint);
    }

    static post(url, data = "", apiEndpoint = true) {
        return awaitRequests.post(url, data, apiEndpoint);
    }

    static put(url, data = "", apiEndpoint = true) {
        return awaitRequests.put(url, data, apiEndpoint);
    }

    static delete(url, data = "", apiEndpoint = true) {
        return awaitRequests.delete(url, data, apiEndpoint);
    }

    static head(url, data = "", apiEndpoint = true) {
        return awaitRequests.head(url, data, apiEndpoint);
    }

    static options(url, data = "", apiEndpoint = true) {
        return awaitRequests.options(url, data, apiEndpoint);
    }
}
class KubekCoresManager extends KubekBase {
    static getList(cb) {
        this.get("/cores", cb);
    }

    static getCoreVersions(core, cb) {
        this.get("/cores/" + core, cb);
    }

    static getCoreURL(core, version, cb) {
        this.get("/cores/" + core + "/" + version, cb);
    }
}
class KubekFileManager extends KubekBase {
    // Получить содержимое папки
    static readDirectory(path, cb) {
        this.get("/fileManager/get?server=" + KubekRequests.selectedServer + "&path=" + path, cb);
        // getvalue return
    }

    // Переименовать файл
    static renameFile(path, newName, cb) {
        console.log("rename", path, newName, cb);
        this.get("/fileManager/rename?server=" + KubekRequests.selectedServer + "&path=" + path + "&newName=" + newName, cb);
    }

    // Удалить файл/директорию
    static delete(path, cb) {
        console.log("delete", path);
        this.get("/fileManager/delete?server=" + KubekRequests.selectedServer + "&path=" + path, cb);
    }

    // Создать новую директорию
    static newDirectory(path, name, cb) {
        this.get("/fileManager/newDirectory?server=" + KubekRequests.selectedServer + "&path=" + path + "&name=" + name, cb);
    }

    // Скачать файл
    static downloadFile(path, cb) {
        window.open("/api/fileManager/download?server=" + KubekRequests.selectedServer + "&path=" + path, "_blank")
    }

    // Прочитать файл
    static readFile(path, cb) {
        this.readDirectory(path, (result) => {
            if (result === false) {
                cb(false);
            }
            cb(result.fileData);
        });
    }

    // Создать элемент для записи
    static startChunkWrite(path, cb){
        this.get("/fileManager/chunkWrite/start?server=" + KubekRequests.selectedServer + "&path=" + path, cb);
        return 
    }

    // Дополнить элемент для записи
    static addChunkWrite(id, data, cb){
        this.get("/fileManager/chunkWrite/add?id=" + id + "&data=" + data, cb);
    }

    // Завершить элемент для записи
    static endChunkWrite(id, cb){
        this.get("/fileManager/chunkWrite/end?id=" + id, cb);
    }
}

class KubekHardware extends KubekBase {
    // Получить суммарную информацию о hardware
    static getSummary(cb){
        this.get("/kubek/hardware/summary", cb);
    }

    // Получить информацию об использовании ЦПУ, памяти и тд
    static getUsage(cb){
        this.get("/kubek/hardware/usage", cb);
    }
}
class KubekJavaManager extends KubekBase {
    // Список пользовательских версий Java, установленных в системе
    static getLocalInstalledJava(cb){
        this.get("/java", cb);
    }

    // Список версий Java, установленных в Kubek
    static getKubekInstalledJava(cb){
        this.get("/java/kubek", cb);
    }

    // Список доступных для скачивания версий Java
    static getOnlineJava(cb){
        this.get("/java/online", cb);
    }

    // Получить полный список Java
    static getAllJavas(cb){
        this.get("/java/all", cb);
    }
}
class KubekPlugins extends KubekBase {
    // Список плагинов
    static getPluginsList (cb) {
        this.get("/plugins/" + KubekRequests.selectedServer, cb);
    }

    // Список модов
    static getModsList(cb) {
        this.get("/mods/" + KubekRequests.selectedServer, cb);
    }
}

class KubekServers extends KubekBase {
    // Получить список серверов
    static getServersList = (cb) => {
        this.get("/servers", cb);
    };

    // Получить информацию о сервере (в т.ч. статус)
    static getServerInfo = (server, cb) => {
        this.get("/servers/" + server + "/info", cb);
    };

    // Проверить сервер на существование
    static isServerExists = (server, cb) => {
        this.getServersList((sList) => {
            cb(sList.includes(server));
        });
    };

    // Получить лог сервера
    static getServerLog = (server, cb) => {
        this.get("/servers/" + server + "/log", (log) => {
            if(log === false){
                cb("");
            } else {
                cb(log);
            }
        });
    };

    // Отправить команду на сервер
    static sendCommandToServer = (server, cmd) => {
        this.get("/servers/" + server + "/send?cmd=" + cmd);
    };

    // Отправить команду на сервер из поля ввода консоли
    static sendCommandFromInput = (server, inputElem) => {
        if(inputElem.length === 1){
            this.sendCommandToServer(server, inputElem);
        }
    };

    // Запустить сервер
    static startServer = (server) => {
        if(currentServerStatus === KubekPredefined.SERVER_STATUSES.STOPPED){
            this.get("/servers/" + server + "/start");
        }
    };

    // Перезапустить сервер
    static restartServer = (server) => {
        if(currentServerStatus === KubekPredefined.SERVER_STATUSES.RUNNING){
            this.get("/servers/" + server + "/restart");
        }
    };

    // Остановить сервер
    static stopServer = (server) => {
        if(currentServerStatus === KubekPredefined.SERVER_STATUSES.RUNNING){
            this.get("/servers/" + server + "/stop");
        }
    };
}



class awaitfilemanager extends awaitBase {
    static readDirectory(path) {
        return this.get("/fileManager/get?server=" + awaitRequests.selectedServer + "&path=" + path);
    }
    static readFile(path) {
        return this.get("/fileManager/get?server=" + awaitRequests.selectedServer + "&path=" + path);
    }
    static startChunkWrite(path) {
        return this.get("/fileManager/chunkWrite/start?server=" + awaitRequests.selectedServer + "&path=" + path);
    }
    static addChunkWrite(id, data) {
        return this.get("/fileManager/chunkWrite/add?id=" + id + "&data=" + data);
    }
    static endChunkWrite(id) {
        return this.get("/fileManager/chunkWrite/end?id=" + id);
    }
    static deleteFile(path) {
        return this.get("/fileManager/delete?server=" + awaitRequests.selectedServer + "&path=" + path);
    }
    static renameFile(path, newName) {
        console.log("rename", path, newName);
        return this.get("/fileManager/rename?server=" + awaitRequests.selectedServer + "&path=" + path + "&newName=" + newName);
    }
    static newDirectory(path, name) {
        return this.get("/fileManager/newDirectory?server=" + awaitRequests.selectedServer + "&path=" + path + "&name=" + name);
    }
    static startChunkyFileWrite(path) {
        return this.get("/fileManager/chunkWrite/start?server=" + awaitRequests.selectedServer + "&path=" + path);
    }
    static addFileChunk(id, data) {
        return this.get("/fileManager/chunkWrite/add?id=" + id + "&data=" + data);
    }
    static endChunkyFileWrite(id) {
        return this.get("/fileManager/chunkWrite/end?id=" + id);
    }
}