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

const fastify = Fastify({
  logger: true
});

// Register CORS plugin
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// Register routes
fastify.register(authRouter, { prefix: '/auth' });
fastify.register(dicoverRouter, { prefix: '/network' });
fastify.register(filesRouter, { prefix: '/api' });
fastify.register(serverRouter, { prefix: '/api' });
fastify.register(hardwareRouter, { prefix: '/api' });
fastify.register(taskRouter, { prefix: '/api' });
fastify.register(coresRouter, { prefix: '/api' });
fastify.register(javaVersionsRouter, { prefix: '/api' });
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
