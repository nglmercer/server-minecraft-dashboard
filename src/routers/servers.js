import * as SERVERS_CONTROLLER from "../minecraft/serversController.js";
import * as SERVERS_GENERATOR from "../minecraft/serversGenerator.js";
import * as SERVERS_MANAGER from "../minecraft/serversManager.js";
import { isObjectsValid, moveUploadedFile, getImageBase64 } from "../utils.js";
import { configManager } from "../configuration.js";
import PREDEFINED from "../predefined.js";
import { security } from "../security.js";
import express from "express";
import fs from "fs";
import path from "path";
import { Base64 } from "js-base64";
import Jimp from "jimp";

const router = express.Router();
function isValidServer(server) {
    return isObjectsValid(server) && SERVERS_MANAGER.isServerExists(server);
}
// Middleware para verificar la autorización del usuario
export const serversRouterMiddleware = (req, res, next) => {
    if (configManager.mainConfig.authorization === false) {
        return next();
    }

    let chkValue = false;
    if (isObjectsValid(req.params.server)) {
        chkValue = req.params.server;
    } else if (isObjectsValid(req.query.server)) {
        chkValue = req.query.server;
    }

    if (chkValue === false) {
        return next();
    }

    if (security.isUserHasCookies(req) && security.isUserHasServerAccess(req.cookies["kbk__login"], chkValue)) {
        return next();
    }

    return res.sendStatus(403);
}

// Estructura del administrador de cuentas
const ACCOUNTS_MANAGER = {
    getUserData: (login) => {
        const useridrandom = Math.random().toString(36).substr(2, 9);
        return useridrandom === login || login === "kubek" || login === "admin" || useridrandom;
    },
}

// Ruta GET para obtener la lista de servidores
router.get("/", function (req, res) {
    let preparedList = SERVERS_MANAGER.getServersList();
    if (configManager.mainConfig.authorization === true) {
        let uData = ACCOUNTS_MANAGER.getUserData(req.cookies["kbk__login"]);
        if (ACCOUNTS_MANAGER.getUserData(req.cookies["kbk__login"]).serversAccessRestricted === true) {
            let newList = [];
            uData.serversAllowed.forEach((server) => {
                if (preparedList.includes(server)) {
                    newList.push(server);
                }
            });
            return res.send(newList);
        }
    }
    res.send(preparedList);
});

// Ruta GET para crear un nuevo servidor
router.get("/new", function (req, res) {
    let q = req.query;
    q.gameType = "minecraft";
    q.minecraftType = "java";
    if (q.gameType === "minecraft" && q.minecraftType === "java") {
        if (isObjectsValid(q.server, q.core, q.coreVersion, q.startParameters, q.javaVersion, q.port)) {
            SERVERS_GENERATOR.prepareJavaForServer(q.javaVersion, (javaExecutablePath) => {
                SERVERS_GENERATOR.startJavaServerGeneration(q.server, q.core, q.coreVersion, q.startParameters, javaExecutablePath, q.port, (genResult) => {
                    res.send(genResult);
                });
            })
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
});

// Ruta GET para obtener el log del servidor
router.get("/:server/log", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server)) {
        if (isObjectsValid(instancesLogs[q.server])) {
            const serverLog = SERVERS_CONTROLLER.getServerLog(q.server);
            res.send({ success: true, serverLog: serverLog });
        } else {
            res.send("");
        }
        return;
    }
    res.sendStatus(400);
});

// Ruta GET para iniciar el servidor
router.get("/:server/start", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isValidServer(q.server)) {
        return res.send(SERVERS_CONTROLLER.startServer(q.server));
    }
    res.sendStatus(400);
});

// Ruta GET para reiniciar el servidor
router.get("/:server/restart", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isValidServer(q.server)) {
        return res.send(SERVERS_CONTROLLER.restartServer(q.server));
    }
    res.sendStatus(400);
});

// Ruta GET para detener el servidor
router.get("/:server/stop", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isValidServer(q.server)) {
        return res.send(SERVERS_CONTROLLER.stopServer(q.server));
    }
    res.sendStatus(400);
});

