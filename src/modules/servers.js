import path from 'path'; // Keep path import if used directly in this file
import {
    StorageManager,
    PathUtils,
    createFile,
    readFile,
    renameFile,
    readFileByPath,
    writeFile,
    deletePath,
    listFiles,
    compressFile,
    decompressFile,
    createFolder,
    getFolderDetails,
    deleteServerFolder,
    compressFolder,
    decompressFolder,
    // getBackupFolderPath is also available if needed directly
} from '../fileutils.js'; // Assuming the refactored utils file is named this

// Configuración inicial
const storage = new StorageManager('servers.json', './data'); // Uses dataPathBase implicitly now

// Use PathUtils for base paths
const SERVERS_PATH = PathUtils.serverPath;
const BACKUPS_PATH = PathUtils.backupPath;


export async function generateServerFolderBackup(folderName, outputFileName = null) {
    // folderName is relative to SERVERS_PATH
    // outputFileName is just the name, will be placed in BACKUPS_PATH
    const result = await compressFolder(SERVERS_PATH, folderName, outputFileName);
    if (result.success) {
        console.log("Backup created successfully:", result.data);
        return result.data;
    } else {
        console.error("Failed to create backup:", result.error);
        return result.error; // Or throw result.originalError
    }
}

export async function uncompressServerFolderBackup(compressedFileName, outputFolderName = null) {
    // compressedFileName is relative to BACKUPS_PATH
    // outputFolderName is relative to SERVERS_PATH
    const result = await decompressFolder(compressedFileName, outputFolderName);
    if (result.success) {
        console.log("Backup uncompressed successfully:", result.data);
        return result.data;
    } else {
        console.error("Failed to uncompress backup:", result.error);
        return result.error;
    }
}

export async function createserverfolder(directoryName) {
    const result = await createFolder(SERVERS_PATH, directoryName, false);
    if (result.success) {
        console.log(`Carpeta creada:`, result.data);
        await updatefolderinfo(directoryName); // updatefolderinfo is async now
        return result.data;
    } else {
        return result.error;
    }
}

export async function createserverfile(directoryName, filename, content) {
    // directoryName is relative to SERVERS_PATH
    const result = await createFile(SERVERS_PATH, directoryName, filename, content);
    if (result.success) {
        console.log(`Archivo creado: ${result.data}`);
        await updatefolderinfo(directoryName.split('/')[0]); // Update top-level server folder info
        return result.data;
    } else {
        return result.error;
    }
}

export async function createsubfolder(directoryName, subfolderName) {
    // directoryName is the main server folder, subfolderName is relative to it.
    const fullSubFolderPath = path.join(directoryName, subfolderName);
    const result = await createFolder(SERVERS_PATH, fullSubFolderPath, true); // isSubFolder = true
    if (result.success) {
        console.log(`Subcarpeta creada:`, result.data);
        await updatefolderinfo(directoryName);
        return result.data;
    } else {
        return result.error;
    }
}

export async function updatefolderinfo(folderName) {
    if (folderName.includes("/")) {
        folderName = folderName.split("/")[0]; // Get root server folder
    }
    const result = await getfolderinfo(folderName); // getfolderinfo is async now
    if (typeof result !== 'string') { // Check if not an error message
        storage.JSONset(folderName, result); // Assuming result is the folder details object
    } else {
        console.error(`Could not update folder info for ${folderName}: ${result}`);
    }
}

export async function getfolderinfo(folderName) {
    // folderName is relative to SERVERS_PATH
    const result = await getFolderDetails(SERVERS_PATH, folderName);
    if (result.success) {
        console.log(`Archivos en la carpeta '${folderName}':`, result.data);
        return result.data;
    } else {
        console.error(`Error getting folder info for '${folderName}': ${result.error}`);
        return result.error;
    }
}

export async function readfilebyname(folderName, fileName) {
    // folderName and fileName are relative to SERVERS_PATH
    const relativeFilePath = path.join(folderName, fileName);
    const result = await readFileByPath(SERVERS_PATH, relativeFilePath);

    if (result.success && result.data !== false) {
        return result.data;
    } else {
        // Fallback: if reading file fails or it's not a file, try to get folder details
        // This mimics the original logic's ambiguity.
        console.warn(`File '${relativeFilePath}' not found or not a file, attempting to get folder details for '${folderName}'. Error: ${result.error}`);
        const folderInfoResult = await getFolderDetails(SERVERS_PATH, folderName);
        if (folderInfoResult.success) {
            return folderInfoResult.data;
        } else {
            return folderInfoResult.error; // Return error from getFolderDetails
        }
    }
}

export async function readfilebypath(relativeFilePath) {
    // relativeFilePath is relative to SERVERS_PATH
    const result = await readFileByPath(SERVERS_PATH, relativeFilePath);
    if (result.success && result.data !== false) {
        return result.data;
    } else {
        // Fallback: if reading file fails, try to get details of the path assuming it might be a folder
        // This assumes relativeFilePath could be a folder name.
        console.warn(`File at path '${relativeFilePath}' not found or not a file, attempting to get folder details. Error: ${result.error}`);
        const folderInfoResult = await getFolderDetails(SERVERS_PATH, relativeFilePath);
        if (folderInfoResult.success) {
            return folderInfoResult.data;
        } else {
            return folderInfoResult.error;
        }
    }
}

