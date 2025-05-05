import {
    getSpigotVersions,
    getAllMinecraftVersions,
    getVanillaCore,
    getCoreVersions,
    getCoreVersionURL,
    getCoresList
} from '../../minecraft/coredownloader.js'; // Asegúrate que la ruta sea correcta

// --- Definición del Plugin Fastify ---
async function coreRoutes (fastify, options) {

  // GET /cores/spigot (o simplemente /spigot si se registra con prefijo /cores)
  fastify.get('/spigot', async (request, reply) => {
    try {
      const spigotVersions = await getSpigotVersions();
      // Fastify envía esto como JSON con código 200 por defecto
      return { success: true, data: spigotVersions };
    } catch (error) {
      fastify.log.error(`Error en GET /spigot: ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al obtener versiones de Spigot.' });
    }
  });

  // GET /cores/all
  fastify.get('/all', async (request, reply) => {
    try {
      const allVersions = await getAllMinecraftVersions();
      return { success: true, data: allVersions };
    } catch (error) {
      fastify.log.error(`Error en GET /all: ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al obtener todas las versiones de Minecraft.' });
    }
  });

  // GET /cores/vanilla
  fastify.get('/vanilla', async (request, reply) => {
    try {
      const vanillaVersions = await getVanillaCore();
      return { success: true, data: vanillaVersions };
    } catch (error) {
      fastify.log.error(`Error en GET /vanilla: ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al obtener versiones Vanilla.' });
    }
  });

  // GET /cores/:core
  fastify.get('/:core', async (request, reply) => {
    const { core } = request.params;
    // Fastify puede usar esquemas para validación, pero la validación manual es simple aquí
    if (!core) {
      // No debería llegar aquí si la ruta coincide, pero por si acaso o si el core es vacío
      return reply.code(400).send({ success: false, error: "El nombre del core es requerido." });
    }
    try {
      const coreVersions = await getCoreVersions(core);
      // Considera manejar el caso donde getCoreVersions devuelva vacío o null si el core no existe
      if (!coreVersions || (Array.isArray(coreVersions) && coreVersions.length === 0)) {
          return reply.code(404).send({ success: false, error: `Core '${core}' no encontrado o sin versiones.` });
      }
      return { success: true, data: coreVersions };
    } catch (error) {
      fastify.log.error(`Error en GET /:core (${core}): ${error.message}`);
       // Podrías intentar detectar errores específicos (ej. 'Core not found')
      reply.code(500).send({ success: false, error: `Error al obtener versiones para el core '${core}'.` });
    }
  });

  // GET /cores/:core/:version
  fastify.get('/:core/:version', async (request, reply) => {
    const { core, version } = request.params;
    if (!core || !version) {
       // Similar al anterior, la ruta requiere ambos, pero es buena práctica validar
      return reply.code(400).send({ success: false, error: "Todos los campos son requeridos: core, version." });
    }
    try {
      const coreVersionURL = await getCoreVersionURL(core, version);
      // Manejar caso donde la URL no se encuentre
       if (!coreVersionURL) {
           return reply.code(404).send({ success: false, error: `URL no encontrada para core '${core}', versión '${version}'.` });
       }
      return { success: true, data: coreVersionURL };
    } catch (error) {
      fastify.log.error(`Error en GET /:core/:version (${core}/${version}): ${error.message}`);
      reply.code(500).send({ success: false, error: `Error al obtener la URL para '${core}' versión '${version}'.` });
    }
  });

  // GET /cores (o simplemente / si se registra con prefijo /cores)
  fastify.get('/', async (request, reply) => {
    try {
      const coresList = await getCoresList();
      return { success: true, data: coresList };
    } catch (error) {
      fastify.log.error(`Error en GET / (cores list): ${error.message}`);
      reply.code(500).send({ success: false, error: 'Error al obtener la lista de cores.' });
    }
  });

}

// Exporta la función del plugin
export default coreRoutes;