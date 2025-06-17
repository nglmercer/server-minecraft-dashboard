import { createbackup, restorebackup, getbackupsdata, deletebackup,BackupManager, updatebackupslist } from '../modules/backup.js';
import { addBackupTask, addRestoreTask, TASK_MANAGER } from '../modules/taskmanager.js';
import { PathUtils } from '../fileutils.js';
import { pipeline } from 'node:stream/promises';
import path from 'path';
import fs from 'fs';
import util from 'util';
const stat = util.promisify(fs.stat);

async function backupRoutes(fastify, options) {
  const backupsDir = PathUtils.backupPath;

  fastify.post('/restore-async', async (request, reply) => {
    const { filename, outputFolderName } = request.body;
    
    if (!filename || !outputFolderName) {
      return reply.code(400).send({ 
        error: 'Faltan parámetros: filename y outputFolderName son requeridos.' 
      });
    }
    
    // Validate backup file
    if (!PathUtils.isValidFilenamePattern(filename)) {
      return reply.code(400).send({ 
        error: 'Nombre de archivo de backup inválido.' 
      });
    }
    
    // ✅ CORRECCIÓN: Limpiar el nombre de la carpeta de destino
    let cleanOutputFolderName = outputFolderName;
    
    // Si el outputFolderName es igual al filename, extraer solo el nombre base
    if (outputFolderName === filename) {
      cleanOutputFolderName = filename
        .replace('.zip', '')
        .replace('.tar.gz', '')
        .replace('.gz', '');
    }
    
    // Eliminar extensiones si las hay
    cleanOutputFolderName = cleanOutputFolderName
      .replace(/\.(zip|tar\.gz|gz)$/i, '');
    
    // Validar nombre de carpeta de destino
    const destinationPath = path.join(PathUtils.serverPath, cleanOutputFolderName);
    if (!PathUtils.isValidDirectoryName(destinationPath)) {
      return reply.code(400).send({ 
        error: 'Nombre de carpeta de destino inválido.' 
      });
    }
    
    const backupFilePath = path.join(backupsDir, filename);
    if (!PathUtils.pathExists(backupFilePath) || !PathUtils.isFile(backupFilePath)) {
      return reply.code(404).send({ 
        error: 'El archivo de backup no existe.' 
      });
    }
    
    try {
      // ✅ VERIFICAR TAMAÑO DEL ARCHIVO ANTES DE PROCEDER
      const stats = await fs.promises.stat(backupFilePath);
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      console.log(`📊 Iniciando restauración de ${filename} (${fileSizeMB} MB) -> ${cleanOutputFolderName}`);
      
      // Advertir si el archivo es muy grande
      if (stats.size > 1024 * 1024 * 1024) { // >1GB
        console.warn(`⚠️  Archivo muy grande detectado (${fileSizeMB} MB). La restauración puede tomar tiempo.`);
      }
      
      // ✅ Usar el nombre limpio de carpeta
      const taskId = await addRestoreTask(filename, cleanOutputFolderName);
      
      return {
        message: 'Tarea de restauración iniciada correctamente',
        taskId: taskId,
        status: 'in_progress',
        filename,
        outputFolderName: cleanOutputFolderName,
        fileSizeMB: fileSizeMB
      };
      
    } catch (error) {
      console.error('❌ Error iniciando tarea de restauración:', error);
      
      // Proporcionar error más específico según el tipo
      let errorMessage = 'Error al iniciar la tarea de restauración.';
      
      if (error.message.includes('Array buffer allocation failed')) {
        errorMessage = `Archivo demasiado grande para procesar (${stats ? (stats.size / 1024 / 1024).toFixed(2) + ' MB' : 'tamaño desconocido'}). Intente con un archivo más pequeño.`;
      } else if (error.message.includes('ENOENT')) {
        errorMessage = 'Archivo de backup no encontrado.';
      } else if (error.message.includes('EACCES')) {
        errorMessage = 'Sin permisos para acceder al archivo de backup.';
      }
      
      reply.code(500).send({ 
        error: errorMessage,
        details: error.message 
      });
    }
  });
  fastify.post('/create', async (request, reply) => {
    const { serverName } = request.body;
    const folderName = request.body.folderName || serverName;
    const outputFilename = request.body.outputFilename || `${serverName}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    
    if (!folderName || !outputFilename) {
      return reply.code(400).send({ error: 'Faltan parámetros: folderName y outputFilename son requeridos.' });
    }
    
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

  fastify.post('/create-async', async (request, reply) => {
    const { serverName } = request.body;
    const folderName = request.body.folderName || serverName;
    const outputFilename = request.body.outputFilename || `${serverName}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const options = request.body.options || {};
    
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
      const taskId = await addBackupTask(folderName, outputFilename, options);
      return { 
        message: 'Tarea de backup iniciada correctamente',
        taskId: taskId,
        status: 'in_progress',
        folderName, 
        outputFilename 
      };
    } catch (error) {
      console.error(error);
      reply.code(500).send({ error: error.message || 'Error al iniciar la tarea de backup.' });
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
      const backups = await getbackupsdata();
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

  fastify.get('/download/:filename(.*)', async (request, reply) => {
    console.log('DOWNLOAD HANDLER - Entry. URL:', request.url);
    const filename = request.params.filename;
    console.log('DOWNLOAD HANDLER - Filename extracted:', filename);
  
    // Tu validación existente...
    console.log('DOWNLOAD HANDLER - Using backupsDir:', backupsDir);
    if (typeof backupsDir !== 'string' || backupsDir.trim() === '') {
      console.error('DOWNLOAD HANDLER - CRITICAL: backupsDir is invalid:', backupsDir);
      return reply.code(500).send({ error: 'Server configuration error: backup directory not set.' });
    }
  
    if (!filename || !PathUtils.isValidFilenamePattern(filename)) {
      console.log('DOWNLOAD HANDLER - Condition: Invalid filename pattern. Filename:', filename);
      return reply.code(400).send({ message: 'Nombre de archivo inválido.' });
    }
    console.log('DOWNLOAD HANDLER - Checkpoint: Filename pattern VALID.');
  
    const filePath = path.join(backupsDir, filename);
    console.log('DOWNLOAD HANDLER - Constructed filePath:', filePath);
  
    const resolvedPath = path.resolve(filePath);
    const resolvedBackupsDir = path.resolve(backupsDir);
    console.log('DOWNLOAD HANDLER - Resolved filePath:', resolvedPath);
    console.log('DOWNLOAD HANDLER - Resolved backupsDir:', resolvedBackupsDir);
  
    if (!resolvedPath.startsWith(resolvedBackupsDir)) {
      console.warn(`DOWNLOAD HANDLER - Condition: Path traversal attempt. ResolvedPath: ${resolvedPath}, ResolvedBackupsDir: ${resolvedBackupsDir}`);
      return reply.code(403).send({ message: 'Acceso prohibido.' });
    }
    console.log('DOWNLOAD HANDLER - Checkpoint: Path traversal check PASSED.');
  
    if (!PathUtils.pathExists(filePath)) {
      console.log('DOWNLOAD HANDLER - Condition: Path does not exist for filePath:', filePath);
      return reply.code(404).send({ message: 'Archivo de backup no encontrado (handler check)' });
    }
    console.log('DOWNLOAD HANDLER - Checkpoint: Path exists check PASSED for filePath:', filePath);
  
    if (!PathUtils.isFile(filePath)) {
      console.log('DOWNLOAD HANDLER - Condition: Path is not a file for filePath:', filePath);
      return reply.code(400).send({ message: 'La ruta no corresponde a un archivo.' });
    }
    console.log('DOWNLOAD HANDLER - Checkpoint: Path is file check PASSED for filePath:', filePath);
  
    try {
      console.log('DOWNLOAD HANDLER - TRY block: Attempting fs.access for filePath:', filePath);
      await fs.promises.access(filePath, fs.constants.R_OK);
      console.log('DOWNLOAD HANDLER - TRY block: fs.access SUCCEEDED for filePath:', filePath);
  
      // Obtener información del archivo
      const stats = await stat(filePath);
      const fileSize = stats.size;
      console.log('DOWNLOAD HANDLER - File size:', fileSize, 'bytes');
  
      // Configurar headers para descarga
      reply.header('Content-Type', 'application/octet-stream');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Content-Length', fileSize);
      reply.header('Cache-Control', 'no-cache');
      
      // Para archivos grandes, usar streaming
      if (fileSize > 50 * 1024 * 1024) { // 50MB threshold
        console.log('DOWNLOAD HANDLER - Using streaming for large file');
        
        // Crear stream de lectura
        const readStream = fs.createReadStream(filePath, {
          highWaterMark: 1024 * 1024 // 1MB chunks
        });
  
        // Manejar errores del stream
        readStream.on('error', (error) => {
          console.error('DOWNLOAD HANDLER - Stream error:', error);
          if (!reply.sent) {
            reply.code(500).send({ message: 'Error al leer el archivo' });
          }
        });
  
        // Enviar el stream
        return reply.send(readStream);
      } else {
        // Para archivos pequeños, usar reply.download
        console.log('DOWNLOAD HANDLER - Using reply.download for small file');
        return reply.download(filePath, filename);
      }
  
    } catch (error) {
      console.error('DOWNLOAD HANDLER - CATCH block: Error for filePath:', filePath, 'Error:', error.message, error.stack);
      if (error.code === 'EACCES') {
        return reply.code(403).send({ message: 'Permiso denegado para leer el archivo' });
      } else {
        return reply.code(500).send({ message: 'No se pudo enviar el archivo de backup.', errorDetails: error.message });
      }
    }
  });
  // SUBIR/IMPORTAR BACKUPS
  fastify.post('/upload', async (request, reply) => {
    try {
      const parts = request.parts();
      let uploadedFile = null;
      
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'file') {
          const sanitizedFilename = BackupManager.sanitizeFilename(part.filename);
          
          if (!sanitizedFilename.endsWith('.zip') && !sanitizedFilename.endsWith('.tar.gz')) {
            // Drenar el stream antes de rechazar
            part.file.resume();
            return reply.code(400).send({ error: 'Tipo de archivo no válido. Solo se permiten archivos .zip y .tar.gz' });
          }
          
          const destination = path.join(backupsDir, sanitizedFilename);
          
          // Verificar que no exista ya el archivo
          if (fs.existsSync(destination)) {
            part.file.resume();
            return reply.code(409).send({ error: 'El archivo ya existe.' });
          }
          
          console.log(`Streaming backup file to: ${destination}`);
          
          // Stream directo a archivo
          await pipeline(part.file, fs.createWriteStream(destination));
          
          // Verificar que el archivo se escribió correctamente
          const stats = fs.statSync(destination);
          console.log(`Backup file uploaded successfully. Size: ${stats.size} bytes`);
          
          uploadedFile = {
            filename: sanitizedFilename,
            path: destination,
            size: stats.size
          };
          
          break; // Solo procesamos el primer archivo válido
        } else if (part.type === 'file') {
          // Si hay otros archivos, drenar sus streams
          part.file.resume();
        }
      }
      
      if (!uploadedFile) {
        return reply.code(400).send({ error: 'No se encontró un archivo válido en el campo "file".' });
      }
      
      await updatebackupslist();
      
      return reply.code(200).send({
        message: 'Backup importado correctamente.',
        filename: uploadedFile.filename,
        path: uploadedFile.path,
        size: uploadedFile.size
      });
      
    } catch (error) {
      console.error('Error uploading backup:', error);
      return reply.code(500).send({ error: 'Error interno al subir el backup: ' + error.message });
    }
  });

}

export default backupRoutes;