import { createbackup, restorebackup, getbackupsdata, deletebackup } from '../modules/backup.js'; // Asegúrate que la ruta sea correcta
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises'; // Para streaming si es necesario (aunque download lo maneja)
import { createReadStream } from 'fs'; // Para streaming manual si se prefiere

// --- Definición del Plugin Fastify ---
async function backupRoutes (fastify, options) {

  const backupsDir = path.join(process.cwd(), 'backups'); // Define la carpeta base de backups

  // Endpoint para crear backup (POST /backup/create)
  fastify.post('/create', async (request, reply) => {
    // Fastify parsea el body JSON automáticamente
    const { folderName, outputFilename } = request.body;
    if (!folderName || !outputFilename) {
      // reply.code() para el código de estado, .send() para el payload
      return reply.code(400).send({ error: 'Faltan parámetros: folderName y outputFilename son requeridos.' });
    }
    try {
      const backupPath = await createbackup(folderName, outputFilename);
      console.log("path", backupPath, folderName, outputFilename);
      // Por defecto Fastify responde 200 OK si retornas un objeto
      return { message: 'Backup creado correctamente', path: backupPath, folderName, outputFilename };
    } catch (error) {
      console.error(error);
      // Manejo de errores genérico
      reply.code(500).send({ error: error.message || 'Error al crear el backup.' });
    }
  });

  // Endpoint para restaurar backup (POST /backup/restore)
  fastify.post('/restore', async (request, reply) => {
    const { filename, outputFolderName } = request.body;
    if (!filename || !outputFolderName) {
      return reply.code(400).send({ error: 'Faltan parámetros: filename y outputFolderName son requeridos.' });
    }
    try {
      const restorePath = await restorebackup(filename, outputFolderName);
      return { message: 'Backup restaurado correctamente', path: restorePath };
    } catch (error) {
      console.error(error);
      reply.code(500).send({ error: error.message || 'Error al restaurar el backup.' });
    }
  });

  // Endpoint para obtener información de los backups (GET /backup/backupsInfo)
  // Puede ser async por consistencia, aunque getbackupsdata sea síncrono
  fastify.get('/backupsInfo', async (request, reply) => {
    try {
      const backups = getbackupsdata(); // Asume que esta función es síncrona
      return { data: backups }; // Devuelve el JSON con código 200 por defecto
    } catch (error) {
      console.error(error);
      reply.code(500).send({ error: error.message || 'Error al obtener información de los backups.' });
    }
  });

  // Endpoint para borrar un backup (POST /backup/delete)
  fastify.post('/delete', async (request, reply) => {
    const { filename } = request.body;
    if (!filename) {
      return reply.code(400).send({ error: 'Faltan parámetros: filename.' });
    }
    try {
      // **Importante:** Sanitizar 'filename' para evitar Path Traversal
      if (filename.includes('..') || filename.includes('/')) {
         return reply.code(400).send({ error: 'Nombre de archivo inválido.' });
      }
      const result = await deletebackup(filename); // Asume que deletebackup maneja la ruta completa o solo necesita el nombre
      return { message: 'Backup borrado correctamente', result: result };
    } catch (error) {
      console.error(error);
      reply.code(500).send({ error: error.message || 'Error al borrar el backup.' });
    }
  });

  // Endpoint para descargar un backup (GET /backup/download/:filename)
  fastify.get('/download/:filename', async (request, reply) => {
    const { filename } = request.params; // Acceso a parámetros de ruta

    // **Importante: Sanitización Path Traversal**
    // Asegúrate de que el nombre de archivo no contenga caracteres peligrosos
    // y que realmente se refiera a un archivo dentro del directorio esperado.
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return reply.code(400).send({ message: 'Nombre de archivo inválido.' });
    }

    const filePath = path.join(backupsDir, filename);
    console.log("Intentando descargar desde filePath:", filePath);

    // **Verificación de Seguridad Adicional**
    // Asegúrate de que la ruta resuelta siga estando dentro del directorio de backups
    if (!filePath.startsWith(backupsDir)) {
        console.warn(`Intento de acceso fuera del directorio de backups denegado: ${filePath}`);
        return reply.code(403).send({ message: 'Acceso prohibido.' }); // 403 Forbidden es más apropiado que 404
    }


    try {
        // Verificar existencia de forma asíncrona (mejor para I/O)
        await fs.promises.access(filePath, fs.constants.R_OK); // Verifica si existe y se puede leer

        // Usar reply.download() de Fastify para enviar el archivo.
        // Establece automáticamente los headers Content-Disposition, Content-Type.
        // El segundo argumento opcional es el nombre que verá el usuario al descargar.
        return reply.download(filePath, filename);

    } catch (error) {
        console.error(`Error al procesar descarga para ${filename}:`, error);
        if (error.code === 'ENOENT') {
            // Si fs.promises.access falló porque no existe
            reply.code(404).send({ message: 'Archivo de backup no encontrado' });
        } else if (error.code === 'EACCES') {
             // Si fs.promises.access falló por permisos
             reply.code(403).send({ message: 'Permiso denegado para leer el archivo' });
        } else {
            // Otros errores (lectura, etc.)
            reply.code(500).send({ message: 'No se pudo enviar el archivo de backup.' });
        }
    }
  });

}

// Exporta la función del plugin
export default backupRoutes;