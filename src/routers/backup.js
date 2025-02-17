import express from 'express';
import { createbackup, restorebackup } from '../modules/backup.js';

const router = express.Router();

// Endpoint para crear backup
router.post('/create', async (req, res) => {
  // Se espera recibir en el body: { folderName, outputFilename }
  const { folderName, outputFilename } = req.body;
  if (!folderName || !outputFilename) {
    return res.status(400).json({ error: 'Faltan parámetros: folderName y outputFilename son requeridos.' });
  }
  try {
    const backupPath = await createbackup(folderName, outputFilename);
    res.status(200).json({ message: 'Backup creado correctamente', path: backupPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para restaurar backup
router.post('/restore', async (req, res) => {
  // Se espera recibir en el body: { filename, outputFolderName }
  const { filename, outputFolderName } = req.body;
  if (!filename || !outputFolderName) {
    return res.status(400).json({ error: 'Faltan parámetros: filename y outputFolderName son requeridos.' });
  }
  try {
    const restorePath = await restorebackup(filename, outputFolderName);
    res.status(200).json({ message: 'Backup restaurado correctamente', path: restorePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
