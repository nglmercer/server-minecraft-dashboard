import express from 'express';
import {
    TASK_MANAGER,
    addDownloadTask,
    unpackArchive,
    getalltasks
} from '../modules/taskmanager.js';
const router = express.Router();

router.get('/tasks', (req, res) => {
    const tasks = getalltasks();
    res.status(200).json({ success: true, data: tasks });
});
export default router;