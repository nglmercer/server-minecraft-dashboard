import dgram from 'dgram';
import os from 'os';
let mainConfig = {
    webserverPort: 3000,
    serverName: "Minecraft Server",
    version: "1.0.0"
}
const DISCOVERY_PORT = 48899;
const DISCOVERY_MSG = 'discvery_server';
const INTERVAL = 60000;

let discoveredServers = new Map();

function getLocalIPs() {
    return Object.values(os.networkInterfaces())
        .flat()
        .filter(details => details.family === 'IPv4' && !details.internal)
        .map(details => details.address);
}

export function startDiscovery() {
    const socket = dgram.createSocket('udp4');
    const localIPs = getLocalIPs();

    // Agregar el servidor local inmediatamente
    const localInfo = getCurrentServerInfo();
    const localKey = `${localInfo.ip}:${localInfo.port}`;
    discoveredServers.set(localKey, {
        ip: localInfo.ip,
        port: localInfo.port,
        lastSeen: Date.now(),
        isLocal: true // Bandera opcional para identificar local
    });

    socket.on('message', (msg, rinfo) => {
        const message = msg.toString();
        
        if (localIPs.includes(rinfo.address)) return;

        if (message === DISCOVERY_MSG) {
            const response = Buffer.from(`${DISCOVERY_MSG}_RESPONSE`);
            socket.send(response, rinfo.port, rinfo.address);
        } else if (message === `${DISCOVERY_MSG}_RESPONSE`) {
            const serverKey = `${rinfo.address}:${mainConfig.webserverPort}`;
            
            if (!discoveredServers.has(serverKey)) {
                discoveredServers.set(serverKey, {
                    ip: rinfo.address,
                    port: mainConfig.webserverPort,
                    lastSeen: Date.now()
                });
            }
        }
    });


    socket.on('error', (err) => {
        console.error('Discovery error:', err);
    });

    socket.bind(DISCOVERY_PORT, () => {
        socket.setBroadcast(true);
        setInterval(() => {
            socket.send(DISCOVERY_MSG, DISCOVERY_PORT, '255.255.255.255');
            
            // Actualizar servidor local
            const localInfo = getCurrentServerInfo();
            const localKey = `${localInfo.ip}:${localInfo.port}`;
            if (discoveredServers.has(localKey)) {
                discoveredServers.get(localKey).lastSeen = Date.now();
            }
        }, INTERVAL);
    });

    setInterval(() => {
        const now = Date.now();
        for (const [key, server] of discoveredServers) {
            // No eliminar el servidor local
            if (server.isLocal) continue;
            
            if (now - server.lastSeen > INTERVAL * 2) {
                discoveredServers.delete(key);
            }
        }
    }, INTERVAL);
}
export function getCurrentServerInfo() {
    const localIPs = getLocalIPs();
    return {
        ip: localIPs[0], // Usar la primera IP local
        port: mainConfig.webserverPort,
        name: mainConfig.serverName || 'Minecraft Server',
        version: mainConfig.version
    };
}
console.log("getCurrentServerInfo", getCurrentServerInfo());
export { discoveredServers };