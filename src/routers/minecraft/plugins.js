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

// --- Funciones Helper ---

// Función para filtrar archivos .jar o .zip
function isPluginORMod(item) {
  // Asegura que item.name exista si es un objeto
  const itemName = typeof item === 'object' && item !== null && typeof item.name === 'string'
    ? item.name
    : typeof item === 'string'
    ? item
    : ''; // Devuelve cadena vacía si no es objeto con name ni string

  // Usa toLowerCase para comparación insensible a mayúsculas/minúsculas
  const lowerCaseName = itemName.toLowerCase();
  // .includes('.jar') es menos preciso que endsWith, pero lo mantenemos por compatibilidad si es necesario
  return lowerCaseName.endsWith('.jar') || lowerCaseName.endsWith('.zip');
}

// Helper para sanitizar nombres/rutas (¡MUY IMPORTANTE!)
// (Puedes reutilizar la versión de las conversiones anteriores)
function sanitizePathInput(input) {
  if (!input || typeof input !== 'string') return null;
  const sanitized = input.replace(/\.\.\//g, '').replace(/\.\./g, '').replace(/^\//, '');
  if (sanitized !== input) {
    console.warn(`Sanitización aplicada: "${input}" -> "${sanitized}"`);
  }
  return sanitized;
}

// --- Definición del Plugin Fastify ---
async function pluginModRoutes(fastify, options) {

  const serversBaseDir = path.resolve(process.cwd(), 'servers'); // Directorio base seguro

  // Función helper para construir y validar rutas seguras
  const getValidatedServerSubPath = (serverName, subDirectory, fileName = null) => {
    const sanitizedServer = sanitizePathInput(serverName);
    const sanitizedSubDir = sanitizePathInput(subDirectory); // 'plugins' o 'mods'
    const sanitizedFileName = fileName ? sanitizePathInput(fileName) : null;

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

      // Llama a getfolderinfo (asume síncrono, si es async, usar await)
      // Pasa la ruta absoluta validada, o ajusta si getfolderinfo espera ruta relativa
      const serverInfo = getfolderinfo(pluginsPath); // O podrías pasar la ruta relativa a 'servers'

      // Verifica que serverInfo y serverInfo.files existan
      const files = serverInfo?.files ?? [];
      const allplugins = files.filter(isPluginORMod);

      return { success: true, data: allplugins };

    } catch (error) {
      fastify.log.error(`Error listando plugins para ${rawServerName}: ${error.message}`);
       if (error.message.includes('ENOENT') || error.message.toLowerCase().includes('not found') || error.message.includes('inválido')) {
         reply.code(404).send({ success: false, error: `Servidor '${rawServerName}' o carpeta de plugins no encontrada/inválida.` });
      } else if (error.message.includes('Acceso prohibido')) {
          reply.code(403).send({ success: false, error: 'Acceso denegado.' });
      }
       else {
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

      const serverInfo = getfolderinfo(modsPath); // Asume síncrono
      const files = serverInfo?.files ?? [];
      const allmods = files.filter(isPluginORMod);

      return { success: true, data: allmods };

    } catch (error) {
      fastify.log.error(`Error listando mods para ${rawServerName}: ${error.message}`);
       if (error.message.includes('ENOENT') || error.message.toLowerCase().includes('not found') || error.message.includes('inválido')) {
         reply.code(404).send({ success: false, error: `Servidor '${rawServerName}' o carpeta de mods no encontrada/inválida.` });
      } else if (error.message.includes('Acceso prohibido')) {
          reply.code(403).send({ success: false, error: 'Acceso denegado.' });
      } else {
         reply.code(500).send({ success: false, error: 'Error al listar los mods.' });
      }
    }
  });

  // GET /plugins/:serverName/:pluginName (Leer contenido de un plugin específico)
  // NOTA: Cambiado de POST a GET por semántica REST (leer datos).
  //       La lógica extraña de parámetros en Express fue simplificada asumiendo esta URL.
  fastify.get('/plugins/:serverName/:pluginName', async (request, reply) => {
    const { serverName: rawServerName, pluginName: rawPluginName } = request.params;

    try {
      // Construye y valida la ruta al archivo del plugin
      const filePath = getValidatedServerSubPath(rawServerName, 'plugins', rawPluginName);

      // Llama a readfilebypath (asume síncrono)
      // Pasa la ruta absoluta validada
      const result = readfilebypath(filePath);

      // ¡Consideración! Leer un .jar/.zip completo a memoria y enviarlo como JSON
      // puede ser muy ineficiente y causar problemas de memoria.
      // ¿Quizás solo se quería información del archivo, no el contenido binario?
      // Si se quiere descargar, se debería usar `reply.sendFile` o `reply.download`.
      // Por ahora, replicamos la lógica original (enviar contenido leído).
      fastify.log.warn(`Leyendo contenido completo de ${filePath} a memoria para JSON. Considera alternativas.`);
      return { success: true, data: result }; // 'result' podría ser un Buffer o string

    } catch (error) {
      fastify.log.error(`Error leyendo plugin ${rawPluginName} para ${rawServerName}: ${error.message}`);
       if (error.message.includes('ENOENT') || error.message.toLowerCase().includes('not found') || error.message.includes('inválido')) {
         reply.code(404).send({ success: false, error: `Plugin '${rawPluginName}' no encontrado en servidor '${rawServerName}' o ruta inválida.` });
      } else if (error.message.includes('Acceso prohibido')) {
          reply.code(403).send({ success: false, error: 'Acceso denegado.' });
      } else {
         reply.code(500).send({ success: false, error: 'Error al leer el archivo del plugin.' });
      }
    }
  });

  // GET /mods/:serverName/:modName (Leer contenido de un mod específico)
  // NOTA: Cambiado de POST a GET por semántica REST.
  fastify.get('/mods/:serverName/:modName', async (request, reply) => {
    const { serverName: rawServerName, modName: rawModName } = request.params;

    try {
      // Construye y valida la ruta al archivo del mod
      const filePath = getValidatedServerSubPath(rawServerName, 'mods', rawModName);

      // Llama a readfilebypath (asume síncrono)
      const result = readfilebypath(filePath);

      fastify.log.warn(`Leyendo contenido completo de ${filePath} a memoria para JSON. Considera alternativas.`);
      return { success: true, data: result };

    } catch (error) {
      fastify.log.error(`Error leyendo mod ${rawModName} para ${rawServerName}: ${error.message}`);
       if (error.message.includes('ENOENT') || error.message.toLowerCase().includes('not found') || error.message.includes('inválido')) {
         reply.code(404).send({ success: false, error: `Mod '${rawModName}' no encontrado en servidor '${rawServerName}' o ruta inválida.` });
      } else if (error.message.includes('Acceso prohibido')) {
          reply.code(403).send({ success: false, error: 'Acceso denegado.' });
      } else {
         reply.code(500).send({ success: false, error: 'Error al leer el archivo del mod.' });
      }
    }
  });

}

// Exporta la función del plugin
export default pluginModRoutes;