import Fastify from 'fastify';
import cors from '@fastify/cors'
import authRouter from './authRouter.js';
import filesRouter from './routers/fileManager.js';
import serverRouter from './routers/servers.js';
import hardwareRouter from './routers/hardware.js';
import dicoverRouter from './routers/discover.js';
import taskRouter from './routers/task.js';
import langRouters from './routers/langRouters.js';
import coresRouter from './routers/minecraft/cores.js';
import javaVersionsRouter from './routers/minecraft/javaversions.js';
import pluginMCRouter from './routers/minecraft/plugins.js';
import backupsRouter from './routers/backup.js';
//@fastify/multipart
import multipart from '@fastify/multipart';
const fastify = Fastify({
  logger: true
});

// Register CORS plugin
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});
fastify.register(multipart, {
  attachFieldsToBody: true,
  limits: {
    fieldNameSize: 100, // Max field name size in bytes
    fieldSize: 1024 * 1024 * 50, // Max field value size in bytes (ej: 5MB)
    fields: 10,         // Max number of non-file fields
    fileSize: 1024 * 1024 * 500, // Max file size in bytes (ej: 100MB) - ¡AUMENTA ESTE!
    files: 5,           // Max number of file fields
    headerPairs: 5000,  // Max number of header pairs
    parts: 2000,        // Max number of parts (fields + files)
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
// Register routes
fastify.register(authRouter, { prefix: '/auth' });
fastify.register(dicoverRouter, { prefix: '/network' });
fastify.register(filesRouter, { prefix: '/api' });
fastify.register(serverRouter, { prefix: '/api' });
fastify.register(hardwareRouter, { prefix: '/api' });
fastify.register(taskRouter, { prefix: '/api' });
fastify.register(coresRouter, { prefix: '/api/cores' });
fastify.register(javaVersionsRouter, { prefix: '/api/java' });
fastify.register(pluginMCRouter, { prefix: '/api' });
fastify.register(langRouters, { prefix: '/api' });
fastify.register(backupsRouter, { prefix: '/api/backups' });

// Start server
const start = async () => {
  try {
    await fastify.listen({port:process.env.PORT || 3000});
    console.log(`Servidor corriendo en http://localhost:${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
