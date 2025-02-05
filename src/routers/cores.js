import PREDEFINED from "../predefined.js";
import * as CORES_MANAGER from "../minecraft/coresManager.js";
import { isObjectsValid } from "../utils.js";
//import * as WEBSERVER from "./../modules/webserver.js";
import express from "express";
const router = express.Router();
    // Endpoint INFO for getting the list of cores
    router.get("/", function (req, res) {
        res.set("Content-Type", "application/json");
        res.send(PREDEFINED.SERVER_CORES);
    });
    
    // Endpoint GET for getting the list of available cores for a server
    router.get("/:core", function (req, res) {
        let q = req.params;
        if (isObjectsValid(q.core) && Object.keys(PREDEFINED.SERVER_CORES).includes(q.core)) {
            res.set("Content-Type", "application/json");
            CORES_MANAGER.getCoreVersions(q.core, (result) => {
                res.send(result);
            });
        } else {
            res.sendStatus(400);
        }
    });
    
    // Endpoint GET for getting the download URL of a core version
    router.get("/:core/:version", function (req, res) {
        let q = req.params;
        if (isObjectsValid(q.core, q.version) && Object.keys(PREDEFINED.SERVER_CORES).includes(q.core)) {
            CORES_MANAGER.getCoreVersionURL(q.core, q.version, (result) => {
                res.send(result);
            });
        } else {
            res.sendStatus(400);
        }
    });
    
    // Endpoint called when a core is uploaded
/*     router.post("/:server", WEBSERVER.serversRouterMiddleware, function (req, res) {
        let q = req.params;
        let sourceFile;
    
        // Revisar si hay archivos en el request tradicional
        if (req.files && Object.keys(req.files).length > 0) {
            sourceFile = req.files["server-core-input"];
            console.log("sourceFile router.post(/:server", sourceFile); 
        } 
        // Revisar si hay datos en el body que necesiten ser convertidos a archivo
        else if (req.body && req.body.fileData) {
            // Si los datos vienen en base64
            if (req.body.fileData.startsWith('data:')) {
                const base64Data = req.body.fileData.split(';base64,').pop();
                sourceFile = {
                    name: req.body.fileName,
                    data: Buffer.from(base64Data, 'base64')
                };
            } 
            // Si los datos vienen en otro formato
            else {
                sourceFile = {
                    name: req.body.fileName,
                    data: Buffer.from(req.body.fileData)
                };
            }
        } else {
            return res.status(400).send("No file data provided");
        }
    
        COMMONS.moveUploadedFile(q.server, sourceFile, "/" + sourceFile.name, (result) => {
            if (result === true) {
                return res.send({ success: true, serverName: q.server, sourceFile: sourceFile });
            }
            console.log("result server", result, sourceFile);
            res.sendStatus(400);
        });
    }); */
export default router;