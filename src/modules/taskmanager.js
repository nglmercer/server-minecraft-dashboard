import path from "path";
import axios from "axios";
import fs from "fs";
import { pipeline } from "stream/promises";
import decompress from "decompress";
import colors from "colors";
import { v4 as uuidv4 } from 'uuid';
import { logger, Logger, StorageManager } from "../utils/utils.js";
const tasklogger = new Logger();
const taskStorage = new StorageManager('tasks.json', './data');
const PREDEFINED = {
    TASK_STATUS: {
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        FAILED: 'failed'
    },
    TASKS_TYPES: {
        DOWNLOADING: "downloading",
        INSTALLING: "installing",
        UNPACKING: "unpacking",
        UPDATING: "updating",
        COMMON: "common"
    }
};

const archivedTaskStorage = new StorageManager('archived_tasks.json', './data');

class TaskManager {
    constructor() {
        this.storage = taskStorage;
        this.archiveStorage = archivedTaskStorage;
        this.tasks = this.storage.JSONget("tasks") || {};
        this.archivedTasks = this.archiveStorage.JSONget("archived_tasks") || {};
    }

    saveTasks() {
        this.storage.JSONset("tasks", this.tasks);
    }

    saveArchivedTasks() {
        this.archiveStorage.JSONset("archived_tasks", this.archivedTasks);
    }

    getNewTaskID() {
        return uuidv4();
    }

    addNewTask(data) {
        const newTaskID = this.getNewTaskID();
        this.tasks[newTaskID] = {
            ...data,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.saveTasks();
        tasklogger.log("{{console.taskAdded}}", colors.cyan(newTaskID), colors.cyan(data.type));
        return newTaskID;
    }

    updateTask(taskID, data) {
        if (!this.tasks[taskID]) return false;
    
        this.tasks[taskID] = {
            ...this.tasks[taskID],
            ...data,
            updatedAt: Date.now()
        };
    
        // Asegurar que si progress llega a 100%, la tarea se marca como completada
        if (this.tasks[taskID].progress === 100) {
            this.tasks[taskID].status = PREDEFINED.TASK_STATUS.COMPLETED;
        }
    
        if (this.tasks[taskID].status === PREDEFINED.TASK_STATUS.COMPLETED) {
            this.archiveTask(taskID);
        } else {
            this.saveTasks();
        }
        return true;
    }
    

    archiveTask(taskID) {
        const task = this.tasks[taskID];
        if (!task) return false;
    
        // Verificar si el archivo realmente existe antes de archivarlo
        if (fs.existsSync(task.path)) {
            this.archivedTasks[taskID] = {
                ...task,
                archivedAt: Date.now()
            };
    
            delete this.tasks[taskID]; // Elimina la tarea de las activas
            this.saveTasks();
            this.saveArchivedTasks();
    
            tasklogger.log("{{console.taskArchived}}", colors.green(taskID));
            return true;
        } else {
            tasklogger.warn("Archivo no encontrado, no se archivará:", task.path);
            return false;
        }
    }

    getTasksByStatus(status) {
        return Object.entries(this.tasks)
            .filter(([_, task]) => task.status === status)
            .map(([id, task]) => ({ id, ...task }));
    }

    getArchivedTasks() {
        return Object.values(this.archivedTasks);
    }
}


const TASK_MANAGER = new TaskManager();

function updateDownloadProgress(taskID, chunkLength) {
    const task = TASK_MANAGER.tasks[taskID];
    if (!task || !task.size) return;

    task.size.current += chunkLength;
    task.progress = task.size.total > 0
        ? Math.min(100, Math.round((task.size.current / task.size.total) * 100))
        : Math.min(99, Math.round(task.size.current / 1024 / 1024));

    TASK_MANAGER.updateTask(taskID, task);
}

async function addDownloadTask(downloadURL, filePath) {
    logger.log(`Descargando archivo desde ${downloadURL} a ${filePath}`);
    try {
        // Extraer la carpeta destino
        const directoryPath = path.dirname(filePath);

        // Verificar si la carpeta existe; si no, crearla
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        const response = await axios({
            url: downloadURL,
            method: "GET",
            responseType: "stream",
            timeout: 10000
        });

        const contentLength = parseInt(response.headers['content-length'], 10);
        if (isNaN(contentLength) || contentLength <= 0) {
            throw new Error("Invalid content length");
        }

        const dlTaskID = TASK_MANAGER.addNewTask({
            type: PREDEFINED.TASKS_TYPES.DOWNLOADING,
            progress: 0,
            size: { total: contentLength, current: 0 },
            url: downloadURL,
            path: filePath,
            filename: path.basename(filePath),
            status: PREDEFINED.TASK_STATUS.IN_PROGRESS
        });

        const writeStream = fs.createWriteStream(filePath);
        response.data.on('data', (chunk) => updateDownloadProgress(dlTaskID, chunk.length));

        await pipeline(response.data, writeStream);

        TASK_MANAGER.updateTask(dlTaskID, {
            size: { current: contentLength },
            progress: 100,
            status: PREDEFINED.TASK_STATUS.COMPLETED
        });

        return true;
    } catch (error) {
        console.error(`Download failed: ${error.message}`);
        TASK_MANAGER.updateTask(dlTaskID, {
            status: PREDEFINED.TASK_STATUS.FAILED,
            error: error.message
        });
        return false;
    }
}


async function unpackArchive(archivePath, unpackPath, deleteAfterUnpack = false) {
    try {
        fs.mkdirSync(unpackPath, { recursive: true });
        await decompress(archivePath, unpackPath);
        
        if (deleteAfterUnpack) {
            fs.unlinkSync(archivePath);
        }

        return true;
    } catch (error) {
        console.error("Unpacking error:", error);
        return false;
    }
}

export {
    TASK_MANAGER,
    addDownloadTask,
    unpackArchive
}
