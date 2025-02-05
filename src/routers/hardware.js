import * as HARDWARE_MANAGER from "../hardware/hardwareManager.js"; 
import { configManager } from "../configuration.js";    
import { isObjectsValid, LanguageManager } from "../utils.js";
import express from "express";                                   
const router = express.Router();                                 
//import { Base64 } from "js-base64";                                



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



router.get("/settings", function (req, res) {
    res.send(configManager.mainConfig); // Envía la configuración principal
});

/* router.put("/settings", function (req, res) {
    let q = req.query;
    if (isObjectsValid(q.config)) {
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
}); */

// Endpoint para aceptar el acuerdo EULA
router.get("/eula/accept", function (req, res) {
    configManager.mainConfig.eulaAccepted = true; // Marca el EULA como aceptado
    configManager.writeMainConfig(configManager.mainConfig); // Guarda la configuración actualizada
    configManager.reloadAllConfigurations();   // Recarga las configuraciones
    res.send(true); // Confirma que el EULA fue aceptado
});

// Endpoint para obtener la lista de idiomas disponibles
router.get("/languages", function (req, res) {
    res.send(LanguageManager.availableLanguages); // Envía la lista de idiomas
});

// Endpoint para obtener los datos brutos de los idiomas
router.get("/rawlanguages", function (req, res) {
    res.send(LanguageManager.rawDataLanguages); // Envía los datos brutos de los idiomas
});
export default router;