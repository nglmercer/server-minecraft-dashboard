import * as UPDATER from "./../modules/updater.js";
import express from "express";
const router = express.Router();
function initializeWebServer() {
// Endpoint GET and POST for checking for updates
/* router.get("/", function (req, res) {
    let updInfo = UPDATER.getCachedUpdate();
    if (updInfo === false) {
        UPDATER.checkForUpdates(() => {
            updInfo = UPDATER.getCachedUpdate();
            res.send(updInfo);
        });
    } else {
        res.send(updInfo);
    }
}); */
}
export { router, initializeWebServer };