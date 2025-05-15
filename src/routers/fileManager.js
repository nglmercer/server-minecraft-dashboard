import path from 'path';
import fs from 'fs'; // Usar fs normal para fs.constants y existsSync si es necesario
import fsp from 'fs/promises'; // Para fs.access
import {
  createserverfolder,
  createserverfile,
  createsubfolder,
  getfolderinfo,
  updatefolderinfo,
  readfilebyname,
  readfilebypath,
  writeFilebyName,
  renamefile,
  deletefile,
  deleteserver,
  generateServerFolderBackup,
  uncompressServerFolderBackup
} from '../modules/servers.js'; // Ajusta esta ruta
import {
  downloadFileFromUrl
} from "../utils/utils.js"; // Ajusta esta ruta
import { PathUtils } from '../fileutils.js'; // Importar PathUtils para SERVERS_PATH

// Directorio base de servidores desde fileutils
const SERVERS_BASE_DIR = PathUtils.serverPath;

// Helper para sanitizar nombres/rutas
function sanitizePathInput(input) {
  if (!input || typeof input !== 'string') return ''; // Evitar errores

  // Eliminar múltiples barras al inicio
  input = input.replace(/^[/\\]+/, ''); // Elimina todos los '/' o '\' iniciales

  // Prevenir path traversal y normalizar
  let sanitized = path.normalize(input).replace(/^(\.\.[/\\])+/, '');

  // Eliminar caracteres problemáticos
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');

  if (sanitized !== input) {
    console.warn(`Sanitización de ruta aplicada: "${input}" -> "${sanitized}"`);
  }

  return sanitized;
}

// Función helper para construir rutas seguras DENTRO de SERVERS_BASE_DIR
// y devolver la ruta relativa al SERVERS_BASE_DIR, que es lo que esperan las funciones de 'servers.js'
function getRelativeServerPath(...args) {
  const sanitizedArgs = args.map(arg => sanitizePathInput(arg || '')).filter(Boolean);
  if (sanitizedArgs.length === 0) {
    throw new Error("Se requiere al menos un componente de ruta válido.");
  }
  const relativePath = path.join(...sanitizedArgs);
  const resolvedPath = path.resolve(SERVERS_BASE_DIR, relativePath);

  if (!resolvedPath.startsWith(SERVERS_BASE_DIR)) {
    throw new Error(`Acceso prohibido fuera del directorio de servidores: ${relativePath}, ruta actual: ${resolvedPath}`);
  }
  // Las funciones de 'servers.js' esperan rutas relativas a SERVERS_BASE_DIR
  // o el nombre del servidor y luego la ruta relativa dentro de ese servidor.
  // Esta función devuelve la ruta completa relativa a SERVERS_BASE_DIR
  return relativePath;
}


