import path from 'path';
import {
  // Importa solo las funciones necesarias aquí
  getfolderinfo,
  readfilebypath,
  // Las otras no se usan en estas rutas, pero las dejamos comentadas por si acaso
  // createserverfolder,
  // createserverfile,
  // createsubfolder,
  // updatefolderinfo,
  // writeFilebyName
} from '../../modules/servers.js'; // Verifica la ruta

// Importamos las utilidades de validación de archivos
import { PathUtils } from '../../fileutils.js'; // Ajusta la ruta según tu estructura

// --- Funciones Helper ---

// Función para filtrar archivos .jar o .zip
function isPluginORMod(item) {
  // Asegura que item.name exista si es un objeto
  const itemName = typeof item === 'object' && item !== null && typeof item.name === 'string'
    ? item.name
    : typeof item === 'string'
    ? item
    : ''; // Devuelve cadena vacía si no es objeto con name ni string

  return PathUtils.isAllowedFileType(itemName, ['jar', 'zip']);
}

// Helper para sanitizar nombres/rutas (Mejorado con validaciones de fileutils)
function sanitizePathInput(input) {
  if (!input || typeof input !== 'string') return null;
  
  // Primero hacemos la sanitización básica
  const sanitized = input.replace(/\.\.\//g, '').replace(/\.\./g, '').replace(/^\//, '');
  
  // Verificamos si el input ha sido modificado
  if (sanitized !== input) {
    console.warn(`Sanitización aplicada: "${input}" -> "${sanitized}"`);
  }
  
  // Validamos el formato del nombre según el patrón esperado para archivos
  if (!PathUtils.isValidFilenamePattern(sanitized)) {
    return null;
  }
  
  return sanitized;
}

// --- Definición del Plugin Fastify ---
async function pluginModRoutes(fastify, options) {

  const serversBaseDir = PathUtils.serverPath; // Usamos la constante de fileutils

  // Función helper para construir y validar rutas seguras
  const getValidatedServerSubPath = (serverName, subDirectory, fileName = null) => {
    const sanitizedServer = sanitizePathInput(serverName);
    const sanitizedSubDir = sanitizePathInput(subDirectory); // 'plugins' o 'mods'
    
    // Verificamos si los subdirectorios permitidos son correctos
    if (!['plugins', 'mods'].includes(sanitizedSubDir)) {
      throw new Error('Subdirectorio no permitido.');
    }
    
    let sanitizedFileName = null;
    
    // Si se proporciona un nombre de archivo, validamos también su extensión
    if (fileName) {
      sanitizedFileName = sanitizePathInput(fileName);
      
      // Verificamos si es un tipo de archivo permitido (.jar o .zip)
      if (sanitizedFileName && !PathUtils.isAllowedFileType(sanitizedFileName, ['jar', 'zip'])) {
        throw new Error('Tipo de archivo no permitido. Solo se permiten archivos .jar o .zip');
      }
    }

    if (!sanitizedServer || !sanitizedSubDir) {
      throw new Error('Nombre de servidor o subdirectorio inválido.');
    }

    const pathSegments = [serversBaseDir, sanitizedServer, sanitizedSubDir];
    if (sanitizedFileName) {
      pathSegments.push(sanitizedFileName);
    }

    const resolvedPath = path.resolve(...pathSegments);

    // Validación CRUCIAL: Asegura que la ruta esté dentro de 'servers/serverName/subDirectory'
    const expectedBasePath = path.resolve(serversBaseDir, sanitizedServer, sanitizedSubDir);
    if (!resolvedPath.startsWith(expectedBasePath)) {
      const attemptedPath = path.join(...pathSegments.slice(1)); // Ruta relativa intentada
      throw new Error(`Acceso prohibido fuera del directorio esperado: ${attemptedPath}`);
    }

    // Verificamos que la ruta existe (si es un directorio)
    if (!sanitizedFileName && !PathUtils.pathExists(resolvedPath)) {
      throw new Error(`El directorio ${resolvedPath} no existe.`);
    }

    // Si es un archivo, verificamos que existe y que es realmente un archivo
    if (sanitizedFileName) {
      const validation = PathUtils.validateFileAttributes(
        resolvedPath,
        ['jar', 'zip'],
        { checkPathExists: true, checkIsFile: true }
      );
      
      if (!validation.isValid) {
        throw new Error(`Archivo inválido: ${validation.errors.join(' ')}`);
      }
    }

    // Devuelve la ruta absoluta validada
    return resolvedPath;
  };


  // --- Rutas ---

  // GET /plugins/:serverName (Listar plugins)
  fastify.get('/plugins/:serverName', async (request, reply) => {
    const { serverName: rawServerName } = request.params;

    try {
      // Construye y valida la ruta a la carpeta de plugins
      const pluginsPath = getValidatedServerSubPath(rawServerName, 'plugins');

      // Llama a getfolderinfo
      const serverInfo = getfolderinfo(pluginsPath);

      // Verifica que serverInfo y serverInfo.files existan
      const files = serverInfo?.files ?? [];
      const allplugins = files.filter(isPluginORMod);

      return { success: true, data: allplugins };

    } catch (error) {
      fastify.log.error(`Error listando plugins para ${rawServerName}: ${error.message}`);
      
      if (error.message.includes('ENOENT') || error.message.includes('no existe') || 
          error.message.toLowerCase().includes('not found') || error.message.includes('inválido')) {
        reply.code(404).send({ 
          success: false, 
          error: `Servidor '${rawServerName}' o carpeta de plugins no encontrada/inválida.` 
        });
      } else if (error.message.includes('Acceso prohibido') || error.message.includes('no permitido')) {
        reply.code(403).send({ success: false, error: 'Acceso denegado.' });
      } else {
        reply.code(500).send({ success: false, error: 'Error al listar los plugins.' });
      }
    }
  });

  // GET /mods/:serverName (Listar mods)
  fastify.get('/mods/:serverName', async (request, reply) => {
    const { serverName: rawServerName } = request.params;

    try {
      // Construye y valida la ruta a la carpeta de mods
      const modsPath = getValidatedServerSubPath(rawServerName, 'mods');

      const serverInfo = getfolderinfo(modsPath);
      const files = serverInfo?.files ?? [];
      const allmods = files.filter(isPluginORMod);

      return { success: true, data: allmods };

    } catch (error) {
      fastify.log.error(`Error listando mods para ${rawServerName}: ${error.message}`);
      
      if (error.message.includes('ENOENT') || error.message.includes('no existe') || 
          error.message.toLowerCase().includes('not found') || error.message.includes('inválido')) {
        reply.code(404).send({ 
          success: false, 
          error: `Servidor '${rawServerName}' o carpeta de mods no encontrada/inválida.` 
        });
      } else if (error.message.includes('Acceso prohibido') || error.message.includes('no permitido')) {
        reply.code(403).send({ success: false, error: 'Acceso denegado.' });
      } else {
        reply.code(500).send({ success: false, error: 'Error al listar los mods.' });
      }
    }
  });

  // GET /plugins/:serverName/:pluginName (Leer contenido de un plugin específico)
  fastify.get('/plugins/:serverName/:pluginName', async (request, reply) => {
    const { serverName: rawServerName, pluginName: rawPluginName } = request.params;

    try {
      // Construye y valida la ruta al archivo del plugin
      const filePath = getValidatedServerSubPath(rawServerName, 'plugins', rawPluginName);

      // En lugar de leer directamente, consideramos enviar el archivo:
      if (request.query.download === 'true') {
        return reply.sendFile(path.basename(filePath), path.dirname(filePath));
      }
      
      // Si no se solicita descargar, procedemos con la lógica original (leer contenido)
      const result = readfilebypath(filePath);
      
      fastify.log.warn(`Leyendo contenido completo de ${filePath} a memoria para JSON. Considera alternativas.`);
      return { success: true, data: result };

    } catch (error) {
      fastify.log.error(`Error leyendo plugin ${rawPluginName} para ${rawServerName}: ${error.message}`);
      
      if (error.message.includes('ENOENT') || error.message.includes('no existe') || 
          error.message.toLowerCase().includes('not found') || error.message.includes('inválido') || 
          error.message.includes('Archivo inválido')) {
        reply.code(404).send({ 
          success: false, 
          error: `Plugin '${rawPluginName}' no encontrado en servidor '${rawServerName}' o ruta inválida.` 
        });
      } else if (error.message.includes('Acceso prohibido') || error.message.includes('no permitido')) {
        reply.code(403).send({ success: false, error: 'Acceso denegado.' });
      } else {
        reply.code(500).send({ success: false, error: 'Error al leer el archivo del plugin.' });
      }
    }
  });

  // GET /mods/:serverName/:modName (Leer contenido de un mod específico)
  fastify.get('/mods/:serverName/:modName', async (request, reply) => {
    const { serverName: rawServerName, modName: rawModName } = request.params;

    try {
      // Construye y valida la ruta al archivo del mod
      const filePath = getValidatedServerSubPath(rawServerName, 'mods', rawModName);

      // En lugar de leer directamente, consideramos enviar el archivo:
      if (request.query.download === 'true') {
        return reply.sendFile(path.basename(filePath), path.dirname(filePath));
      }
      
      // Si no se solicita descargar, procedemos con la lógica original
      const result = readfilebypath(filePath);
      
      fastify.log.warn(`Leyendo contenido completo de ${filePath} a memoria para JSON. Considera alternativas.`);
      return { success: true, data: result };

    } catch (error) {
      fastify.log.error(`Error leyendo mod ${rawModName} para ${rawServerName}: ${error.message}`);
      
      if (error.message.includes('ENOENT') || error.message.includes('no existe') || 
          error.message.toLowerCase().includes('not found') || error.message.includes('inválido') || 
          error.message.includes('Archivo inválido')) {
        reply.code(404).send({ 
          success: false, 
          error: `Mod '${rawModName}' no encontrado en servidor '${rawServerName}' o ruta inválida.` 
        });
      } else if (error.message.includes('Acceso prohibido') || error.message.includes('no permitido')) {
        reply.code(403).send({ success: false, error: 'Acceso denegado.' });
      } else {
        reply.code(500).send({ success: false, error: 'Error al leer el archivo del mod.' });
      }
    }
  });

}

// Exporta la función del plugin
export default pluginModRoutes;