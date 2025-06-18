// src/modules/TaskScheduler.js
import cron from 'node-cron';

class TaskScheduler {
  constructor() {
    this.tasks = new Map();
  }

  /**
   * Programa una nueva tarea usando un patrón Cron.
   * @param {string} taskId - Un identificador único para la tarea (ej. "restart-servidor1").
   * @param {string} schedule - El patrón Cron (ej. "0 4 * * *").
   * @param {function} callback - La función a ejecutar.
   */
  schedule(taskId, schedule, callback) {
    // Si ya existe una tarea con ese ID, la detenemos antes de crear una nueva.
    this.cancel(taskId);

    if (cron.validate(schedule)) {
      const task = cron.schedule(schedule, callback, {
        scheduled: true,
        timezone: "America/New_York" // ¡IMPORTANTE! Configura tu zona horaria
      });
      this.tasks.set(taskId, task);
      console.log(`Tarea '${taskId}' programada con el horario: ${schedule}`);
    } else {
      console.error(`Error: El formato de cron '${schedule}' para la tarea '${taskId}' no es válido.`);
    }
  }

  /**
   * Cancela y elimina una tarea programada.
   * @param {string} taskId 
   */
  cancel(taskId) {
    if (this.tasks.has(taskId)) {
      this.tasks.get(taskId).stop();
      this.tasks.delete(taskId);
      console.log(`Tarea '${taskId}' cancelada.`);
    }
  }

  cancelAll() {
    this.tasks.forEach((task, taskId) => {
      this.cancel(taskId);
    });
  }
}

export const scheduler = new TaskScheduler();