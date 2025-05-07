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
} from '../modules/fileFolderRegistry.js'; // Verifica la ruta
import {
    manager,
    MinecraftServer, // Aunque no se use directamente aquí, lo mantenemos por si acaso
    ServerManager // Igual que arriba
} from "../minecraft/servermanager.js"; // Verifica la ruta
import { startJavaServerGeneration, startJavaServerbyFile } from "../minecraft/createserver.js"; // Verifica la ruta
import path from 'path'; // Útil para construir rutas de forma segura

// La función getRequestData se puede mantener o integrar su lógica directamente
// La mantenemos aquí por simplicidad en la conversión inicial
function getRequestData(request, keys) {
    const data = {};
    keys.forEach(key => {
        // En Fastify, el body, params y query están directamente en el objeto request
        data[key] = request.body?.[key] ?? request.params?.[key] ?? request.query?.[key] ?? null;
    });
    return data;
}


// --- Definición del Plugin Fastify ---
async function serverManagementRoutes(fastify, options) {

    const serversBaseDir = path.resolve(process.cwd(), 'servers'); // Define el directorio base de servidores

    // GET /servers (list all servers)
    fastify.get('/servers', async (request, reply) => {
        try {
            const servers = getallfolderinfo();
            // console.log("servers", servers); // Descomenta si necesitas depurar

            // La lógica de actualizar al obtener la lista se mantiene
            if (servers.files) {
                servers.files.forEach(server => {
                    try {
                        // Es buena idea envolver esto en try/catch por si falla la actualización de uno
                        updatefolderinfo(server.name);
                    } catch (updateError) {
                        fastify.log.error(`Error actualizando info para ${server.name}: ${updateError.message}`);
                        // Decide si continuar o devolver un error parcial
                    }
                });
            }
            // Retorna el objeto JSON, Fastify lo enviará con código 200
            return { success: true, data: servers, message: ServerStore.store };
        } catch (error) {
            fastify.log.error(`Error en GET /servers: ${error.message}`);
            reply.code(500).send({ success: false, error: 'Error al obtener la lista de servidores.' });
        }
    });

    // GET /servers/:serverName (get specific server info)
    fastify.get('/servers/:serverName', async (request, reply) => {
        const { serverName } = request.params;
        if (!serverName) {
            // El esquema de Fastify podría manejar esto, pero mantenemos la validación manual por ahora
            return reply.code(400).send({ success: false, error: "El nombre del servidor es requerido." });
        }
        try {
            const serverInfo = getfolderinfo(serverName); // Asume que lanza error si no existe
            return { success: true, data: serverInfo };
        } catch (error) {
            fastify.log.error(`Error en GET /servers/${serverName}: ${error.message}`);
            // Diferenciar si el error es "no encontrado" vs "error interno" sería mejor
            if (error.message.includes("not found")) { // Ajusta esto según el error real de getfolderinfo
                reply.code(404).send({ success: false, error: 'Servidor no encontrado.' });
            } else {
                reply.code(500).send({ success: false, error: 'Error al obtener información del servidor.' });
            }
        }
    });

    // GET /servers/:serverName/log (get latest log)
    fastify.get('/servers/:serverName/log', async (request, reply) => {
        const { serverName } = request.params;
        // No necesitas verificar serverName de nuevo si la ruta coincide
        try {
            // Asume que getFileInfo necesita el nombre del servidor y la ruta relativa al archivo
            // ¡Importante! Asegúrate que getFileInfo previene Path Traversal
            const fileInfo = getFileInfo(serverName, "logs/latest.log");
            return { success: true, data: fileInfo };
        } catch (error) {
            fastify.log.error(`Error en GET /servers/${serverName}/log: ${error.message}`);
            if (error.message.includes("not found")) { // Ajusta esto según el error real
                reply.code(404).send({ success: false, error: 'Archivo de log no encontrado o servidor inexistente.' });
            } else {
                reply.code(500).send({ success: false, error: 'Error al obtener el log del servidor.' });
            }
        }
    });

    // GET /servers/:serverName/:fileName (get specific file info)
    fastify.get('/servers/:serverName/:fileName', async (request, reply) => {
        const { serverName, fileName } = request.params;
        // Podrías añadir validación/sanitización para fileName aquí también
        if (!fileName) {
            return reply.code(400).send({ success: false, error: "El nombre del archivo es requerido." });
        }
        // *** ¡ALERTA DE SEGURIDAD! ***
        // Es CRUCIAL sanitizar `fileName` para prevenir Path Traversal.
        // No permitas '..' o '/' al inicio. Idealmente, valida contra una lista de archivos permitidos
        // o asegúrate que `getFileInfo` maneje esto internamente de forma segura.
        if (fileName.includes('..') || fileName.startsWith('/')) {
            return reply.code(400).send({ success: false, error: "Nombre de archivo inválido." });
        }

        try {
            const fileInfo = getFileInfo(serverName, fileName);
            return { success: true, data: fileInfo };
        } catch (error) {
            fastify.log.error(`Error en GET /servers/${serverName}/${fileName}: ${error.message}`);
            if (error.message.includes("not found")) { // Ajusta esto
                reply.code(404).send({ success: false, error: 'Archivo no encontrado o servidor inexistente.' });
            } else {
                reply.code(500).send({ success: false, error: 'Error al obtener información del archivo.' });
            }
        }
    });

    // POST /createserver
    fastify.post('/createserver', async (request, reply) => {
        const keys = ["serverName", "core", "coreVersion", "startParameters", "javaVersion", "port", "fileName", "formData", "version"];
        const requestData = getRequestData(request, keys);
        const { serverName, core, coreVersion, startParameters, javaVersion, port, formData, version } = requestData;

        if (!serverName || !core || !startParameters || !javaVersion || !port) {
            fastify.log.warn('Faltan campos requeridos en /createserver', { received: requestData });
            return reply.code(400).send({
                success: false,
                error: "Campos requeridos: serverName, core, startParameters, javaVersion, port." // coreVersion puede venir de 'version'
            });
        }

        const mapedServerInfo = {
            existsfolder: existsfolder(serverName), // Llama a la función importada
            fileName: formData?.fileName || `${core}-${coreVersion || version}.jar`, // Usa optional chaining y coalescing
            core: core,
            coreVersion: coreVersion || version,
            startParameters: startParameters,
            javaVersion: javaVersion,
            port: port,
            serverPort: port, // Parece redundante, pero mantenemos la estructura original
            serverName: serverName
        };

        try {
            if (formData) {
                fastify.log.info(`Creando servidor ${serverName} usando core subido: ${mapedServerInfo.fileName}`);
                // --- Manejo de Callback ---
                // Si startJavaServerbyFile es async y devuelve una promesa, puedes hacer:
                // const serverResult = await startJavaServerbyFile(mapedServerInfo);
                // return { success: true, data: mapedServerInfo, message: serverResult };

                // Si usa un callback como en Express: necesitamos envolverlo en una Promesa
                const serverResult = await new Promise((resolve, reject) => {
                    startJavaServerbyFile(mapedServerInfo, (result) => {
                        if (result) { // Asume que `result` contiene la data de éxito o un objeto de error
                            if (result.success === false) { // Si la función de callback indica un error conocido
                                fastify.log.error(`Error (callback) al crear servidor con archivo ${serverName}: ${result.error}`);
                                reject(new Error(result.error || 'Error reportado por startJavaServerbyFile'));
                            } else {
                                resolve(result);
                            }
                        } else {
                            fastify.log.error(`Error inesperado (callback vacío) al crear servidor con archivo ${serverName}`);
                            reject(new Error('Error desconocido durante la creación del servidor (callback vacío).'));
                        }
                    });
                });
                // Si la promesa se resuelve, envía la respuesta exitosa
                return { success: true, data: mapedServerInfo, message: serverResult };
                // El bloque catch manejará si la promesa es rechazada

            } else if (!mapedServerInfo.existsfolder) {
                fastify.log.info(`Iniciando generación y descarga para servidor ${serverName} (core: ${mapedServerInfo.core})`);
                // --- Manejo de Callback (Fire and Forget como en Express) ---
                // La versión Express respondía inmediatamente y dejaba la generación en segundo plano.
                // Podemos replicar eso NO esperando la promesa.
                new Promise((resolve, reject) => {
                    startJavaServerGeneration(mapedServerInfo, result => {
                        if (result) {
                            fastify.log.info(`Generación de servidor ${serverName} completada (o en progreso).`);
                            resolve(result); // Resuelve la promesa (aunque no la esperemos)
                        } else {
                            fastify.log.error(`Error en la generación de servidor ${serverName} (callback).`);
                            reject(new Error('Error durante la generación del servidor (callback).')); // Rechaza la promesa
                        }
                    });
                }).catch(err => {
                    // Captura errores de la promesa en segundo plano para loguearlos
                    fastify.log.error(`Error en background de startJavaServerGeneration para ${serverName}: ${err.message}`);
                });

                // Responde inmediatamente al cliente
                return {
                    success: true,
                    data: mapedServerInfo,
                    message: "Solicitud de creación de servidor recibida. La descarga y configuración se ejecutan en segundo plano."
                };

            } else {
                fastify.log.info(`Intento de crear servidor ${serverName}, pero ya existe.`);
                return {
                    success: true, // O podrías enviar un 409 Conflict: reply.code(409).send(...)
                    data: mapedServerInfo,
                    message: "El servidor ya existe."
                };
            }
        } catch (error) {
            fastify.log.error(`Error general en POST /createserver para ${serverName}: ${error.message}`, error);
            reply.code(500).send({ success: false, error: error.message || 'Error interno al procesar la creación del servidor.' });
        }
    });
    fastify.post('/newserver', async (request, reply) => {
        const keys = ["serverName", "coreName", "coreVersion", "startParameters", "javaVersion", "serverPort", "fileName", "formData", "version"];
        const requestData = getRequestData(request, keys);
        return requestData
    });

    // GET /servermanager/:serverName/:action (Server control actions)
    fastify.get('/servermanager/:serverName/:action', async (request, reply) => {
        const { serverName, action } = request.params;
        const cmd = request.query.cmd; // Comando para la acción 'send'

        // Podrías validar `action` contra una lista de acciones permitidas
        const validActions = ['start', 'stop', 'restart', 'send', 'log', 'info', 'players', 'metrics', 'kill'];
        if (!validActions.includes(action)) {
            return reply.code(400).send({ success: false, error: "La acción no es válida." });
        }

        if (action === 'send' && !cmd) {
            return reply.code(400).send({ success: false, error: "El parámetro 'cmd' es requerido para la acción 'send'." });
        }

        try {
            // Añadir el servidor al manager en cada petición puede ser ineficiente si ya existe.
            // Considera si manager.addServer puede manejar duplicados o si necesitas verificar antes.
            // manager.addServer puede lanzar error si la ruta no existe.
            const serverPath = path.join(serversBaseDir, serverName);
            // Podrías verificar fs.existsSync(serverPath) antes de añadirlo
            manager.addServer(serverName, serverPath, { stopCommand: "stop" }); // Asegúrate que la ruta sea correcta y exista

            let data = null;
            let message = `Acción '${action}' ejecutada para el servidor '${serverName}'.`; // Mensaje por defecto

            switch (action) {
                case 'start':
                    await manager.startServer(serverName); // Asume que estas funciones son async o devuelven promesa
                    break;
                case 'stop':
                    await manager.stopServer(serverName);
                    break;
                case 'restart':
                    // Considera la lógica: ¿esperar a que pare antes de iniciar?
                    await manager.sendCommand(serverName, "stop");
                    // Podrías añadir un pequeño delay aquí si es necesario
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 seg (ajustable)
                    await manager.startServer(serverName);
                    break;
                case 'send':
                    await manager.sendCommand(serverName, cmd);
                    message = `Comando '${cmd}' enviado al servidor '${serverName}'.`;
                    break;
                case 'log':
                    data = await manager.getServerLogs(serverName); // Asume async
                    message = `Logs obtenidos para '${serverName}'.`;
                    break;
                case 'info':
                    data = await manager.getServerStatus(serverName); // Asume async
                    message = `Estado obtenido para '${serverName}'.`;
                    break;
                case 'players':
                    data = await manager.getServerPlayers(serverName); // Asume async
                    message = `Jugadores obtenidos para '${serverName}'.`;
                    break;
                case 'metrics':
                    data = await manager.getServerMetrics(serverName); // Asume async
                    message = `Métricas obtenidas para '${serverName}'.`;
                    break;
                case 'kill':
                    data = await manager.killserver(serverName); // Asume async
                    message = `Se intentó terminar forzosamente el servidor '${serverName}'.`;
                    break;
                // El default ya se manejó con la validación inicial
            }

            // Devuelve éxito con datos si los hay, o solo mensaje
            return { success: true, message: message, ...(data !== null && { data }) };

        } catch (error) {
            fastify.log.error(`Error en /servermanager/${serverName}/${action}: ${error.message}`, error);
            // Intenta dar errores más específicos si es posible (ej. servidor no encontrado por el manager)
            reply.code(500).send({ success: false, error: error.message || `Error al ejecutar la acción '${action}' en el servidor '${serverName}'.` });
        }
    });

}

// Exporta la función del plugin
export default serverManagementRoutes;