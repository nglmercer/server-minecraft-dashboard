import express from 'express';
import {
    getSpigotVersions,
    getAllMinecraftVersions,
    getVanillaCore,
    getCoreVersions,
    getCoreVersionURL,
    getCoresList
} from '../../minecraft/coredownloader.js';

const router = express.Router();

// Middleware para manejar rutas asíncronas y capturar errores
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/cores/spigot', asyncHandler(async (req, res) => {
    const spigotVersions = await getSpigotVersions();
    res.status(200).json({ success: true, data: spigotVersions });
}));

router.get('/cores/all', asyncHandler(async (req, res) => {
    const allVersions = await getAllMinecraftVersions();
    res.status(200).json({ success: true, data: allVersions });
}));

router.get('/cores/vanilla', asyncHandler(async (req, res) => {
    const vanillaVersions = await getVanillaCore();
    res.status(200).json({ success: true, data: vanillaVersions });
}));

router.get('/cores/:core', asyncHandler(async (req, res) => {
    const { core } = req.params;
    if (!core) {
        return res.status(400).json({ success: false, error: "El nombre del core es requerido." });
    }
    const coreVersions = await getCoreVersions(core);
    res.status(200).json({ success: true, data: coreVersions });
}));

router.get('/cores/:core/:version', asyncHandler(async (req, res) => {
    const { core, version } = req.params;
    if (!core || !version) {
        return res.status(400).json({ success: false, error: "Todos los campos son requeridos: core, version." });
    }
    const coreVersionURL = await getCoreVersionURL(core, version);
    res.status(200).json({ success: true, data: coreVersionURL });
}));

router.get('/cores', asyncHandler(async (req, res) => {
    const coresList = await getCoresList();
    res.status(200).json({ success: true, data: coresList });
}));

export default router;
