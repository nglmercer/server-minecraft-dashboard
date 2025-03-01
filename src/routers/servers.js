import express from 'express';
import {
    createserverfolder,
    createserverfile,
    createsubfolder,
    getfolderinfo,
    updatefolderinfo,
    getallfolderinfo,
    existsfolder,
    getFileInfo,
    ServerStore
  } from '../modules/fileFolderRegistry.js';
  import {
    manager,
    MinecraftServer,
    ServerManager
  } from "../minecraft/servermanager.js";
  import { startJavaServerGeneration,startJavaServerbyFile } from "../minecraft/createserver.js";
function getRequestData(req, keys) {
  const data = {};
  
  keys.forEach(key => {
    data[key] = req.body?.[key] || req.params?.[key] || req.query?.[key] || null;
  });

  return data;
}

  const router = express.Router();
  router.get('/servers', (req, res) => {
    const servers = getallfolderinfo();
//    console.log("servers", servers);
    if (servers.files){
      servers.files.forEach(server => {
        updatefolderinfo(server.name);
      });
    }
    res.status(200).json({ success: true, data: servers, message: ServerStore.store });
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

  router.post('/createserver', (req, res) => {
    const keys = ["serverName", "core", "coreVersion", "startParameters", "javaVersion", "port", "fileName", "formData", "version"];
  
    // Obtener los datos de la petición
    const requestData = getRequestData(req, keys);
    const { serverName, core, coreVersion, startParameters, javaVersion, port, formData, version } = requestData;
    // Validación de campos obligatorios
    if (!serverName || !core || !startParameters || !javaVersion || !port) {
      console.log("Error en la validación de campos", serverName, core, coreVersion, startParameters, javaVersion, port);
      return res.status(400).json({
        success: false,
        error: "Todos los campos son requeridos: serverName, core, coreVersion, startParameters, javaVersion, port."
      });
    }
    
    // Preparar información mapeada
    const mapedServerInfo = {
      existsfolder: existsfolder(serverName),
      fileName: formData ? formData.fileName : `${core}-${coreVersion}.jar`,
      core: core,
      coreVersion: coreVersion || version,
      startParameters: startParameters,
      javaVersion: javaVersion,
      port: port,
      serverPort: port,
      serverName: serverName
    };
    
    if (formData) {
      console.log("Usando core subido:", formData);
      let serverResult = {};
      startJavaServerbyFile(mapedServerInfo, (result) => {
        if (result) {
          serverResult = result;
        } else {
          serverResult.success = false;
          serverResult.error = "Error al crear el servidor.";
        }
        return res.status(200).json({
          success: true,
          data: mapedServerInfo,
          message: serverResult
        });
      });
    } else  if (!mapedServerInfo.existsfolder) {
      try {
        startJavaServerGeneration(mapedServerInfo, result => {
          if (result) {
            console.log({ success: true, data: mapedServerInfo });
          } else {
            console.log({ success: false, error: "Error al crear el servidor.", ServerInfo: mapedServerInfo });
          }
        });
        return res.status(200).json({
          success: true,
          data: mapedServerInfo,
          message: "Servidor creado y core descargado."
        });
      } catch (error) {
        return res.status(500).json({ success: false, error: JSON.stringify(error) });
      }
    } else {
      return res.status(200).json({
        success: true,
        data: mapedServerInfo,
        message: "El servidor ya existe."
      });
    }
  });
  
  
  router.get('/servermanager/:serverName/:action', (req, res) => {
    const { serverName, action } = req.params;
    if (!serverName || !action) {
      return res.status(400).json({ success: false, error: "Todos los campos son requeridos: serverName, action." });
    }
    manager.addServer(serverName, "./servers/" + serverName, { stopCommand: "stop" });
    //console.log("action", action);
    switch (action) {
      case 'start':
        manager.startServer(serverName);
        break;
      case 'stop':
        manager.stopServer(serverName);
        break;
      case 'restart':
        manager.sendCommand(serverName, "stop");
        manager.startServer(serverName);
        break;
      case 'send':
        manager.sendCommand(serverName, req.query.cmd);
        break;
      case 'log':
        const log = manager.getServerLogs(serverName);
        res.status(200).json({ success: true, data: log });
        break;
      case 'info':
        const info = manager.getServerStatus(serverName);
        res.status(200).json({ success: true, data: info });
        break;
      case 'players':
        const players = manager.getServerPlayers(serverName);
        res.status(200).json({ success: true, data: players });
        break;
      case 'metrics':
        const metrics = manager.getServerMetrics(serverName);
        res.status(200).json({ success: true, data: metrics });
        break;
      case 'kill':
        const kill = manager.killserver(serverName);
        res.status(200).json({ success: true, data: kill });
        break;
      default:
        res.status(400).json({ success: false, error: "La acción no es válida." });
    }
  });
  export default router;