import { v4 as uuidv4 } from 'uuid';
import {logger, LanguageManager} from "../utils/utils.js";

import colors from "colors";
const PREDEFINED = {
    TASK_STATUS: {
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        FAILED: 'failed'
    }
}
import { configManager } from "./configuration.js";
class TaskManager {
    constructor() {
        this.tasks = {};
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
        logger.log(LanguageManager.translateText(
            configManager.mainConfig.language, 
            "{{console.taskAdded}}", 
            colors.cyan(newTaskID), 
            colors.cyan(data.type)
        ));
        return newTaskID;
    }

    removeTask(taskID) {
        if (this.tasks[taskID]) {
            delete this.tasks[taskID];
            logger.log(LanguageManager.translateText(
                configManager.mainConfig.language, 
                "{{console.taskRemoved}}", 
                colors.cyan(taskID)
            ));
            return true;
        }
        return false;
    }

    setTaskData(taskID, data) {
        if (typeof this.tasks[taskID] !== 'undefined') {
            this.tasks[taskID] = data;
            return true;
        }
        return false;
    }
    updateTask(taskID, data) {
        if (typeof this.tasks[taskID] !== 'undefined') {
            this.tasks[taskID] = {
                ...this.tasks[taskID],
                ...data
            };
            return true;
        }
        return false;
    }
    getTaskData(taskID) {
        if (typeof this.tasks[taskID] !== 'undefined') {
            return this.tasks[taskID];
        }
        return false;
    }
    isTaskExists(taskID) {
        return typeof this.tasks[taskID] !== 'undefined';
    }
    removeCompletedTasks() {
        const now = Date.now();
        for (const [taskID, task] of Object.entries(this.tasks)) {
            if (task.status === PREDEFINED.TASK_STATUS.COMPLETED && 
                now - task.updatedAt > 5000) { // 5 segundos después de completar
                delete this.tasks[taskID];
            }
        }
        return true;
    }
}

export default new TaskManager();