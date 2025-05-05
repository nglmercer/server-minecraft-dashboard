import path from 'path';
import fs from 'fs/promises'; // Usar promesas para operaciones de FS es más moderno
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
  deleteserver
} from '../modules/servers.js'; // Verifica la ruta
import {
  downloadFileFromUrl
} from "../utils/utils.js"; // Verifica la ruta

// Helper para sanitizar nombres/rutas (¡MUY IMPORTANTE!)
// Esta es una versión BÁSICA, considera una librería más robusta o validaciones más estrictas.
function sanitizePathInput(input) {
  if (!input || typeof input !== 'string') return null; // O lanzar error
  // Prevenir Path Traversal y caracteres problemáticos
  const sanitized = input.replace(/\.\.\//g, '').replace(/\.\./g, '').replace(/^\//, '');
  // Podrías añadir más reemplazos o validaciones aquí (ej: caracteres permitidos)
  if (sanitized !== input) {
    console.warn(`Intento de Path Traversal detectado o caracteres inválidos: "${input}" -> "${sanitized}"`);
  }
  return sanitized;
}

async function fileManagerRoutes(fastify, options) {

  const serversBaseDir = path.resolve(process.cwd(), 'servers'); // Directorio base seguro

  // Función helper para construir rutas seguras dentro de serversBaseDir
  const getServerPath = (...args) => {
    const potentiallyUnsafePath = path.join(...args.map(arg => sanitizePathInput(arg || '')).filter(Boolean));
    const resolvedPath = path.resolve(serversBaseDir, potentiallyUnsafePath);
    // ¡Validación CRUCIAL! Asegurarse que la ruta resultante está DENTRO de serversBaseDir
    if (!resolvedPath.startsWith(serversBaseDir)) {
      throw new Error(`Acceso prohibido fuera del directorio de servidores: ${potentiallyUnsafePath}`);
    }
    return {
        absolute: resolvedPath,
        relative: path.relative(serversBaseDir, resolvedPath) // Ruta relativa a 'servers'
    };
  };


  // Ruta para crear una carpeta (POST /filemanager/create-folder)
  fastify.post('/create-folder', async (request, reply) => {
    const { directoryname: rawDirName } = request.body;
    const directoryname = sanitizePathInput(rawDirName);

    if (!directoryname) {
      return reply.code(400).send({ success: false, error: "El nombre de la carpeta es requerido o inválido." });
    }
    try {
      // Asume que createserverfolder trabaja relativo a la base o maneja rutas absolutas de forma segura
      // Si necesita la ruta absoluta segura: getServerPath(directoryname).absolute
      const result = createserverfolder(directoryname); // Ajusta si necesita ruta absoluta/relativa
      return { success: true, data: result };
    } catch (error) {
      fastify.log.error(`Error creando carpeta ${directoryname}: ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al crear la carpeta.' });
    }
  });

  // Ruta para crear un archivo (POST /filemanager/create-file)
  fastify.post('/create-file', async (request, reply) => {
    const { directoryname: rawDirName, filename: rawFileName, content } = request.body;
    const directoryname = sanitizePathInput(rawDirName);
    const filename = sanitizePathInput(rawFileName);

    if (!directoryname || !filename) { // content puede ser vacío
      return reply.code(400).send({ success: false, error: "Nombre de directorio y archivo son requeridos/inválidos." });
    }
    try {
      // Similar a create-folder, ajusta cómo pasas las rutas a createserverfile
      const result = createserverfile(directoryname, filename, content ?? ''); // Usa ?? para default seguro
      return { success: true, data: result };
    } catch (error) {
      fastify.log.error(`Error creando archivo ${filename} en ${directoryname}: ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al crear el archivo.' });
    }
  });

  // Ruta para crear una subcarpeta (POST /filemanager/create-subfolder)
  fastify.post('/create-subfolder', async (request, reply) => {
    const { directoryname: rawDirName, subfoldername: rawSubfolderName } = request.body;
    const directoryname = sanitizePathInput(rawDirName);
    const subfoldername = sanitizePathInput(rawSubfolderName);

    if (!directoryname || !subfoldername) {
      return reply.code(400).send({ success: false, error: "Nombre de directorio y subcarpeta son requeridos/inválidos." });
    }
    try {
      // Ajusta cómo pasas las rutas a createsubfolder
      const result = createsubfolder(directoryname, subfoldername);
      return { success: true, data: result };
    } catch (error) {
      fastify.log.error(`Error creando subcarpeta ${subfoldername} en ${directoryname}: ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al crear la subcarpeta.' });
    }
  });

  // Ruta para obtener información de una carpeta (GET /filemanager/folder-info/:folderName)
  fastify.get('/folder-info/:folderName', async (request, reply) => {
    const { folderName: rawFolderName } = request.params;
    const folderName = sanitizePathInput(rawFolderName);

    if (!folderName) {
      return reply.code(400).send({ success: false, error: "El nombre de la carpeta es requerido o inválido." });
    }
    try {
      // Ajusta cómo pasas la ruta a getfolderinfo
      const result = getfolderinfo(folderName); // Asume que maneja errores si no existe
      return { success: true, data: result };
    } catch (error) {
      fastify.log.error(`Error obteniendo info de ${folderName}: ${error.message}`);
      // Diferenciar Not Found de otros errores
      if (error.message.includes('ENOENT') || error.message.toLowerCase().includes('not found')) {
         reply.code(404).send({ success: false, error: 'Carpeta no encontrada.' });
      } else {
         reply.code(500).send({ success: false, error: 'Error al obtener información de la carpeta.' });
      }
    }
  });

  // Ruta para actualizar la información de una carpeta (POST /filemanager/update-folder-info)
  fastify.post('/update-folder-info', async (request, reply) => {
    const { folderName: rawFolderName } = request.body;
    const folderName = sanitizePathInput(rawFolderName);

    if (!folderName) {
      return reply.code(400).send({ success: false, error: "El nombre de la carpeta es requerido o inválido." });
    }
    try {
      updatefolderinfo(folderName); // Asume síncrona o devuelve promesa
      return { success: true, message: "Información de la carpeta actualizada correctamente." };
    } catch (error) {
      fastify.log.error(`Error actualizando info de ${folderName}: ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al actualizar la información.' });
    }
  });

  // Ruta para leer un archivo por nombre (GET /filemanager/read-file/:folderName/:fileName)
  fastify.get('/read-file/:folderName/:fileName', async (request, reply) => {
    const { folderName: rawFolderName, fileName: rawFileName } = request.params;
    const folderName = sanitizePathInput(rawFolderName);
    const fileName = sanitizePathInput(rawFileName);


    if (!folderName || !fileName) {
      return reply.code(400).send({ success: false, error: "Nombre de carpeta y archivo son requeridos/inválidos." });
    }
    try {
      const result = readfilebyname(folderName, fileName); // Asume que maneja errores
      return { success: true, data: result };
    } catch (error) {
      fastify.log.error(`Error leyendo ${fileName} en ${folderName}: ${error.message}`);
      if (error.message.includes('ENOENT') || error.message.toLowerCase().includes('not found')) {
         reply.code(404).send({ success: false, error: 'Archivo no encontrado.' });
      } else {
         reply.code(500).send({ success: false, error: 'Error al leer el archivo.' });
      }
    }
  });

  // Ruta para leer un archivo por ruta completa (relativa a 'servers') (GET /filemanager/read-file-by-path/*)
  fastify.get('/read-file-by-path/*', async (request, reply) => {
    const rawFilePath = request.params['*']; // Obtiene la parte del wildcard
    const filePath = sanitizePathInput(rawFilePath);

    if (!filePath) {
        return reply.code(400).send({ success: false, error: "La ruta del archivo es requerida o inválida." });
    }
    try {
        // ¡CRUCIAL! Asegúrate que readfilebypath está confinado al directorio 'servers'
        // O usa el helper para obtener la ruta absoluta segura y pásala
        const safePath = getServerPath(filePath).absolute; // Lanza error si está fuera
        const result = await readfilebypath(safePath); // Asume que readfilebypath acepta ruta absoluta
        // O si readfilebypath espera la ruta relativa a 'servers':
        // const result = readfilebypath(getServerPath(filePath).relative);

        return { success: true, data: result };
    } catch (error) {
        fastify.log.error(`Error leyendo por path ${filePath}: ${error.message}`);
        if (error.message.includes('ENOENT') || error.message.toLowerCase().includes('not found') || error.message.includes('Acceso prohibido')) {
            reply.code(404).send({ success: false, error: 'Archivo no encontrado o acceso denegado.' });
        } else {
            reply.code(500).send({ success: false, error: 'Error al leer el archivo por ruta.' });
        }
    }
  });


  // Ruta para escribir un archivo (POST /filemanager/writeFilebyName)
  fastify.post('/writeFilebyName', async (request, reply) => {
    let { folderName: rawFolderName, fileName: rawFileName, content } = request.body;
    const folderName = sanitizePathInput(rawFolderName);
    let fileName = sanitizePathInput(rawFileName);

    if (!folderName || !fileName) { // content puede ser null/undefined
      return reply.code(400).send({ success: false, error: "Nombre de carpeta y archivo son requeridos/inválidos." });
    }
    // La lógica original eliminaba '/', ya lo hace sanitizePathInput si está al inicio
    // Podrías añadir más validaciones a fileName si es necesario

    try {
      fastify.log.info(`Escribiendo archivo: ${folderName}/${fileName}`);
      const result = writeFilebyName(folderName, fileName, content ?? '');
      fastify.log.info("Resultado escritura:", result);
      return { success: true, data: result };
    } catch (error) {
      fastify.log.error(`Error escribiendo ${fileName} en ${folderName}: ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al escribir el archivo.' });
    }
  });

  // Ruta para subir un solo archivo (POST /filemanager/upload)
  fastify.post('/upload', async (request, reply) => {
    // Los campos 'server' y 'path' vienen del query string
    const { server: rawServer, path: rawServerPath } = request.query;
    const server = sanitizePathInput(rawServer);
    const serverPath = sanitizePathInput(rawServerPath) || ''; // Default a raíz del server si no se provee path

    // Verifica si la petición es multipart
    if (!request.isMultipart()) {
      return reply.code(400).send({ success: false, message: "Se esperaba una petición multipart/form-data." });
    }

    try {
      const fileData = await request.file(); // Espera el primer archivo

      if (!fileData || !server) {
        return reply.code(400).send({
          success: false,
          message: "Faltan parámetros (server) en query o archivo no recibido",
          data: { server, path: serverPath, fileReceived: !!fileData },
        });
      }

      const originalFileName = sanitizePathInput(fileData.filename); // Sanitizar nombre original
      if (!originalFileName) {
         return reply.code(400).send({ success: false, message: "Nombre de archivo inválido." });
      }

      const fileContent = await fileData.toBuffer(); // Obtener contenido como Buffer

      // Construye la ruta relativa DENTRO del servidor específico
      const relativeFilePath = path.join(serverPath, originalFileName);

      fastify.log.info(`Subiendo archivo a: server=${server}, rutaRelativa=${relativeFilePath}`);

      // Llama a la función que crea/escribe el archivo
      // Asegúrate que createserverfile maneje la ruta relativa dentro del 'server' dado
      // y que también valide/sanitice internamente por seguridad.
      const result = createserverfile(server, relativeFilePath, fileContent);

      return { success: true, result };

    } catch (error) {
      // Maneja errores de @fastify/multipart (ej. límites excedidos) u otros
      fastify.log.error(`Error subiendo archivo a ${server}/${serverPath}: ${error.message}`, error);
       if (error.validation) { // Error de validación de @fastify/multipart
           reply.code(400).send({ success: false, message: `Error de validación: ${error.message}` });
       } else if (error.message.includes('Request file too large')) {
            reply.code(413).send({ success: false, message: 'El archivo es demasiado grande.' });
       }
       else {
          reply.code(500).send({ success: false, message: 'Error interno al subir el archivo.' });
       }
    }
  });

  // Ruta para subir múltiples archivos (POST /filemanager/upload/files)
  fastify.post('/upload/files', async (request, reply) => {
    const { server: rawServer, path: rawServerPath } = request.query;
    const server = sanitizePathInput(rawServer);
    const serverPath = sanitizePathInput(rawServerPath) || '';

    if (!request.isMultipart()) {
      return reply.code(400).send({ success: false, message: "Se esperaba una petición multipart/form-data." });
    }

    if (!server) {
       return reply.code(400).send({ success: false, message: "Parámetro 'server' requerido en query." });
    }

    const results = [];
    let filesReceived = 0;

    try {
      const parts = request.files(); // Obtiene un Async Iterator para los archivos

      for await (const part of parts) {
        filesReceived++;
        const originalFileName = sanitizePathInput(part.filename);
        if (!originalFileName) {
          fastify.log.warn(`Archivo omitido en subida múltiple a ${server}/${serverPath}: Nombre inválido`);
          results.push({ filename: part.filename, success: false, error: 'Nombre de archivo inválido.' });
          continue; // Salta este archivo
        }

        const fileContent = await part.toBuffer();
        const relativeFilePath = path.join(serverPath, originalFileName);

        try {
          fastify.log.info(`Subiendo archivo múltiple a: server=${server}, rutaRelativa=${relativeFilePath}`);
          const result = createserverfile(server, relativeFilePath, fileContent);
          results.push({ filename: originalFileName, success: true, result });
        } catch (fileError) {
          fastify.log.error(`Error subiendo ${originalFileName} a ${server}/${serverPath}: ${fileError.message}`);
          results.push({ filename: originalFileName, success: false, error: fileError.message });
        }
      }

      if (filesReceived === 0) {
          return reply.code(400).send({
              success: false,
              message: "No se recibieron archivos válidos.",
              data: { server, path: serverPath, filesReceived },
          });
      }

      return { success: true, results };

    } catch (error) {
      fastify.log.error(`Error en subida múltiple a ${server}/${serverPath}: ${error.message}`, error);
       if (error.validation) {
           reply.code(400).send({ success: false, message: `Error de validación: ${error.message}` });
       } else if (error.message.includes('reach file limit')) {
            reply.code(413).send({ success: false, message: 'Se superó el límite de archivos.' });
       } else {
          reply.code(500).send({ success: false, message: 'Error interno durante la subida múltiple.' });
       }
    }
  });

  // Ruta para renombrar (GET /filemanager/rename) - ¡Debería ser PUT/PATCH!
  fastify.get('/rename', async (request, reply) => {
    // NOTA: Usar GET para modificar estado no es ideal. Considera PUT o PATCH.
    const { server: rawServer, path: rawServerPath, newName: rawNewName } = request.query;
    const server = sanitizePathInput(rawServer);
    const serverPath = sanitizePathInput(rawServerPath);
    const newName = sanitizePathInput(rawNewName);


    if (!server || !serverPath || !newName) {
      return reply.code(400).send({ success: false, message: "Parámetros requeridos/inválidos: server, path, newName" });
    }
    try {
      // Asegúrate que renamefile maneje las rutas de forma segura
      const result = renamefile(server, serverPath, newName);
      return { success: true, result };
    } catch (error) {
      fastify.log.error(`Error renombrando ${serverPath} a ${newName} en ${server}: ${error.message}`);
      reply.code(500).send({ success: false, message: 'Error al renombrar.' });
    }
  });

  // Ruta para borrar (GET /filemanager/delete) - ¡Debería ser DELETE!
  fastify.get('/delete', async (request, reply) => {
    // NOTA: Usar GET para borrar no es ideal. Considera DELETE.
    const { server: rawServer, path: rawServerPath } = request.query;
    const server = sanitizePathInput(rawServer);
    const serverPath = sanitizePathInput(rawServerPath);

    if (!server || !serverPath) {
      return reply.code(400).send({ success: false, message: "Parámetros requeridos/inválidos: server, path" });
    }
    try {
      // Asegúrate que deletefile maneje las rutas de forma segura
      const result = deletefile(server, serverPath);
      return { success: true, result };
    } catch (error) {
      fastify.log.error(`Error borrando ${serverPath} en ${server}: ${error.message}`);
      reply.code(500).send({ success: false, message: 'Error al borrar.' });
    }
  });

  // Ruta para borrar un servidor completo (DELETE /filemanager/servers/:serverName)
  fastify.delete('/servers/:serverName', async (request, reply) => {
    const { serverName: rawServerName } = request.params;
    const serverName = sanitizePathInput(rawServerName);

    if (!serverName) {
      return reply.code(400).send({ success: false, message: "Nombre de servidor requerido/inválido." });
    }
    try {
      // Asegúrate que deleteserver sea seguro y borre solo el directorio correcto
      const result = deleteserver(serverName);
      return { success: true, result };
    } catch (error) {
      fastify.log.error(`Error borrando servidor ${serverName}: ${error.message}`);
      reply.code(500).send({ success: false, message: 'Error al borrar el servidor.' });
    }
  });

  // Ruta para descargar un archivo desde URL y guardarlo (GET /filemanager/download-file)
  fastify.get('/download-file', async (request, reply) => {
    const { server: rawServer, path: rawServerPath, url } = request.query;
    const server = sanitizePathInput(rawServer);
    const serverPath = sanitizePathInput(rawServerPath) || ''; // Directorio destino dentro del server

     // Validación básica de URL (podría ser más robusta)
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
         return reply.code(400).send({ success: false, message: "URL inválida o faltante." });
    }
    if (!server) {
       return reply.code(400).send({ success: false, message: "Parámetro 'server' requerido/inválido." });
    }

    try {
        // Extraer nombre de archivo de la URL de forma segura
        const urlObject = new URL(url);
        const rawFileName = path.basename(urlObject.pathname);
        const fileName = sanitizePathInput(rawFileName);

        if (!fileName) {
           return reply.code(400).send({ success: false, message: "No se pudo determinar un nombre de archivo válido desde la URL." });
        }

        // Construir la ruta de destino relativa dentro del servidor
        const relativeDestPath = path.join(serverPath, fileName);

        fastify.log.info(`Iniciando descarga de ${url} a ${server}/${relativeDestPath}`);

        // Configuración para downloadFileFromUrl
        // Asegúrate que esta función maneje la escritura segura en 'server/relativeDestPath'
        const fileConfig = {
          server, // Nombre del servidor base
          url,    // URL de origen
          filePath: relativeDestPath, // Ruta relativa donde guardar DENTRO del servidor
          cb: (...args) => { // Callback opcional
            fastify.log.info("Callback de downloadFileFromUrl:", ...args);
          }
        };

        // Ejecutar la descarga (asume que es async o fire-and-forget)
        // Si es async y quieres esperar: await downloadFileFromUrl(fileConfig);
        downloadFileFromUrl(fileConfig);

        // Responder inmediatamente como en el código original
        return { success: true, message: "Descarga iniciada en segundo plano." };

    } catch (error) {
        fastify.log.error(`Error iniciando descarga desde ${url} a ${server}/${serverPath}: ${error.message}`);
        reply.code(500).send({ success: false, message: 'Error al iniciar la descarga.' });
    }
  });

   // Servir archivos estáticos desde un servidor específico (GET /filemanager/serve-file/:serverName/*)
   fastify.get('/serve-file/:serverName/*', async (request, reply) => {
    const { serverName: rawServerName } = request.params;
    const serverName = sanitizePathInput(rawServerName);
    const rawFilePath = request.params['*'];
    const filePath = sanitizePathInput(rawFilePath); // Sanitiza la ruta relativa del archivo

    if (!serverName || !filePath) {
        return reply.code(400).send({ error: 'Nombre del servidor y ruta del archivo son requeridos/inválidos.' });
    }

    try {
        // Construye la ruta absoluta y valida que esté dentro del directorio permitido
        const safePath = getServerPath(serverName, filePath).absolute;

        fastify.log.info(`Intentando servir archivo: ${safePath}`);

        // Verifica si el archivo existe antes de intentar enviarlo
        await fs.access(safePath, fs.constants.R_OK);

        // Usa reply.sendFile para enviar el archivo. Fastify maneja Content-Type, etc.
        // Proporciona la ruta ABSOLUTA VALIDADA.
        return reply.sendFile(filePath, serversBaseDir); // Sirve el archivo relativo al root especificado


    } catch (error) {
        fastify.log.error(`Error sirviendo ${filePath} desde ${serverName}: ${error.message}`);
        if (error.code === 'ENOENT' || error.message.includes('Acceso prohibido') || error.code === 'FST_ERR_SEND_FILE_INVALID_PATH') {
             reply.code(404).send({ error: 'Archivo no encontrado o acceso denegado.' });
        } else if (error.code === 'EACCES') {
            reply.code(403).send({ error: 'Permiso denegado para leer el archivo.' });
        }
         else {
             reply.code(500).send({ error: 'Error al servir el archivo.' });
        }
    }
  });

}

export default fileManagerRoutes;