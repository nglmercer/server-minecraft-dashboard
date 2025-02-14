import express from 'express';

import {
  createserverfolder,
  createserverfile,
  createsubfolder,
  getfolderinfo,
  updatefolderinfo,
  readfilebyname,
  readfilebypath,
  writeFilebyName
}from '../../modules/servers.js';
import { type } from 'os';
const router = express.Router();

router.get('/plugins/:serverName', (req, res) => {
  const { serverName } = req.params;
  if (!serverName) {
    return res.status(400).json({ success: false, error: "El nombre del servidor es requerido." });
  }
  try {
    const pluginPath = serverName + "/plugins";
    const serverInfo = getfolderinfo(pluginPath);
    const allplugins = serverInfo.files.filter(isPluginORMod);
    res.status(200).json({ success: true, data: allplugins });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});
router.get('/mods/:serverName', (req, res) => {
    const { serverName } = req.params;
    if (!serverName) {
      return res.status(400).json({ success: false, error: "El nombre del servidor es requerido." });
    }
    try {
        const modPath = serverName + "/mods";
      const serverInfo = getfolderinfo(modPath);
      const allmods = serverInfo.files.filter(isPluginORMod);
      res.status(200).json({ success: true, data: allmods });
    } catch (error) {
      res.status(500).json({ success: false, error: JSON.stringify(error) });
    }
  });
  // necesitamos retornar un array de plugins y mods de unicamente los archivos que tengan extension .jar o con extension .zip
  function isPluginORMod(item) {
    const itemTOeval = typeof item === "string" ? item : item.name;

    return itemTOeval.endsWith('.jar') || itemTOeval.endsWith('.zip') || itemTOeval.includes('.jar');
  }
export default router;