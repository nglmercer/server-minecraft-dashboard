import path from "path";
import axios from "axios";
import fs from "fs";
import { pipeline } from "stream/promises";
import decompress from "decompress";
import colors from "colors";
import { v4 as uuidv4 } from 'uuid';
import { logger, Logger, StorageManager } from "../utils/utils.js";
import { emitter } from '../sockets/Emitter.js';
// Importar funciones de backup
import { backupManager,sanitizeFilename } from '../modules/backup.js';

const tasklogger = new Logger();
const taskStorage = new StorageManager('tasks.json', './data');

const PREDEFINED = {
    TASK_STATUS: {
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        FAILED: 'failed',
        CANCELLED: 'cancelled'
    },
    TASKS_TYPES: {
        DOWNLOADING: "downloading",
        INSTALLING: "installing",
        UNPACKING: "unpacking",
        UPDATING: "updating",
        BACKUP_CREATE: "backup_create",
        BACKUP_RESTORE: "backup_restore",
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
        
        // Configurar eventos de backup
        this.setupBackupEvents();
    }

    setupBackupEvents() {
        // Escuchar eventos personalizados de backup si los necesitas
        process.on('backup:progress', (data) => {
            if (data.taskId && this.tasks[data.taskId]) {
                this.updateTask(data.taskId, {
                    progress: data.progress,
                    currentStep: data.step
                });
            }
        });
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
        const taskData = {
            ...data,
            id: newTaskID,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.tasks[newTaskID] = taskData;
        this.saveTasks();
        
        // Emitir evento con el ID incluido
        emitter.emit('tasks:add', { id: newTaskID, ...taskData });
        
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
        
        // Emitir evento de actualización
        emitter.emit('tasks:update', { id: taskID, ...this.tasks[taskID] });
    
        if (this.tasks[taskID].status === PREDEFINED.TASK_STATUS.COMPLETED) {
           setTimeout(() => this.archiveTask(taskID), 4000);
        } else {
            this.saveTasks();
        }
        return true;
    }

    // Cancelar tarea
    cancelTask(taskID) {
        if (!this.tasks[taskID]) return false;
        
        this.updateTask(taskID, {
            status: PREDEFINED.TASK_STATUS.CANCELLED,
            cancelledAt: Date.now()
        });
        
        tasklogger.log("{{console.taskCancelled}}", colors.yellow(taskID));
        return true;
    }

    archiveTask(taskID) {
        const task = this.tasks[taskID];
        if (!task) return false;
    
        this.archivedTasks[taskID] = {
            ...task,
            archivedAt: Date.now()
        };

        delete this.tasks[taskID];
        this.saveTasks();
        this.saveArchivedTasks();

        emitter.emit('tasks:archived', { id: taskID, ...this.archivedTasks[taskID] });
        tasklogger.log("{{console.taskArchived}}", colors.green(taskID));
        return true;
    }

    getTasksByStatus(status) {
        return Object.entries(this.tasks)
            .filter(([_, task]) => task.status === status)
            .map(([id, task]) => ({ id, ...task }));
    }

    getArchivedTasks() {
        return Object.values(this.archivedTasks);
    }

    getAllTasks() {
        return Object.entries(this.tasks)
            .map(([id, task]) => ({ id, ...task }));
    }

    getTask(taskID) {
        return this.tasks[taskID] || null;
    }

    // MÉTODOS DE BACKUP INTEGRADOS

    /**
     * Crear tarea de backup
     * @param {string} folderName - Nombre de la carpeta a respaldar
     * @param {string} outputFilename - Nombre del archivo de salida
     * @param {Object} options - Opciones adicionales de backup
     * @returns {Promise<string>} ID de la tarea
     */
    async addBackupTask(folderName, outputFilename = null, options = {}) {
        const sanitizedFolderName = sanitizeFilename(folderName);
        const finalOutputFilename = outputFilename || `${sanitizedFolderName}_backup_${Date.now()}.tar.gz`;
        
        const taskID = this.addNewTask({
            type: PREDEFINED.TASKS_TYPES.BACKUP_CREATE,
            progress: 0,
            status: PREDEFINED.TASK_STATUS.IN_PROGRESS,
            folderName: sanitizedFolderName,
            outputFilename: finalOutputFilename,
            currentStep: 'Inicializando backup...',
            options: options
        });

        // Ejecutar backup en background
        this.executeBackupTask(taskID, folderName, finalOutputFilename, options)
            .catch(error => {
                console.error(`Backup task ${taskID} failed:`, error);
                this.updateTask(taskID, {
                    status: PREDEFINED.TASK_STATUS.FAILED,
                    error: error.message,
                    progress: 0
                });
            });

        return taskID;
    }

    /**
     * Ejecutar tarea de backup
     * @private
     */
    async executeBackupTask(taskID, folderName, outputFilename, options) {
        try {
            // Paso 1: Verificar servidor
            this.updateTask(taskID, {
                progress: 5,
                currentStep: 'Verificando estado del servidor...'
            });
            const progressCallback = (step, progress, details = {}) => {
                this.updateTask(taskID, {
                    // El progreso total será un 90% del progreso de compresión, dejando 10% para el inicio.
                    progress: Math.min(95, 10 + Math.round(progress * 0.85)),
                    currentStep: `${step} (${progress}%)`,
                    ...details
                });
              };
            const backupOptions = { ...options, progressCallback };

            const result = await backupManager.createBackup(folderName, outputFilename, backupOptions);

            // Paso final: Completar
            this.updateTask(taskID, {
                progress: 100,
                status: PREDEFINED.TASK_STATUS.COMPLETED,
                currentStep: 'Backup completado exitosamente',
                result: result,
                completedAt: Date.now()
            });

            tasklogger.log("Backup task completed", colors.green(taskID), colors.green(result));

        } catch (error) {
            this.updateTask(taskID, {
                status: PREDEFINED.TASK_STATUS.FAILED,
                error: error.message,
                currentStep: `Error: ${error.message}`,
                failedAt: Date.now()
            });
            throw error;
        }
    }

    /**
     * Crear tarea de restauración de backup
     * @param {string} filename - Nombre del archivo de backup
     * @param {string} outputFolderName - Nombre de la carpeta de destino
     * @returns {Promise<string>} ID de la tarea
     */
    async addRestoreTask(filename, outputFolderName) {
        const taskID = this.addNewTask({
            type: PREDEFINED.TASKS_TYPES.BACKUP_RESTORE,
            progress: 0,
            status: PREDEFINED.TASK_STATUS.IN_PROGRESS,
            filename: filename,
            outputFolderName: outputFolderName,
            currentStep: 'Inicializando restauración...'
        });

        // Ejecutar restauración en background
        this.executeRestoreTask(taskID, filename, outputFolderName)
            .catch(error => {
                console.error(`Restore task ${taskID} failed:`, error);
                this.updateTask(taskID, {
                    status: PREDEFINED.TASK_STATUS.FAILED,
                    error: error.message,
                    progress: 0
                });
            });

        return taskID;
    }

/**
 * Ejecutar tarea de restauración mejorada
 * @private
 */
async executeRestoreTask(taskID, filename, outputFolderName) {
    try {
      this.updateTask(taskID, {
        progress: 5,
        currentStep: 'Verificando archivo de backup...'
      });
      
      // ✅ Verificar tamaño del archivo
      const backupPath = path.join(backupManager.constructor.backupPathBase || './backups', filename);
      const stats = await fs.promises.stat(backupPath);
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      this.updateTask(taskID, {
        progress: 10,
        currentStep: `Procesando archivo de ${fileSizeMB} MB...`,
        fileSize: stats.size,
        fileSizeMB: fileSizeMB
      });
      
      // ✅ Verificar memoria disponible
      const memUsage = process.memoryUsage();
      const availableMemory = memUsage.heapTotal - memUsage.heapUsed;
      
      if (stats.size > availableMemory * 0.8) {
        this.updateTask(taskID, {
          progress: 15,
          currentStep: 'Archivo grande detectado, usando método de streaming...'
        });
      }
      
      this.updateTask(taskID, {
        progress: 20,
        currentStep: 'Iniciando extracción de archivos...'
      });
      
      const progressCallback = (step, progress, details = {}) => {
        this.updateTask(taskID, {
            // El progreso total será un 80% del progreso de extracción.
            progress: Math.min(95, 10 + Math.round(progress * 0.85)),
            currentStep: `${step} (${progress}%)`,
            ...details
        });
      };
      
      const restoreOptions = { progressCallback };
      const result = await backupManager.restoreBackup(filename, outputFolderName, restoreOptions);
      
      this.updateTask(taskID, {
        progress: 95,
        currentStep: 'Verificando archivos extraídos...'
      });
      
      const outputPath = path.join(backupManager.constructor.serverPathBase || './servers', outputFolderName);
      const outputExists = fs.existsSync(outputPath);
      
      if (!outputExists) {
        throw new Error('La carpeta de destino no fue creada correctamente');
      }
      
      this.updateTask(taskID, {
        progress: 100,
        status: PREDEFINED.TASK_STATUS.COMPLETED,
        currentStep: 'Restauración completada exitosamente',
        result: result,
        outputPath: outputPath,
        completedAt: Date.now()
      });
      
      tasklogger.log("Restore task completed", colors.green(taskID), colors.green(result));
      
    } catch (error) {
      console.error(`❌ Error en tarea de restauración ${taskID}:`, error);
      
      // ✅ Categorizar errores para mejor debugging
      let errorCategory = 'unknown';
      let userFriendlyMessage = error.message;
      
      if (error.message.includes('Array buffer allocation failed')) {
        errorCategory = 'memory';
        userFriendlyMessage = 'Archivo demasiado grande para la memoria disponible';
      } else if (error.message.includes('ENOENT')) {
        errorCategory = 'file_not_found';
        userFriendlyMessage = 'Archivo de backup no encontrado';
      } else if (error.message.includes('ENOSPC')) {
        errorCategory = 'disk_space';
        userFriendlyMessage = 'Espacio en disco insuficiente';
      } else if (error.message.includes('EACCES')) {
        errorCategory = 'permissions';
        userFriendlyMessage = 'Sin permisos para acceder al archivo';
      }
      
      this.updateTask(taskID, {
        status: PREDEFINED.TASK_STATUS.FAILED,
        error: error.message,
        errorCategory: errorCategory,
        userFriendlyMessage: userFriendlyMessage,
        currentStep: `Error: ${userFriendlyMessage}`,
        failedAt: Date.now()
      });
      
      throw error;
    }
  }
}

const TASK_MANAGER = new TaskManager();

// Funciones existentes de descarga...
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
    let dlTaskID;
    
    try {
        const directoryPath = path.dirname(filePath);

        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        const response = await axios({
            url: downloadURL,
            method: "GET",
            responseType: "stream",
            timeout: 20000, // <<< RECOMENDACIÓN: Aumentar un poco el timeout para descargas grandes/lentas
            headers: { // <<< RECOMENDACIÓN: Añadir un User-Agent es buena práctica
                'User-Agent': 'MiAppDeServidores/1.0'
            }
        });

        const contentLength = parseInt(response.headers['content-length'], 10);
        // <<< CAMBIO: Comprobamos si el content-length es válido, pero no fallamos si no lo es.
        const hasValidContentLength = !isNaN(contentLength) && contentLength > 0;

        dlTaskID = TASK_MANAGER.addNewTask({
            type: PREDEFINED.TASKS_TYPES.DOWNLOADING,
            progress: 0,
            // <<< CAMBIO: Usamos el content-length si es válido, si no, ponemos 0.
            size: { total: hasValidContentLength ? contentLength : 0, current: 0 },
            url: downloadURL,
            path: filePath,
            filename: path.basename(filePath),
            status: PREDEFINED.TASK_STATUS.IN_PROGRESS
        });

        const writeStream = fs.createWriteStream(filePath);
        
        // Esta parte ya funciona bien incluso sin el tamaño total, gracias a tu lógica en `updateDownloadProgress`
        response.data.on('data', (chunk) => updateDownloadProgress(dlTaskID, chunk.length));

        await pipeline(response.data, writeStream);

        // <<< CAMBIO: Al finalizar, obtenemos el tamaño real del archivo y actualizamos la tarea.
        // Esto asegura que la tarea siempre termine con el tamaño y progreso correctos.
        const finalStats = fs.statSync(filePath); 
        const finalSize = finalStats.size;

        TASK_MANAGER.updateTask(dlTaskID, {
            size: { total: finalSize, current: finalSize },
            progress: 100,
            status: PREDEFINED.TASK_STATUS.COMPLETED
        });

        return { success: true }; 
    } catch (error) {
        console.error(`Download failed: ${error.message}`);
        if (dlTaskID) {
            TASK_MANAGER.updateTask(dlTaskID, {
                status: PREDEFINED.TASK_STATUS.FAILED,
                error: error.message
            });
        }
        // <<< CAMBIO: Asegúrate de que la función que llama a esta maneje correctamente el error.
        // El error que recibes en el log ("Falla en startJavaServerGeneration") viene de la función que llama a esta.
        // Es importante que esa función capture este `return` o el `throw` implícito.
        // Aquí lanzamos el error para que la función superior sepa que algo falló.
        throw new Error(`Falló la descarga del core: ${error.message}`);
    }
}

