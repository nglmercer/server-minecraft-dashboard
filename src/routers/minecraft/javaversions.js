import {
    // Importa solo lo que necesitas dentro de este archivo
    getLocalJavaVersions,
    getDownloadableJavaVersions,
    // Mantén las otras importaciones si otras rutas en este archivo las necesitarán
    gameVersionToJava,
    isTermux,
    getArchitecture,
    installJavaTermux,
    checkJavaVersionTermux,
    getJavaInfoByVersion,
    getJavaPath,
    verifyJavaInstallation,
    prepareJavaForServer,
    isJavaVersionCompatible,
    generateserverrequirements
} from '../../minecraft/javaManager.js'; // Verifica la ruta

// La función helper puede permanecer fuera o dentro del plugin
// si no necesita acceso a 'fastify' u 'options'.
// Es asíncrona y las funciones que llama también lo son.
async function mapallJavaInfo() {
    // Retorna un objeto con versiones instaladas y disponibles
    return {
        installed: await getLocalJavaVersions(),
        available: await getDownloadableJavaVersions()
    };
}

// --- Definición del Plugin Fastify ---
async function javaRoutes(fastify, options) {

  // Ruta GET /java/all (o solo /all si se registra con prefijo /java)
  fastify.get('/all', async (request, reply) => {
    try {
      // Llama a la función helper asíncrona
      const javaVersions = await mapallJavaInfo();

      // Usa el logger de Fastify si está habilitado
      fastify.log.info("javaVersions", javaVersions);

      // Retorna el objeto; Fastify lo envía como JSON con código 200
      return { success: true, data: javaVersions };

    } catch (error) {
      // Captura cualquier error de las funciones internas o de mapallJavaInfo
      fastify.log.error('Error al obtener información de versiones Java:', error);

      // Envía una respuesta de error genérica al cliente
      reply.code(500).send({ success: false, error: 'Error interno al obtener las versiones de Java.' });
    }
  });

  // --- Puedes añadir más rutas relacionadas con Java aquí ---
  // Ejemplo:
  // fastify.get('/path/:version', async (request, reply) => {
  //   try {
  //     const version = request.params.version;
  //     const path = await getJavaPath(version); // Asume que getJavaPath es async
  //     if (!path) {
  //       return reply.code(404).send({ success: false, error: `Java version ${version} not found or path not available.` });
  //     }
  //     return { success: true, data: { path } };
  //   } catch (error) {
  //     fastify.log.error(`Error getting path for Java ${request.params.version}:`, error);
  //     reply.code(500).send({ success: false, error: 'Error getting Java path.' });
  //   }
  // });

}

// Exporta la función del plugin
export default javaRoutes;