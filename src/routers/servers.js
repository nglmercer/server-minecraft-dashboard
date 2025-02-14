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
  import {
    manager,
    MinecraftServer,
    ServerManager
  } from "../minecraft/servermanager.js";
  import { startJavaServerGeneration } from "../minecraft/createserver.js";
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
  router.get('/createserver', (req, res) => {
    const { serverName, core, coreVersion, startParameters, javaVersion, port, fileName } = req.query;
    const configserver = {
      serverName: serverName,
      core: core,
      coreVersion: coreVersion,
      startParameters: startParameters,
      javaVersion: javaVersion,
      port: port,
      fileName: fileName
    };
    console.log("configserver", configserver);
    // verificar si el serverName existe y los datos son correctos y enviamos la respuesta de la validacion
    if (!serverName || !core || !coreVersion || !startParameters || !javaVersion || !port || !fileName) {
      return res.status(400).json({ success: false, error: "Todos los campos son requeridos: serverName, core, coreVersion, startParameters, javaVersion, port, fileName." });
    }
    const mapedServerInfo = {
      existsfolder: existsfolder(serverName),
      existsfile: existsfolder(serverName),
      fileName: fileName,
      core: core,
      coreVersion: coreVersion,
      startParameters: startParameters,
      javaVersion: javaVersion,
      port: port,
      serverPort: port,
      serverName: serverName
    };
    
    // verificar si el folderName existe y si tambien existe tanto el archivo core como el startScript
    if (!mapedServerInfo.existsfolder) {
      try {
        const serverInfo = startJavaServerGeneration(mapedServerInfo, result => {
          if (result) {
            console.log({ success: true, data: serverInfo, ServerInfo: mapedServerInfo });
          } else {
            console.log({ success: false, error: "Error al crear el servidor.", ServerInfo: mapedServerInfo  });
          }
        });
        res.status(200).json({ success: true, data: serverInfo });
      } catch (error) {
        res.status(500).json({ success: false, error: JSON.stringify(error) });
      }
    } else {
      return res.status(200).json({ success: true, data: mapedServerInfo, message: "El servidor ya existe." });
      // return res.status(400).json({ success: false, error: "El servidor ya existe." });
    }
/*     try {
      const serverInfo = prepareServerCreation(serverName, core, coreVersion, startParameters, javaVersion, port, fileName);
      res.status(200).json({ success: true, data: serverInfo });
    } catch (error) {
      res.status(500).json({ success: false, error: JSON.stringify(error) });
    } */
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
      default:
        res.status(400).json({ success: false, error: "La acción no es válida." });
    }
  });
  export default router;