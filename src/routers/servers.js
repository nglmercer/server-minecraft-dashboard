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
import { startJavaServerGeneration, startJavaServerbyFile, ensureJavaVersionReady } from "../minecraft/createserver.js"; 
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

    fastify.get('/servers', async (req, reply) => {
        try {
            const servers = await getallfolderinfo();
            console.log("servers", servers);
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


    fastify.post('/newserver', async (req, reply) => {
        try {
            // --- INICIO DE CAMBIOS ---
            // 1. Ya no usamos req.body. Obtenemos un iterador para las partes del formulario.
            const parts = req.parts();
            let jsonDataString = null;
            let fileData = null; // Almacenará el objeto de la parte del archivo

            // 2. Iteramos sobre las partes del stream del formulario
            for await (const part of parts) {
                if (part.type === 'field' && part.fieldname === 'jsonData') {
                    // Si la parte es un campo de texto y se llama 'jsonData', guardamos su valor
                    jsonDataString = part.value;
                } else if (part.type === 'file' && part.fieldname === 'file') {
                    // Si la parte es un archivo y se llama 'file', guardamos la parte completa.
                    // Verificamos que el archivo no venga vacío (sin nombre de archivo).
                    if (part.filename) {
                        fileData = part;
                    } else {
                        // Si es un campo de archivo vacío, simplemente drenamos el stream para no bloquear la petición.
                        part.file.resume();
                    }
                } else if (part.type === 'file') {
                    // Si se envía cualquier otro archivo no esperado, lo drenamos.
                    part.file.resume();
                }
            }

            // 3. Validamos que hayamos encontrado el campo jsonData
            if (!jsonDataString) {
                return reply.status(400).send({
                    message: 'El campo "jsonData" es requerido en el formulario multipart.',
                });
            }
            
            let parsedJsonData;
            try {
                // El resto del código ahora usa la variable 'jsonDataString' que extrajimos
                parsedJsonData = JSON.parse(jsonDataString);
            } catch (e) {
                console.error('Error parseando jsonData:', e);
                return reply.status(400).send({
                    message: 'El campo jsonData no contiene un JSON válido.',
                    error: e.message
                });
            }
            // --- FIN DE CAMBIOS ---

            const {
                serverName,
                javaVersion,
                serverPort,
                coreName,
                startParameters,
                fileName,
                coreVersion
            } = parsedJsonData;

            // Ahora usamos 'fileData' (el objeto de la parte del archivo) en lugar de req.body.file
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
            
            // CORRECCIÓN LÓGICA: Esta validación no hacía lo que esperabas.
            // La he reescrito para que sea más clara.
            const requiredFields = { serverName, javaVersion, serverPort, startParameters, coreName };
            Object.entries(requiredFields).forEach(([key, value]) => {
                if (!value) {
                    isnotvalid.push({ key, value });
                }
            });
            
            const serverPath = path.join(PathUtils.serverPath, serverConfig.serverName);
            if (!PathUtils.isValidDirectoryName(serverPath)) {
                isnotvalid.push({ key: 'serverName (inválido para nombre de directorio)', value: serverConfig.serverName });
            }
            
            if (!fileData && !coreVersion) {
                isnotvalid.push({ key: 'Archivo(fileData) o Version(coreVersion)', value: 'Ninguno proporcionado' });
            }
            
            if (isnotvalid.length > 0) {
                console.warn('Faltan campos requeridos en /newserver', isnotvalid);
                return reply.code(400).send({
                    success: false,
                    error: "Campos requeridos faltantes o inválidos: " + isnotvalid.map(i => i.key).join(', '),
                    data: isnotvalid
                });
            }

            console.info('Configuración final a procesar:', serverConfig);

            if (javaVersion) await ensureJavaVersionReady(javaVersion);

            // La lógica principal ahora usa la variable 'fileData'
            if (fileData && (!coreVersion || !coreName)) {
                const fileBuffer = await fileData.toBuffer(); // fileData tiene el método .toBuffer()
                await createserverfile(serverConfig.serverName, serverConfig.fileName, fileBuffer);
                
                // Tu lógica de promesas para startJavaServerbyFile está bien
                const serverResult = await new Promise((resolve, reject) => {
                    startJavaServerbyFile(serverConfig, (result) => {
                        if (result?.success === false) {
                            reject(new Error(result.error || 'Error reportado por startJavaServerbyFile'));
                        } else if (result) {
                            resolve(result);
                        } else {
                            reject(new Error('Error desconocido durante la creación del servidor (callback vacío).'));
                        }
                    });
                });
                
                return { success: true, data: serverConfig, message: serverResult };
            } else {
                // Esta parte no cambia, ya que no depende del archivo subido
                const result = await startJavaServerGeneration(serverConfig, result => {
                    if (result) {
                        console.info(`Generación de servidor ${serverName} completada (o en progreso).`);
                    } else {
                        console.error(`Error en la generación de servidor ${serverName} (callback).`);
                    }
                });
                
                // Nota: aquí no usas await, por lo que la respuesta es inmediata. Esto es correcto para tareas en segundo plano.
                return reply.send({
                    message: 'La generación del servidor ha terminado.',
                    data: serverConfig,
                    ...result
                });
            }
            
        } catch (err) {
            console.error('Error en el manejador /newserver:', err);
            if (!reply.sent) {
                reply.status(500).send({ message: 'Error interno del servidor', error: err.message });
            }
        }
    });

}

export default serverManagementRoutes;