async function fileManagerRoutes(fastify, options) {

  // Ruta para crear una carpeta de servidor
  fastify.post('/create-folder', async (request, reply) => {
    const { directoryname: rawDirName } = request.body;
    try {
      const directoryname = getRelativeServerPath(rawDirName); // Esto valida y devuelve la ruta relativa
      const result = await createserverfolder(directoryname); // createserverfolder espera solo el nombre del server (primer nivel)
      
      if (typeof result === 'string') { // Es un mensaje de error de createserverfolder
        return reply.code(400).send({ success: false, error: result });
      }
      return reply.send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(`Error creando carpeta ${rawDirName}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al crear la carpeta.' });
    }
  });

  // Ruta para crear un archivo
  fastify.post('/create-file', async (request, reply) => {
    const { directoryname: rawDirName, filename: rawFileName, content } = request.body;
    try {
      const serverName = sanitizePathInput(rawDirName); // El primer nivel es el server
      const relativeFilePathInServer = sanitizePathInput(rawFileName); // El resto es la ruta relativa dentro del server

      if (!serverName || !relativeFilePathInServer) {
        return reply.code(400).send({ success: false, error: "Nombre de directorio (servidor) y archivo son requeridos/inválidos." });
      }
      // createserverfile(serverName, pathToFileInServer, content)
      // Ejemplo: createserverfile("myServer", "config/settings.json", "{}")
      const result = await createserverfile(serverName, relativeFilePathInServer, content ?? '');
      
      if (typeof result === 'string' && (result.startsWith("Extensión no permitida") || result.includes("no existe"))) {
        return reply.code(400).send({ success: false, error: result });
      }
      return reply.send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(`Error creando archivo ${rawFileName} en ${rawDirName}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al crear el archivo.' });
    }
  });

  // Ruta para crear una subcarpeta
  fastify.post('/create-subfolder', async (request, reply) => {
    const { directoryname: rawDirName, subfoldername: rawSubfolderName } = request.body;
    try {
      const serverName = sanitizePathInput(rawDirName);
      const subfolderName = sanitizePathInput(rawSubfolderName);

      if (!serverName || !subfolderName) {
        return reply.code(400).send({ success: false, error: "Nombre de directorio (servidor) y subcarpeta son requeridos/inválidos." });
      }
      // createsubfolder(serverName, subfolderPathRelativeToAsyncServer)
      const result = await createsubfolder(serverName, subfolderName);
      
      if (typeof result === 'string') { // Es un mensaje de error
        return reply.code(400).send({ success: false, error: result });
      }
      return reply.send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(`Error creando subcarpeta ${rawSubfolderName} en ${rawDirName}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al crear la subcarpeta.' });
    }
  });

    // Ruta para obtener información de una carpeta
    fastify.get('/folder-info/*', async (request, reply) => {
      // El parámetro capturado por '*' está disponible en request.params['*']
      const rawFolderName = request.params['*'];
    
      try {
        // getRelativeServerPath debería sanitizar y validar esta entrada
        const folderPath = getRelativeServerPath(rawFolderName);
      //  console.log("Ruta solicitada (relativa procesada):", folderPath, Date.now(), rawFolderName);
        const result = await getfolderinfo(folderPath); // getfolderinfo espera la ruta relativa completa
    
        if (typeof result === 'string') { // Es un mensaje de error de getfolderinfo
          return reply.code(404).send({ success: false, error: result });
        }
        return reply.send({ success: true, data: result });
      } catch (error) {
        fastify.log.error(`Error obteniendo info de '${rawFolderName}': ${error.message}`);
        reply.code(500).send({ success: false, error: error.message || 'Error al obtener información de la carpeta.' });
      }
    });

  // Ruta para actualizar la información de una carpeta (usualmente automático, pero si es manual)
  fastify.post('/update-folder-info', async (request, reply) => {
    const { folderName: rawFolderName } = request.body;
    try {
      const folderName = getRelativeServerPath(rawFolderName); // folderName es la ruta relativa al server base
      await updatefolderinfo(folderName); // updatefolderinfo maneja la lógica de /
      return reply.send({ success: true, message: "Información de la carpeta en proceso de actualización." });
    } catch (error) {
      fastify.log.error(`Error actualizando info de ${rawFolderName}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al actualizar la información.' });
    }
  });

  // Ruta para leer un archivo por nombre (server/folder/file)
  fastify.get('/read-file/:serverName/:filePath(.*)', async (request, reply) => {
    const { serverName: rawServerName, filePath: rawFilePath } = request.params;
    try {
      const serverName = sanitizePathInput(rawServerName);
      const filePathInServer = sanitizePathInput(rawFilePath);

      if (!serverName || !filePathInServer) {
        return reply.code(400).send({ success: false, error: "Nombre de servidor y ruta de archivo son requeridos/inválidos." });
      }
      // readfilebyname(serverName, pathToFileInServer)
      const result = await readfilebyname(serverName, filePathInServer);
      
      if (result === false || (typeof result === 'string' && result.includes("no existe"))) {
        return reply.code(404).send({ success: false, error: 'Archivo no encontrado.' });
      }
      if (typeof result === 'object' && result.name && result.files ) { // Parece info de carpeta
        return reply.code(400).send({ success: false, error: 'La ruta especificada es una carpeta, no un archivo.', data: result });
      }
      return reply.send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(`Error leyendo ${rawFilePath} en ${rawServerName}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al leer el archivo.' });
    }
  });
  
  // Ruta para leer un archivo por ruta completa (relativa a 'servers')
  fastify.get('/read-file-by-path/:filePath(.*)', async (request, reply) => {
    const rawFilePathParams = request.params.filePath; // Puede ser undefined si no hay nada después de /
    try {
      const relativeFilePath = getRelativeServerPath(rawFilePathParams || '');
      
      const verifyPath = path.join(PathUtils.serverPath, relativeFilePath);
      const result = await readfilebypath(relativeFilePath); // readfilebypath espera ruta relativa a SERVERS_BASE_DIR
      const allowedFile = await PathUtils.checkFileValidity(verifyPath);
      if (!allowedFile.isValid) {
        return reply.code(400).send({ success: false, details: allowedFile.details });
      }
      
      if (result === false || (typeof result === 'string' && result.includes("no existe"))) {
        return reply.code(404).send({ success: false, error: 'Archivo no encontrado.' });
      }
       if (typeof result === 'object' && result.name && result.files ) { // Parece info de carpeta
        return reply.code(400).send({ success: false, error: 'La ruta especificada es una carpeta, no un archivo.', data: result });
      }
      return reply.send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(`Error leyendo por path ${rawFilePathParams}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al leer el archivo por ruta.' });
    }
  });

  // Ruta para escribir/actualizar un archivo
  fastify.post('/write-file', async (request, reply) => {
    let { directoryname: rawDirName, filename: rawFileName, content } = request.body;
    try {
      const serverName = sanitizePathInput(rawDirName);
      const filePathInServer = sanitizePathInput(rawFileName);

      if (!serverName || !filePathInServer) {
        return reply.code(400).send({ success: false, error: "Nombre de directorio (servidor) y archivo son requeridos/inválidos." });
      }
      // writeFilebyName(serverName, pathToFileInServer, content)
      const result = await writeFilebyName(serverName, filePathInServer, content ?? '');
      
      if (typeof result === 'string') { // Es un mensaje de error
        return reply.code(400).send({ success: false, error: result });
      }
      return reply.send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(`Error escribiendo ${rawFileName} en ${rawDirName}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al escribir el archivo.' });
    }
  });

  // Ruta para renombrar (Considerar PUT/PATCH /filemanager/servers/:serverName/path/:filePath)
  fastify.put('/rename', async (request, reply) => { // Cambiado a PUT
    const { server: rawServer, path: rawServerPath, newName: rawNewName } = request.body; // Cambiado a request.body
    try {
      const serverName = sanitizePathInput(rawServer);
      const filePathInServer = sanitizePathInput(rawServerPath); // Esta es la ruta del archivo/carpeta a renombrar DENTRO del server
      const newNameOnly = sanitizePathInput(rawNewName); // Este es SOLO el nuevo nombre base

      if (!serverName || !filePathInServer || !newNameOnly) {
        return reply.code(400).send({ success: false, error: "Parámetros server, path, y newName son requeridos/inválidos." });
      }
      // renamefile(serverName, pathToFileOrFolderInServer, newBaseName)
      const result = await renamefile(serverName, filePathInServer, newNameOnly);
      
      if (result === false || (typeof result === 'string' && result.includes("no existe"))) {
        return reply.code(404).send({ success: false, error: result || 'Elemento no encontrado para renombrar.' });
      }
      if (typeof result === 'string' && result.includes("ya existe")) {
        return reply.code(409).send({ success: false, error: result }); // 409 Conflict
      }
      return reply.send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(`Error renombrando ${rawServerPath} a ${rawNewName} en ${rawServer}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al renombrar.' });
    }
  });


  fastify.delete('/deleteFile/:serverName/:filePath(.*)', async (request, reply) => { // Cambiado a DELETE
    const { serverName: rawServer, filePath: rawServerPath } =  request.params;
    // EXAMPLE = DELETE /delete/serverName/pathToFileOrFolderInServer
    console.log("deletefile", rawServer, rawServerPath);
    try {
      const serverName = sanitizePathInput(rawServer);
      const pathInServerToDelete = sanitizePathInput(rawServerPath);

      if (!serverName || !pathInServerToDelete) {
        return reply.code(400).send({ success: false, error: "Parámetros server y path son requeridos/inválidos." });
      }
      // deletefile(serverName, pathToFileOrFolderInServer)
      const result = await deletefile(serverName, pathInServerToDelete);
      
      if (result === false || (typeof result === 'string' && result.includes("no existe"))) {
        return reply.code(404).send({ success: false, error: result || 'Elemento no encontrado para borrar.' });
      }
      return reply.send({ success: true, data: { message: "Elemento borrado exitosamente."} }); // result es true/false/error
    } catch (error) {
      fastify.log.error(`Error borrando ${rawServerPath} en ${rawServer}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al borrar.' });
    }
  });

  // Ruta para borrar un servidor completo
  fastify.delete('/servers/:serverName', async (request, reply) => {
    const { serverName: rawServerName } = request.params;
    try {
      const serverName = sanitizePathInput(rawServerName);
      if (!serverName) {
        return reply.code(400).send({ success: false, error: "Nombre de servidor es requerido/inválido." });
      }
      const result = await deleteserver(serverName); // deleteserver espera el nombre del server
      
      if (result === false) {
         return reply.code(404).send({ success: false, error: 'Servidor no encontrado o ya eliminado.' });
      }
      return reply.send({ success: true, data: { message: `Servidor '${serverName}' eliminado.` } });
    } catch (error) {
      fastify.log.error(`Error borrando servidor ${rawServerName}: ${error.message}`);
      reply.code(500).send({ success: false, error: error.message || 'Error al borrar el servidor.' });
    }
  });
  
  // Ruta para descargar un archivo desde URL y guardarlo
  fastify.post('/download-file', async (request, reply) => { // Cambiado a POST ya que crea un recurso
    const { server: rawServer, path: rawPathInServer, url } = request.body; // Cambiado a body
    try {
        const serverName = sanitizePathInput(rawServer);
        const pathInServer = sanitizePathInput(rawPathInServer) || '';

        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            return reply.code(400).send({ success: false, error: "URL inválida o faltante." });
        }
        if (!serverName) {
           return reply.code(400).send({ success: false, error: "Parámetro 'server' es requerido/inválido." });
        }

        const urlObject = new URL(url);
        let fileNameFromUrl = path.basename(urlObject.pathname);
        if (!fileNameFromUrl || fileNameFromUrl === '/' || fileNameFromUrl === '.') {
            // Intenta obtener de Content-Disposition o generar uno si es necesario
            // Esto es más complejo y depende de la respuesta del servidor remoto.
            // Por ahora, si no hay nombre, se podría generar o rechazar.
            // Ejemplo simple: usar un timestamp si el nombre no es válido.
            fileNameFromUrl = `downloaded_${Date.now()}`;
            console.warn(`No se pudo determinar un nombre de archivo válido desde la URL '${url}', usando '${fileNameFromUrl}'`);
        }
        const safeFileName = sanitizePathInput(fileNameFromUrl);


        if (!safeFileName) {
           return reply.code(400).send({ success: false, error: "No se pudo determinar un nombre de archivo válido desde la URL." });
        }

        const relativeDestPathInServer = path.join(pathInServer, safeFileName);

        fastify.log.info(`Iniciando descarga de ${url} a server: ${serverName}, ruta en server: ${relativeDestPathInServer}`);
        
        // Aquí downloadFileFromUrl es llamado. Asumimos que es asíncrono y devuelve un resultado
        // similar a las otras funciones (o una promesa que resuelva a eso).
        const downloadResult = await downloadFileFromUrl({
          server: serverName,
          url,
          filePath: relativeDestPathInServer, // Ruta relativa DENTRO del servidor
          // cb: (status) => fastify.log.info("Download status:", status) // Si tu cb devuelve algo útil
        });

        // Suponiendo que downloadFileFromUrl ahora devuelve { success, data/error }
        if (downloadResult && downloadResult.success) {
            return reply.send({ success: true, message: "Descarga completada.", data: downloadResult.data });
        } else {
            return reply.code(500).send({ success: false, error: downloadResult.error || 'Error durante la descarga.' });
        }

    } catch (error) {
        fastify.log.error(`Error en la descarga desde ${url}: ${error.message}`);
        reply.code(500).send({ success: false, error: error.message || 'Error al procesar la descarga.' });
    }
  });

   // Servir archivos estáticos desde un servidor específico
   fastify.get('/serve-file/:serverName/:filePath(.*)', async (request, reply) => {
    const { serverName: rawServerName, filePath: rawFilePathInServer } = request.params;
    try {
        const serverName = sanitizePathInput(rawServerName);
        const filePathInServer = sanitizePathInput(rawFilePathInServer);

        if (!serverName || !filePathInServer) {
            return reply.code(400).send({ error: 'Nombre del servidor y ruta del archivo son requeridos/inválidos.' });
        }

        const absolutePathToServe = path.resolve(SERVERS_BASE_DIR, serverName, filePathInServer);

        if (!absolutePathToServe.startsWith(path.resolve(SERVERS_BASE_DIR, serverName))) {
          fastify.log.warn(`Intento de acceso fuera del directorio del servidor: ${absolutePathToServe}`);
          return reply.code(403).send({ error: 'Acceso prohibido.' });
        }
        
        // Verificar si es un directorio, no servir directorios directamente
        // a menos que tengas una lógica para listar contenidos o servir un index.html
        const stats = await fsp.stat(absolutePathToServe).catch(() => null);
        if (!stats) {
            return reply.code(404).send({ error: 'Archivo no encontrado.' });
        }
        if (stats.isDirectory()) {
            return reply.code(403).send({ error: 'No se permite listar o servir directorios directamente.' });
        }

        // fastify.log.info(`Sirviendo archivo: ${absolutePathToServe}`);
        // `reply.sendFile` toma el nombre del archivo RELATIVO al `root` especificado.
        // El `root` debe ser el directorio del servidor específico.
        return reply.sendFile(filePathInServer, path.resolve(SERVERS_BASE_DIR, serverName));

    } catch (error) {
        fastify.log.error(`Error sirviendo archivo: ${error.message} (Path: ${rawServerName}/${rawFilePathInServer})`);
        if (error.code === 'ENOENT' || error.code === 'FST_ERR_SEND_FILE_INVALID_PATH') {
             reply.code(404).send({ error: 'Archivo no encontrado.' });
        } else if (error.code === 'EACCES') {
            reply.code(403).send({ error: 'Permiso denegado.' });
        } else {
             reply.code(500).send({ error: 'Error al servir el archivo.' });
        }
    }
  });

  // --- Rutas de Backup ---
  fastify.post('/servers/:serverName/backup', async (request, reply) => {
    const { serverName: rawServerName } = request.params;
    const { outputFileName: rawOutputFileName } = request.body || {}; // outputFileName es opcional desde el body
    try {
        const serverName = sanitizePathInput(rawServerName);
        const outputFileName = rawOutputFileName ? sanitizePathInput(rawOutputFileName) : null;

        if (!serverName) {
            return reply.code(400).send({ success: false, error: "Nombre de servidor es requerido/inválido." });
        }
        
        const result = await generateServerFolderBackup(serverName, outputFileName);
        if (typeof result === 'string' && (result.includes("no existe") || result.startsWith("Error"))) {
             return reply.code(404).send({ success: false, error: result });
        }
        return reply.send({ success: true, data: result }); // result es la ruta del backup
    } catch (error) {
        fastify.log.error(`Error generando backup para ${rawServerName}: ${error.message}`);
        reply.code(500).send({ success: false, error: error.message || 'Error al generar el backup.' });
    }
  });

  fastify.post('/servers/uncompress-backup', async (request, reply) => {
    const { compressedFileName: rawCompressedFile, outputFolderName: rawOutputFolder } = request.body;
    try {
        const compressedFileName = sanitizePathInput(rawCompressedFile); // Nombre del archivo en 'backups/'
        const outputFolderName = rawOutputFolder ? sanitizePathInput(rawOutputFolder) : null; // Nombre para la carpeta en 'servers/'

        if (!compressedFileName) {
            return reply.code(400).send({ success: false, error: "Nombre del archivo comprimido es requerido/inválido." });
        }

        const result = await uncompressServerFolderBackup(compressedFileName, outputFolderName);
        if (typeof result === 'string' && (result.includes("no existe") || result.startsWith("Error"))) {
             return reply.code(404).send({ success: false, error: result });
        }
        return reply.send({ success: true, data: result }); // result es la ruta de la carpeta descomprimida
    } catch (error) {
        fastify.log.error(`Error descomprimiendo ${rawCompressedFile}: ${error.message}`);
        reply.code(500).send({ success: false, error: error.message || 'Error al descomprimir el backup.' });
    }
  });


}

export default fileManagerRoutes;