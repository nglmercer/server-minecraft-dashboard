import express from 'express';
import { createbackup, restorebackup, getbackupsdata, deletebackup } from '../modules/backup.js';
import path from 'path';
import fs from 'fs';
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
    console.log("path", backupPath, folderName, outputFilename)
    res.status(200).json({ message: 'Backup creado correctamente', path: backupPath, folderName, outputFilename });
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
router.get('/backupsInfo', (req, res) => {
  try {
    const backups = getbackupsdata();
    res.status(200).json({ data: backups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
router.post('/delete', async (req, res) => {
  // Se espera recibir en el body: { filename }
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Faltan parámetros: filename.' });
  }
  try {
    const result = await deletebackup(filename);
    res.status(200).json({ message: 'Backup borrado correctamente', result: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'backups', filename); // o la ruta donde guardes los backups
  console.log("filePath de download", filePath)
  // Verificar que el archivo exista
  if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo de backup no encontrado' });
  }

  // Usar res.download() para enviar el archivo
  res.download(filePath, (err) => {
      if (err) {
          // Manejar errores de envío (opcional)
          if (res.headersSent) {
            console.log("se enviaron ya")
          } else {
            return res.status(500).send("no se pudo enviar")
          }
      }
  });
});
export default router;
