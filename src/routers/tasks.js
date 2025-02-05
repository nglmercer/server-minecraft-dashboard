import { isObjectsValid } from "../utils.js";
import TASK_MANAGER from "../taskManager.js";
import express from "express";
const router = express.Router();
// Endpoint GET and POST for getting tasks
router.get("/", function (req, res) {
    res.set("Content-Type", "application/json");
    res.send(TASK_MANAGER.tasks);
    TASK_MANAGER.removeCompletedTasks();
});

// Endpoint GET and POST for getting a task
router.get("/:id", function (req, res) {
    let q = req.params;
    if (isObjectsValid(q.id) && Object.keys(TASK_MANAGER.tasks).includes(q.id)) {
        res.set("Content-Type", "application/json");
        const taskobj = TASK_MANAGER.getTaskData(q.id);
        if (taskobj) {
        return  res.send(taskobj);
        }
    }
    res.sendStatus(400);
});
export default router;