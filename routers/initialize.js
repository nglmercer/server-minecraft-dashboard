import * as HARDWARE_MANAGER from "../modules/hardwareManager.js"; 
import { configManager } from "../modules/configuration.js";    
import * as COMMONS from "../modules/commons.js";             
import * as FTP_DAEMON from "../modules/ftpDaemon.js";         
import MULTILANG from "../modules/multiLanguage.js";      
import express from "express";                                   
import { createRequire } from 'module';                             
const require = createRequire(import.meta.url);
const router = express.Router();                                 
import { Base64 } from "js-base64";                                
const packageJSON = require("../package.json");                    


function initializeWebServer() {

    // Endpoint para obtener el uso de recursos del sistema
    router.get("/hardware/usage", function (req, res) {
        HARDWARE_MANAGER.getResourcesUsage((result) => {
            res.send(result); // Envía el resultado al cliente
        });
    });

    // Endpoint para obtener un resumen de la información del hardware
    router.get("/hardware/summary", function (req, res) {
        HARDWARE_MANAGER.getHardwareInfo((result) => {
            res.send(result); // Envía el resultado al cliente
        });
    });

    // Endpoint para obtener la versión actual del proyecto
    router.get("/version", function (req, res) {
        // Verifica si la versión está disponible en packageJSON
        if (!packageJSON.version) {
            res.status(500).json({
                error: 'Versión no disponible',
                packageJSON: packageJSON
            });
            return;
        }
        // Envía la versión actual
        res.json({ version: packageJSON.version });
    });

    router.get("/settings", function (req, res) {
        res.send(configManager.mainConfig); // Envía la configuración principal
    });

    router.put("/settings", function (req, res) {
        let q = req.query;
        if (COMMONS.isObjectsValid(q.config)) {
            let decodedConfig = Base64.decode(q.config);
            //console.log("Decoded Config:", decodedConfig); // Verifica la decodificación
            // Detiene el servidor FTP si está en ejecución
            if (FTP_DAEMON.isFTPStarted()) {
                FTP_DAEMON.stopFTP();
            }
            let writeResult = configManager.writeMainConfig(decodedConfig);
            configManager.reloadAllConfigurations();
            globalThis.currentLanguage = configManager.mainConfig.language;
            // Reinicia el servidor FTP
            FTP_DAEMON.startFTP();
            // Envía el resultado de la operación
            return res.send(writeResult);
        }
        // Si la configuración no es válida, devuelve un error 400
        res.sendStatus(400);
    });

    // Endpoint para aceptar el acuerdo EULA
    router.get("/eula/accept", function (req, res) {
        configManager.mainConfig.eulaAccepted = true; // Marca el EULA como aceptado
        configManager.writeMainConfig(configManager.mainConfig); // Guarda la configuración actualizada
        configManager.reloadAllConfigurations();   // Recarga las configuraciones
        res.send(true); // Confirma que el EULA fue aceptado
    });

    // Endpoint para obtener la lista de idiomas disponibles
    router.get("/languages", function (req, res) {
        res.send(MULTILANG.availableLanguages); // Envía la lista de idiomas
    });

    // Endpoint para obtener los datos brutos de los idiomas
    router.get("/rawlanguages", function (req, res) {
        res.send(MULTILANG.rawDataLanguages); // Envía los datos brutos de los idiomas
    });
}

// Exporta el router y la función de inicialización del servidor web
export { router, initializeWebServer };