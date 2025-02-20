import express from 'express';
import {
    getResourcesUsage,
    getHardwareInfo
} from '../modules/hardwareManager.js';
const router = express.Router();

router.get('/hardware/resources', (req, res) => {
    const hardwareInfo = getResourcesUsage();
    res.status(200).json({ success: true, data: hardwareInfo });
});

router.get("/hardware/usage", function (req, res) {
    getResourcesUsage((result) => {
        res.send(result); // Envía el resultado al cliente
    });
});

// Endpoint para obtener un resumen de la información del hardware
router.get("/hardware/summary", function (req, res) {
    getHardwareInfo((result) => {
        res.send(result); // Envía el resultado al cliente
    });
});

export default router;