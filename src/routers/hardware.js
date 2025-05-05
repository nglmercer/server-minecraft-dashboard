import {
    getResourcesUsage,
    getHardwareInfo
} from '../modules/hardwareManager.js';

export default async function (fastify, options) {
    fastify.get('/hardware/resources', async (request, reply) => {
        const hardwareInfo = await getResourcesUsage();
        
        return reply.status(200).send({ success: true, data: hardwareInfo });
    });

    fastify.get("/hardware/usage", async (request, reply) => {
        const result = await getResourcesUsage();
        return reply.status(200).send({ success: true, data: result });
    });

    // Endpoint para obtener un resumen de la información del hardware
    fastify.get("/hardware/summary", async (request, reply) => {
        const result = await getHardwareInfo();
        return reply.status(200).send({ success: true, data: result });
    });
}
