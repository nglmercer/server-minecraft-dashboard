// index.js (en la raíz)
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Configuración
import {
    P2P_INSTANCE_NAME_PREFIX,
    API_PORT,
    API_HOST
} from './config.js';

// Lógica P2P
import { peerManager } from './src/p2p/peerManager.js';
import { startDiscovery, stopDiscovery } from './src/p2p/discovery.js';
import {
    createTcpServer,
    closeAllConnections as closeP2PConnections
} from './src/p2p/communication.js';

// Lógica de Fastify
import { buildFastify } from './main.js';

// Emitter global (para puentear eventos P2P a WebSockets si es necesario)
import { emitter } from './src/sockets/Emitter.js';


let p2pTcpServerInstance = null;
let p2pTcpPort = 0; // Puerto en el que escucha el servidor TCP P2P
const p2pInstanceName = `${P2P_INSTANCE_NAME_PREFIX}${os.hostname().replace(/\./g, '_')}_${uuidv4().substring(0, 6)}`;

let fastifyInstance = null;

function handleP2PIncomingMessage(socket, message, socketId) {
    const senderInfo = message.senderInstanceName || `Desconocido(${socketId})`;
    console.log(`[P2P MSG IN] De ${senderInfo}: ${message.text}`);
    // Emitir al sistema global de eventos para que los WebSockets puedan recogerlo
    emitter.emit('p2p_message_received', {
        from: senderInfo,
        message: message.text,
        timestamp: message.timestamp
    });
}

function handleP2PClientConnected(socket, socketId) {
    console.log(`[P2P SYS] Cliente conectado a nuestro servidor TCP: ${socketId}`);
    emitter.emit('p2p_client_connected', { socketId });
}

function handleP2PClientDisconnected(socket, socketId) {
    console.log(`[P2P SYS] Cliente desconectado de nuestro servidor TCP: ${socketId}`);
    emitter.emit('p2p_client_disconnected', { socketId });
}


async function main() {
    console.log(`[MAIN] Iniciando instancia P2P: ${p2pInstanceName}`);

    try {
        // 1. Iniciar servidor TCP P2P para escuchar mensajes entrantes
        const { server, port } = await createTcpServer(
            handleP2PIncomingMessage,
            handleP2PClientConnected,
            handleP2PClientDisconnected
        );
        p2pTcpServerInstance = server;
        p2pTcpPort = port;
        console.log(`[MAIN] Servidor TCP P2P escuchando en el puerto: ${p2pTcpPort}`);

        // 2. Iniciar descubrimiento mDNS (anunciarse y encontrar otros)
        startDiscovery(p2pInstanceName, p2pTcpPort);
        console.log(`[MAIN] Descubrimiento mDNS iniciado para ${p2pInstanceName} en puerto ${p2pTcpPort}`);

        // 3. Construir e iniciar el servidor Fastify
        fastifyInstance = await buildFastify({ logger: true }); // Pasa opciones si es necesario

        // Decorar Fastify con información P2P para que los routers la usen
        fastifyInstance.decorate('p2pInfo', {
            instanceName: p2pInstanceName,
            p2pPort: p2pTcpPort
        });

        await fastifyInstance.listen({ port: API_PORT, host: API_HOST });
        // fastifyInstance.log.info(`Servidor Fastify escuchando en ${fastifyInstance.server.address().address}:${fastifyInstance.server.address().port}`);
        // La línea anterior puede dar error si el logger está desactivado. `buildFastify` ya lo loguea.


        // Conectar eventos de PeerManager al emitter global
        peerManager.on('peerUp', (service) => {
            console.log(`[P2P SYS] Peer ARRIBA: ${service.name}`);
            emitter.emit('p2p_peer_up', { name: service.name, host: service.host, port: service.port, fqdn: service.fqdn });
        });
        peerManager.on('peerDown', (service) => {
            console.log(`[P2P SYS] Peer ABAJO: ${service.name}`);
            emitter.emit('p2p_peer_down', { name: service.name, fqdn: service.fqdn });
        });


    } catch (error) {
        console.error('[MAIN] Fallo al inicializar la aplicación:', error);
        await gracefulShutdown(1);
    }
}

async function gracefulShutdown(exitCode = 0) {
    console.log('\n[MAIN] Cerrando aplicación...');

    // 1. Detener Fastify
    if (fastifyInstance) {
        try {
             fastifyInstance.close();
            console.log('[MAIN] Servidor Fastify cerrado.');
        } catch (err) {
            console.error('[MAIN] Error cerrando Fastify:', err);
        }
    }

    // 2. Detener Descubrimiento P2P
    try {
         stopDiscovery();
    } catch (err) {
        console.error('[MAIN] Error deteniendo descubrimiento P2P:', err);
    }


    // 3. Detener Servidor TCP P2P
    if (p2pTcpServerInstance) {
         new Promise(resolve => {
            p2pTcpServerInstance.close(() => {
                console.log('[MAIN] Servidor TCP P2P cerrado.');
                resolve();
            });
            closeP2PConnections(); // Forzar cierre de sockets P2P
            setTimeout(resolve, 2000); // Timeout por si acaso
        });
    } else {
        closeP2PConnections(); // Si el servidor no se inició, al menos cerrar conexiones salientes
    }

    console.log('[MAIN] Aplicación finalizada.');
    process.exit(exitCode);
}

process.on('SIGINT', () => gracefulShutdown());
process.on('SIGTERM', () => gracefulShutdown());
// process.on('uncaughtException', async (err) => {
// console.error('[MAIN] Excepción no capturada:', err);
// await gracefulShutdown(1);
// });
// process.on('unhandledRejection', async (reason, promise) => {
// console.error('[MAIN] Rechazo de promesa no manejado:', reason);
// await gracefulShutdown(1);
// });


main().catch(async err => {
    console.error("[MAIN] Error no manejado en la ejecución principal:", err);
    await gracefulShutdown(1);
});