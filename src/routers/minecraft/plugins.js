import path from 'path';
import {
  getfolderinfo,
  renamefile
} from '../../modules/servers.js';
import { PathUtils } from '../../fileutils.js';

function isPluginORMod(item) {
  const itemName = (typeof item === 'object' && item !== null && typeof item.name === 'string')
    ? item.name
    : (typeof item === 'string' ? item : '');

  if (!itemName) return null;

  const isDisabled = itemName.endsWith('.jar.dis') || itemName.endsWith('.zip.dis');
  let baseName = itemName;
  if (isDisabled) {
    baseName = itemName.substring(0, itemName.length - 4);
  }

  if (PathUtils.isAllowedFileType(baseName, ['jar', 'zip'])) {
    const type = baseName.substring(baseName.lastIndexOf('.') + 1);
    return {
      name: itemName,
      baseName: baseName,
      type: type,
      status: isDisabled ? 'disabled' : 'active',
    };
  }
  return null;
}

function sanitizePathInput(input) {
  if (!input || typeof input !== 'string') return null;
  
  const sanitized = input.replace(/\.\.\//g, '').replace(/\.\./g, '').replace(/^\//, '');
  
  if (sanitized !== input) {
    // Consider removing this log if strict "no console output" is required for "clean code"
    // console.warn(`Sanitization applied: "${input}" -> "${sanitized}"`);
  }
  
  if (!PathUtils.isValidFilenamePattern(sanitized)) {
    return null;
  }
  
  return sanitized;
}

async function pluginModRoutes(fastify, options) {

  const getValidatedServerSubPath = (serverName, subDirectory) => {
    const sanitizedServer = sanitizePathInput(serverName);

    if (!['plugins', 'mods'].includes(subDirectory)) {
      throw new Error('Subdirectorio no permitido.');
    }

    if (!sanitizedServer) {
      throw new Error('Nombre de servidor inválido.');
    }
    return path.join(sanitizedServer, subDirectory);
  };

  fastify.get('/plugins/:serverName', async (request, reply) => {
    const { serverName: rawServerName } = request.params;

    try {
      const pluginsPath = getValidatedServerSubPath(rawServerName, 'plugins');
      const serverInfo = await getfolderinfo(pluginsPath);

      const files = serverInfo?.files ?? [];
      const allplugins = files.map(isPluginORMod).filter(p => p !== null);
      
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

  fastify.get('/mods/:serverName', async (request, reply) => {
    const { serverName: rawServerName } = request.params;

    try {
      const modsPath = getValidatedServerSubPath(rawServerName, 'mods');
      const serverInfo = await getfolderinfo(modsPath);
      
      const files = serverInfo?.files ?? [];
      const allmods = files.map(isPluginORMod).filter(p => p !== null);

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

  async function handleItemToggle(request, reply, subDirectory) {
    const { serverName, itemName: baseItemNameFromReq, operation } = request.params;

    const sanitizedServerName = sanitizePathInput(serverName);
    const sanitizedBaseItemName = sanitizePathInput(baseItemNameFromReq);

    if (!sanitizedServerName || !sanitizedBaseItemName) {
      return reply.code(400).send({ success: false, error: 'Nombre de servidor o elemento inválido.' });
    }

    if (!PathUtils.isAllowedFileType(sanitizedBaseItemName, ['jar', 'zip'])) {
      return reply.code(400).send({
        success: false,
        error: `Nombre de elemento base inválido: '${sanitizedBaseItemName}'. Debe terminar en .jar o .zip.`,
      });
    }

    if (!['enable', 'disable'].includes(operation)) {
      return reply.code(400).send({ success: false, error: 'Operación no válida. Use "enable" o "disable".' });
    }

    let currentFileNameOnDisk;
    let newFileNameOnDisk;

    if (operation === 'enable') {
      currentFileNameOnDisk = sanitizedBaseItemName + '.dis';
      newFileNameOnDisk = sanitizedBaseItemName;
    } else { // operation === 'disable'
      currentFileNameOnDisk = sanitizedBaseItemName;
      newFileNameOnDisk = sanitizedBaseItemName + '.dis';
    }

    const sourceFileRelativePath = path.join(subDirectory, currentFileNameOnDisk);

    try {
      const renameResult = await renamefile(sanitizedServerName, sourceFileRelativePath, newFileNameOnDisk);

      if (renameResult) {
        return reply.send({
          success: true,
          message: `${subDirectory.slice(0, -1)} '${sanitizedBaseItemName}' ${operation}d successfully. New name: '${newFileNameOnDisk}'.`,
        });
      } else {
        return reply.code(404).send({
          success: false,
          error: `No se pudo ${operation} el ${subDirectory.slice(0, -1)} '${sanitizedBaseItemName}'. Asegúrese que '${currentFileNameOnDisk}' exista en la carpeta '${subDirectory}' del servidor '${sanitizedServerName}'.`,
        });
      }
    } catch (error) {
      fastify.log.error(`Error al cambiar estado de ${subDirectory.slice(0, -1)} ${sanitizedBaseItemName} para ${sanitizedServerName}: ${error.message}`);
      if (error.code === 'ENOENT') {
           return reply.code(404).send({ success: false, error: `Archivo '${currentFileNameOnDisk}' no encontrado para la operación ${operation}.` });
      }
      return reply.code(500).send({ success: false, error: `Error interno del servidor al intentar ${operation} el ${subDirectory.slice(0, -1)}.` });
    }
  }

  fastify.get('/plugin/:serverName/:itemName/:operation', async (request, reply) => {
    return handleItemToggle(request, reply, 'plugins');
  });

  fastify.get('/mod/:serverName/:itemName/:operation', async (request, reply) => {
    return handleItemToggle(request, reply, 'mods');
  });
}

//NO MANEJAMOS NI LECTURA NI DESCARGA YA QUE ESO SE ENCARGA OTRO MODULO ROUTER
export default pluginModRoutes;