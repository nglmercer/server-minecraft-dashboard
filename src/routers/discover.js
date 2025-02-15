import express from 'express';
import { discoveredServers } from '../modules/networkDiscovery.js';

const router = express.Router();
let mainConfig = globalThis.mainConfig;
router.get('/', (req, res) => {
    res.json({
        name: mainConfig.serverName || 'Kubek Server',
        port: mainConfig.webserverPort,
        version: globalThis.kubekVersion,
        servers: mainConfig.servers
    });
});

router.get('/list', (req, res) => {
    const servers = Array.from(discoveredServers.values());    
    // Combinar datos
    const response = {
        servers: servers
    };
    
    res.json(response);
});
setTimeout(() => {
    const server = Array.from(discoveredServers.values());
    server.forEach(server => {
        console.log(`Servidor encontrado: IP ${server.ip}, Puerto ${server.port}`);
    });
    console.log('Lista de servidores encontrados:', server);
}, 10000);
export default router;