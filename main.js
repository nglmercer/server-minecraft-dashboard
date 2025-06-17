import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import filesRouter from './src/routers/fileManager.js';
import serverRouter from './src/routers/servers.js';
import servermanagerRouter from './src/routers/servers/servermanager.js'
import hardwareRouter from './src/routers/hardware.js';
import networkRouter from './src/routers/networkRouter.js';
import taskRouter from './src/routers/task.js';
import langRouters from './src/routers/langRouters.js';
import coresRouter from './src/routers/minecraft/cores.js';
import javaVersionsRouter from './src/routers/minecraft/javaversions.js';
import pluginMCRouter from './src/routers/minecraft/plugins.js';
import backupsRouter from './src/routers/backup.js';
import uploadRouter from './src/routers/uploadRouter.js';
import fastifyWebsocket from '@fastify/websocket'; 
import WebSocketManager from './src/sockets/ws.js'; 
import { emitter } from './src/sockets/Emitter.js';
//@fastify/multipart
import multipart from '@fastify/multipart';
export async function buildFastify(options = {}) {
  const fastify = Fastify({
      logger: options.logger !== undefined ? options.logger : false, // Permite pasar logger desde index.js
      bodyLimit: 1048576 * 1000, // 1GB limit
      ...options.fastifyOptions // Otras opciones de Fastify
  })
.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
})
.register(fastifyStatic, {
  root: fileURLToPath(new URL('./dist', import.meta.url)),
})

// Register CORS plugin
fastify.register(multipart, {
  attachFieldsToBody: false,
  limits: {
    fieldNameSize: 100, // Max field name size in bytes
    fieldSize: 1024 * 1024 * 50, // Max field value size in bytes (ej: 5MB)
    fields: 10,         // Max number of non-file fields
    fileSize: 1024 * 1024 * 1024 * 10, // 10GB por archivo
    files: 10,           // Max number of file fields
    headerPairs: 2000,  // Max number of header pairs
    parts: 200,        // Max number of parts (fields + files)
  },
  // Para manejar el error de "file too large" específicamente:
  onFileSizeLimit: function (part) {
    // part es el stream del archivo que excedió el límite
    // Importante: DEBES consumir el stream del archivo aquí o el request se colgará.
    // Simplemente drenándolo es una opción.
    fastify.log.warn(`File size limit exceeded for fieldname: ${part.fieldname}, filename: ${part.filename}`);
    part.file.resume();
  },
  // También hay onFieldsLimit, onFilesLimit, onPartsLimit
});
await fastify.register(fastifyWebsocket, {
  options: {
    maxPayload: 1048576, // 1 MiB
    clientTracking: true, // Crucial for .clients to be populated
    // perMessageDeflate: true, // Optional: enable compression
  }
});
// ------------------------------------------------------------------------

// --- Inicialización del WebSocketManager ---
const wsManager = new WebSocketManager(fastify, '/ws');
wsManager.init();
emitter.on('*', (event, data) => {
  console.log("Evento recibido:", event, data);
  wsManager.broadcast({
    event,
    data
  });
});
fastify.register(filesRouter, { prefix: '/api' });
fastify.register(networkRouter, { prefix: '/api/network' });
fastify.register(serverRouter, { prefix: '/api' });
fastify.register(servermanagerRouter,{prefix: '/api/servermanager'})
fastify.register(hardwareRouter, { prefix: '/api' });
fastify.register(taskRouter, { prefix: '/api' });
fastify.register(coresRouter, { prefix: '/api/cores' });
fastify.register(javaVersionsRouter, { prefix: '/api/java' });
fastify.register(pluginMCRouter, { prefix: '/api' });
fastify.register(langRouters, { prefix: '/api' });
fastify.register(backupsRouter, { prefix: '/api/backups' });
fastify.register(uploadRouter, { prefix: '/upload' }); // Register the new router with prefix
return fastify;
}
