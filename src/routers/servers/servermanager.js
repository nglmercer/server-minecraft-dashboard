import {
    manager,
    MinecraftServer,
    ServerManager
} from "../../minecraft/servermanager.js"; 
import { serverPathBase } from '../../fileutils.js';
import path from 'path';

function getreqData(req, keys) {
    const data = {};
    keys.forEach(key => {
        data[key] = req.body?.[key] ?? req.params?.[key] ?? req.query?.[key] ?? null;
    });
    return data;
}
const validActions = ['start', 'stop', 'restart', 'send', 'sendMultiple', 'log', 'info', 'players', 'metrics', 'kill'];

async function serverManagementRoutes(fastify, options) {
    const serversBaseDir = serverPathBase;
    // prefix: '/servermanager'
    fastify.get('/:serverName/:action', async (req, reply) => {
        const { serverName, action } = req.params;
        if (!serverName || !action) {
            return reply.code(400).send({ success: false, error: "El nombre del servidor y la acción son requeridos." });
        }
        const cmd = req.query.cmd;
        const cmdArray = req.query.cmds ? JSON.parse(req.query.cmds) : null;
        
        if (!validActions.includes(action)) {
            return reply.code(400).send({ success: false, error: "La acción no es válida." });
        }
        
        if (action === 'send' && !cmd) {
            return reply.code(400).send({ success: false, error: "El parámetro 'cmd' es requerido para la acción 'send'." });
        }
        
        if (action === 'sendMultiple' && !cmdArray) {
            return reply.code(400).send({ success: false, error: "El parámetro 'cmds' es requerido para la acción 'sendMultiple'." });
        }
        
        try {
            const serverPath = path.join(serversBaseDir, serverName);
            manager.addServer(serverName, serverPath, { stopCommand: "stop" });
            let data = null;
            let message = `Acción '${action}' ejecutada para el servidor '${serverName}'.`;
            
            switch (action) {
                case 'start':
                    await manager.startServer(serverName);
                    break;
                case 'stop':
                    await manager.stopServer(serverName);
                    break;
                case 'restart':
                    await manager.sendCommand(serverName, "stop");
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await manager.startServer(serverName);
                    break;
                case 'send':
                    await manager.sendCommand(serverName, cmd);
                    message = `Comando '${cmd}' enviado al servidor '${serverName}'.`;
                    break;
                case 'sendMultiple':
                    const sentCommands = [];
                    await Promise.all(
                        cmdArray.map(async (command) => {
                            await manager.sendCommand(serverName, command);
                            sentCommands.push(command);
                        })
                    );
                    message = `Comandos [${sentCommands.join(', ')}] enviados al servidor '${serverName}'.`;
                    data = { sentCommands };
                    break;
                case 'log':
                    data = await manager.getServerLogs(serverName);
                    message = `Logs obtenidos para '${serverName}'.`;
                    break;
                case 'info':
                    data = await manager.getServerStatus(serverName);
                    message = `Estado obtenido para '${serverName}'.`;
                    break;
                case 'players':
                    data = await manager.getServerPlayers(serverName);
                    message = `Jugadores obtenidos para '${serverName}'.`;
                    break;
                case 'metrics':
                    data = await manager.getServerMetrics(serverName);
                    message = `Métricas obtenidas para '${serverName}'.`;
                    break;
                case 'kill':
                    data = await manager.killserver(serverName);
                    message = `Se intentó terminar forzosamente el servidor '${serverName}'.`;
                    break;
            }
            
            return { success: true, message: message, ...(data !== null && { data }) };
        } catch (error) {
            console.error(`Error en /servermanager/${serverName}/${action}: ${error.message}`, error);
            reply.code(500).send({ success: false, error: error.message || `Error al ejecutar la acción '${action}' en el servidor '${serverName}'.` });
        }
    });
    fastify.post('/:serverName/:action', async (req, reply) => {
        const { serverName, action } = req.params;
        if (!serverName || !action) {
            return reply.code(400).send({ success: false, error: "El nombre del servidor y la acción son requeridos." });
        }
        if (!validActions.includes(action)) {
            return reply.code(400).send({ success: false, error: "La acción no es válida." });
        }
        const body = req.body;
        let data = null;
        let message = `Acción POST '${action}' ejecutada para el servidor '${serverName}'.`;
        try {
            const serverPath = path.join(serversBaseDir, serverName);
            manager.addServer(serverName, serverPath, { stopCommand: "stop" });
            switch (action) {
                case 'start':
                    data = await manager.startServer(serverName);
                    break;
                case 'stop':
                    data = await manager.stopServer(serverName);
                    break;
                case 'restart':
                    await manager.sendCommand(serverName, "stop");
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    data = await manager.startServer(serverName);
                    break;
                case 'send':
                    if (!body.cmd) {
                        /*
                        {
                            cmd: "tu_comando"
                        }
                        */
                        return reply.code(400).send({ success: false, error: "El campo 'cmd' es requerido para la acción 'send'." });
                    }
                    data = await manager.sendCommand(serverName, body.cmd);
                    message = `Comando '${body.cmd}' enviado al servidor '${serverName}'.`;
                    break;
                case 'sendMultiple':
                    if (!body.cmds || !Array.isArray(body.cmds)) {
                        return reply.code(400).send({ success: false, error: "El campo 'cmds' debe ser un array para la acción 'sendMultiple'." });
                    }
                    /*
                    {
                        cmds: ["comando1", "comando2", ...]
                    }
                    */
                    const sentCommands = [];
                    await Promise.all(
                        body.cmds.map(async (command) => {
                            await manager.sendCommand(serverName, command);
                            sentCommands.push(command);
                        })
                    );
                    message = `Comandos [${sentCommands.join(', ')}] enviados al servidor '${serverName}'.`;
                    data = { sentCommands };
                    break;
                case 'log':
                    data = await manager.getServerLogs(serverName);
                    message = `Logs obtenidos para '${serverName}'.`;
                    break;
                case 'info':
                    data = await manager.getServerStatus(serverName);
                    message = `Estado obtenido para '${serverName}'.`;
                    break;
                case 'players':
                    data = await manager.getServerPlayers(serverName);
                    message = `Jugadores obtenidos para '${serverName}'.`;
                    break;
                case 'metrics':
                    data = await manager.getServerMetrics(serverName);
                    message = `Métricas obtenidas para '${serverName}'.`;
                    break;
                case 'kill':
                    data = await manager.killserver(serverName);
                    message = `Se intentó terminar forzosamente el servidor '${serverName}'.`;
                    break;
            }
            return { success: true, message: message, ...(data !== null && { data }) };

        } catch (error) {
            console.error(`Error en /servermanager/${serverName}/${action}: ${error.message}`, error);
            reply.code(500).send({ success: false, error: error.message || `Error al ejecutar la acción '${action}' en el servidor '${serverName}'.` });
        }
    });
}

export default serverManagementRoutes;