import { createbackup, restorebackup, getbackupsdata, deletebackup } from '../modules/backup.js';
import { pipeline } from 'stream/promises';
import { createReadStream } from 'fs';
import { PathUtils } from '../fileutils.js';
import path from 'path';
import fs from 'fs';

async function backupRoutes(fastify, options) {
  // Use PathUtils constants for paths
  const backupsDir = PathUtils.backupPath;

  fastify.post('/create', async (request, reply) => {
    const { serverName } = request.body;
    const folderName = request.body.folderName || serverName;
    const outputFilename = request.body.outputFilename || `${serverName}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    if (!folderName || !outputFilename) {
      return reply.code(400).send({ error: 'Faltan parámetros: folderName y outputFilename son requeridos.' });
    }
    
    // Validate folder name and output filename
    if (!PathUtils.isValidDirectoryName(path.join(PathUtils.serverPath, folderName))) {
      return reply.code(400).send({ error: 'Nombre de carpeta inválido.' });
    }
    
    if (!PathUtils.isValidFilenamePattern(outputFilename)) {
      return reply.code(400).send({ error: 'Nombre de archivo de salida inválido.' });
    }
    
    try {
      const backupPath = await createbackup(folderName, outputFilename);
      return { 
        message: 'Backup creado correctamente', 
        path: backupPath, 
        folderName, 
        outputFilename 
      };
    } catch (error) {
      console.error(error);
      reply.code(500).send({ error: error.message || 'Error al crear el backup.' });
    }
  });

  fastify.post('/restore', async (request, reply) => {
    const { filename, outputFolderName } = request.body;
    
    if (!filename || !outputFolderName) {
      return reply.code(400).send({ error: 'Faltan parámetros: filename y outputFolderName son requeridos.' });
    }
    
    // Validate backup file and output folder
    if (!PathUtils.isValidFilenamePattern(filename)) {
      return reply.code(400).send({ error: 'Nombre de archivo de backup inválido.' });
    }
    
    if (!PathUtils.isValidDirectoryName(path.join(PathUtils.serverPath, outputFolderName))) {
      return reply.code(400).send({ error: 'Nombre de carpeta de destino inválido.' });
    }
    
    const backupFilePath = path.join(backupsDir, filename);
    if (!PathUtils.pathExists(backupFilePath) || !PathUtils.isFile(backupFilePath)) {
      return reply.code(404).send({ error: 'El archivo de backup no existe.' });
    }
    
    try {
      const restorePath = await restorebackup(filename, outputFolderName);
      return { message: 'Backup restaurado correctamente', path: restorePath };
    } catch (error) {
      console.error(error);
      reply.code(500).send({ error: error.message || 'Error al restaurar el backup.' });
    }
  });

  fastify.get('/backupsInfo', async (request, reply) => {
    try {
      const backups = getbackupsdata();
      return { data: backups };
    } catch (error) {
      console.error(error);
      reply.code(500).send({ error: error.message || 'Error al obtener información de los backups.' });
    }
  });

  fastify.post('/delete', async (request, reply) => {
    const { filename } = request.body;
    
    if (!filename) {
      return reply.code(400).send({ error: 'Falta parámetro: filename.' });
    }
    
    // Validate filename
    if (!PathUtils.isValidFilenamePattern(filename)) {
      return reply.code(400).send({ error: 'Nombre de archivo inválido.' });
    }
    
    // Check if file exists
    const filePath = path.join(backupsDir, filename);
    if (!PathUtils.pathExists(filePath) || !PathUtils.isFile(filePath)) {
      return reply.code(404).send({ error: 'El archivo de backup no existe.' });
    }
    
    try {
      const result = await deletebackup(filename);
      return { message: 'Backup borrado correctamente', result };
    } catch (error) {
      console.error(error);
      reply.code(500).send({ error: error.message || 'Error al borrar el backup.' });
    }
  });

  fastify.get('/download/:filename', async (request, reply) => {
    const { filename } = request.params;
    
    // Validate filename using PathUtils
    if (!filename || !PathUtils.isValidFilenamePattern(filename)) {
      return reply.code(400).send({ message: 'Nombre de archivo inválido.' });
    }
    
    const filePath = path.join(backupsDir, filename);
    
    // Additional security check
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(backupsDir)) {
      console.warn(`Intento de acceso fuera del directorio de backups denegado: ${filePath}`);
      return reply.code(403).send({ message: 'Acceso prohibido.' });
    }
    
    // Use PathUtils to check file existence and type
    if (!PathUtils.pathExists(filePath)) {
      return reply.code(404).send({ message: 'Archivo de backup no encontrado' });
    }
    
    if (!PathUtils.isFile(filePath)) {
      return reply.code(400).send({ message: 'La ruta no corresponde a un archivo.' });
    }
    
    try {
      // Verify file permissions
      await fs.promises.access(filePath, fs.constants.R_OK);
      
      // Use Fastify's reply.download for efficient file download
      return reply.download(filePath, filename);
    } catch (error) {
      console.error(`Error al procesar descarga para ${filename}:`, error);
      
      if (error.code === 'EACCES') {
        reply.code(403).send({ message: 'Permiso denegado para leer el archivo' });
      } else {
        reply.code(500).send({ message: 'No se pudo enviar el archivo de backup.' });
      }
    }
  });
}

export default backupRoutes;