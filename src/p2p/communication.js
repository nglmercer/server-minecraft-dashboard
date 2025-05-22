// communication.js
import net from 'net';
import { P2P_MESSAGE_DELIMITER } from '../../config.js';

// Sockets de clientes conectados A ESTE servidor
const serverClients = new Map(); // key: socketId (ej. remoteAddress:remotePort), value: socket

// Conexiones salientes iniciadas POR ESTE cliente
const outgoingConnections = new Map(); // key: peerFqdn, value: socket

function generateSocketId(socket) {
    return `${socket.remoteAddress}:${socket.remotePort}`;
}

export function createTcpServer(onDataCallback, onClientConnected, onClientDisconnected) {
    const server = net.createServer((socket) => {
        const socketId = generateSocketId(socket);
        console.log(`[TCP Server] Cliente conectado: ${socketId}`);
        serverClients.set(socketId, socket);

        if (onClientConnected) {
            onClientConnected(socket, socketId);
        }

        let P_END_BUFFER = ""; // Buffer para mensajes parciales
        socket.on('data', (data) => {
            P_END_BUFFER += data.toString('utf8');
            let delimiterIndex;
            while ((delimiterIndex = P_END_BUFFER.indexOf(P2P_MESSAGE_DELIMITER)) > -1) {
                const jsonString = P_END_BUFFER.substring(0, delimiterIndex);
                P_END_BUFFER = P_END_BUFFER.substring(delimiterIndex + P2P_MESSAGE_DELIMITER.length);
                if (jsonString) {
                    try {
                        const message = JSON.parse(jsonString);
                        if (onDataCallback) {
                            onDataCallback(socket, message, socketId);
                        }
                    } catch (e) {
                        console.error(`[TCP Server] Error parseando JSON de ${socketId}:`, e.message);
                        console.error(`[TCP Server] Datos crudos recibidos: ${jsonString}`);
                    }
                }
            }
        });

        socket.on('end', () => {
            console.log(`[TCP Server] Cliente desconectado (end): ${socketId}`);
            serverClients.delete(socketId);
            if (onClientDisconnected) {
                onClientDisconnected(socket, socketId);
            }
        });

        socket.on('error', (err) => {
            console.error(`[TCP Server] Error en socket de ${socketId}:`, err.message);
            // 'close' se llamará después, así que no es necesario limpiar aquí
        });

        socket.on('close', (hadError) => {
            console.log(`[TCP Server] Conexión de cliente cerrada (${hadError ? 'con error' : 'normal'}): ${socketId}`);
            if (serverClients.has(socketId)) {
                serverClients.delete(socketId);
                if (onClientDisconnected) { // Asegurarse que se llame si 'end' no lo hizo
                    onClientDisconnected(socket, socketId);
                }
            }
        });
    });

    return new Promise((resolve, reject) => {
        server.listen(0, () => { // Puerto 0 para que el SO asigne uno libre
            const address = server.address();
            if (address && typeof address !== 'string') {
                console.log(`[TCP Server] Escuchando en ${address.address || '0.0.0.0'}:${address.port}`);
                resolve({ server, port: address.port });
            } else {
                reject(new Error('No se pudo obtener la dirección del servidor.'));
            }
        });
        server.on('error', (err) => {
            console.error('[TCP Server] Error de servidor:', err);
            reject(err);
        });
    });
}

export function connectToPeer(peer) { // peer es el objeto servicio de mDNS
    const peerFqdn = peer.fqdn;

    if (outgoingConnections.has(peerFqdn)) {
        const existingSocket = outgoingConnections.get(peerFqdn);
        // Comprobar si el socket sigue siendo válido (no destruido y abierto)
        if (existingSocket && !existingSocket.destroyed && existingSocket.readyState === 'open') {
            console.log(`[TCP Client] Reutilizando conexión existente a ${peer.name} (${peerFqdn})`);
            return Promise.resolve(existingSocket);
        } else {
            console.log(`[TCP Client] Conexión previa a ${peer.name} no válida, reconectando.`);
            outgoingConnections.delete(peerFqdn); // Limpiar conexión antigua
        }
    }

    return new Promise((resolve, reject) => {
        console.log(`[TCP Client] Intentando conectar a ${peer.name} (${peer.host}:${peer.port})`);
        const socket = net.createConnection({ host: peer.host, port: peer.port }, () => {
            console.log(`[TCP Client] Conectado a ${peer.name} (${peerFqdn})`);
            outgoingConnections.set(peerFqdn, socket);
            resolve(socket);
        });

        // Es importante manejar eventos en el socket cliente también, aunque aquí no pongamos onData por defecto
        socket.on('error', (err) => {
            console.error(`[TCP Client] Error de conexión con ${peer.name} (${peerFqdn}):`, err.message);
            outgoingConnections.delete(peerFqdn);
            reject(err); // Rechazar la promesa original si falla la conexión inicial
        });

        socket.on('close', () => {
            console.log(`[TCP Client] Conexión cerrada con ${peer.name} (${peerFqdn})`);
            outgoingConnections.delete(peerFqdn);
        });

        socket.on('end', () => {
            console.log(`[TCP Client] Conexión finalizada por ${peer.name} (${peerFqdn})`);
            // 'close' se llamará después
        });
    });
}

export function sendMessage(socket, messageObject) {
    if (!socket || socket.destroyed || !socket.writable) {
        console.error('[TCP] No se puede enviar mensaje: Socket no escribible o destruido.');
        return false;
    }
    try {
        const jsonString = JSON.stringify(messageObject);
        socket.write(jsonString + P2P_MESSAGE_DELIMITER);
        return true;
    } catch (e) {
        console.error('[TCP] Error serializando mensaje:', e);
        return false;
    }
}

export function closeAllConnections() {
    console.log('[TCP] Cerrando todas las conexiones de clientes del servidor...');
    serverClients.forEach(socket => socket.destroy());
    serverClients.clear();

    console.log('[TCP] Cerrando todas las conexiones salientes...');
    outgoingConnections.forEach(socket => socket.destroy());
    outgoingConnections.clear();
}