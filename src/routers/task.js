import { TASK_MANAGER, addDownloadTask, unpackArchive, getalltasks } from '../modules/taskmanager.js';

async function taskRoutes(fastify, options) {
    fastify.get('/tasks', async (request, reply) => {
        const tasks = getalltasks();
        return reply.status(200).send({ success: true, data: tasks });
    });
}

export default taskRoutes;
