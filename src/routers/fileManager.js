import express from 'express';
import {
  createserverfolder,
  createserverfile,
  createsubfolder,
  getfolderinfo,
  updatefolderinfo
}from '../modules/servers.js';

const router = express.Router();

// Ruta para crear una carpeta
router.post('/create-folder', (req, res) => {
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
router.post('/create-file', (req, res) => {
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
router.post('/create-subfolder', (req, res) => {
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
router.get('/folder-info/:folderName', (req, res) => {
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
router.post('/update-folder-info', (req, res) => {
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

export default router;