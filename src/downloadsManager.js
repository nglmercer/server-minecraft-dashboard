import TASK_MANAGER from "./taskManager.js";
import {logger, LanguageManager} from "../utils/utils.js";
import path from "path";
import axios from "axios";
import fs from "fs";
import { pipeline } from "stream/promises";
import decompress from "decompress";
import colors from "colors";
import { configManager } from "./configuration.js";
const PREDEFINED = {
    TASKS_TYPES: {
        DOWNLOADING: "downloading",
        INSTALLING: "installing",
        ZIPPING: "zipping",
        UNPACKING: "unpacking",
        UPDATING: "updating",
        RESTARTING: "restarting",
        CREATING: "creating",
        DELETION: "deletion",
        COMMON: "common",
        UNKNOWN: "unknown"
    },
    TASK_STATUS: {
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        FAILED: 'failed'
    }
}
function updateDownloadProgress(taskID, chunkLength) {
    const task = TASK_MANAGER.getTaskData(taskID);
    if (!task) {
        console.error(`Task ${taskID} not found`);
        return;
    }

    // Initialize size object if it doesn't exist
    if (!task.size) {
        console.error(`Size object missing for task ${taskID}, initializing...`);
        task.size = { current: 0, total: 0 };
    }

    // Ensure size properties exist and are numbers
    const currentSize = Number(task.size.current) || 0;
    const totalSize = Number(task.size.total) || 0;

    // Validate chunk length
    if (typeof chunkLength !== "number" || isNaN(chunkLength) || chunkLength < 0) {
        console.error(`Invalid chunk length for task ${taskID}: ${chunkLength}`);
        return;
    }

    // Calculate new current size
    const newCurrent = currentSize + chunkLength;

    // Calculate progress only if we have a valid total
    let newProgress = 0;
    if (totalSize > 0) {
        newProgress = Math.min(100, Math.round((newCurrent / totalSize) * 100));
    } else {
        // If total size is unknown, use an indeterminate progress value
        newProgress = Math.min(99, Math.round((newCurrent / 1024 / 1024))); // Base progress on MB downloaded
    }
    const statsdata = {
        progress: newProgress,
        current: newCurrent,
        total: totalSize,
        chunk: chunkLength
    }
    // Log detailed debug information
    //console.log(`Updating task ${taskID}:`,statsdata );

    // Update task with new values
    TASK_MANAGER.updateTask(taskID, {
        size: { 
            current: newCurrent,
            total: totalSize // Preserve the original total
        },
        progress: newProgress
    });
}

// Función auxiliar para crear y configurar la tarea de descarga
function createDownloadTask(downloadURL, filePath, contentLength) {
    // Verificar que contentLength sea un número válido
    if (typeof contentLength !== "number" || isNaN(contentLength) || contentLength <= 0) {
        throw new Error("Invalid contentLength: must be a positive number");
    }

    const taskData = {
        type: PREDEFINED.TASKS_TYPES.DOWNLOADING,
        progress: 0, // Inicializar en 0, no en null
        size: {
            total: contentLength,
            current: 0
        },
        url: downloadURL,
        path: filePath,
        filename: path.basename(filePath),
        status: PREDEFINED.TASK_STATUS.IN_PROGRESS
    };

    const taskID = TASK_MANAGER.addNewTask(taskData);
    
    logger.log(
        LanguageManager.translateText(
            configManager.mainConfig.language,
            "{{console.downloadTaskCreated}}",
            colors.cyan(taskID),
            colors.cyan(taskData.filename)
        )
    );

    return taskID;
}

export async function addDownloadTask(downloadURL, filePath, cb = () => {}) {
    try {
        const response = await axios({
            url: downloadURL,
            method: "GET",
            responseType: "stream",
            timeout: 10000,
        });

        const contentLength = parseInt(response.headers['content-length'], 10);
        if (isNaN(contentLength) || contentLength <= 0) {
            const error = new Error("Content-Length header missing or invalid");
            cb(false, error);
            throw error;
        }

        const dlTaskID = createDownloadTask(downloadURL, filePath, contentLength);
        const writeStream = fs.createWriteStream(filePath);

        // Configurar listeners de progreso
        response.data.on('data', (chunk) => {
            updateDownloadProgress(dlTaskID, chunk.length);
        });

        try {
            await pipeline(response.data, writeStream);
            
            // Actualización final para asegurar 100%
            TASK_MANAGER.updateTask(dlTaskID, {
                size: { current: contentLength },
                progress: 100,
                status: PREDEFINED.TASK_STATUS.COMPLETED
            });

            console.log(`Download completed for task ${dlTaskID}`); // Depuración

            // Eliminar la tarea después de un breve retraso para permitir UI updates
            setTimeout(() => {
                TASK_MANAGER.removeTask(dlTaskID);
            }, 2000);

            cb(true, null);
            return true;
        } catch (error) {
            console.error(`Download failed for task ${dlTaskID}:`, error.message); // Depuración
            TASK_MANAGER.updateTask(dlTaskID, {
                status: PREDEFINED.TASK_STATUS.FAILED,
                error: error.message
            });
            cb(false, error);
            throw error;
        }
    } catch (error) {
        console.error("Error in addDownloadTask:", error.message); // Depuración
        cb(false, error);
        throw error;
    }
}

export const unpackArchive = async (archivePath, unpackPath, cb, deleteAfterUnpack = false) => {
    try {
        fs.mkdirSync(unpackPath, { recursive: true });
        await decompress(archivePath, unpackPath);
        
        if (deleteAfterUnpack) {
            fs.unlinkSync(archivePath);
        }
        
        cb(true);
    } catch (error) {
        console.error("Unpacking error:", error);
        cb(false);
    }
};

export default addDownloadTask;