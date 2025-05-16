// fileFolderRegistry.js
import path from 'node:path';
import {
    createFile as fuCreateFile,
    readFile as fuReadFile,
    createFolder as fuCreateFolder,
    getFolderDetails as fuGetFolderDetails,
    serverPathBase,
    dataPathBase,
    StorageManager
} from '../fileutils.js'; // Ajusta la ruta a fileutils.js si es necesario

const ServerStore = new StorageManager('servers.json', dataPathBase);

async function updatefolderinfo(folderNameFromInput) {
    let mainFolderName = folderNameFromInput;
    // Extrae el nombre de la carpeta raíz del servidor si se proporciona una ruta anidada
    if (folderNameFromInput && folderNameFromInput.includes(path.sep)) {
        mainFolderName = folderNameFromInput.split(path.sep)[0];
    }

    // Asegúrate de que mainFolderName no sea vacío o undefined
    if (!mainFolderName) {
        console.error(`Invalid folder name received in updatefolderinfo: ${folderNameFromInput}`);
        return;
    }

    const detailsResult = await fuGetFolderDetails(serverPathBase, mainFolderName);
    if (detailsResult.success) {
        ServerStore.JSONset(mainFolderName, detailsResult.data);
    } else {
        console.error(`Error al actualizar información de la carpeta '${mainFolderName}': ${detailsResult.error}`);
    }
}

async function createserverfolder(directoryname) {
    const result = await fuCreateFolder(serverPathBase, directoryname, false);
    if (result.success) {
        await updatefolderinfo(directoryname);
        return result.data;
    }
    console.error(`Error al crear carpeta de servidor '${directoryname}': ${result.error}`);
    return result.error;
}

async function createserverfile(directoryname, filename, content = '') {
    const result = await fuCreateFile(serverPathBase, directoryname, filename, content);
    if (result.success) {
        await updatefolderinfo(directoryname);
        return result.data; // Retorna la ruta del archivo creado
    }
    console.error(`Error al crear archivo '${filename}' en '${directoryname}': ${result.error}`);
    return result.error;
}

async function createsubfolder(parentDirectoryName, subfolderName) {
    const subfolderPathRelativeToServer = path.join(parentDirectoryName, subfolderName);
    const result = await fuCreateFolder(serverPathBase, subfolderPathRelativeToServer, true);
    if (result.success) {
        await updatefolderinfo(parentDirectoryName); // Actualiza la info del directorio padre principal
        return result.data;
    }
    console.error(`Error al crear subcarpeta '${subfolderName}' en '${parentDirectoryName}': ${result.error}`);
    return result.error;
}

async function getfolderinfo(folderName) {
    const result = await fuGetFolderDetails(serverPathBase, folderName);
    if (result.success) {
        return result.data;
    }
    console.error(`Error al obtener información de la carpeta '${folderName}': ${result.error}`);
    return undefined; // Comportamiento original: retorna undefined en error tras log
}

async function getallfolderinfo() {
    const result = await fuGetFolderDetails(serverPathBase, "."); // "." es relativo a serverPathBase
    if (result.success) {
        return result.data;
    }
    console.error(`Error al obtener información de todas las carpetas: ${result.error}`);
    return undefined;
}

async function existsfolder(folderName) {
    // Esta función, según el original, devuelve detalles si existe, o undefined si hay error (ej. no existe)
    const result = await fuGetFolderDetails(serverPathBase, folderName);
    if (result.success) {
        return result.data;
    }
    // No es necesariamente un error si la carpeta no existe, para una función "exists".
    // Pero para mantener la consistencia con el logueo original:
    // console.log(`La carpeta '${folderName}' no existe o no se pudo acceder: ${result.error}`);
    return undefined;
}

async function getFileInfo(folderName, fileName) {
    const result = await fuReadFile(serverPathBase, folderName, fileName);
    if (result.success) {
        return result.data; // Contenido del archivo
    }
    // La lógica original de crear el archivo si no existía en una función de lectura
    // se considera una mala práctica y se ha eliminado.
    // Si se necesita crear, se debe llamar a createserverfile explícitamente.
    console.error(`Error al leer archivo '${fileName}' en '${folderName}': ${result.error}`);
    return result.error;
}

export {
    createserverfolder,
    createserverfile,
    createsubfolder,
    getfolderinfo,
    updatefolderinfo,
    getallfolderinfo,
    existsfolder,
    getFileInfo,
    ServerStore
};