// Ruta GET para matar el servidor
router.get("/:server/kill", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isValidServer(q.server)) {
        return res.send(SERVERS_CONTROLLER.killServer(q.server));
    }
    res.sendStatus(400);
});

// Ruta GET para enviar comandos al servidor
router.get("/:server/send", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (isObjectsValid(q.server, q2.cmd)) {
        return res.send(SERVERS_CONTROLLER.writeToStdin(q.server, q2.cmd));
    }
    res.sendStatus(400);
});

// Ruta GET para obtener el icono del servidor
router.get("/:server/icon", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (!isValidServer(q.server)) return res.sendStatus(400);

    let iconPath = `./servers/${q.server}/server-icon.png`;
    let base64Image = getImageBase64(iconPath) || getImageBase64(PREDEFINED.DEFAULT_KUBEK_ICON);
    
    if (base64Image) {
        let imageBuffer = Buffer.from(base64Image, "base64");
        res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": imageBuffer.length,
        });
        res.end(imageBuffer);
    } else {
        res.sendStatus(500);
    }
});


// Ruta POST para cambiar el icono del servidor
router.post("/:server/icon", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let sourceFile, sourceExt;
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
    }

    sourceFile = req.files["server-icon-input"];
    sourceExt = path.extname(sourceFile.name);

    moveUploadedFile(q.server, sourceFile, "/server-icon-PREPARED" + sourceExt, (result) => {
        if (result === true) {
            Jimp.read("./servers/" + q.server + "/server-icon-PREPARED" + sourceExt, (err, file) => {
                if (err) throw err;
                file
                    .resize(64, 64) // resize
                    .write("./servers/" + q.server + "/server-icon.png");
                return res.send(true);
            });
        } else {
            res.sendStatus(400);
        }
    })
});

// Ruta GET para obtener la información del servidor
router.get("/:server/info", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isValidServer(q.server)) {
        return res.send(SERVERS_MANAGER.getServerInfo(q.server));
    }
    return res.sendStatus(400);
});

// Ruta PUT para escribir la información del servidor
router.put("/:server/info", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (isObjectsValid(q.server, q2.data) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_MANAGER.writeServerInfo(q.server, JSON.parse(Base64.decode(q2.data))));
    }
    res.sendStatus(400);
});

// Ruta GET para obtener la consulta del servidor
router.get("/:server/query", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isValidServer(q.server) && SERVERS_MANAGER.getServerStatus(q.server) === PREDEFINED.SERVER_STATUSES.RUNNING) {
        SERVERS_CONTROLLER.queryServer(q.server, (queryResult) => {
            res.send(queryResult);
        });
    } else {
        res.sendStatus(400);
    }
});

// Ruta GET para obtener el script de inicio del servidor
router.get("/:server/startScript", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isValidServer(q.server)) {
        const startScript = SERVERS_CONTROLLER.getStartScript(q.server);
        console.log("startScript", startScript);
        return res.send({ success: true, startScript: startScript });
    }
    res.sendStatus(400);
});

// Ruta PUT para escribir el script de inicio del servidor
router.put("/:server/startScript", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (isObjectsValid(q.server, q2.data) && SERVERS_MANAGER.isServerExists(q.server)) {
        const startScript = SERVERS_CONTROLLER.setStartScript(q.server, Base64.decode(q2.data));
        console.log("startScript", startScript);
        return res.send({ success: true, startScript: startScript });
    }
    res.sendStatus(400);
});

// Ruta GET para obtener las propiedades del servidor
router.get("/:server/server.properties", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isValidServer(q.server)) {
        return res.send(SERVERS_CONTROLLER.getServerProperties(q.server));
    }
    res.sendStatus(400);
});

// Ruta PUT para escribir las propiedades del servidor
router.put("/:server/server.properties", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (isObjectsValid(q.server, q2.data) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_CONTROLLER.saveServerProperties(q.server, Base64.decode(q2.data)));
    }
    res.sendStatus(400);
});

// Ruta DELETE para eliminar el servidor
router.delete("/:server", (req, res) => {
    let q = req.params;
    if (isObjectsValid(q.server)) {
        return res.send(SERVERS_MANAGER.deleteServer(q.server));
    }
    res.sendStatus(400);
});

export default router;