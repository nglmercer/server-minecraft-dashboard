import { discoveredServers } from '../modules/networkDiscovery.js'; // Asegúrate que la ruta sea correcta

// --- Lógica de inicialización/descubrimiento (se ejecuta una vez cuando se carga el módulo) ---
// Esta parte se mantiene fuera de la función del plugin para que se ejecute
// al iniciar la aplicación, no cada vez que se registra el plugin (aunque usualmente es solo una vez).
// Considera si este es el mejor lugar para esta lógica o si debería estar
// en un módulo de inicialización separado.
let mainConfig = globalThis.mainConfig; // Accede a la configuración global (ver nota abajo)

// El setTimeout original para mostrar los servidores después de 10 segundos
setTimeout(() => {
    // Re-obtener la configuración en caso de que haya cambiado (aunque es improbable en 10s)
    // O mejor aún, pasar la configuración necesaria si es posible.
    mainConfig = globalThis.mainConfig;
    console.log(`Usando configuración: Nombre=${mainConfig?.serverName}, Puerto Web=${mainConfig?.webserverPort}`);

    const serverList = Array.from(discoveredServers.values());
    if (serverList.length > 0) {
        serverList.forEach(server => {
            console.log(`Servidor encontrado al inicio: IP ${server.ip}, Puerto ${server.port}`);
        });
        console.log('Lista inicial de servidores encontrados:', serverList);
    } else {
        console.log('No se encontraron servidores en los primeros 10 segundos.');
    }
}, 10000);
// --- Fin de la lógica de inicialización ---


// --- Definición del Plugin Fastify ---
async function networkRoutes (fastify, options) {

  // Accede a la configuración global.
  // **Nota:** Usar variables globales (`globalThis`) no es ideal.
  // Sería mejor pasar `mainConfig` a través de las opciones del plugin
  // o usar decoradores de Fastify para hacerla accesible (ej: fastify.mainConfig).
  // Pero para una conversión directa, mantenemos el acceso global por ahora.
  const currentMainConfig = globalThis.mainConfig;

  // Ruta GET / (equivalente a /network/ si se registra con ese prefijo)
  fastify.get('/', async (request, reply) => {
    // Asegúrate que mainConfig exista antes de acceder a sus propiedades
    if (!currentMainConfig) {
        reply.code(500).send({ error: 'Server configuration not available.' });
        return;
    }
    return { // Fastify envía objetos como JSON por defecto
      name: currentMainConfig.serverName || 'MC Server',
      port: currentMainConfig.webserverPort,
      version: currentMainConfig.version,
      servers: currentMainConfig.servers
    };
  });

  // Ruta GET /list (equivalente a /network/list si se registra con ese prefijo)
  fastify.get('/list', async (request, reply) => {
    const servers = Array.from(discoveredServers.values());
    const response = {
      servers: servers
    };
    return response; // Fastify envía objetos como JSON por defecto
  });

  // Puedes añadir más rutas aquí si es necesario
  // fastify.post('/', async (request, reply) => { ... });
}

// Exporta la función del plugin
export default networkRoutes;