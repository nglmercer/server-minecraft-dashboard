// src/routers/networkRouter.js
import { peerManager } from '../p2p/peerManager.js';
import { connectToPeer, sendMessage } from '../p2p/communication.js';
// Necesitaremos el instanceName y el p2pPort de nuestra propia instancia P2P
// Lo obtendremos de fastify.p2pInfo que decoraremos en index.js

export default async function networkRouter(fastify, options) {
    fastify.get('/peers', async (request, reply) => {
        const peers = peerManager.getAllPeers().map(p => ({
            name: p.name,
            host: p.host,
            port: p.port,
            fqdn: p.fqdn,
            txt: p.txt || {}
        }));
        return { peers };
    });

    fastify.post('/peers/:peerName/send', async (request, reply) => {
        const { peerName } = request.params;
        const { message } = request.body; // Asume JSON: { "message": "Hola" }

        if (!message || typeof message !== 'string') {
            return reply.code(400).send({ error: 'El campo "message" (string) es requerido en el body.' });
        }

        const peer = peerManager.getPeerByName(peerName);
        if (!peer) {
            return reply.code(404).send({ error: `Peer "${peerName}" no encontrado.` });
        }

        try {
            const { instanceName: localInstanceName } = fastify.p2pInfo; // Obtenido de la decoración
            const socket = await connectToPeer(peer);
            const messagePayload = {
                senderInstanceName: localInstanceName,
                text: message,
                timestamp: new Date().toISOString()
            };
            if (sendMessage(socket, messagePayload)) {
                return { success: true, message: `Mensaje enviado a ${peer.name}.` };
            } else {
                return reply.code(500).send({ error: 'Fallo al enviar mensaje, el socket podría estar cerrado.' });
            }
        } catch (error) {
            fastify.log.error(`Error enviando mensaje a ${peer.name}: ${error.message}`);
            return reply.code(500).send({ error: `No se pudo enviar el mensaje: ${error.message}` });
        }
    });

    fastify.get('/info', async (request, reply) => {
        const { instanceName, p2pPort } = fastify.p2pInfo;
        return {
            p2pInstanceName: instanceName,
            p2pTcpPort: p2pPort,
            apiHost: fastify.server.address().address,
            apiPort: fastify.server.address().port
        };
    });
}