export async function writeFilebyName(folderName, fileName, content) {
    // folderName and fileName are relative to SERVERS_PATH
    const result = await writeFile(SERVERS_PATH, folderName, fileName, content);
    if (result.success) {
        await updatefolderinfo(folderName.split('/')[0]); // Update root server folder
        return result.data;
    } else {
        // Original code had a fallback to getFolderDetails if writeFile failed.
        // This seems unusual for a writeFile operation. Sticking to error reporting for now.
        console.error(`Error writing file '${fileName}' in '${folderName}': ${result.error}`);
        return result.error;
    }
}

export async function renamefile(serverName, sourceFileRelativePath, newFileNameOnly) {
    // serverName is the root server folder.
    // sourceFileRelativePath is relative to serverName, e.g., "config/old.json"
    // newFileNameOnly is just the new name, e.g., "new.json"
    const result = await renameFile(SERVERS_PATH, serverName, sourceFileRelativePath, newFileNameOnly);
    if (result.success) {
        await updatefolderinfo(serverName);
        return result.data; // new path
    } else {
        console.error(`Error renaming file '${sourceFileRelativePath}' to '${newFileNameOnly}' in server '${serverName}': ${result.error}`);
        return false; // Mimicking original return on error
    }
}

export async function deletefile(serverName, fileOrFolderPathRelativeToServer) {
    // serverName is the root server folder.
    // fileOrFolderPathRelativeToServer is relative to serverName.
    const fullRelativePath = path.join(serverName, fileOrFolderPathRelativeToServer);
    const result = await deletePath(SERVERS_PATH, fullRelativePath);
    if (result.success) {
        await updatefolderinfo(serverName);
        return true; // Mimicking original return on success
    } else {
        console.error(`Error deleting '${fileOrFolderPathRelativeToServer}' in server '${serverName}': ${result.error}`);
        return false; // Mimicking original return on error
    }
}

export async function deleteserver(serverName) {
    // serverName is a directory directly under SERVERS_PATH
    if (!serverName) return false;
    const result = await deleteServerFolder(SERVERS_PATH, serverName);
    if (result.success && result.data) { // .data here is true/false from _deleteServerFolderLogic
        storage.remove(serverName); // Remove server info from storage
        console.log(`Servidor '${serverName}' eliminado.`);
        return true;
    } else {
        console.error(`Error deleting server '${serverName}': ${result.error || 'Operation reported failure.'}`);
        return false;
    }
}

// Example Usage (Async IIFE or top-level await if your environment supports it)

(async () => {
    const server1 = "testServer123";
    const server2 = "anotherServer";

    console.log("--- Creating server folder ---");
    let details = await createserverfolder(server1);
     console.log(details);

    console.log("\n--- Creating subfolder ---");
    let subfolderDetails = await createsubfolder(server1, "config");
     console.log(subfolderDetails);

    console.log("\n--- Creating file in subfolder ---");
    let filePath = await createserverfile(`${server1}/config`, "settings.json", JSON.stringify({ theme: "dark" }));
    console.log(filePath);

    console.log("\n--- Reading file ---");
    let content = await readfilebyname(`${server1}/config`, "settings.json");
    console.log("File content:", content);

    console.log("\n--- Renaming file ---");
    let newPath = await renamefile(server1, `config/settings.json`, "user_prefs.json");
    console.log("New path:", newPath);

    console.log("\n--- Getting folder info for server ---");
    let serverInfo = await getfolderinfo(server1);
    console.log("Server info:", JSON.stringify(serverInfo, null, 2));

    console.log("\n--- Updating file content ---");
    await writeFilebyName(`${server1}/config`, "user_prefs.json", JSON.stringify({ theme: "light", fontSize: 14 }));
    content = await readfilebypath(`${server1}/config/user_prefs.json`);
    console.log("Updated content:", content);
    
    /*
    console.log("\n--- Compressing server folder ---");
    const backupFile = await generateServerFolderBackup(server1, `${server1}_backup.tar.gz`);
    console.log("Backup file created:", backupFile);

    console.log("\n--- Deleting server folder (temporarily for uncompress test) ---");
    // await deleteserver(server1);

    console.log("\n--- Uncompressing server folder ---");
    // if (typeof backupFile === 'string' && backupFile.endsWith('.tar.gz')) {
    //     const uncompressedPath = await uncompressServerFolderBackup(path.basename(backupFile), `${server1}_restored`);
    //     console.log("Server folder restored to:", uncompressedPath);
    //     await updatefolderinfo(`${server1}_restored`); // Update info for the restored server
    // }


    console.log("\n--- Deleting file ---");
    // await deletefile(server1, `config/user_prefs.json`);
    // serverInfo = await getfolderinfo(server1);
    console.log("Server info after delete:", JSON.stringify(serverInfo, null, 2));

    console.log("\n--- Deleting server ---");
    // await deleteserver(server1);
    // if (serverInfo && typeof serverInfo !== 'string' && serverInfo.name === `${server1}_restored`) {
    //    await deleteserver(`${server1}_restored`);
    // }
    
    console.log("\n--- Check Storage ---");
    console.log("Storage keys:", storage.keys()); */
})();
