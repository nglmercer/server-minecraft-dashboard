import * as FILE_MANAGER from "../fileManager.js";
import * as SERVERS_MANAGER from "../minecraft/serversManager.js";
import {isObjectsValid,downloadFileFromUrl, moveUploadedFile,getSafeFilename } from "../utils.js";
import { security, serversRouterMiddleware } from "../security.js";
import express from "express";
const router = express.Router();
// Endpoint GET for getting the list of plugins
router.get("/:server", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        FILE_MANAGER.scanDirectory(q.server, "/plugins", (result) => {
            if (result === false) {
                return res.send([]);
            }
            let resultArray = [];
            if (result && result.length >= 1){
                result.forEach((item) => {
                    if (item.type === "file") {
                        resultArray.push(item.name);
                    }
                });
            }
            res.send(resultArray);
        });
    } else {
        res.sendStatus(400);
    }
});

// Endpoint POST for uploading a plugin
router.post("/:server", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let sourceFile;
    // Проверяем присутствие файлов в запросе
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
    }

    sourceFile = req.files["server-plugin-input"];

    moveUploadedFile(q.server, sourceFile, "/plugins/" + sourceFile.name, (result) => {
        if (result === true) {
            return res.send(true);
        }
        console.log(result);
        res.sendStatus(400);
    })
});

// Endpoint DELETE for deleting a plugin
router.delete("/:server", serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (isObjectsValid(q.server, q2.plugin) && SERVERS_MANAGER.isServerExists(q.server)) {
        let delResult = FILE_MANAGER.deleteFile(q.server, "/plugins/" + q2.plugin);
        return res.send(delResult);
    }
    res.sendStatus(400);
});
router.post("/:server/from-url", serversRouterMiddleware, (req, res) => {
    const { server } = req.params;
    const { url } = req.body;
    console.log("url plugin", url);
    downloadFileFromUrl(
        server,
        url,
        "/plugins/" + getSafeFilename(url),
        (result, error) => {
            if (result === true) return res.send(true);
            console.error(error);
            res.status(500).send(error || "Error al descargar el plugin");
        }
    );
});
export default router;