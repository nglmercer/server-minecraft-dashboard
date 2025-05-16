import {
    createserverfolder,
    createserverfile,
    createsubfolder,
    getfolderinfo,
    updatefolderinfo,
    getallfolderinfo,
    existsfolder,
    getFileInfo,
    ServerStore
} from '../modules/fileFolderRegistry.js'; 
import {
    manager,
    MinecraftServer,
    ServerManager
} from "../minecraft/servermanager.js"; 
import { startJavaServerGeneration, startJavaServerbyFile } from "../minecraft/createserver.js"; 
import { PathUtils } from '../fileutils.js';
import path from 'path';

function getreqData(req, keys) {
    const data = {};
    keys.forEach(key => {
        data[key] = req.body?.[key] ?? req.params?.[key] ?? req.query?.[key] ?? null;
    });
    return data;
}

async function serverManagementRoutes(fastify, options) {
    const serversBaseDir = path.resolve(process.cwd(), 'servers');

    fastify.get('/servers', async (req, reply) => {
        try {
            const servers = getallfolderinfo();
    
            if (servers.files) {
                servers.files.forEach(server => {
                    try {
                        updatefolderinfo(server.name);
                    } catch (updateError) {
                        console.error(`Error actualizando info para ${server.name}: ${updateError.message}`);
                    }
                });
            }
    
            // ServerStore.store = objetos de servidores adicionales
            const mapServers = Object.entries(ServerStore.store).map(([key, value]) => ({
                name: key,
                ...value
            }));
    
            // Crear un mapa para evitar duplicados por `name`
            const mergedFilesMap = new Map();
    
            // Agregar primero los de servers.files
            servers.files?.forEach(file => {
                mergedFilesMap.set(file.name, file);
            });
    
            // Agregar o reemplazar con los de mapServers
            mapServers.forEach(server => {
                mergedFilesMap.set(server.name, server);
            });
    
            const ServersData = {
                ...servers,
                files: Array.from(mergedFilesMap.values())
            };
    
            return { success: true, data: ServersData, message: ServerStore.store };
        } catch (error) {
            console.error(`Error en GET /servers: ${error.message}`);
            reply.code(500).send({ success: false, error: 'Error al obtener la lista de servidores.' });
        }
    });
    

    fastify.get('/servers/:serverName', async (req, reply) => {
        const { serverName } = req.params;
        if (!serverName) {
            return reply.code(400).send({ success: false, error: "El nombre del servidor es requerido." });
        }
        try {
            const serverInfo = getfolderinfo(serverName);
            return { success: true, data: serverInfo };
        } catch (error) {
            console.error(`Error en GET /servers/${serverName}: ${error.message}`);
            if (error.message.includes("not found")) {
                reply.code(404).send({ success: false, error: 'Servidor no encontrado.' });
            } else {
                reply.code(500).send({ success: false, error: 'Error al obtener información del servidor.' });
            }
        }
    });

    fastify.get('/servers/:serverName/log', async (req, reply) => {
        const { serverName } = req.params;
        try {
            const fileInfo = getFileInfo(serverName, "logs/latest.log");
            return { success: true, data: fileInfo };
        } catch (error) {
            console.error(`Error en GET /servers/${serverName}/log: ${error.message}`);
            if (error.message.includes("not found")) {
                reply.code(404).send({ success: false, error: 'Archivo de log no encontrado o servidor inexistente.' });
            } else {
                reply.code(500).send({ success: false, error: 'Error al obtener el log del servidor.' });
            }
        }
    });

    fastify.get('/servers/:serverName/:fileName', async (req, reply) => {
        const { serverName, fileName } = req.params;
        if (!fileName) {
            return reply.code(400).send({ success: false, error: "El nombre del archivo es requerido." });
        }
        
        if (fileName.includes('..') || fileName.startsWith('/')) {
            return reply.code(400).send({ success: false, error: "Nombre de archivo inválido." });
        }

        try {
            const fileInfo = await getFileInfo(serverName, fileName);
            console.log("fileInfo", "fileName",{
                fileName,
                fileInfo
            });
            return { success: true, data: fileInfo };
        } catch (error) {
            console.error(`Error en GET /servers/${serverName}/${fileName}: ${error.message}`);
            if (error.message.includes("not found")) {
                reply.code(404).send({ success: false, error: 'Archivo no encontrado o servidor inexistente.' });
            } else {
                reply.code(500).send({ success: false, error: 'Error al obtener información del archivo.' });
            }
        }
    });

    fastify.post('/createserver', async (req, reply) => {
        const keys = ["serverName", "core", "coreVersion", "startParameters", "javaVersion", "port", "fileName", "formData"];
        const reqData = getreqData(req, keys);
        const { serverName, core, coreVersion, startParameters, javaVersion, port, formData } = reqData;

        if (!serverName || !core || !startParameters || !javaVersion || !port) {
            console.warn('Faltan campos requeridos en /createserver', { received: reqData });
            return reply.code(400).send({
                success: false,
                error: "Campos requeridos: serverName, core, startParameters, javaVersion, port."
            });
        }

        const mapedServerInfo = {
            existsfolder: existsfolder(serverName),
            fileName: formData?.fileName || `${core}-${coreVersion}.jar`,
            core,
            coreVersion,
            startParameters,
            javaVersion,
            port,
            serverPort: port,
            serverName
        };

        try {
            if (formData) {
                console.info(`Creando servidor ${serverName} usando core subido: ${mapedServerInfo.fileName}`);
                
                const serverResult = await new Promise((resolve, reject) => {
                    startJavaServerbyFile(mapedServerInfo, (result) => {
                        if (result) {
                            if (result.success === false) {
                                console.error(`Error (callback) al crear servidor con archivo ${serverName}: ${result.error}`);
                                reject(new Error(result.error || 'Error reportado por startJavaServerbyFile'));
                            } else {
                                resolve(result);
                            }
                        } else {
                            console.error(`Error inesperado (callback vacío) al crear servidor con archivo ${serverName}`);
                            reject(new Error('Error desconocido durante la creación del servidor (callback vacío).'));
                        }
                    });
                });
                return { success: true, data: mapedServerInfo, message: serverResult };

            } else if (!mapedServerInfo.existsfolder) {
                console.info(`Iniciando generación y descarga para servidor ${serverName} (core: ${mapedServerInfo.core})`);
                
                new Promise((resolve, reject) => {
                    startJavaServerGeneration(mapedServerInfo, result => {
                        if (result) {
                            console.info(`Generación de servidor ${serverName} completada (o en progreso).`);
                            resolve(result);
                        } else {
                            console.error(`Error en la generación de servidor ${serverName} (callback).`);
                            reject(new Error('Error durante la generación del servidor (callback).'));
                        }
                    });
                }).catch(err => {
                    console.error(`Error en background de startJavaServerGeneration para ${serverName}: ${err.message}`);
                });

                return {
                    success: true,
                    data: mapedServerInfo,
                    message: "Solicitud de creación de servidor recibida. La descarga y configuración se ejecutan en segundo plano."
                };

            } else {
                console.info(`Intento de crear servidor ${serverName}, pero ya existe.`);
                return {
                    success: true,
                    data: mapedServerInfo,
                    message: "El servidor ya existe."
                };
            }
        } catch (error) {
            console.error(`Error general en POST /createserver para ${serverName}: ${error.message}`, error);
            reply.code(500).send({ success: false, error: error.message || 'Error interno al procesar la creación del servidor.' });
        }
    });

    fastify.post('/newserver', async (req, reply) => {
        try {
            if (!req.body || !req.body.jsonData || typeof req.body.jsonData.value !== 'string') {
                return reply.status(400).send({
                    message: 'El campo jsonData es requerido y debe contener un string en su propiedad .value.',
                    data: typeof req.body.jsonData.value
                });
            }
            
            const jsonDataString = req.body.jsonData.value;
            let parsedJsonData;
    
            try {
                parsedJsonData = JSON.parse(jsonDataString);
            } catch (e) {
                console.error('Error parseando jsonData.value:', e);
                return reply.status(400).send({
                    message: 'El campo jsonData.value no contiene un JSON válido.',
                    error: e.message
                });
            }
    
            const {
                serverName,
                javaVersion,
                serverPort,
                coreName,
                startParameters,
                fileName,
                coreVersion
            } = parsedJsonData;    
            const fileData = req.body.file;

            const serverConfig = {
                serverName,
                javaVersion: parseInt(javaVersion, 10),
                serverPort: parseInt(serverPort, 10),
                startParameters,
                fileName: fileData?.filename || fileName || `${coreName}-${coreVersion}.jar`,
                coreName,
                coreVersion
            };
            
            const isnotvalid = [];
            
            Object.entries(serverConfig).forEach(([key, value]) => {
                if ((key !== 'fileName' || key !== 'coreVersion')){
                    return;
                }
                if (!value) {
                    isnotvalid.push({ key, value });
                }
            });
            
            const serverPath = path.join(PathUtils.serverPath, serverConfig.serverName);
            const isValidServerPath = PathUtils.isValidDirectoryName(serverPath);
            
            if (!isValidServerPath) isnotvalid.push({ key: 'Directorio(serverPath)', value: {serverConfig,isValidServerPath} });
            if (!fileData && !coreVersion){
                isnotvalid.push({ key: 'Archivo(fileData) || Version(coreVersion)', value: coreVersion });
            }
            
            if (isnotvalid.length > 0) {
                console.warn('Faltan campos requeridos en /newserver', isnotvalid);
                return reply.code(400).send({
                    success: false,
                    error: "Campos requeridos: " + isnotvalid.map(i => i.key).join(', '),
                    data: isnotvalid
                });
            }

            console.info('Configuración final a procesar:', serverConfig,{ isValidServerPath, serverPath});

            if (fileData && (!coreVersion || !coreName)) {
                const fileBuffer = await fileData.toBuffer();
                createserverfile(serverConfig.serverName, serverConfig.fileName, fileBuffer);
                
                const serverResult = await new Promise((resolve, reject) => {
                    startJavaServerbyFile(serverConfig, (result) => {
                        if (result) {
                            if (result.success === false) {
                                console.error(`Error (callback) al crear servidor con archivo ${serverName}: ${result.error}`);
                                reject(new Error(result.error || 'Error reportado por startJavaServerbyFile'));
                            } else {
                                resolve(result);
                            }
                        } else {
                            console.error(`Error inesperado (callback vacío) al crear servidor con archivo ${serverName}`);
                            reject(new Error('Error desconocido durante la creación del servidor (callback vacío).'));
                        }
                    });
                });
                
                return { success: true, data: serverConfig, message: serverResult };
            } else {
                new Promise((resolve, reject) => {
                    startJavaServerGeneration(serverConfig, result => {
                        if (result) {
                            console.info(`Generación de servidor ${serverName} completada (o en progreso).`);
                            resolve(result);
                        } else {
                            console.error(`Error en la generación de servidor ${serverName} (callback).`);
                            reject(new Error('Error durante la generación del servidor (callback).'));
                        }
                    });
                }).catch(err => {
                    console.error(`Error en background de startJavaServerGeneration para ${serverName}: ${err.message}`);
                });
                
                return reply.send({
                    message: 'Servidor configurado exitosamente!',
                    data: serverConfig
                });
            }
            
        } catch (err) {
            console.error('Error en el manejador /newserver:', err);
            if (!reply.sent) {
                reply.status(500).send({ message: 'Error interno del servidor', error: err.message });
            }
        }
    });

    fastify.get('/servermanager/:serverName/:action', async (req, reply) => {
        const { serverName, action } = req.params;
        const cmd = req.query.cmd;

        const validActions = ['start', 'stop', 'restart', 'send', 'log', 'info', 'players', 'metrics', 'kill'];
        if (!validActions.includes(action)) {
            return reply.code(400).send({ success: false, error: "La acción no es válida." });
        }

        if (action === 'send' && !cmd) {
            return reply.code(400).send({ success: false, error: "El parámetro 'cmd' es requerido para la acción 'send'." });
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