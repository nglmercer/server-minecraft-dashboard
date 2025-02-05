import * as SERVERS_CONTROLLER from "../minecraft/serversController.js";
import * as SERVERS_GENERATOR from "../minecraft/serversGenerator.js";
import * as SERVERS_MANAGER from "../minecraft/serversManager.js";
import {isObjectsValid, moveUploadedFile} from "../utils.js";
import PREDEFINED from "../predefined.js";
import { configManager } from "../configuration.js";
import express from "express";
import fs from "fs";
import path from "path";
import { Base64 } from "js-base64";
import Jimp from "jimp";
const router = express.Router();
export const serversRouterMiddleware = (req, res, next) => {
    if (configManager.mainConfig.authorization === false) {
        return next();
    }

    let chkValue = false;
    if (COMMONS.isObjectsValid(req.params.server)) {
        chkValue = req.params.server;
    } else if (COMMONS.isObjectsValid(req.query.server)) {
        chkValue = req.query.server;
    }

    if (chkValue === false) {
        return next();
    }

    if (SECURITY.isUserHasCookies(req) && SECURITY.isUserHasServerAccess(req.cookies["kbk__login"], chkValue)) {
        return next();
    }
    
    return res.sendStatus(403);
}
// accountsManager structure
const ACCOUNTS_MANAGER = {
    getUserData: (login) => {
        const useridrandom = Math.random().toString(36).substr(2, 9);
        return useridrandom === login || login === "kubek" || login === "admin" || useridrandom;
    },
}
// Router GET for getting the list of servers
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
// Router GET for creating a new server
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

// Router GET for getting the log of the server
router.get("/:server/log", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server)) {
        if (isObjectsValid(instancesLogs[q.server])) {
            const serverLog = SERVERS_CONTROLLER.getServerLog(q.server);
            //console.log("serverLog", serverLog);
            res.send({ success: true, serverLog: serverLog });
        } else {
            res.send("");
        }
        return;
    }
    res.sendStatus(400);
});

// Router GET for starting the server
router.get("/:server/start", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_CONTROLLER.startServer(q.server));
    }
    res.sendStatus(400);
});

// Router GET for restarting the server
router.get("/:server/restart", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_CONTROLLER.restartServer(q.server));
    }
    res.sendStatus(400);
});

// Router GET for stopping the server
router.get("/:server/stop", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_CONTROLLER.stopServer(q.server));
    }
    res.sendStatus(400);
});

// Router GET for killing the server
router.get("/:server/kill", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_CONTROLLER.killServer(q.server));
    }
    res.sendStatus(400);
});

// Router GET for sending commands to the server
router.get("/:server/send", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (isObjectsValid(q.server, q2.cmd)) {
        return res.send(SERVERS_CONTROLLER.writeToStdin(q.server, q2.cmd));
    }
    res.sendStatus(400);
});

// Router GET for getting the icon of the server
router.get("/:server/icon", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        let iconPath = "./servers/" + q.server + "/server-icon.png";
        if (fs.existsSync(iconPath)) {
            // Если есть файл иконки, то отправляем его
            res.sendFile(iconPath, {
                root: "./",
            });
        } else {
            // Если нет файла, то отправляем заготовленную иконку
            let image = Buffer.from(PREDEFINED.DEFAULT_KUBEK_ICON, "base64");
            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": image.length,
            });
            res.end(image);
        }
        return;
    }
    res.sendStatus(400);
});

// Router POST for changing the icon of the server
router.post("/:server/icon", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let sourceFile, sourceExt;
    // Проверяем присутствие файлов в запросе
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

// Router GET for getting the information of the server
router.get("/:server/info", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_MANAGER.getServerInfo(q.server));
    }
    return res.sendStatus(400);
});

// Router PUT for writing the information of the server
router.put("/:server/info", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (isObjectsValid(q.server, q2.data) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_MANAGER.writeServerInfo(q.server, JSON.parse(Base64.decode(q2.data))));
    }
    res.sendStatus(400);
});

// Router GET for getting the query of the server
router.get("/:server/query", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server) && SERVERS_MANAGER.getServerStatus(q.server) === PREDEFINED.SERVER_STATUSES.RUNNING) {
        SERVERS_CONTROLLER.queryServer(q.server, (queryResult) => {
            res.send(queryResult);
        });
    } else {
        res.sendStatus(400);
    }
});

// Router GET for getting the start script of the server
router.get("/:server/startScript", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        const startScript = SERVERS_CONTROLLER.getStartScript(q.server);
        console.log("startScript", startScript);
        return res.send({ success: true, startScript: startScript });
    }
    res.sendStatus(400);
});

// Router PUT for writing the start script of the server
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

// Router GET for getting the server.properties of the server
router.get("/:server/server.properties", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_CONTROLLER.getServerProperties(q.server));
    }
    res.sendStatus(400);
});

// Router PUT for writing the server.properties of the server
router.put("/:server/server.properties", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (isObjectsValid(q.server, q2.data) && SERVERS_MANAGER.isServerExists(q.server)) {
        return res.send(SERVERS_CONTROLLER.saveServerProperties(q.server, Base64.decode(q2.data)));
    }
    res.sendStatus(400);
});

// Router DELETE for deleting the server
router.delete("/:server", (req, res) => {
    let q = req.params;
    if (isObjectsValid(q.server)) {
        return res.send(SERVERS_MANAGER.deleteServer(q.server));
    }
    res.sendStatus(400);
});
export default router;