async function unpackArchive(archivePath, unpackPath, deleteAfterUnpack = false) {
    const unpackTaskID = TASK_MANAGER.addNewTask({
        type: PREDEFINED.TASKS_TYPES.UNPACKING,
        progress: 0,
        archivePath,
        filename: path.basename(archivePath),
        path: unpackPath,
        status: PREDEFINED.TASK_STATUS.IN_PROGRESS
    });

    try {
        fs.mkdirSync(unpackPath, { recursive: true });
        await decompress(archivePath, unpackPath);

        if (deleteAfterUnpack) {
            fs.unlinkSync(archivePath);
        }

        TASK_MANAGER.updateTask(unpackTaskID, {
            progress: 100,
            status: PREDEFINED.TASK_STATUS.COMPLETED
        });

        return { success: true, message: "Unpacking completed successfully." };
    } catch (error) {
        console.error("Unpacking error:", error);
        TASK_MANAGER.updateTask(unpackTaskID, {
            status: PREDEFINED.TASK_STATUS.FAILED,
            error: error.message
        });
        return { success: false, error: error.message}
    }
}

function getalltasks() {
    try {
        return taskStorage.JSONget("tasks");
    } catch (error) {
        console.error("Error getting tasks:", error);
        return false;
    }
}

// Exportar funciones de backup
export async function addBackupTask(folderName, outputFilename, options) {
    return await TASK_MANAGER.addBackupTask(folderName, outputFilename, options);
}

export async function addRestoreTask(filename, outputFolderName) {
    return await TASK_MANAGER.addRestoreTask(filename, outputFolderName);
}

export {
    TASK_MANAGER,
    addDownloadTask,
    unpackArchive,
    getalltasks,
    PREDEFINED
};