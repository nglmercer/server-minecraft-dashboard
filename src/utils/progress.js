// Archivo: utils/progress.js (NUEVO)
import { Transform } from 'stream';

/**
 * Crea un stream transformador que reporta el progreso de los datos que pasan a través de él.
 * @param {number} totalSize - El tamaño total en bytes del stream para calcular el porcentaje.
 * @param {(progress: { percentage: number, processedBytes: number, totalBytes: number }) => void} onProgress - Callback que se ejecuta con cada actualización de progreso.
 * @returns {Transform} Un stream.Transform que puedes insertar en un pipeline.
 */
export function createProgressStream(totalSize, onProgress) {
  let processedBytes = 0;
  let lastReportedPercentage = -1;

  return new Transform({
    transform(chunk, encoding, callback) {
      processedBytes += chunk.length;
      
      const percentage = totalSize > 0 
        ? Math.round((processedBytes / totalSize) * 100) 
        : 0;

      // Reportar solo si el porcentaje ha cambiado para no saturar de eventos
      if (percentage > lastReportedPercentage) {
        lastReportedPercentage = percentage;
        onProgress({
          percentage,
          processedBytes,
          totalBytes: totalSize
        });
      }
      
      // Pasa el chunk al siguiente stream en el pipeline
      this.push(chunk);
      callback();
    }
  });
}