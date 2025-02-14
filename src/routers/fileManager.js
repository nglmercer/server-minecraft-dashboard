import express from 'express';
import {
  createserverfolder,
  createserverfile,
  createsubfolder,
  getfolderinfo,
  updatefolderinfo,
  readfilebyname,
  readfilebypath
}from '../modules/servers.js';

const router = express.Router();

// Ruta para crear una carpeta
router.post('/filemanager/create-folder', (req, res) => {
  const { directoryname } = req.body;

  if (!directoryname) {
    return res.status(400).json({ success: false, error: "El nombre de la carpeta es requerido." });
  }

  try {
    const result = createserverfolder(directoryname);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// Ruta para crear un archivo
router.post('/filemanager/create-file', (req, res) => {
  const { directoryname, filename, content } = req.body;

  if (!directoryname || !filename || !content) {
    return res.status(400).json({ success: false, error: "Todos los campos son requeridos: directoryname, filename, content." });
  }

  try {
    const result = createserverfile(directoryname, filename, content);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// Ruta para crear una subcarpeta
router.post('/filemanager/create-subfolder', (req, res) => {
  const { directoryname, subfoldername } = req.body;

  if (!directoryname || !subfoldername) {
    return res.status(400).json({ success: false, error: "Todos los campos son requeridos: directoryname, subfoldername." });
  }

  try {
    const result = createsubfolder(directoryname, subfoldername);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// Ruta para obtener información de una carpeta
router.get('/filemanager/folder-info/:folderName', (req, res) => {
  const { folderName } = req.params;

  if (!folderName) {
    return res.status(400).json({ success: false, error: "El nombre de la carpeta es requerido." });
  }

  try {
    const result = getfolderinfo(folderName);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});

// Ruta para actualizar la información de una carpeta
router.post('/filemanager/update-folder-info', (req, res) => {
  const { folderName } = req.body;

  if (!folderName) {
    return res.status(400).json({ success: false, error: "El nombre de la carpeta es requerido." });
  }

  try {
    updatefolderinfo(folderName);
    res.status(200).json({ success: true, message: "Información de la carpeta actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});
router.get('/filemanager/read-file/:folderName/:fileName', (req, res) => {
  const { folderName, fileName } = req.params;

  if (!folderName || !fileName) {
    return res.status(400).json({ success: false, error: "Todos los campos son requeridos: folderName, fileName." });
  }

  try {
    const result = readfilebyname(folderName, fileName);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});
router.get('/filemanager/read-file-by-path/*', (req, res) => {
  // 'req.params[0]' contendrá toda la ruta que venga después de '/filemanager/read-file-by-path/'
  const filePath = req.params[0];
  try {
    const result = readfilebypath(filePath);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: JSON.stringify(error) });
  }
});
     
export default router;