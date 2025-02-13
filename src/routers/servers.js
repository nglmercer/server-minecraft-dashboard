import express from 'express';
import {
    createserverfolder,
    createserverfile,
    createsubfolder,
    getfolderinfo,
    updatefolderinfo,
    getallfolderinfo,
    existsfolder,
    getFileInfo
  } from '../modules/fileFolderRegistry.js';
  const router = express.Router();
  router.get('/servers', (req, res) => {
    const servers = getallfolderinfo();
    res.status(200).json({ success: true, data: servers });
  });
  router.get('/servers/:serverName', (req, res) => {
    const { serverName } = req.params;
    if (!serverName) {
      return res.status(400).json({ success: false, error: "El nombre del servidor es requerido." });
    }
    try {
      const serverInfo = getfolderinfo(serverName);
      res.status(200).json({ success: true, data: serverInfo });
    } catch (error) {
      res.status(500).json({ success: false, error: JSON.stringify(error) });
    }
  });
  router.get('/servers/:serverName/log', (req, res) => {
    const { serverName } = req.params;
    if (!serverName ) {
      return res.status(400).json({ success: false, error: "Todos los campos son requeridos: serverName, fileName." });
    }
    try {
      const fileInfo = getFileInfo(serverName, "logs/latest.log");
      res.status(200).json({ success: true, data: fileInfo });
    } catch (error) {
      res.status(500).json({ success: false, error: JSON.stringify(error) });
    }
  });
  // get file by sername and filename
  router.get('/servers/:serverName/:fileName', (req, res) => {
    const { serverName, fileName } = req.params;
    if (!serverName || !fileName) {
      return res.status(400).json({ success: false, error: "Todos los campos son requeridos: serverName, fileName." });
    }
    try {
      const fileInfo = getFileInfo(serverName, fileName);
      res.status(200).json({ success: true, data: fileInfo });
    } catch (error) {
      res.status(500).json({ success: false, error: JSON.stringify(error) });
    }
  });
  export default router;